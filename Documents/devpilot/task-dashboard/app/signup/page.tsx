'use client'

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "@/lib/axiosInstance"

const ROLE_OPTIONS = ["개발자", "디자이너", "PM", "기타"];

export default function SignUpPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    loginId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    email: "",
    phoneNumber: "010-",
    department: "",
    description: "",
    role: "개발자",
    customRole: ""
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // 전화번호 자동 하이픈
    if (name === "phoneNumber") {
      let num = value.replace(/[^0-9]/g, "");
      if (num.startsWith("010")) {
        if (num.length > 3 && num.length <= 7) {
          num = num.slice(0, 3) + "-" + num.slice(3);
        } else if (num.length > 7) {
          num = num.slice(0, 3) + "-" + num.slice(3, 7) + "-" + num.slice(7, 11);
        }
      }
      setForm((prev) => ({ ...prev, [name]: num.slice(0, 13) }))
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, role: value, customRole: value === "직접입력" ? prev.customRole : "" }));
  }

  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, customRole: e.target.value, role: e.target.value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setLoading(true)
    try {
      const response = await axios.post("/api/member/signup", {
        loginId: form.loginId,
        password: form.password,
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        department: form.department,
        description: form.description,
        role: form.role,
      })

      console.log(response)

      if (response.data.resultCode === "SUCCESS") {
        alert("회원가입 성공! 로그인 페이지로 이동합니다.")
        router.push("/login")
      } else {
        alert(response.data.message || "회원가입 실패")
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 text-sm font-medium">아이디</label>
              <Input
                name="loginId"
                placeholder="아이디"
                value={form.loginId}
                onChange={handleChange}
                required
                maxLength={30}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">비밀번호</label>
              <Input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
                required
                maxLength={30}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">비밀번호 확인</label>
              <Input
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 확인"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
                maxLength={30}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">이름</label>
              <Input
                name="name"
                placeholder="이름"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={30}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">이메일</label>
              <Input
                type="email"
                name="email"
                placeholder="이메일"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={50}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">전화번호</label>
              <Input
                name="phoneNumber"
                placeholder="010-1234-5678"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                maxLength={13}
                pattern="^01[016789]-\d{3,4}-\d{4}$"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">부서</label>
              <Input
                name="department"
                placeholder="부서"
                value={form.department}
                onChange={handleChange}
                required
                maxLength={30}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">직책/역할</label>
              <select
                name="role"
                className="w-full border rounded-md p-2 text-sm"
                value={ROLE_OPTIONS.includes(form.role) ? form.role : "직접입력"}
                onChange={handleRoleChange}
                required
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
                <option value="직접입력">직접입력</option>
              </select>
              {form.role === "직접입력" && (
                <Input
                  name="customRole"
                  placeholder="직접 입력"
                  value={form.customRole}
                  onChange={handleCustomRoleChange}
                  maxLength={30}
                  className="mt-2"
                  required
                />
              )}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">자기소개</label>
              <textarea
                name="description"
                placeholder="자기소개를 입력하세요 (최대 255자)"
                value={form.description}
                onChange={handleChange}
                required
                maxLength={255}
                className="w-full border rounded-md p-2 text-sm min-h-[80px]"
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" onClick={() => router.push("/login")}>이미 회원이신가요? 로그인</Button>
        </CardFooter>
      </Card>
    </div>
  )
}