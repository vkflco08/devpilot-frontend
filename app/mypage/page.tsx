"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Settings, Clock, Calendar, ArrowLeft, CheckCircle, BarChart2, Edit, Mail, Phone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { mockTasks } from "@/lib/mock-data"
import { TaskStatus } from "@/lib/types"
import { flattenTaskTree } from "@/lib/task-utils"

export default function MyPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // Mock user data
  const user = {
    name: "김개발",
    role: "프로젝트 매니저",
    email: "kim@example.com",
    phone: "010-1234-5678",
    department: "개발팀",
    joinDate: "2023년 3월 15일",
    bio: "10년 경력의 프로젝트 매니저입니다. 애자일 방법론과 효율적인 태스크 관리에 관심이 많습니다.",
  }

  // Calculate task statistics
  const allTasks = flattenTaskTree(mockTasks)
  const assignedTasks = allTasks.length
  const completedTasks = allTasks.filter((t) => t.status === TaskStatus.DONE).length
  const inProgressTasks = allTasks.filter((t) => t.status === TaskStatus.DOING).length
  const todoTasks = allTasks.filter((t) => t.status === TaskStatus.TODO).length
  const completionRate = Math.round((completedTasks / assignedTasks) * 100)

  // Mock recent activity
  const recentActivity = [
    { id: 1, action: "태스크 완료", task: "API 엔드포인트 문서화", date: "오늘" },
    { id: 2, action: "태스크 생성", task: "사용자 인터페이스 개선", date: "어제" },
    { id: 3, action: "코멘트 추가", task: "데이터베이스 스키마 설계", date: "3일 전" },
    { id: 4, action: "태스크 상태 변경", task: "로그인 기능 구현", date: "1주일 전" },
  ]

  return (
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
                  <AvatarFallback className="text-2xl">KD</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription>{user.role}</CardDescription>

              <div className="mt-4">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  프로필 편집
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.department}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">입사일: {user.joinDate}</span>
                </div>

                <Separator className="my-4" />

                <div>
                  <h4 className="text-sm font-medium mb-2">자기소개</h4>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main content */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="tasks">내 태스크</TabsTrigger>
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
                          <span className="font-medium">2.5일</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">이번 주 완료</span>
                          </div>
                          <span className="font-medium">7개</span>
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
                    <CardTitle>내 태스크</CardTitle>
                    <CardDescription>현재 담당하고 있는 모든 태스크 목록입니다.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allTasks.slice(0, 5).map((task) => (
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
                              {task.priority && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">P{task.priority}</span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>예상: {task.estimatedTimeHours || "-"}시간</span>
                              {task.dueDate && <span>마감: {new Date(task.dueDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button variant="outline" className="w-full">
                        모든 태스크 보기
                      </Button>
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
                            <input type="text" className="w-full p-2 rounded-md border" value={user.name} readOnly />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">이메일</label>
                            <input type="email" className="w-full p-2 rounded-md border" value={user.email} readOnly />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">전화번호</label>
                            <input type="tel" className="w-full p-2 rounded-md border" value={user.phone} readOnly />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">부서</label>
                            <input
                              type="text"
                              className="w-full p-2 rounded-md border"
                              value={user.department}
                              readOnly
                            />
                          </div>
                        </div>
                        <Button className="mt-4">정보 수정</Button>
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
                        <Button className="mt-4">설정 저장</Button>
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
  )
}
