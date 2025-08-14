import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { springApi } from "@/lib/axiosInstance";
  
export interface MyInfo {
  id: number;
  loginId: string;
  name: string;
  email: string;
  createdDate: string | null;
  role: string;
  phoneNumber: string;
  department: string;
  description: string;
  providers: string[];
}

export function useMyInfo() {
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchMyInfo = async () => {
      const token = localStorage.getItem('task-pilot-accessToken');
      if (!token) {
        setLoading(false);
        setError('로그인이 필요합니다.');
        return;
      }

      try {
        const res = await springApi.get("/api/member/info", {
          validateStatus: (status) => status < 500
        });
        
        if (res.data.resultCode === "SUCCESS") {
          setMyInfo(res.data.data);
        } else {
          throw new Error(res.data.message || "내 정보 불러오기 실패");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "내 정보 불러오기 실패";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMyInfo();
  }, [pathname]);

  return { myInfo, loading, error };
}