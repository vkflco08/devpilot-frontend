"use client"

import { Suspense } from "react"
import Dashboard from "@/components/dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, PlusCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Next.js 13의 useRouter
import { useSearchParams } from "next/navigation" // useSearchParams 임포트
import RequireAuth from "@/components/RequireAuth"
import { useMyInfo } from "@/lib/hooks/useMyInfo"
import { useTheme } from "next-themes"
import HierarchyView from "@/components/hierarchy-view/hierarchy-view"

export default function Home() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams() // URL 쿼리 파라미터를 읽기 위한 훅
  const { myInfo, loading, error } = useMyInfo()
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    setMounted(true)
    const tabParam = searchParams.get('tab')
    if (tabParam && (tabParam === "dashboard" || tabParam === "hierarchy-view")) {
      setActiveTab(tabParam)
    } else {
      setActiveTab("dashboard")
      // URL에 기본 탭을 추가 (선택적)
      // router.replace({ query: { tab: 'dashboard' } }, undefined, { shallow: true });
    }
  }, [searchParams]) // searchParams가 변경될 때마다 재실행

  useEffect(() => {
    if (mounted) {
      const currentTabParam = searchParams.get('tab');
      if (currentTabParam !== activeTab) { 
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('tab', activeTab);
        router.replace(`/?${newSearchParams.toString()}`, undefined, { shallow: true });
      }
    }
  }, [activeTab, mounted, router, searchParams]);


  const resolved = theme === "system" ? systemTheme : theme
  const bgClass = resolved === "dark"
    ? "bg-gradient-to-br from-[#18181b] to-[#23272f]"
    : "bg-gradient-to-br from-gray-50 to-gray-200"
  const textClass = resolved === "dark" ? "text-gray-300" : "text-muted-foreground"

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="container mx-auto px-4 py-4 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">TaskPilot</h1>
              <div className="flex items-center gap-4">
                <TabsList>
                  <TabsTrigger value="dashboard">대시보드</TabsTrigger>
                  <TabsTrigger value="hierarchy-view">계층 보기</TabsTrigger>
                </TabsList>
                <ThemeToggle />
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />새 태스크
                </Button>
                <div className="border-l pl-4 ml-2">
                  <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/mypage")}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="text-sm font-medium">{myInfo ? myInfo.name[0] : "?"}</span>
                    </div>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{myInfo ? myInfo.name : ""}</span>
                      <span className="text-xs text-muted-foreground">{myInfo ? myInfo.role : ""}</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="dashboard" className="mt-0">
            <Suspense fallback={<LoadingState />}>
              <Dashboard isCreateDialogOpen={isCreateDialogOpen} setIsCreateDialogOpen={setIsCreateDialogOpen} />
            </Suspense>
          </TabsContent>

          <TabsContent value="hierarchy-view" className="mt-0">
            <Suspense fallback={<LoadingState />}>
              <HierarchyView isCreateDialogOpen={isCreateDialogOpen} setIsCreateDialogOpen={setIsCreateDialogOpen}/>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  )
}

function LoadingState() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const resolved = theme === "system" ? systemTheme : theme
  const bgClass = resolved === "dark"
    ? "bg-gradient-to-br from-[#18181b] to-[#23272f]"
    : "bg-gradient-to-br from-gray-50 to-gray-200"
  const textClass = resolved === "dark" ? "text-gray-300" : "text-muted-foreground"
  if (!mounted) return null
  return (
    <div className={`flex flex-col items-center justify-center h-[80vh] w-full ${bgClass}`}>
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <span className={`text-base ${textClass}`}>잠시만 기다려주세요...</span>
    </div>
  )
}
