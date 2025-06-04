'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext || authContext.isLoading) return <div>Loading...</div>;
  if (!authContext.isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
