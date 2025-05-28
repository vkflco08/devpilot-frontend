'use client'; // App Router일 때 필수

import React, { createContext, useEffect, useState, type ReactNode } from 'react';
import axios from '@/lib/axiosInstance';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('task-manager-accessToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('task-manager-accessToken', accessToken);
    localStorage.setItem('task-manager-refreshToken', refreshToken);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('task-manager-accessToken');
      if (!accessToken) {
        setIsAuthenticated(false);
        localStorage.removeItem('task-manager-accessToken');
        localStorage.removeItem('task-manager-refreshToken');
        window.location.href = '/landing';
        return;
      }
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member/logout`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });
      setIsAuthenticated(false);
      localStorage.removeItem('task-manager-accessToken');
      localStorage.removeItem('task-manager-refreshToken');
      window.location.href = '/landing';
    } catch (error) {
      console.error('There was a problem with the logout request:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('task-manager-accessToken');
      localStorage.removeItem('task-manager-refreshToken');
      window.location.href = '/landing';
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
