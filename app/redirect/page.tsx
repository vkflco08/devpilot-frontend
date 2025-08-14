'use client'

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function OAuth2RedirectPage() {
  const router = useRouter()
  const params = useSearchParams()
  const accessToken = params.get("accessToken")

  const authContext = useContext(AuthContext)

  useEffect(() => {
    if (accessToken && authContext) {
      authContext.login({ accessToken })
      router.replace("/")
    } else {
      alert("소셜 로그인 실패: 토큰 없음")
      router.replace("/login")
    }
  }, [accessToken])

  return <LoadingSpinner text="소셜 로그인 처리 중..." />
}
