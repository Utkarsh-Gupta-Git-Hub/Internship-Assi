import React, {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from 'react';
import type { AuthUser } from '../types';
import { authApi } from '../api';
import { setAccessToken, clearAccessToken } from '../api/axios';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to restore session via refresh token on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await authApi.refresh();
        setAccessToken(response.data.data.accessToken);
        setUser(response.data.data.user);
      } catch {
        // No valid refresh token — user needs to login
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Listen for forced logout events (triggered by axios interceptor on refresh failure)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      clearAccessToken();
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setAccessToken(response.data.data.accessToken);
    setUser(response.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
