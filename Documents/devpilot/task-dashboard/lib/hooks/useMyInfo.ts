import { useEffect, useState } from "react";
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

  useEffect(() => {
    axios.get("/api/member/info")
      .then(res => {
        if (res.data.resultCode === "SUCCESS") {
          setMyInfo(res.data.data);
        } else {
          setError(res.data.message || "내 정보 불러오기 실패");
        }
      })
      .catch(() => setError("내 정보 불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  return { myInfo, loading, error };
} 