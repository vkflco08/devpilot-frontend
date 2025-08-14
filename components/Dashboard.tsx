"use client"

import { useState, useEffect, useCallback } from "react"
import type { DragEndEvent } from "@dnd-kit/core"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { type Task as OrigTask, TaskStatus } from "@/lib/types"
import { buildTaskTree, getRootTasks, flattenTaskTree } from "@/lib/task-utils"
import { TaskCard } from "@/components/TaskCard"
import { TaskColumn } from "@/components/TaskColumn"
import { CreateTaskDialog } from "@/components/CreateTaskDialog"
import { TaskDetailDialog } from "@/components/TaskDetailDialog"
import { TaskFilter } from "@/components/TaskFilter"
import { BarChart3, PlusCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button, } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog" // Dialog 임포트
import { springApi } from "@/lib/axiosInstance"
import LoadingSpinner from "@/components/LoadingSpinner"
import { ProjectStatus } from "@/lib/types"

interface DashboardProps {
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
}

type Task = OrigTask & { projectId?: number }

export default function Dashboard({ isCreateDialogOpen, setIsCreateDialogOpen }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]) // tasks는 이제 buildTaskTree를 거쳐 트리 형태
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [parentTaskForCreate, setParentTaskForCreate] = useState<Task | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    tag: "",
    priority: 0,
    search: "",
  })
  const [activeId, setActiveId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | number>('all')
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDesc, setProjectDesc] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)

  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(() => {
    try {
      // HierarchyView와 충돌하지 않도록 고유한 키 사용
      const item = window.localStorage.getItem('task-pilot:dashboard:expanded-tasks');
      return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
      console.error(error);
      return new Set();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('task-pilot:dashboard:expanded-tasks', JSON.stringify(Array.from(expandedTasks)));
    } catch (error) {
      console.error(error);
    }
  }, [expandedTasks]);

  const handleToggleExpand = (taskId: number) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleFilterChange = useCallback((filters: { tag: string; priority: number; search: string }) => {
    setFilterOptions(filters)
  }, [])

  // 프로젝트 목록 fetch
  const fetchProjects = async () => {
    try {
      const res = await springApi.get("/api/project/dashboard")
      if (res.data.resultCode === "SUCCESS") {
        setProjects(res.data.data)
      } else {
        setError(res.data.message || "프로젝트 목록을 불러오지 못했습니다.")
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "프로젝트 목록을 불러오지 못했습니다.")
    }
  }

  // 태스크 fetch (전체 or 프로젝트별)
  const fetchTasks = async (projectId: 'all' | number) => {
    setLoading(true)
    setError(null)
    try {
      let res;
      if (projectId === 'all') {
        res = await springApi.get("/api/task/all")
      } else {
        res = await springApi.get(`/api/project/${projectId}`)
      }
      
      if (res.data.resultCode === "SUCCESS") {
        const fetchedTasks = projectId === 'all' ? res.data.data : res.data.data.tasks;
        setTasks(buildTaskTree(fetchedTasks || []));
      } else {
        setError(res.data.message || "태스크 목록을 불러오지 못했습니다.")
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "태스크 목록을 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchTasks(selectedProjectId)
  }, [selectedProjectId])

  useEffect(() => {
    let filtered = [...tasks] // tasks는 이미 트리 형태

    if (filterOptions.tag) {
      filtered = flattenTaskTree(filtered).filter((task) => task.tags?.includes(filterOptions.tag))
    }

    if (filterOptions.priority > 0) {
      filtered = filtered.filter((task) => task.priority === filterOptions.priority)
    }

    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) || task.description?.toLowerCase().includes(searchLower),
      )
    }
    setFilteredTasks(filtered)
  }, [tasks, filterOptions])

  // Create dialog이 열릴 때 parentTask 초기화
  useEffect(() => {
    if (isCreateDialogOpen) {
      if (!parentTaskForCreate) {
        setParentTaskForCreate(null)
      }
    } else {
      setParentTaskForCreate(null)
    }
  }, [isCreateDialogOpen])

  const projectFilteredTasks = selectedProjectId === 'all'
    ? filteredTasks // filteredTasks는 이미 트리 형태
    : filteredTasks.filter((task) => task.projectId === selectedProjectId);

  const rootTasksForColumns = getRootTasks(projectFilteredTasks); // TaskColumn에 들어갈 루트 태스크들

  const todoTasks = rootTasksForColumns.filter((task) => task.status === TaskStatus.TODO)
  const doingTasks = rootTasksForColumns.filter((task) => task.status === TaskStatus.DOING)
  const doneTasks = rootTasksForColumns.filter((task) => task.status === TaskStatus.DONE)

  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTaskId = active.id as number;
    let newStatus: TaskStatus | undefined;

    if (Object.values(TaskStatus).includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
    } else {
      const overTask = flattenTaskTree(tasks).find(t => t.id === over.id); // 모든 태스크에서 찾기
      if (overTask) newStatus = overTask.status;
    }

    const activeTask = flattenTaskTree(tasks).find(t => t.id === activeTaskId); // 모든 태스크에서 찾기
    if (newStatus && activeTask && activeTask.status !== newStatus) {
      setTaskLoading(true);
      try {
        const response = await springApi.put(`/api/task/${activeTaskId}`, { status: newStatus });
        if (response.data?.resultCode === "SUCCESS") {
          await fetchTasks(selectedProjectId); // 데이터 다시 페치하여 UI 업데이트
        } else {
          alert(response.data?.message || "상태 변경에 실패했습니다.");
        }
      } catch (e: any) {
        alert(e?.response?.data?.message || "상태 변경 중 오류가 발생했습니다.");
      } finally {
        setTaskLoading(false);
      }
    } 
  }    

  const handleToggleTaskStatus = async (taskId: number, newStatus: TaskStatus, previousStatusToSend: TaskStatus | null) => {
    setTaskLoading(true);
    try {
        const response = await springApi.put(`/api/task/${taskId}`, { 
            status: newStatus,
            previousStatus: previousStatusToSend 
        });
        if (response.data?.resultCode === "SUCCESS") {
            await fetchTasks(selectedProjectId);
        } else {
            alert(response.data?.message || "태스크 상태 업데이트에 실패했습니다.");
        }
    } catch (e: any) {
        alert(e?.response?.data?.message || "태스크 상태 업데이트 중 오류가 발생했습니다.");
    } finally {
        setTaskLoading(false);
    }
  };

  const handleCreateTask = async (newTask: Task) => { // newTask는 CreateTaskDialog에서 넘어온 Task 객체
    setTaskLoading(true)
    try {
      const response = await springApi.post("/api/task/new", {
        title: newTask.title,
        description: newTask.description === '' ? '' : (newTask.description || null),
        status: newTask.status,
        tags: newTask.tags === '' ? '' : (newTask.tags || null),
        priority: newTask.priority || null,
        dueDate: newTask.dueDate || null,
        estimatedTimeHours: newTask.estimatedTimeHours || null,
        parentId: newTask.parentId,
        projectId: newTask.projectId,
      })
      if (response.data && response.data.resultCode === "SUCCESS") {
        await fetchTasks(selectedProjectId)
        setIsCreateDialogOpen(false)
        setParentTaskForCreate(null)
      } else {
        alert(response.data?.message || "태스크 생성에 실패했습니다.")
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || "태스크 생성 중 오류가 발생했습니다."
      alert(message)
    } finally {
      setTaskLoading(false)
    }
  }

  const handleUpdateTask = async (updatedTask: Task) => {
    setTaskLoading(true)
    try {
      const response = await springApi.put(`/api/task/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description === '' ? '' : (updatedTask.description || null),
        status: updatedTask.status,
        tags: updatedTask.tags === '' ? '' : (updatedTask.tags || null),
        priority: updatedTask.priority || null,
        dueDate: updatedTask.dueDate || null,
        estimatedTimeHours: updatedTask.estimatedTimeHours || null,
        actualTimeHours: updatedTask.actualTimeHours || null,
      })
      if (response.data?.resultCode === "SUCCESS") {
        await fetchTasks(selectedProjectId)
        setIsDetailDialogOpen(false)
        setSelectedTask(null)
      } else {
        alert(response.data?.message || "태스크 수정에 실패했습니다.")
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 수정 중 오류가 발생했습니다.")
    } finally {
      setTaskLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return
    setTaskLoading(true)
    try {
      const response = await springApi.delete(`/api/task/${taskId}`)
      if (response.data?.resultCode === "SUCCESS") {
        await fetchTasks(selectedProjectId)
        setIsDetailDialogOpen(false)
        setSelectedTask(null)
      } else {
        alert(response.data?.message || "태스크 삭제에 실패했습니다.")
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 삭제 중 오류가 발생했습니다.")
    } finally {
      setTaskLoading(false)
    }
  }

  const handleAddSubtask = (parentTask: Task) => {
    setSelectedTask(null)
    setTimeout(() => {
      setParentTaskForCreate(parentTask);
      setSelectedProjectId(parentTask.projectId || 'all');
      setIsCreateDialogOpen(true);
    }, 100);
  };

  const handleDuplicateTask = async (taskToDuplicate: Task) => {
    setTaskLoading(true);
    try {
      const response = await springApi.post("/api/task/new", {
        title: `${taskToDuplicate.title} (복제됨)`,
        description: taskToDuplicate.description,
        status: TaskStatus.TODO,
        tags: taskToDuplicate.tags,
        priority: taskToDuplicate.priority,
        dueDate: taskToDuplicate.dueDate,
        estimatedTimeHours: taskToDuplicate.estimatedTimeHours,
        projectId: taskToDuplicate.projectId,
        parentId: taskToDuplicate.parentId,
      });
      if (response.data?.resultCode === "SUCCESS") {
        await fetchTasks(selectedProjectId);
      } else {
        alert(response.data?.message || "태스크 복제에 실패했습니다.");
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 복제 중 오류가 발생했습니다.");
    } finally {
      setTaskLoading(false);
    }
  };


  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setIsDetailDialogOpen(true)
  }

  const activeTask = activeId ? flattenTaskTree(tasks).find(t => t.id === activeId) : null // 모든 태스크에서 찾기

  function getProgressStats(tasks: any[]) {
    const total = flattenTaskTree(tasks).length // 모든 하위 태스크 포함
    const done = flattenTaskTree(tasks).filter((t) => t.status === TaskStatus.DONE).length
    const doing = flattenTaskTree(tasks).filter((t) => t.status === TaskStatus.DOING).length
    const todo = flattenTaskTree(tasks).filter((t) => t.status === TaskStatus.TODO).length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, doing, todo, percent }
  }

  // 진행상황 카드 데이터
  let progressCards: { title: string; percent: number; todo: number; doing: number; done: number }[] = [];
  if (selectedProjectId === 'all') {
    const stats = getProgressStats(tasks)
    progressCards = [
      {
        title: '모든 태스크',
        percent: stats.percent,
        todo: stats.todo,
        doing: stats.doing,
        done: stats.done,
      }
    ]
  } else {
    const proj = projects.find(p => p.id === selectedProjectId)
    // 현재 프로젝트에 해당하는 태스크들만 필터링하여 진행률 계산
    const projectSpecificTasks = flattenTaskTree(tasks).filter(t => t.projectId === selectedProjectId);
    const stats = getProgressStats(projectSpecificTasks)
    progressCards = [
      {
        title: proj ? proj.name : '',
        percent: stats.percent,
        todo: stats.todo,
        doing: stats.doing,
        done: stats.done,
      }
    ]
  }

  // 프로젝트 추가 핸들러
  const handleAddProject = async () => {
    setTaskLoading(true)
    if (!projectName.trim()) {
      alert("프로젝트명을 입력하세요.")
      return
    }
    setLoading(true)
    try {
      const response = await springApi.post("/api/project/new", {
        projectName: projectName.trim(),
        projectDescription: projectDesc.trim() || undefined,
        projectStatus: ProjectStatus.ACTIVE,
      })
      if (response.data && response.data.resultCode === "SUCCESS") {
        await fetchProjects();
        setProjectDialogOpen(false)
        setProjectName("")
        setProjectDesc("")
        setSelectedProjectId(response.data.data?.id)
      } else {
        alert(response.data?.message || "프로젝트 추가에 실패했습니다.")
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "프로젝트 추가 중 오류가 발생했습니다."
      alert(message)
    } finally {
      setLoading(false)
      setTaskLoading(false)
    }
  }

  // 태스크 생성 다이얼로그에 넘길 프로젝트 목록 (id, name만)
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {progressCards.map((card, idx) => (
            <div key={card.title + idx} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">{card.title} 진행 상황</h2>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>완료율</span>
                  <span className="font-medium">{card.percent}%</span>
                </div>
                <Progress value={card.percent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>할 일: {card.todo}</span>
                  <span>진행 중: {card.doing}</span>
                  <span>완료: {card.done}</span>
                </div>
              </div>
            </div>
          ))}

          <TaskFilter
            onFilterChange={handleFilterChange}
            tags={Array.from(new Set(flattenTaskTree(tasks).flatMap((t) => t.tags?.split(",") || []))).filter(Boolean)}
          />
        </div>

        <div className="flex gap-2 items-center mb-4">
          <label className="font-medium">프로젝트:</label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">전체</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" className="flex items-center gap-1 ml-2" onClick={() => setProjectDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" /> 프로젝트 추가
          </Button>
        </div>

        <div className="flex">
          {/* Main task columns */}
          {loading ? (
            <div className="w-full">
              <LoadingSpinner text="태스크 불러오는 중..." />
            </div>
          ) : taskLoading ? (
            <div className="w-full">
              <LoadingSpinner text="처리 중..." />
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 w-full`}>
              <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <TaskColumn title="할 일" status={TaskStatus.TODO} count={todoTasks.length}>
                  <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {todoTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={openTaskDetail}
                        onToggleTask={handleToggleTaskStatus}
                        onAddSubtask={handleAddSubtask}
                        onDeleteTask={handleDeleteTask}
                        onToggleExpand={handleToggleExpand}
                        expandedTasks={expandedTasks}
                      />
                    ))}
                  </SortableContext>
                </TaskColumn>

                <TaskColumn title="진행 중" status={TaskStatus.DOING} count={doingTasks.length}>
                  <SortableContext items={doingTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {doingTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={openTaskDetail}
                        onToggleTask={handleToggleTaskStatus}
                        onAddSubtask={handleAddSubtask}
                        onDeleteTask={handleDeleteTask}
                        onToggleExpand={handleToggleExpand}
                        expandedTasks={expandedTasks}
                      />
                    ))}
                  </SortableContext>
                </TaskColumn>

                <TaskColumn title="완료" status={TaskStatus.DONE} count={doneTasks.length}>
                  <SortableContext items={doneTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {doneTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onClick={openTaskDetail}
                        onToggleTask={handleToggleTaskStatus}
                        onAddSubtask={handleAddSubtask}
                        onDeleteTask={handleDeleteTask}
                        onToggleExpand={handleToggleExpand}
                        expandedTasks={expandedTasks}
                      />
                    ))}
                  </SortableContext>
                </TaskColumn>

                {/* Drag overlay for better visual feedback */}
                <DragOverlay>
                  {activeTask ? (
                    <div className="opacity-80">
                      <TaskCard
                        task={activeTask}
                        index={0}
                        onClick={openTaskDetail}
                        isDragOverlay
                        onToggleTask={handleToggleTaskStatus}
                        onAddSubtask={handleAddSubtask}
                        onDeleteTask={handleDeleteTask}
                        expandedTasks={expandedTasks}
                        onToggleExpand={handleToggleExpand}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>
      </main>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        parentTask={parentTaskForCreate}
        existingTasks={tasks}
        projects={projectOptions}
        defaultProjectId={selectedProjectId !== 'all' ? Number(selectedProjectId) : null}
      />

      {selectedTask && (
        <TaskDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          task={selectedTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
        />
      )}

      {/* 프로젝트 추가 다이얼로그 */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">프로젝트명</label>
              <input
                type="text"
                className="w-full border rounded-md p-2 text-sm"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                maxLength={30}
                required
                placeholder="프로젝트명을 입력하세요"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">설명 (선택)</label>
              <textarea
                className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
                maxLength={255}
                placeholder="프로젝트 설명을 입력하세요"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddProject} type="button" disabled={taskLoading}>
              {taskLoading ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
