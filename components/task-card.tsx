"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { type Task, TaskStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, GripVertical, ChevronRight, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  index?: number
  level?: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  onClick: () => void
  isDragOverlay?: boolean
}

export function TaskCard({
  task,
  index = 0,
  level = 0,
  isExpanded = false,
  onToggleExpand,
  onClick,
  isDragOverlay = false,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      sortable: {
        containerId: task.status,
        index,
      },
    },
    disabled: isDragOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColors = {
    1: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    2: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    4: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    5: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  }

  const statusColors = {
    [TaskStatus.TODO]: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    [TaskStatus.DOING]: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    [TaskStatus.DONE]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  }

  const hasSubtasks = task.subTasks && task.subTasks.length > 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer group hover:border-primary transition-colors",
        isDragging && "opacity-50",
        level > 0 && "border-l-4 border-l-primary/20",
        isDragOverlay && "shadow-lg",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {!isDragOverlay && (
            <div
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {hasSubtasks && onToggleExpand && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand()
              }}
              className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          <div className="flex-1 space-y-2" onClick={onClick}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <h4 className="font-medium line-clamp-2">{task.title}</h4>
                {hasSubtasks && (
                  <Badge variant="outline" className="text-xs">
                    {task.subTasks.length}
                  </Badge>
                )}
              </div>
              {task.priority && (
                <Badge
                  variant="outline"
                  className={cn("ml-2 text-xs", priorityColors[task.priority as keyof typeof priorityColors])}
                >
                  P{task.priority}
                </Badge>
              )}
            </div>
            {task.description && <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>}
            <div className="flex flex-wrap gap-1 pt-1">
              {task.tags &&
                task.tags.split(",").map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
            </div>
            {task.estimatedTimeHours && task.dueDate && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
