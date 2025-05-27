"use client"

import * as React from "react"
import { useState } from "react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updatedProject: Project = {
        id: project?.id || Date.now(),
        name,
        description,
        createdDate: project?.createdDate || new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        tasks: project?.tasks || []
      }
      onUpdateProject(updatedProject)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update project:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    setLoading(true)
    try {
      onDeleteProject(project)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete project:", error)
    } finally {
      setLoading(false)
    }
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
