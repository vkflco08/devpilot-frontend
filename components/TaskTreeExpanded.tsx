"use client"

import { type Task, TaskStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TaskTreeExpandedProps {
  task: Task
  onTaskClick: (task: Task) => void
  onClose: () => void
}

export function TaskTreeExpanded({ task, onTaskClick, onClose }: TaskTreeExpandedProps) {
  const priorityColors = {
    1: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    2: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    4: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    5: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  }

  const statusColors = {
    [TaskStatus.TODO]: "bg-slate-500",
    [TaskStatus.DOING]: "bg-amber-500",
    [TaskStatus.DONE]: "bg-emerald-500",
    [TaskStatus.BLOCKED]: "bg-red-500",
  }

  const renderSubtask = (subtask: Task, level: number) => (
    <div key={subtask.id} className="relative">
      <div 
        className={cn(
          "absolute top-0 left-[-12px] w-px h-full bg-border",
          level > 1 && `left-[${(level - 1) * 16 + 4}px]`
        )}
        style={{ left: level > 0 ? `${(level * 16) - 12}px` : undefined }}
      ></div>
      <div 
        className="absolute top-4 w-3 h-px bg-border" 
        style={{ left: level > 0 ? `${(level * 16) - 12 + 4}px` : undefined }}
      ></div>

      <div
        className={cn(
            "p-3 rounded-md border bg-card hover:bg-accent cursor-pointer",
            level > 0 && `ml-[${level * 16}px]`
        )}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => onTaskClick(subtask)}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("w-2 h-2 rounded-full", statusColors[subtask.status])}></span>
          <h5 className="font-medium line-clamp-1">{subtask.title}</h5>
          {subtask.priority && (
            <Badge
              variant="outline"
              className={cn(
                "ml-auto text-xs",
                priorityColors[subtask.priority as keyof typeof priorityColors],
              )}
            >
              P{subtask.priority}
            </Badge>
          )}
        </div>
        {subtask.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{subtask.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {subtask.estimatedTimeHours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{subtask.estimatedTimeHours}시간</span>
            </div>
          )}
          {subtask.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(subtask.dueDate), "yyyy-MM-dd")}</span>
            </div>
          )}
        </div>

        {/* 재귀적으로 하위 태스크 렌더링 */}
        {subtask.subTasks.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">
              하위 태스크 {subtask.subTasks.length}개
            </div>
            <div className="space-y-2">
              {subtask.subTasks.map(nestedTask => renderSubtask(nestedTask, level + 1))}
            </div>
          </div>
        )}
      </div>
    </div>
  );


  return (
    <Card className="h-full overflow-y-auto"> 
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">태스크 트리</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("w-3 h-3 rounded-full", statusColors[task.status])}></span>
            <h3 className="text-lg font-medium line-clamp-2">{task.title}</h3> 
            {task.priority && (
              <Badge
                variant="outline"
                className={cn("ml-2 text-xs", priorityColors[task.priority as keyof typeof priorityColors])}
              >
                P{task.priority}
              </Badge>
            )}
          </div>
          {task.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>} {/* ✨ line-clamp-2 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags && typeof task.tags === 'string' &&
              task.tags.split(",").map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag.trim()}
                </Badge>
              ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.estimatedTimeHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedTimeHours}시간</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.dueDate), "yyyy-MM-dd")}</span>
              </div>
            )}
          </div>
        </div>

        {task.subTasks.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-4">하위 태스크</h4>
            <div className="relative pl-1">
              {/* <div className="absolute top-0 left-3 w-px h-full bg-border"></div> */}

              <div className="space-y-4">
                {task.subTasks.map((subtask) => renderSubtask(subtask, 1))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
