import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "@/lib/axiosInstance";

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
}

export function useMyInfo() {
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchMyInfo = async () => {
      // 로그인 페이지인 경우 요청을 보내지 않음
      if (pathname === '/login') {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("/api/member/info");
        if (res.data.resultCode === "SUCCESS") {
          setMyInfo(res.data.data);
        } else {
          throw new Error(res.data.message || "내 정보 불러오기 실패");
        }
      } catch (error) {
        // 에러 메시지는 axiosInstance의 인터셉터에서 처리
        setError("사용자 정보를 불러오는데 실패했습니다.");
      } finally { 
        setLoading(false);
      }
    };

    fetchMyInfo();
  }, [pathname]);

  return { myInfo, loading, error };
}