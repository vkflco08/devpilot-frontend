"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/lib/types";
import type { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Calendar } from "lucide-react"
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"

export const TaskItem = ({
    task,
    level = 0,
    expandedTasks,
    onToggleExpand,
    onToggle,
    onTaskClick,
    onAddSubtask,
    onDeleteTask,
  }: {
    task: Task
    level?: number
    expandedTasks: Set<number>;
    onToggleExpand: (taskId: number) => void;
    onToggle: (taskId: number, newStatus: TaskStatus, previousStatusToSend: TaskStatus | null) => void 
    onTaskClick: (task: Task) => void
    onAddSubtask: (parentTask: Task) => void
    onDeleteTask: (taskId: number, taskTitle: string) => void 
  }) => {
    const isExpanded = expandedTasks.has(task.id);
  
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
            <div className="flex items-center justify-center w-6 h-6">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpand(task.id);
                }}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            </div>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => {
              let newStatus: TaskStatus;
              let previousStatusToSend: TaskStatus | null = null; // 백엔드로 보낼 이전 상태
  
              if (isCompleted) { // 현재 '완료' 상태라면, 체크를 풀고 이전 상태로 돌아가야 함
                  // 직전 상태 (previousStatus)가 있으면 그 상태로, 없으면 TODO로
                  newStatus = task.previousStatus || TaskStatus.TODO; 
                  previousStatusToSend = TaskStatus.DONE; // 현재 DONE이었음을 백엔드에 알림
              } else { // 현재 '할 일', '진행 중', '블록됨' 상태라면, 체크 시 완료로 변경
                  newStatus = TaskStatus.DONE;
                  // 현재 태스크의 status를 previousStatus로 저장하여 다음 체크 해제 시 사용
                  previousStatusToSend = task.status; 
              }
              // ✨ onToggle 함수 호출 시 newStatus와 previousStatusToSend 모두 전달
              onToggle(task.id, newStatus, previousStatusToSend); 
              }}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
  
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
  
            <span
              className={`
                ${isCompleted ? "line-through text-gray-500" : ""}
                ${level === 0 ? "font-semibold" : ""}
                ${hasChildren ? "font-extrabold" : "font-medium"}
              `}
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
  
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()} // 버튼 클릭 시 태스크 클릭 이벤트 방지
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddSubtask(task); }}>
                  하위 태스크 추가
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id, task.title); }}
                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  태스크 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
  
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {task.subTasks?.map((child) => (
              <TaskItem
                key={child.id}
                task={child}
                level={level + 1}
                expandedTasks={expandedTasks}
                onToggleExpand={onToggleExpand}
                onToggle={onToggle}
                onTaskClick={onTaskClick}
                onAddSubtask={onAddSubtask}
                onDeleteTask={onDeleteTask}
              />
            ))}
          </div>
        )}
      </div>
    )
  }