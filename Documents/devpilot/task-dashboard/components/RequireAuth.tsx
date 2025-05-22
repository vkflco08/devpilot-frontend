"use client"

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (auth && !auth.isLoading && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth, router]);

  if (!auth || auth.isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 