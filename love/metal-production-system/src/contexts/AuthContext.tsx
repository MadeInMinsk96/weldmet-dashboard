import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (firstName: string, lastName: string, remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'metal_production_auth';
const ANALYTICS_AUTH_KEY = 'metal_production_analytics_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage first (remember me)
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const userData = JSON.parse(storedAuth);
        setUser(userData);
        return;
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    
    // Check sessionStorage (current session)
    const sessionAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionAuth) {
      try {
        const userData = JSON.parse(sessionAuth);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse session auth:', error);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const login = (firstName: string, lastName: string, remember: boolean) => {
    const userData: User = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
    };

    setUser(userData);

    // Always save the session
    if (remember) {
      // Save to localStorage for persistent login
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      // Save to sessionStorage for current session only
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(ANALYTICS_AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
