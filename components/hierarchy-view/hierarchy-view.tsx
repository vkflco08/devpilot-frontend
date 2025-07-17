
/**
 * @file 프로젝트와 태스크의 계층 구조를 표시하고 관리하는 메인 뷰 컴포넌트입니다.
 * @description 백엔드에서 프로젝트 및 태스크 데이터를 가져와 트리 형태로 시각화하며,
 * 태스크 상태 토글, 상세 보기, 하위 태스크/새 태스크 생성 등의
 * 주요 기능을 통합 관리합니다.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import axios from "@/lib/axiosInstance"
import { buildTaskTree } from "@/lib/task-utils"

import { ProjectList } from "@/components/hierarchy-view/project-list" // 새로 분리한 ProjectList 임포트
import { TaskDialogsManager } from "@/components/hierarchy-view/task-dialogs-manager" // 새로 분리한 TaskDialogsManager 임포트

import { TaskStatus } from "@/lib/types"
import type { Task as OrigTask, Project as OrigProject } from "@/lib/types"


// 내부적으로 사용할 타입 정의
interface Task extends OrigTask {}
interface Project extends OrigProject {}

// 외부에서 받는 props 정의 (pages/index.tsx에서 전달됨)
interface HierarchyViewProps {
    isCreateDialogOpen: boolean;
    setIsCreateDialogOpen: (open: boolean) => void;
}

export default function HierarchyView({ isCreateDialogOpen, setIsCreateDialogOpen }: HierarchyViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null) // TaskDetailDialog 제어용
  const [taskLoading, setTaskLoading] = useState(false) // 태스크 수정/삭제/생성 시 로딩

  // CreateTaskDialog 제어용 (일부 상태는 TaskDialogsManager로 이동)
  const [parentTaskForCreate, setParentTaskForCreate] = useState<Task | null>(null) // 부모 태스크 상태
  const [selectedProjectIdForCreate, setSelectedProjectIdForCreate] = useState<number | null>(null); // 태스크 생성 시 사용할 프로젝트 ID


  // 프로젝트와 태스크 데이터를 함께 페칭하는 함수
  const fetchProjectsAndTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get("/api/project/mypage") // /mypage 엔드포인트에서 프로젝트 내 태스크들을 가져옴
      if (res.data.resultCode === "SUCCESS") {
        const fetchedProjects: Project[] = res.data.data.map((proj: any) => ({
          ...proj,
          // 백엔드에서 받은 플랫한 태스크 리스트를 트리로 변환
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
  }, []); // useCallback 사용하여 의존성 배열을 비워둠 (변하지 않는 함수)


  useEffect(() => {
    fetchProjectsAndTasks()
  }, [fetchProjectsAndTasks]) // fetchProjectsAndTasks가 변경될 때마다 실행 (useCallback 사용 시 안정적)


  // 태스크 완료 상태 토글 (ProjectCard에서 호출됨)
  const toggleTask = async (taskId: number, newStatus: TaskStatus, previousStatusToSend: TaskStatus | null) => {
    setTaskLoading(true)
    try {
        // ✨ previousStatus를 함께 전송
        const response = await axios.put(`/api/task/${taskId}`, { 
            status: newStatus,
            previousStatus: previousStatusToSend 
        })
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

  // TaskDetailDialog에서 태스크 클릭 시 호출
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  // ProjectCard의 '태스크 추가' 버튼 클릭 시 호출
  const handleAddTaskToProject = useCallback((projectId: number) => {
    setParentTaskForCreate(null); // 최상위 태스크이므로 부모 태스크 없음
    setSelectedProjectIdForCreate(projectId); // 선택된 프로젝트 ID 설정
    setIsCreateDialogOpen(true); // CreateTaskDialog 열기
  }, [setIsCreateDialogOpen]); // setIsCreateDialogOpen이 변경될 때마다 재생성

  // TaskDetailDialog의 '하위 태스크 추가' 버튼 클릭 시 호출
  const handleAddSubtask = useCallback((parentTask: Task) => {
    setSelectedTask(null); // 상세 다이얼로그 닫기
    // 다이얼로그 닫힘 애니메이션을 위한 짧은 지연
    setTimeout(() => {
      setParentTaskForCreate(parentTask);
      setSelectedProjectIdForCreate(parentTask.projectId || null);
      setIsCreateDialogOpen(true); // CreateTaskDialog 열기
    }, 100);
  }, [setIsCreateDialogOpen]); // setIsCreateDialogOpen이 변경될 때마다 재생성


  // CreateTaskDialog의 onCreateTask prop으로 전달될 함수
  const handleCreateTask = async (newTask: OrigTask) => {
    setTaskLoading(true);
    try {
        console.log("newTask parentId", newTask.parentId)
      const response = await axios.post("/api/task/new", {
        title: newTask.title,
        description: newTask.description === '' ? '' : (newTask.description || null),
        status: newTask.status,
        tags: newTask.tags === '' ? '' : (newTask.tags || null),
        priority: newTask.priority || null,
        dueDate: newTask.dueDate || null,
        estimatedTimeHours: newTask.estimatedTimeHours || null,
        parentId: newTask.parentId,
        projectId: newTask.projectId,
      });
      if (response.data && response.data.resultCode === "SUCCESS") {
        await fetchProjectsAndTasks();
        setIsCreateDialogOpen(false); // 다이얼로그 닫기
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

  // TaskDetailDialog의 onUpdateTask prop으로 전달될 함수
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
      } else {
        alert(response.data?.message || "태스크 수정에 실패했습니다.");
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || "태스크 수정 중 오류가 발생했습니다.");
    } finally {
      setTaskLoading(false);
    }
  };

  // TaskDetailDialog의 onDeleteTask prop으로 전달될 함수
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setTaskLoading(true);
    try {
      const response = await axios.delete(`/api/task/${taskId}`);
      if (response.data?.resultCode === "SUCCESS") {
        await fetchProjectsAndTasks();
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
  const allTasksFlat = projects.flatMap(p => p.tasks || []) // 모든 태스크를 플랫하게

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">프로젝트 & 태스크 계층 구조</h1>
          <p className="text-gray-600 dark:text-gray-400">
            상위 태스크와 하위 태스크의 계층 관계를 한눈에 파악하며 효율적으로 프로젝트를 관리하세요.
          </p>
        </div>

        {/* ProjectList 컴포넌트 렌더링 */}
        <ProjectList
            projects={projects}
            onToggleTask={toggleTask}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTaskToProject}
        />

        {/* TaskDialogsManager 컴포넌트 렌더링 */}
        <TaskDialogsManager
            isCreateDialogOpen={isCreateDialogOpen}
            setIsCreateDialogOpen={setIsCreateDialogOpen}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            parentTaskForCreate={parentTaskForCreate}
            selectedProjectIdForCreate={selectedProjectIdForCreate}
            handleCreateTask={handleCreateTask}
            handleUpdateTask={handleUpdateTask}
            handleDeleteTask={handleDeleteTask}
            handleAddSubtask={handleAddSubtask}
            projects={projectOptions}
            existingTasks={allTasksFlat} // 플랫한 모든 태스크를 전달
        />
      </div>
    </div>
  )
}
