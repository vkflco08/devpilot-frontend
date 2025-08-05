'use client';

import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import axios from '@/lib/axiosInstance';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokenInfo: { accessToken: string }) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('task-pilot-accessToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const login = (tokenInfo: { accessToken: string }) => {
    localStorage.setItem('task-pilot-accessToken', tokenInfo.accessToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenInfo.accessToken}`;
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('task-pilot-accessToken');
      if (!accessToken) {
        handleLogoutCleanup();
        return;
      }

      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member/logout`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        withCredentials: true
      });
      document.cookie = 'task-pilot-refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      handleLogoutCleanup();
    } catch (error) {
      console.error("Logout API failed, performing client-side cleanup:", error);
      handleLogoutCleanup();
    }
  };

  const handleLogoutCleanup = () => {
    localStorage.removeItem('task-pilot-accessToken');
    setIsAuthenticated(false);
    // window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
