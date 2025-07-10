"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { type Task, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: number) => void
  onAddSubtask?: (parentTask: Task) => void
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [tags, setTags] = useState(task.tags || "")
  const [priority, setPriority] = useState<number | null>(task.priority || null)
  const [dueDate, setDueDate] = useState<Date | null>(task.dueDate ? new Date(task.dueDate) : null)
  const [estimatedTimeHours, setEstimatedTimeHours] = useState<number | null>(task.estimatedTimeHours || null)
  const [actualTimeHours, setActualTimeHours] = useState<number | null>(task.actualTimeHours || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setTags(task.tags || "")
      setPriority(task.priority || null)
      setDueDate(task.dueDate ? new Date(task.dueDate) : null)
      setEstimatedTimeHours(task.estimatedTimeHours || null)
      setActualTimeHours(task.actualTimeHours || null)
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true)
    e.preventDefault()
    if (!title.trim()) return

    const updatedTask: Task = {
      ...task,
      title,
      description: description || null,
      status,
      tags: tags || null,
      priority: priority || 3,
      dueDate: dueDate ? dueDate.toISOString() : null,
      estimatedTimeHours: estimatedTimeHours || null,
      actualTimeHours: actualTimeHours || null,
    }

    await onUpdateTask(updatedTask)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>태스크 상세</DialogTitle>
            <DialogDescription>태스크의 세부 정보를 확인하고 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="태스크 제목"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="태스크에 대한 설명"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">상태</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.TODO}>할 일</SelectItem>
                    <SelectItem value={TaskStatus.DOING}>진행 중</SelectItem>
                    <SelectItem value={TaskStatus.DONE}>완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">우선순위</Label>
                <Select
                  value={priority?.toString() || ""}
                  onValueChange={(value) => setPriority(value ? Number.parseInt(value) : null)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="우선순위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (최상)</SelectItem>
                    <SelectItem value="2">2 (상)</SelectItem>
                    <SelectItem value="3">3 (중)</SelectItem>
                    <SelectItem value="4">4 (하)</SelectItem>
                    <SelectItem value="5">5 (최하)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">태그</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="쉼표로 구분된 태그 (예: 프론트엔드, 디자인)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">마감일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "yyyy-MM-dd") : <span>날짜 선택</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate ? new Date(dueDate) : undefined} onSelect={(date) => setDueDate(date || null)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimatedTime">예상 시간 (시간)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedTimeHours?.toString() || ""}
                  onChange={(e) => setEstimatedTimeHours(e.target.value ? Number.parseFloat(e.target.value) : null)}
                  placeholder="예: 2.5"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="actualTime">실제 소요 시간 (시간)</Label>
              <Input
                id="actualTime"
                type="number"
                min="0"
                step="0.5"
                value={actualTimeHours?.toString() || ""}
                onChange={(e) => setActualTimeHours(e.target.value ? Number.parseFloat(e.target.value) : null)}
                placeholder="예: 3.0"
              />
            </div>
            {estimatedTimeHours && actualTimeHours && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">시간 차이: </span>
                {actualTimeHours > estimatedTimeHours
                  ? `${(actualTimeHours - estimatedTimeHours).toFixed(1)}시간 초과`
                  : `${(estimatedTimeHours - actualTimeHours).toFixed(1)}시간 절약`}
              </div>
            )}

            {task.subTasks && task.subTasks.length > 0 && (
              <div className="mt-2">
                <Label className="mb-2 block">하위 태스크 ({task.subTasks.length}개)</Label>
                <ul className="space-y-1 text-sm">
                  {task.subTasks.map((subtask) => (
                    <li key={subtask.id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          subtask.status === TaskStatus.TODO
                            ? "bg-slate-500"
                            : subtask.status === TaskStatus.DOING
                              ? "bg-amber-500"
                              : "bg-emerald-500",
                        )}
                      ></span>
                      <span className="flex-1">{subtask.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => onDeleteTask(task.id)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                {loading ? "삭제 중..." : "삭제"}
              </Button>

              {onAddSubtask && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => onAddSubtask(task)}
                >
                  <Plus className="h-4 w-4" />
                  하위 태스크 추가
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "수정 중..." : "수정"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
