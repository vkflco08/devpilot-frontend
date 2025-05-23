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
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Task) => void
  parentTask?: Task | null
  existingTasks?: Task[]
  projects: { id: number; name: string }[]
  defaultProjectId?: number | null
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreateTask,
  parentTask = null,
  existingTasks = [],
  projects = [],
  defaultProjectId = null,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO)
  const [tags, setTags] = useState("")
  const [priority, setPriority] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [estimatedTimeHours, setEstimatedTimeHours] = useState<number | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'none'>(defaultProjectId ?? 'none')

  // Reset form when dialog opens/closes or parent task changes
  useEffect(() => {
    if (open) {
      // If creating a subtask, inherit some properties from parent
      if (parentTask) {
        setSelectedParentId(parentTask.id)
        setStatus(parentTask.status)
        // Optionally inherit tags or other properties
        if (parentTask.tags) {
          setTags(parentTask.tags)
        }
        if (parentTask.priority) {
          setPriority(parentTask.priority)
        }
      } else {
        resetForm()
      }
      if (defaultProjectId) setSelectedProjectId(defaultProjectId)
      else setSelectedProjectId('none')
    }
  }, [open, parentTask, defaultProjectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newTask: Task = {
      id: Date.now(),
      title,
      description: description || undefined,
      status,
      tags: tags || undefined,
      priority: priority || undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      estimatedTimeHours: estimatedTimeHours || undefined,
      parent: selectedParentId ? ({ id: selectedParentId } as Task) : undefined,
      subTasks: [],
      projectId: selectedProjectId === 'none' ? undefined : selectedProjectId,
    }

    onCreateTask(newTask)
    resetForm()
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStatus(TaskStatus.TODO)
    setTags("")
    setPriority(3)
    setDueDate(null)
    setEstimatedTimeHours(null)
    setSelectedParentId(null)
    setSelectedProjectId('none')
  }

  // Flatten tasks for parent selection dropdown
  const flattenTasks = (
    tasks: Task[],
    level = 0,
    result: Array<{ task: Task; level: number }> = [],
  ): Array<{ task: Task; level: number }> => {
    tasks.forEach((task) => {
      result.push({ task, level })
      if (task.subTasks && task.subTasks.length > 0) {
        flattenTasks(task.subTasks, level + 1, result)
      }
    })
    return result
  }

  const flattenedTasks = flattenTasks(existingTasks || [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{parentTask ? `새 하위 태스크 생성 (${parentTask.title})` : "새 태스크 생성"}</DialogTitle>
            <DialogDescription>새로운 태스크의 세부 정보를 입력하세요.</DialogDescription>
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

            {!parentTask && existingTasks && existingTasks.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="parent">상위 태스크 (선택사항)</Label>
                <Select
                  value={selectedParentId?.toString() || ""}
                  onValueChange={(value) => setSelectedParentId(value ? Number.parseInt(value) : null)}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="상위 태스크 선택 (없음)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음 (최상위 태스크)</SelectItem>
                    {flattenedTasks.map(({ task, level }) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {Array(level).fill("　").join("")}
                        {level > 0 ? "└ " : ""}
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="project">프로젝트</Label>
              <Select
                value={selectedProjectId === 'none' ? 'none' : selectedProjectId.toString()}
                onValueChange={value => setSelectedProjectId(value === 'none' ? 'none' : Number(value))}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">프로젝트 없음</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <Calendar mode="single" selected={dueDate ?? undefined} onSelect={d => setDueDate(d ?? null)} initialFocus />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit">생성</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
