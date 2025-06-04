"use client"

import type React from "react"
import { useDroppable } from "@dnd-kit/core"
import type { TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskColumnProps {
  title: string
  status: TaskStatus
  count: number
  children: React.ReactNode
}

export function TaskColumn({ title, status, count, children }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-auto rounded-lg border bg-card shadow-sm",
        isOver && "ring-2 ring-primary ring-opacity-50",
      )}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <span className="text-sm px-2 py-1 bg-muted rounded-full">{count}</span>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 h-full transition-all duration-200">
        {children}
      </div>
    </div>
  )
}
