'use client';

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';

export default function OAuthCallback() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('task-manager-accessToken');

    console.log("oauth callback page")

    if (!accessToken) {
      console.error('Missing accessToken from redirect');
      router.push('/login');
      return;
    }

    if (auth) {
      auth.login(accessToken);
      router.push('/'); // 로그인 성공 후 홈으로
    }
  }, [auth, router]);

  return <div>로그인 처리 중...</div>;
}
