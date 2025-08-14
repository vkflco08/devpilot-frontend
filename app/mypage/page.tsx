"use client"

import { useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Settings, Clock, Calendar, ArrowLeft, CheckCircle, BarChart2, Edit, Mail, Phone, Loader2 } from "lucide-react"
import { ProjectStatus } from "@/lib/types"
import { useMyInfo } from "@/lib/hooks/useMyInfo"
import { type Project } from "@/lib/types"
import { ProjectDetailDialog } from "@/components/ProjectDetailDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TaskStatus } from "@/lib/types"
import { AuthContext } from '@/contexts/AuthContext'
import RequireAuth from "@/components/RequireAuth"
import { springApi } from "@/lib/axiosInstance"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { FcGoogle } from "react-icons/fc"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function formatRelativeDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays <= 7) return `${diffDays}일 전`;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function ProfileEditDialog({ open, onOpenChange, myInfo, onSave }: { open: boolean, onOpenChange: (v: boolean) => void, myInfo: any, onSave: () => void }) {
  const [form, setForm] = useState({
    name: myInfo.name || "",
    email: myInfo.email || "",
    role: myInfo.role || "",
    phoneNumber: myInfo.phoneNumber || "",
    department: myInfo.department || "",
    description: myInfo.description || "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      name: myInfo.name || "",
      email: myInfo.email || "",
      role: myInfo.role || "",
      phoneNumber: myInfo.phoneNumber || "",
      department: myInfo.department || "",
      description: myInfo.description || "",
    })
  }, [myInfo, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await springApi.put("/api/member/info_edit", form)
      if (res.data.resultCode === "SUCCESS") {
        onSave()
        onOpenChange(false)
      } else {
        alert(res.data.message || "프로필 수정에 실패했습니다.")
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "프로필 수정 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로필 편집</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input name="name" value={form.name} onChange={handleChange} placeholder="이름" required />
          <Input name="email" value={form.email} onChange={handleChange} placeholder="이메일" required type="email" />
          <Input name="role" value={form.role} onChange={handleChange} placeholder="역할" />
          <Input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="전화번호" />
          <Input name="department" value={form.department} onChange={handleChange} placeholder="부서" />
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded" placeholder="설명" />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>{loading ? "저장 중..." : "저장"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MyPage() {

  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | number>('all');
  const [tasks, setTasks] = useState<any[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [tasksError, setTasksError] = useState<string|null>(null)

  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string|null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isProjectDetailDialogOpen, setIsProjectDetailDialogOpen] = useState(false)

  const auth = useContext(AuthContext)
  const { myInfo, loading, error } = useMyInfo()

  const [editOpen, setEditOpen] = useState(false)
  const handleProfileSave = () => { window.location.reload() } // 또는 useMyInfo refetch

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const error = searchParams.get('error')
    const status = searchParams.get('status')
    
    if (error) {
      // Decode the error message
      const decodedError = decodeURIComponent(error)
      setErrorMessage(decodedError)
      
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      url.searchParams.delete('status')
      window.history.replaceState({}, document.title, url.pathname + url.search)
    }
  }, [searchParams])

  useEffect(() => {
    if (errorMessage) {
      alert(errorMessage)
    }
  }, [errorMessage])

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true)
      try {
        const res = await springApi.get("/api/task/all")
        if (res.data.resultCode === "SUCCESS") {
          setTasks(res.data.data)
        } else {
          setTasksError(res.data.message || "태스크를 불러오지 못했습니다.")
        }
      } catch (e: any) {
        setTasksError(e?.response?.data?.message || "태스크를 불러오지 못했습니다.")
      } finally {
        setTasksLoading(false)
      }
    }
    fetchTasks()
  }, [])

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true)
      try {
        const res = await springApi.get("/api/project/mypage")
        if (res.data.resultCode === "SUCCESS") {
          setProjects(res.data.data)
        } else {
          setProjectsError(res.data.message || "프로젝트를 불러오지 못했습니다.")
        }
      } catch (e: any) {
        setProjectsError(e?.response?.data?.message || "프로젝트를 불러오지 못했습니다.")
      } finally {
        setProjectsLoading(false)
      }
    }
    fetchProjects() 
  }, [])

  const myTasks = tasks // 전체 태스크
  const sortedTasks = [...myTasks].sort((a, b) => {
    const aDate = new Date(a.lastModifiedDate || a.createdDate || 0).getTime();
    const bDate = new Date(b.lastModifiedDate || b.createdDate || 0).getTime();
    return bDate - aDate;
  });

  const recentActivity = sortedTasks.slice(0, 5).map((task) => ({
    id: task.id,
    action: task.status === TaskStatus.DONE ? "태스크 완료" : task.status === TaskStatus.DOING ? "진행 중" : "태스크 생성",
    task: task.title,
    date: formatRelativeDate(task.lastModifiedDate || task.createdDate),
  }))

  const now = new Date();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const doneThisWeek = sortedTasks.filter(t => t.status === TaskStatus.DONE && new Date(t.lastModifiedDate || t.createdDate) >= weekAgo).length;
  const doneTasks = sortedTasks.filter(t => t.status === TaskStatus.DONE && t.createdDate && t.lastModifiedDate);
  const avgDoneTime = doneTasks.length > 0 ?
    (doneTasks.reduce((acc, t) => acc + (new Date(t.lastModifiedDate).getTime() - new Date(t.createdDate).getTime()), 0) / doneTasks.length / (1000*60*60*24)).toFixed(1) : "-";

  const assignedTasks = sortedTasks.length
  const completedTasks = sortedTasks.filter((t) => t.status === TaskStatus.DONE).length
  const inProgressTasks = sortedTasks.filter((t) => t.status === TaskStatus.DOING).length
  const todoTasks = sortedTasks.filter((t) => t.status === TaskStatus.TODO).length
  const completionRate = assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0;

  if ((loading || tasksLoading || projectsLoading)) {
    if (!mounted) return null
    const resolved = theme === "system" ? systemTheme : theme
    const bgClass = resolved === "dark"
      ? "bg-gradient-to-br from-[#18181b] to-[#23272f]"
      : "bg-gradient-to-br from-gray-50 to-gray-200"
    const textClass = resolved === "dark" ? "text-gray-300" : "text-muted-foreground"
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${bgClass}`}>
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <span className={`text-base ${textClass}`}>잠시만 기다려주세요...</span>
      </div>
    )
  }
  if (error) return <div>{error}</div>
  if (!myInfo) return <div>내 정보가 없습니다.</div>

  const openProjectDetail = (project: Project) => {
    setSelectedProject(project)
    setIsProjectDetailDialogOpen(true)
  }

  const handleUpdateProject = async (project: Project) => {
    setProjectsLoading(true)
    try {
      const response = await springApi.put(`/api/project/${project.id}`, {
        projectName: project.name,
        projectDescription: project.description,
        projectStatus: project.status || ProjectStatus.ACTIVE
      })
      
      if (response.data?.resultCode === "SUCCESS") {
        // API 응답으로 상태 업데이트
        const updatedProject = response.data.data
        setProjects(prev => prev.map(p => 
          p.id === project.id ? { ...updatedProject } : p
        ))
        setIsProjectDetailDialogOpen(false)
        setSelectedProject(null)
      } else {
        alert(response.data?.message || "프로젝트 수정에 실패했습니다.")
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "프로젝트 수정 중 오류가 발생했습니다.")
    } finally {
      setProjectsLoading(false)
    }
  }
  
  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm("프로젝트를 삭제하면 프로젝트에 포함된 태스크들도 삭제됩니다. 정말 삭제하시겠습니까?")) return
    setProjectsLoading(true)
    try {
      const response = await springApi.delete(`/api/project/${project.id}`)
      if (response.data?.resultCode === "SUCCESS") {
        // 현재 projects 상태에서 삭제된 프로젝트를 제거
        setProjects(prev => prev.filter(p => p.id !== project.id))
        setIsProjectDetailDialogOpen(false)
        setSelectedProject(null)
      } else {
        alert(response.data?.message || "프로젝트 삭제에 실패했습니다.")
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "프로젝트 삭제 중 오류가 발생했습니다.")
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleBindGoogleAccount = async () => {
    try {
      const response = await springApi.get(`/api/auth/bind/google`)
      const redirectUrl = response.data.data
      console.log(response)
      window.location.href = redirectUrl
    } catch (e: any) {
      console.error("계정 연동 요청 중 클라이언트 측 오류:", e);
      alert("네트워크 오류 또는 서버에 연결할 수 없습니다.");
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" className="mb-6 flex items-center gap-2" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
            대시보드로 돌아가기
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile sidebar */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="text-2xl">{myInfo.name ? myInfo.name[0] : "?"}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{myInfo.name}</CardTitle>
                <CardDescription>{myInfo.role}</CardDescription>

                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setEditOpen(true)}>
                    <Edit className="h-4 w-4" />
                    프로필 편집
                  </Button>
                  {!myInfo.providers?.includes("GOOGLE") && (
                  <Button
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={handleBindGoogleAccount}
                  >
                    <FcGoogle size={20} />
                    Google 아이디 연동하기
                  </Button>
                  )}
                  <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} myInfo={myInfo} onSave={handleProfileSave} />
                  <Button variant="destructive" className="w-full flex items-center gap-2" onClick={auth?.logout}>
                    로그아웃
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{myInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{myInfo.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{myInfo.department}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">가입일: {formatRelativeDate(myInfo.createdDate)}</span>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="text-sm font-medium mb-2">자기소개</h4>
                    <p className="text-sm text-muted-foreground">{myInfo.description || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main content */}
            <div className="md:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">개요</TabsTrigger>
                  <TabsTrigger value="projects">프로젝트</TabsTrigger>
                  <TabsTrigger value="tasks">태스크</TabsTrigger>
                  <TabsTrigger value="settings">설정</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">태스크 통계</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>완료율</span>
                              <span className="font-medium">{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                              <span className="text-2xl font-bold">{todoTasks}</span>
                              <p className="text-xs text-muted-foreground">할 일</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-2xl font-bold">{inProgressTasks}</span>
                              <p className="text-xs text-muted-foreground">진행 중</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-2xl font-bold">{completedTasks}</span>
                              <p className="text-xs text-muted-foreground">완료</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">생산성 요약</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              <span className="text-sm">완료한 태스크</span>
                            </div>
                            <span className="font-medium">{completedTasks}개</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              <span className="text-sm">평균 완료 시간</span>
                            </div>
                            <span className="font-medium">{avgDoneTime}일</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BarChart2 className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">이번 주 완료</span>
                            </div>
                            <span className="font-medium">{doneThisWeek}개</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">최근 활동</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-4">
                            <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                            <div>
                              <p className="font-medium text-sm">
                                {activity.action}: {activity.task}
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">내 태스크</CardTitle>
                      <CardDescription>생성한 모든 태스크를 확인할 수 있습니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sortedTasks.length === 0 ? (
                          <div className="text-muted-foreground text-center py-8">해당 프로젝트에 태스크가 없습니다.</div>
                        ) : (
                          sortedTasks.map((task) => (
                            <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border">
                              <div
                                className={`w-2 h-2 mt-2 rounded-full ${
                                  task.status === TaskStatus.TODO
                                    ? "bg-slate-500"
                                    : task.status === TaskStatus.DOING
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                }`}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <span className="text-xs text-muted-foreground">
                                    {task.lastModifiedDate ? `수정: ${formatRelativeDate(task.lastModifiedDate)}` : task.createdDate ? `생성: ${formatRelativeDate(task.createdDate)}` : ""}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">내 프로젝트</CardTitle>
                      <CardDescription>생성한 모든 프로젝트를 확인할 수 있습니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projectsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-muted-foreground">프로젝트를 불러오는 중입니다...</span>
                          </div>
                        ) : projects ? (
                          projects.length === 0 ? (
                            <div className="text-muted-foreground text-center py-8">프로젝트가 없습니다.</div>
                          ) : (
                            projects.map((project) => (
                              <div key={project.id} className="flex items-start gap-3 p-3 rounded-md border cursor-pointer group hover:border-primary transition-colors" onClick={() => openProjectDetail(project)}>
                                <div className="flex-1">
                                  <div className="flex justify-between items-baseline">
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={project.status === ProjectStatus.ACTIVE ? "default" : "secondary"}
                                        className={cn(
                                          "text-xs",
                                          project.status === ProjectStatus.ACTIVE && "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300",
                                          project.status === ProjectStatus.COMPLETED && "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
                                          project.status === ProjectStatus.ARCHIVED && "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                                        )}
                                      >
                                        {project.status === ProjectStatus.ACTIVE && "진행중"}
                                        {project.status === ProjectStatus.COMPLETED && "완료됨"}
                                        {project.status === ProjectStatus.ARCHIVED && "보관됨"}
                                      </Badge>
                                      <h4 className="font-medium">{project.name}</h4>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{project.tasks?.length || 0}개</span>
                                  </div>
                                  <div className="flex justify-between items-baseline mt-1">
                                    {project.description && (
                                      <p className="text-sm text-muted-foreground">{project.description}</p>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {project.lastModifiedDate ? `수정: ${formatRelativeDate(project.lastModifiedDate)}` : 
                                      project.createdDate ? `생성: ${formatRelativeDate(project.createdDate)}` : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )
                        ) : (
                          <div className="text-muted-foreground text-center py-8">프로젝트를 불러오지 못했습니다.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>계정 설정</CardTitle>
                      <CardDescription>계정 정보와 알림 설정을 관리합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            개인 정보
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">이름</label>
                              <input type="text" className="w-full p-2 rounded-md border" value={myInfo.name} readOnly />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">이메일</label>
                              <input type="email" className="w-full p-2 rounded-md border" value={myInfo.email} readOnly />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">전화번호</label>
                              <input type="tel" className="w-full p-2 rounded-md border" value={myInfo.phoneNumber} readOnly />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">부서</label>
                              <input
                                type="text"
                                className="w-full p-2 rounded-md border"
                                value={myInfo.department}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-medium mb-4">알림 설정</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm">이메일 알림</label>
                              <input type="checkbox" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm">태스크 마감일 알림</label>
                              <input type="checkbox" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm">태스크 할당 알림</label>
                              <input type="checkbox" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm">주간 요약 리포트</label>
                              <input type="checkbox" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {selectedProject && (
              <ProjectDetailDialog
                open={isProjectDetailDialogOpen}
                onOpenChange={setIsProjectDetailDialogOpen}
                project={selectedProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
              />
            )}
    </RequireAuth>
  )
}
