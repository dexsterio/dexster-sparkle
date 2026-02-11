import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface DexsterUser {
  id: number;
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  headerUrl: string | null;
  socialLinks: Record<string, string> | null;
  profileCompleted: boolean;
  language: string;
  theme: string;
  hideWalletBalance: boolean;
  isAdmin: boolean;
}

interface AuthContextValue {
  currentUser: DexsterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  wsToken: string | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  // ══════════════════════════════════════════════════════════════
  // BACKEND TODO: Add login function for Solana SIWS flow
  // This should be exposed so components (e.g. a login screen) can trigger auth.
  // See loginWithWallet placeholder below.
  // ══════════════════════════════════════════════════════════════
  loginWithWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  wsToken: null,
  refreshSession: async () => {},
  logout: async () => {},
  loginWithWallet: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DexsterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wsToken, setWsToken] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════
  // BACKEND TODO: Refresh / restore session on mount
  // Endpoint: GET /api/auth/me
  // Response: { user: DexsterUser, wsToken: string }
  // Notes: Uses session cookie (auth_token) set by the login flow.
  //        If cookie is missing or expired, user stays unauthenticated.
  // ══════════════════════════════════════════════════════════════
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      // const res = await api.get<{ user: DexsterUser; wsToken: string }>('/auth/me');
      // setCurrentUser(res.user);
      // setWsToken(res.wsToken);
    } catch {
      setCurrentUser(null);
      setWsToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ══════════════════════════════════════════════════════════════
  // BACKEND TODO: Logout
  // Endpoint: POST /api/auth/logout
  // Notes: Clears the session cookie on the server.
  // ══════════════════════════════════════════════════════════════
  const logout = useCallback(async () => {
    try {
      // await api.post('/auth/logout');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setWsToken(null);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // BACKEND TODO: Solana SIWS (Sign-In With Solana) login flow
  // Step 1 — Endpoint: POST /api/auth/siws/challenge
  //   Request: { walletAddress: string }
  //   Response: { nonce: string, message: string }
  // Step 2 — Sign the challenge message with the connected wallet adapter
  // Step 3 — Endpoint: POST /api/auth/siws/verify
  //   Request: { walletAddress: string, signature: string, nonce: string }
  //   Response: { user: DexsterUser, wsToken: string }
  // Notes: After verify, session cookie is set by the server.
  //        Use @solana/wallet-adapter-react's useWallet() hook to access
  //        wallet.publicKey and wallet.signMessage.
  // ══════════════════════════════════════════════════════════════
  const loginWithWallet = useCallback(async () => {
    // Implementation will call challenge → sign → verify flow
    // setCurrentUser(res.user);
    // setWsToken(res.wsToken);
  }, []);

  // Auto-restore session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      wsToken,
      refreshSession,
      logout,
      loginWithWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
