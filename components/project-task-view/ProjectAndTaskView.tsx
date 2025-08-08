
/**
 * @file 프로젝트와 태스크의 계층 구조를 표시하고 관리하는 메인 뷰 컴포넌트입니다.
 * @description 백엔드에서 프로젝트 및 태스크 데이터를 가져와 트리 형태로 시각화하며,
 * 태스크 상태 토글, 상세 보기, 하위 태스크/새 태스크 생성 등의
 * 주요 기능을 통합 관리합니다.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { springApi } from "@/lib/axiosInstance"
import { buildTaskTree } from "@/lib/task-utils"

import { ProjectList } from "@/components/project-task-view/ProjectList"
import { TaskDialogsManager } from "@/components/project-task-view/TaskDialogsManager" 

import { TaskStatus } from "@/lib/types"
import type { Task as OrigTask, Project as OrigProject } from "@/lib/types"


// 내부적으로 사용할 타입 정의
interface Task extends OrigTask {}
interface Project extends OrigProject {}

// 외부에서 받는 props 정의 (pages/index.tsx에서 전달됨)
interface ProjectAndTaskViewProps {
    isCreateDialogOpen: boolean;
    setIsCreateDialogOpen: (open: boolean) => void;
}

export default function ProjectAndTaskView({ isCreateDialogOpen, setIsCreateDialogOpen }: ProjectAndTaskViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null) 
  const [taskLoading, setTaskLoading] = useState(false) 

  const [parentTaskForCreate, setParentTaskForCreate] = useState<Task | null>(null) 
  const [selectedProjectIdForCreate, setSelectedProjectIdForCreate] = useState<number | null>(null); 

  // Set의 초기값을 localStorage에서 가져오도록 수정
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(() => {
    try {
        const item = window.localStorage.getItem('task-pilot:hierarchy:expanded-tasks');
        return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
        console.error(error);
        return new Set();
    }
  });

  // expandedTasks 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
      try {
          window.localStorage.setItem('task-pilot:hierarchy:expanded-tasks', JSON.stringify(Array.from(expandedTasks)));
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

  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(() => {
    try {
        const item = window.localStorage.getItem('task-pilot:hierarchy:expanded-projects');
        return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) { return new Set(); }
  });

  useEffect(() => {
    try {
        window.localStorage.setItem('task-pilot:hierarchy:expanded-projects', JSON.stringify(Array.from(expandedProjects)));
    } catch (error) { console.error(error); }
  }, [expandedProjects]);

  const handleToggleProjectExpand = (projectId: number) => {
    setExpandedProjects(prev => {
        const newSet = new Set(prev);
        if (newSet.has(projectId)) {
            newSet.delete(projectId);
        } else {
            newSet.add(projectId);
        }
        return newSet;
    });
  };

  const fetchProjectsAndTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await springApi.get("/api/project/mypage") 
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
  }, []); 


  useEffect(() => {
    fetchProjectsAndTasks()
  }, [fetchProjectsAndTasks]) 


  const toggleTask = async (taskId: number, newStatus: TaskStatus, previousStatusToSend: TaskStatus | null) => {
    setTaskLoading(true)
    try {
        const response = await springApi.put(`/api/task/${taskId}`, { 
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

  const handleAddTaskToProject = useCallback((projectId: number) => {
    setParentTaskForCreate(null);
    setSelectedProjectIdForCreate(projectId); 
    setIsCreateDialogOpen(true); 
  }, [setIsCreateDialogOpen]); 

  const handleAddSubtask = useCallback((parentTask: Task) => {
    setSelectedTask(null); 
    setTimeout(() => {
      setParentTaskForCreate(parentTask);
      setSelectedProjectIdForCreate(parentTask.projectId || null);
      setIsCreateDialogOpen(true); 
    }, 100);
  }, [setIsCreateDialogOpen]); 

  const handleCreateTask = async (newTask: OrigTask) => {
    setTaskLoading(true);
    try {
        console.log("newTask parentId", newTask.parentId)
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

  const handleUpdateTask = async (updatedTask: OrigTask) => {
    setTaskLoading(true);
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

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setTaskLoading(true);
    try {
      const response = await springApi.delete(`/api/task/${taskId}`);
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
  const allTasksFlat = projects.flatMap(p => p.tasks || [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">프로젝트 & 태스크 계층 구조</h1>
          <p className="text-gray-600 dark:text-gray-400">
            상위 태스크와 하위 태스크의 계층 관계를 한눈에 파악하며 효율적으로 프로젝트를 관리하세요.
          </p>
        </div> */}

        {/* ProjectList 컴포넌트 렌더링 */}
        <ProjectList
            projects={projects}
            expandedTasks={expandedTasks}
            expandedProjects={expandedProjects}
            onToggleExpand={handleToggleExpand}
            onToggleProjectExpand={handleToggleProjectExpand}
            onToggle={toggleTask}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTaskToProject}
            onAddSubtask={handleAddSubtask}
            onDeleteTask={handleDeleteTask}
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
            existingTasks={allTasksFlat}
        />
      </div>
    </div>
  )
}
