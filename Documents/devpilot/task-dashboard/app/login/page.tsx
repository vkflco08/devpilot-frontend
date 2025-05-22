'use client'

import { useRouter } from "next/navigation"
import { useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthContext } from "@/contexts/AuthContext"
import axios from "@/lib/axiosInstance"

export default function LoginPage() {
  const router = useRouter()
  const { login, logout } = useContext(AuthContext)

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post("/api/member/login", {
        loginId: loginId,
        password: password,
      })

      if (response.data.resultCode === "SUCCESS") {
        const { accessToken, refreshToken } = response.data.data
        login(accessToken, refreshToken)
        router.push("/")
      } else {
        alert(response.data.message || "로그인 실패")
      }
    } catch (err) {
      logout()
      alert("로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              placeholder="아이디"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" onClick={() => router.push("/signup")}>
            아직 회원이 아니신가요? 회원가입
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}