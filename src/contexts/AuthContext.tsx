import React, { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_USER } from '@/data/mockData';

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
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  wsToken: null,
  refreshSession: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DexsterUser | null>(MOCK_USER);

  const refreshSession = useCallback(async () => {}, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading: false,
      wsToken: 'mock-token',
      refreshSession,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
