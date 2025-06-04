"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { type Project } from "@/lib/types"

interface ProjectDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  onUpdateProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

export function ProjectDetailDialog({
  open,
  onOpenChange,
  project,
  onUpdateProject,
  onDeleteProject,
}: ProjectDetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(project?.name || "")
  const [description, setDescription] = useState(project?.description || "")
  const [createdDate, setCreatedDate] = useState(project?.createdDate || "")
  const [updatedDate, setUpdatedDate] = useState(project?.updatedDate || "")

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description || "")
      setCreatedDate(project.createdDate || "")
      setUpdatedDate(project.updatedDate || "")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true)
    e.preventDefault()
    const updatedProject: Project = {
      id: project?.id || Date.now(),
      name,
      description,
      createdDate,
      updatedDate: new Date().toISOString(),
      tasks: project?.tasks || []
    }
    try {
      await onUpdateProject(updatedProject)
    } catch (error) {
      alert(error instanceof Error ? error.message : "프로젝트 수정 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    try {
      setLoading(true)
      await onDeleteProject(project)
    } catch (error) {
      alert(error instanceof Error ? error.message : "프로젝트 삭제 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{project ? "프로젝트 수정" : "새 프로젝트"}</DialogTitle>
          <DialogDescription>
            프로젝트의 이름과 설명을 설정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              프로젝트 이름
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              설명
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "수정 중..." : "수정"}
            </Button>
            {project && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "삭제 중..." : "삭제"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
