'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
