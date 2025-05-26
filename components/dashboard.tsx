"use client"

import { useState, useEffect, useCallback } from "react"
import type { DragEndEvent } from "@dnd-kit/core"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { type Task as OrigTask, TaskStatus } from "@/lib/types"
import { buildTaskTree, getRootTasks, findTaskById } from "@/lib/task-utils"
import { TaskCard } from "@/components/task-card"
import { TaskColumn } from "@/components/task-column"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { TaskTreeExpanded } from "@/components/task-tree-expanded"
import { TaskFilter } from "@/components/task-filter"
import { BarChart3, PlusCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import axios from "@/lib/axiosInstance"
import LoadingSpinner from "@/components/LoadingSpinner"

interface DashboardProps {
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
}

type Task = OrigTask & { projectId?: number }

export default function Dashboard({ isCreateDialogOpen, setIsCreateDialogOpen }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [parentTaskForCreate, setParentTaskForCreate] = useState<Task | null>(null) // 새로 추가
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    tag: "",
    priority: 0,
    search: "",
  })
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | number>('all')
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDesc, setProjectDesc] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)

  const handleFilterChange = useCallback((filters: { tag: string; priority: number; search: string }) => {
    setFilterOptions(filters)
  }, [])

  // 프로젝트 목록 fetch
  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/project/all")
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
      if (projectId === 'all') {
        const res = await axios.get("/api/task/all")
        if (res.data.resultCode === "SUCCESS") {
          setTasks(res.data.data)
        } else {
          setError(res.data.message || "태스크 목록을 불러오지 못했습니다.")
        }
      } else {
        const res = await axios.get(`/api/project/${projectId}`)
        if (res.data.resultCode === "SUCCESS") {
          setTasks(res.data.data.tasks || [])
        } else {
          setError(res.data.message || "프로젝트 태스크를 불러오지 못했습니다.")
        }
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
    // First build the task tree to properly handle parent-child relationships
    const taskTree = buildTaskTree(tasks)

    // Then apply filters to the tree
    let filtered = [...taskTree]

    if (filterOptions.tag) {
      filtered = filtered.filter((task) => task.tags?.includes(filterOptions.tag))
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
      // nav에서 열릴 때는 parentTask를 null로 설정
      if (!parentTaskForCreate) {
        setParentTaskForCreate(null)
      }
    } else {
      // Create dialog이 닫힐 때 parentTask 초기화
      setParentTaskForCreate(null)
    }
  }, [isCreateDialogOpen])

  // 프로젝트별 필터링
  const projectFilteredTasks = selectedProjectId === 'all'
    ? filteredTasks
    : filteredTasks.filter((task) => task.projectId === selectedProjectId);

  // Get only root tasks (tasks without parents)
  const rootTasks = getRootTasks(projectFilteredTasks)

  const todoTasks = rootTasks.filter((task) => task.status === TaskStatus.TODO)
  const doingTasks = rootTasks.filter((task) => task.status === TaskStatus.DOING)
  const doneTasks = rootTasks.filter((task) => task.status === TaskStatus.DONE)

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

    // 1. 컬럼의 빈 공간에 드롭: over.id가 status임
    if (Object.values(TaskStatus).includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
    } else {
      // 2. 태스크 위에 드롭: 해당 태스크의 status를 찾아서 사용
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (newStatus && activeTask && activeTask.status !== newStatus) {
      setTaskLoading(true);
      try {
        const response = await axios.put(`/api/task/${activeTaskId}`, { status: newStatus });
        if (response.data?.resultCode === "SUCCESS") {
          await fetchTasks(selectedProjectId);
        } else {
          alert(response.data?.message || "상태 변경에 실패했습니다.");
        }
      } catch (e: any) {
        alert(e?.response?.data?.message || "상태 변경 중 오류가 발생했습니다.");
      } finally {
        setTaskLoading(false);
      }
    } else if (active.id !== over.id) {
      // 같은 컬럼 내 순서 변경(로컬 상태만 변경)
      const activeContainer = active.data.current?.sortable.containerId;
      const overContainer = over.data.current?.sortable.containerId;
      const activeIndex = active.data.current?.sortable.index;
      const overIndex = over.data.current?.sortable.index;
      if (activeContainer && activeContainer === overContainer && activeIndex !== undefined && overIndex !== undefined) {
        const column = activeContainer as TaskStatus;
        let tasksInColumn: Task[] = [];
        if (column === TaskStatus.TODO) {
          tasksInColumn = [...todoTasks];
        } else if (column === TaskStatus.DOING) {
          tasksInColumn = [...doingTasks];
        } else {
          tasksInColumn = [...doneTasks];
        }
        const reordered = arrayMove(tasksInColumn, activeIndex, overIndex);
        setTasks((prev) => {
          const updatedTasks = JSON.parse(JSON.stringify(prev)) as Task[];
          const rootTasksToUpdate = getRootTasks(updatedTasks).filter((t) => t.status === column);
          for (let i = 0; i < rootTasksToUpdate.length; i++) {
            const taskIndex = updatedTasks.findIndex((t) => t.id === rootTasksToUpdate[i].id);
            if (taskIndex !== -1 && i < reordered.length) {
              updatedTasks[taskIndex] = reordered[i];
            }
          }
          return updatedTasks;
        });
      }
    }
  }

  const handleCreateTask = async (newTask: Task) => {
    setTaskLoading(true)
    try {
      const response = await axios.post("/api/task/new", {
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        tags: newTask.tags,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        estimatedTimeHours: newTask.estimatedTimeHours,
        parentId: newTask.parent?.id,
        projectId: newTask.projectId,
      })
      if (response.data && response.data.resultCode === "SUCCESS") {
        await fetchTasks(selectedProjectId)
        setIsCreateDialogOpen(false)
        setParentTaskForCreate(null) // 생성 후 초기화
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
      const response = await axios.put(`/api/task/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        tags: updatedTask.tags,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        estimatedTimeHours: updatedTask.estimatedTimeHours,
        actualTimeHours: updatedTask.actualTimeHours,
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
      const response = await axios.delete(`/api/task/${taskId}`)
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

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setIsDetailDialogOpen(true)
  }

  const handleAddSubtask = (parentTask: Task) => {
    setSelectedTask(null)
    setIsDetailDialogOpen(false)

    // Open create dialog with parent task pre-selected
    setTimeout(() => {
      setParentTaskForCreate(parentTask) // selectedTask 대신 parentTaskForCreate 사용
      setIsCreateDialogOpen(true)
    }, 100)
  }

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }

  // Calculate completion percentage based on all tasks including subtasks
  const allTasks = flattenTaskTree(Array.isArray(tasks) ? tasks : []);
  const completionPercentage =
    allTasks.length > 0
      ? Math.round((allTasks.filter((t) => t.status === TaskStatus.DONE).length / allTasks.length) * 100)
      : 0

  // Find the expanded task if any
  const expandedTask = expandedTaskId ? findTaskById(filteredTasks, expandedTaskId) : null

  // Find the active task for drag overlay
  const activeTask = activeId ? findTaskById(filteredTasks, activeId) : null

  // 진행상황 계산 함수
  function getProgressStats(tasks: any[]) {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === TaskStatus.DONE).length
    const doing = tasks.filter((t) => t.status === TaskStatus.DOING).length
    const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length
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
    const stats = getProgressStats(tasks)
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
    if (!projectName.trim()) {
      alert("프로젝트명을 입력하세요.")
      return
    }
    setLoading(true)
    try {
      const response = await axios.post("/api/project/new", {
        projectName: projectName.trim(),
        projectDescription: projectDesc.trim() || undefined,
      })
      console.log(response.data)
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
    }
  }

  // 태스크 생성 다이얼로그에 넘길 프로젝트 목록 (id, name만)
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

  // if (error) return <div className="flex items-center justify-center h-[60vh] text-lg text-red-500">{error}</div>;

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
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${expandedTask ? "w-1/2" : "w-full"}`}>
              <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <TaskColumn title="할 일" status={TaskStatus.TODO} count={todoTasks.length}>
                  <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {todoTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() => toggleTaskExpansion(task.id)}
                        onClick={() => openTaskDetail(task)}
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
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() => toggleTaskExpansion(task.id)}
                        onClick={() => openTaskDetail(task)}
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
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() => toggleTaskExpansion(task.id)}
                        onClick={() => openTaskDetail(task)}
                      />
                    ))}
                  </SortableContext>
                </TaskColumn>

                {/* Drag overlay for better visual feedback */}
                <DragOverlay>
                  {activeTask ? (
                    <div className="opacity-80">
                      <TaskCard task={activeTask} index={0} isExpanded={false} onClick={() => {}} isDragOverlay />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )}

          {/* Expanded task tree view */}
          {expandedTask && !loading && !taskLoading && (
            <div className="w-1/2 pl-6 animate-in slide-in-from-right duration-300">
              <TaskTreeExpanded
                task={expandedTask}
                onTaskClick={openTaskDetail}
                onClose={() => setExpandedTaskId(null)}
              />
            </div>
          )}
        </div>
      </main>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        parentTask={parentTaskForCreate} // selectedTask 대신 parentTaskForCreate 사용
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
            <Button onClick={handleAddProject} type="button" disabled={loading}>
              {loading ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function flattenTaskTree(tasks: Task[]): Task[] {
  const result: Task[] = [];
  if (!Array.isArray(tasks)) return result;
  function traverse(task: Task) {
    result.push(task);
    (task.subTasks ?? []).forEach(traverse);
  }
  tasks.forEach(traverse);
  return result;
}
