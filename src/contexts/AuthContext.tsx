import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

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
  /** Call after external login completes to refresh session */
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  wsToken: null,
  refreshSession: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DexsterUser | null>(null);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const data = await api.get<{ user: DexsterUser | null; wsToken?: string }>('/auth/session');
      setCurrentUser(data.user);
      setWsToken(data.wsToken ?? null);
    } catch {
      setCurrentUser(null);
      setWsToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    await fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setWsToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      wsToken,
      refreshSession,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
