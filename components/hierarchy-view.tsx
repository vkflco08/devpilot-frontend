"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronRight, Calendar, Plus, MoreHorizontal } from "lucide-react"

import { TaskStatus, ProjectStatus } from "@/lib/types"
import type { Task as OrigTask, Project as OrigProject } from "@/lib/types"
import axios from "@/lib/axiosInstance"
import LoadingSpinner from "@/components/LoadingSpinner"
import { buildTaskTree } from "@/lib/task-utils"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"

interface Task extends OrigTask {}
interface Project extends OrigProject {}

// --- TaskItem 컴포넌트 (변경 없음, 이전 코드 그대로 사용) ---
const TaskItem = ({
  task,
  level = 0,
  onToggle,
  onTaskClick,
}: {
  task: Task
  level?: number
  onToggle: (taskId: number, newStatus: TaskStatus) => void
  onTaskClick: (task: Task) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 1:
        return "bg-red-500"
      case 2:
        return "bg-orange-500"
      case 3:
        return "bg-yellow-500"
      case 4:
        return "bg-lime-500"
      case 5:
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            완료
          </Badge>
        )
      case TaskStatus.DOING:
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            진행 중
          </Badge>
        )
      case TaskStatus.TODO:
        return <Badge variant="outline">할 일</Badge>
      case TaskStatus.BLOCKED:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            블록됨
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch (e) {
      console.error("날짜 포맷 오류:", e);
      return "-";
    }
  };

  const hasChildren = task.subTasks && task.subTasks.length > 0
  const isCompleted = task.status === TaskStatus.DONE;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group ${
          level > 0 ? "ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4" : ""
        }`}
        style={{ marginLeft: level * 24 }}
        onClick={() => onTaskClick(task)}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}

          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => {
              const newStatus = isCompleted ? TaskStatus.TODO : TaskStatus.DONE;
              onToggle(task.id, newStatus);
            }}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />

          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />

          <span
            className={`font-medium ${isCompleted ? "line-through text-gray-500" : ""} ${level === 0 ? "font-semibold" : ""}`}
          >
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(task.status)}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {task.subTasks?.map((child) => (
            <TaskItem key={child.id} task={child} level={level + 1} onToggle={onToggle} onTaskClick={onTaskClick} />
          ))}
        </div>
      )}
    </div>
  )
}


// --- ProjectCard 컴포넌트 (onAddTask prop 추가 및 onClick 핸들러 수정) ---
interface ProjectCardProps {
  project: Project
  onToggleTask: (taskId: number, newStatus: TaskStatus) => void
  onTaskClick: (task: Task) => void
  // ✨ onAddTask prop 추가: 이 함수를 통해 CreateTaskDialog를 열고 프로젝트 ID를 전달합니다.
  onAddTask: (projectId: number) => void;
}

const ProjectCard = ({
  project,
  onToggleTask,
  onTaskClick,
  onAddTask, // props로 받기
}: ProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const getAllTasksFlat = (tasks: Task[]): Task[] => {
    let allTasks: Task[] = []
    function traverse(task: Task) {
      allTasks.push(task)
      if (task.subTasks) {
        task.subTasks.forEach(traverse)
      }
    }
    (tasks || []).forEach(traverse)
    return allTasks
  }

  const allTasks = getAllTasksFlat(project.tasks || [])
  const completedTasks = allTasks.filter((task) => task.status === TaskStatus.DONE)
  const completionPercentage = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {allTasks.length} tasks
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">진행률</span>
            <span className="font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-1">
            {(project.tasks || []).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => onAddTask(project.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            태스크 추가
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

interface HierarchyViewProps { 
    isCreateDialogOpen: boolean;
    setIsCreateDialogOpen: (open: boolean) => void;
}

export default function HierarchyView({ isCreateDialogOpen, setIsCreateDialogOpen }: HierarchyViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)
//   const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false) // CreateTaskDialog 상태
  const [parentTaskForCreate, setParentTaskForCreate] = useState<Task | null>(null) // 부모 태스크 상태
  const [selectedProjectIdForCreate, setSelectedProjectIdForCreate] = useState<number | null>(null); // 태스크 생성 시 사용할 프로젝트 ID


  const fetchProjectsAndTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get("/api/project/dashboard")
      if (res.data.resultCode === "SUCCESS") {
        const fetchedProjects: Project[] = res.data.data.map((proj: any) => ({
          ...proj,
          tasks: buildTaskTree(proj.tasks || [])
        }))
        setProjects(fetchedProjects)
      } else {
        setError(res.data.message || "프로젝트 데이터를 불러오지 못했습니다.")
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "데이터를 불러오지 못했습니다.")
      console.error("Error fetching projects and tasks:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectsAndTasks()
  }, [])

  const toggleTask = async (taskId: number, newStatus: TaskStatus) => {
    setTaskLoading(true)
    try {
      const response = await axios.put(`/api/task/${taskId}`, { status: newStatus })
      if (response.data?.resultCode === "SUCCESS") {
        await fetchProjectsAndTasks()
      } else {
        alert(response.data?.message || "태스크 상태 업데이트에 실패했습니다.")
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 상태 업데이트 중 오류가 발생했습니다.")
    } finally {
      setTaskLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  // ✨ 새 태스크 추가를 위한 핸들러
  // 이 함수는 ProjectCard에서 호출될 때 해당 project.id를 받습니다.
  const handleAddTaskToProject = (projectId: number) => {
    setParentTaskForCreate(null); // 최상위 태스크이므로 부모 태스크 없음
    setSelectedProjectIdForCreate(projectId); // 선택된 프로젝트 ID 설정
    setIsCreateDialogOpen(true); // 다이얼로그 열기
  };

  // Subtask 추가 핸들러 (TaskDetailDialog에서 호출될 때)
  const handleAddSubtask = (parentTask: Task) => {
    setSelectedTask(null);
    setTimeout(() => {
      setParentTaskForCreate(parentTask);
      setSelectedProjectIdForCreate(parentTask.projectId || null);
      setIsCreateDialogOpen(true);
    }, 100);
  };


  const handleCreateTask = async (newTask: OrigTask) => {
    setTaskLoading(true);
    try {
        console.log("newTask parentId", newTask.parentId)
      const response = await axios.post("/api/task/new", {
        title: newTask.title,
        description: newTask.description === '' ? '' : (newTask.description || null), // 빈 문자열 허용 및 undefined -> null
        status: newTask.status,
        tags: newTask.tags === '' ? '' : (newTask.tags || null), // 빈 문자열 허용 및 undefined -> null
        priority: newTask.priority || null, // undefined -> null
        dueDate: newTask.dueDate || null, // 빈 문자열 -> null
        estimatedTimeHours: newTask.estimatedTimeHours || null, // undefined -> null
        // actualTimeHours는 TaskCreateRequest에 없으므로 일단 제외. 필요하면 백엔드 DTO 및 여기에 추가
        parentId: newTask.parentId, 
        projectId: newTask.projectId,
      });
      if (response.data && response.data.resultCode === "SUCCESS") {
        await fetchProjectsAndTasks();
        setIsCreateDialogOpen(false);
        setParentTaskForCreate(null);
        setSelectedProjectIdForCreate(null);
      } else {
        alert(response.data?.message || "태스크 생성에 실패했습니다.");
      }
    } catch (e: any) {
      const message = e?.response?.data?.message || "태스크 생성 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleUpdateTask = async (updatedTask: OrigTask) => {
    setTaskLoading(true);
    try {
      const response = await axios.put(`/api/task/${updatedTask.id}`, {
        title: updatedTask.title,
        description: updatedTask.description === '' ? '' : (updatedTask.description || null),
        status: updatedTask.status,
        tags: updatedTask.tags === '' ? '' : (updatedTask.tags || null),
        priority: updatedTask.priority || null,
        dueDate: updatedTask.dueDate || null,
        estimatedTimeHours: updatedTask.estimatedTimeHours || null,
        actualTimeHours: updatedTask.actualTimeHours || null, // 이 필드는 TaskCreateRequest/UpdateRequest에 없으면 문제될 수 있습니다.
      });
      if (response.data?.resultCode === "SUCCESS") {
        await fetchProjectsAndTasks();
        // TaskDetailDialog는 onOpenChange 콜백으로 외부에서 닫히므로 여기서는 상태 변경만.
      } else {
        alert(response.data?.message || "태스크 수정에 실패했습니다.");
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 수정 중 오류가 발생했습니다.");
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setTaskLoading(true);
    try {
      const response = await axios.delete(`/api/task/${taskId}`);
      if (response.data?.resultCode === "SUCCESS") {
        await fetchProjectsAndTasks();
        // TaskDetailDialog는 onOpenChange 콜백으로 외부에서 닫히므로 여기서는 상태 변경만.
      } else {
        alert(response.data?.message || "태스크 삭제에 실패했습니다.");
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 삭제 중 오류가 발생했습니다.");
    } finally {
      setTaskLoading(false);
    }
  };

  if (loading || taskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text={loading ? "프로젝트와 태스크를 불러오는 중..." : "처리 중..."} />
      </div>
    )
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>
  }

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">프로젝트 & 태스크 계층 구조</h1>
          <p className="text-gray-600 dark:text-gray-400">
            상위 태스크와 하위 태스크의 계층 관계를 한눈에 파악하며 효율적으로 프로젝트를 관리하세요.
          </p>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="md:col-span-3 text-center py-10 text-muted-foreground">
              프로젝트가 없습니다. 새로운 프로젝트를 추가하세요.
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onToggleTask={toggleTask}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTaskToProject}
              />
            ))
          )}
        </div>

        {/* Task Detail Side Panel */}
        {selectedTask && (
          <TaskDetailDialog
            open={!!selectedTask}
            onOpenChange={(open) => {
              if (!open) setSelectedTask(null);
            }}
            task={selectedTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddSubtask={handleAddSubtask}
          />
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        parentTask={parentTaskForCreate}
        existingTasks={projects.flatMap(p => p.tasks || [])}
        projects={projectOptions}
        defaultProjectId={selectedProjectIdForCreate}
      />
    </div>
  )
}
