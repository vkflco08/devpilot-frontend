"use client"

import { useState, useEffect } from "react"
import { mockTasks } from "@/lib/mock-data"
import { type Task, TaskStatus } from "@/lib/types"
import { buildTaskTree, getRootTasks } from "@/lib/task-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { cn } from "@/lib/utils"

interface TreeViewProps {
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
}

export function TreeView({ isCreateDialogOpen, setIsCreateDialogOpen }: TreeViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    // In a real app, you would fetch tasks from an API
    setTasks(mockTasks)
  }, [])

  const rootTasks = getRootTasks(buildTaskTree(tasks))

  const handleCreateTask = (newTask: Task) => {
    setTasks((prev) => {
      const taskWithId = { ...newTask, id: Date.now() }

      // If this is a subtask, add it to the parent's subtasks
      if (newTask.parent) {
        const updatedTasks = JSON.parse(JSON.stringify(prev)) as Task[]

        // Helper function to add subtask to the correct parent
        const addSubtaskToParent = (tasks: Task[]): Task[] => {
          return tasks.map((task) => {
            if (task.id === newTask.parent?.id) {
              return {
                ...task,
                subTasks: [...task.subTasks, taskWithId],
              }
            } else if (task.subTasks.length > 0) {
              return {
                ...task,
                subTasks: addSubtaskToParent(task.subTasks),
              }
            }
            return task
          })
        }

        return addSubtaskToParent(updatedTasks)
      }

      // Otherwise add it as a top-level task
      return [...prev, taskWithId]
    })
    setIsCreateDialogOpen(false)
  }

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => {
      const updatedTasks = JSON.parse(JSON.stringify(prev)) as Task[]

      const updateTaskInList = (tasks: Task[]): Task[] => {
        return tasks.map((task) => {
          if (task.id === updatedTask.id) {
            return updatedTask
          } else if (task.subTasks.length > 0) {
            return {
              ...task,
              subTasks: updateTaskInList(task.subTasks),
            }
          }
          return task
        })
      }

      return updateTaskInList(updatedTasks)
    })
    setIsDetailDialogOpen(false)
    setSelectedTask(null)
  }

  const handleDeleteTask = (taskId: number) => {
    setTasks((prev) => {
      const updatedTasks = JSON.parse(JSON.stringify(prev)) as Task[]

      const deleteTaskFromList = (tasks: Task[]): Task[] => {
        return tasks.filter((task) => {
          if (task.id === taskId) {
            return false
          } else if (task.subTasks.length > 0) {
            task.subTasks = deleteTaskFromList(task.subTasks)
          }
          return true
        })
      }

      return deleteTaskFromList(updatedTasks)
    })
    setIsDetailDialogOpen(false)
    setSelectedTask(null)
  }

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setIsDetailDialogOpen(true)
  }

  const handleAddSubtask = (parentTask: Task) => {
    setSelectedTask(null)
    setIsDetailDialogOpen(false)

    // Open create dialog with parent task pre-selected
    setTimeout(() => {
      setSelectedTask(parentTask)
      setIsCreateDialogOpen(true)
    }, 100)
  }

  const statusColors = {
    [TaskStatus.TODO]: "bg-slate-500",
    [TaskStatus.DOING]: "bg-amber-500",
    [TaskStatus.DONE]: "bg-emerald-500",
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>태스크 트리 시각화</CardTitle>
        </CardHeader>
        <CardContent>
          {rootTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              표시할 태스크가 없습니다. 새 태스크를 추가해보세요.
            </div>
          ) : (
            <div className="tree-structure">
              {rootTasks.map((task) => (
                <div key={task.id} className="task-tree mb-8">
                  {/* Root task */}
                  <div
                    className="p-4 rounded-md border bg-card hover:bg-accent cursor-pointer mb-4"
                    onClick={() => openTaskDetail(task)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("w-3 h-3 rounded-full", statusColors[task.status])}></span>
                      <h3 className="text-lg font-medium">{task.title}</h3>
                      {task.priority && (
                        <Badge variant="outline" className="ml-auto">
                          우선순위 {task.priority}
                        </Badge>
                      )}
                    </div>
                    {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.tags &&
                        task.tags.split(",").map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Subtasks with tree lines */}
                  {task.subTasks.length > 0 && (
                    <div className="relative pl-8 ml-4">
                      {/* Vertical line */}
                      <div className="absolute top-0 left-4 w-0.5 h-full bg-border"></div>

                      <div className="space-y-6">
                        {task.subTasks.map((subtask, index) => (
                          <div key={subtask.id} className="relative">
                            {/* Horizontal line to subtask */}
                            <div className="absolute top-6 left-[-4px] w-4 h-0.5 bg-border"></div>

                            <div>
                              <div
                                className="p-4 rounded-md border bg-card hover:bg-accent cursor-pointer"
                                onClick={() => openTaskDetail(subtask)}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={cn("w-2.5 h-2.5 rounded-full", statusColors[subtask.status])}></span>
                                  <h4 className="font-medium">{subtask.title}</h4>
                                  {subtask.priority && (
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      P{subtask.priority}
                                    </Badge>
                                  )}
                                </div>
                                {subtask.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{subtask.description}</p>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {subtask.tags &&
                                    subtask.tags.split(",").map((tag, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {tag.trim()}
                                      </Badge>
                                    ))}
                                </div>
                              </div>

                              {/* Nested subtasks with tree lines */}
                              {subtask.subTasks.length > 0 && (
                                <div className="relative pl-8 ml-4 mt-6">
                                  {/* Vertical line for nested subtasks */}
                                  <div className="absolute top-0 left-4 w-0.5 h-full bg-border"></div>

                                  <div className="space-y-4">
                                    {subtask.subTasks.map((nestedTask) => (
                                      <div key={nestedTask.id} className="relative">
                                        {/* Horizontal line to nested subtask */}
                                        <div className="absolute top-4 left-[-4px] w-4 h-0.5 bg-border"></div>

                                        <div
                                          className="p-3 rounded-md border bg-card hover:bg-accent cursor-pointer"
                                          onClick={() => openTaskDetail(nestedTask)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={cn("w-2 h-2 rounded-full", statusColors[nestedTask.status])}
                                            ></span>
                                            <span className="font-medium">{nestedTask.title}</span>
                                            {nestedTask.priority && (
                                              <Badge variant="outline" className="ml-auto text-xs">
                                                P{nestedTask.priority}
                                              </Badge>
                                            )}
                                          </div>
                                          {nestedTask.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {nestedTask.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTask={handleCreateTask}
        parentTask={selectedTask}
        existingTasks={tasks}
      />

      {selectedTask && (
        <TaskDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          task={selectedTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
        />
      )}
    </div>
  )
}
