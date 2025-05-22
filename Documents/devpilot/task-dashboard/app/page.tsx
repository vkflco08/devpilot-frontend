"use client"

import { Suspense } from "react"
import Dashboard from "@/components/dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TreeView } from "@/components/tree-view"
import { Loader2, PlusCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/RequireAuth"
import { useMyInfo } from "@/lib/hooks/useMyInfo"

export default function Home() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()
  const { myInfo, loading, error } = useMyInfo()

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="container mx-auto px-4 py-4 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">TaskPilot</h1>
              <div className="flex items-center gap-4">
                <TabsList>
                  <TabsTrigger value="dashboard">대시보드</TabsTrigger>
                  <TabsTrigger value="tree">트리 뷰</TabsTrigger>
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

          <TabsContent value="tree" className="mt-0">
            <Suspense fallback={<LoadingState />}>
              <TreeView isCreateDialogOpen={isCreateDialogOpen} setIsCreateDialogOpen={setIsCreateDialogOpen} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  )
}
