"use client"

import { useState, useEffect, useCallback } from "react"
import type { DragEndEvent } from "@dnd-kit/core"
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { type Task, TaskStatus } from "@/lib/types"
import { mockTasks } from "@/lib/mock-data"
import { buildTaskTree, flattenTaskTree, getRootTasks, findTaskById } from "@/lib/task-utils"
import { TaskCard } from "@/components/task-card"
import { TaskColumn } from "@/components/task-column"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { TaskDetailDialog } from "@/components/task-detail-dialog"
import { TaskTreeExpanded } from "@/components/task-tree-expanded"
import { TaskFilter } from "@/components/task-filter"
import { BarChart3 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface DashboardProps {
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
}

export default function Dashboard({ isCreateDialogOpen, setIsCreateDialogOpen }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    tag: "",
    priority: 0,
    search: "",
  })
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)

  const handleFilterChange = useCallback((filters) => {
    setFilterOptions(filters)
  }, [])

  useEffect(() => {
    // In a real app, you would fetch tasks from an API
    setTasks(mockTasks)
  }, [])

  useEffect(() => {
    // First build the task tree to properly handle parent-child relationships
    const taskTree = buildTaskTree(tasks)

    // Then apply filters to the tree
    let filtered = [...taskTree]

    if (filterOptions.tag) {
      filtered = filtered.filter((task) => task.tags?.includes(filterOptions.tag))
    }

    if (filterOptions.priority > 0) {
      filtered = filtered.filter((task) => task.priority === filterOptions.priority)
    }

    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) || task.description?.toLowerCase().includes(searchLower),
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, filterOptions])

  // Get only root tasks (tasks without parents)
  const rootTasks = getRootTasks(filteredTasks)

  const todoTasks = rootTasks.filter((task) => task.status === TaskStatus.TODO)
  const doingTasks = rootTasks.filter((task) => task.status === TaskStatus.DOING)
  const doneTasks = rootTasks.filter((task) => task.status === TaskStatus.DONE)

  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveId(active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    if (active.id !== over.id) {
      const activeContainer = active.data.current?.sortable.containerId
      const overContainer = over.data.current?.sortable.containerId

      if (activeContainer !== overContainer) {
        // Moving between columns
        const taskId = active.id as number
        const newStatus = overContainer as TaskStatus

        setTasks((prev) => {
          // Create a deep copy of the tasks array to avoid mutation issues
          const updatedTasks = JSON.parse(JSON.stringify(prev)) as Task[]

          // Helper function to update task status recursively
          const updateTaskStatus = (tasks: Task[]): Task[] => {
            return tasks.map((task) => {
              if (task.id === taskId) {
                return { ...task, status: newStatus }
              } else if (task.subTasks.length > 0) {
                return { ...task, subTasks: updateTaskStatus(task.subTasks) }
              }
              return task
            })
          }

          return updateTaskStatus(updatedTasks)
        })
      } else {
        // Reordering within the same column
        const activeIndex = active.data.current?.sortable.index
        const overIndex = over.data.current?.sortable.index

        if (activeIndex !== undefined && overIndex !== undefined) {
          const column = activeContainer as TaskStatus
          let tasksInColumn: Task[] = []

          if (column === TaskStatus.TODO) {
            tasksInColumn = [...todoTasks] // Create a copy
          } else if (column === TaskStatus.DOING) {
            tasksInColumn = [...doingTasks] // Create a copy
          } else {
            tasksInColumn = [...doneTasks] // Create a copy
          }

          const reordered = arrayMove(tasksInColumn, activeIndex, overIndex)

          // Update the order in the original tasks array
          setTasks((prev) => {
            // Create a deep copy to avoid mutation issues
            const updatedTasks = JSON.parse(JSON.stringify(prev)) as Task[]
            const rootTasksToUpdate = getRootTasks(updatedTasks).filter((t) => t.status === column)

            // Replace the root tasks of this status with the reordered ones
            for (let i = 0; i < rootTasksToUpdate.length; i++) {
              const taskIndex = updatedTasks.findIndex((t) => t.id === rootTasksToUpdate[i].id)
              if (taskIndex !== -1 && i < reordered.length) {
                updatedTasks[taskIndex] = reordered[i]
              }
            }

            return updatedTasks
          })
        }
      }
    }
  }

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
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null)
    }
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

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }

  // Calculate completion percentage based on all tasks including subtasks
  const allTasks = flattenTaskTree(tasks)
  const completionPercentage =
    allTasks.length > 0
      ? Math.round((allTasks.filter((t) => t.status === TaskStatus.DONE).length / allTasks.length) * 100)
      : 0

  // Find the expanded task if any
  const expandedTask = expandedTaskId ? findTaskById(filteredTasks, expandedTaskId) : null

  // Find the active task for drag overlay
  const activeTask = activeId ? findTaskById(filteredTasks, activeId) : null

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">전체 진행 상황</h2>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>완료율</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>할 일: {todoTasks.length}</span>
                <span>진행 중: {doingTasks.length}</span>
                <span>완료: {doneTasks.length}</span>
              </div>
            </div>
          </div>

          <TaskFilter
            onFilterChange={handleFilterChange}
            tags={Array.from(new Set(flattenTaskTree(tasks).flatMap((t) => t.tags?.split(",") || []))).filter(Boolean)}
          />
        </div>

        <div className="flex">
          {/* Main task columns */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${expandedTask ? "w-1/2" : "w-full"}`}>
            <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <TaskColumn title="할 일" status={TaskStatus.TODO} count={todoTasks.length}>
                <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {todoTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isExpanded={expandedTaskId === task.id}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                      onClick={() => openTaskDetail(task)}
                    />
                  ))}
                </SortableContext>
              </TaskColumn>

              <TaskColumn title="진행 중" status={TaskStatus.DOING} count={doingTasks.length}>
                <SortableContext items={doingTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {doingTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isExpanded={expandedTaskId === task.id}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                      onClick={() => openTaskDetail(task)}
                    />
                  ))}
                </SortableContext>
              </TaskColumn>

              <TaskColumn title="완료" status={TaskStatus.DONE} count={doneTasks.length}>
                <SortableContext items={doneTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {doneTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isExpanded={expandedTaskId === task.id}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                      onClick={() => openTaskDetail(task)}
                    />
                  ))}
                </SortableContext>
              </TaskColumn>

              {/* Drag overlay for better visual feedback */}
              <DragOverlay>
                {activeTask ? (
                  <div className="opacity-80">
                    <TaskCard task={activeTask} index={0} isExpanded={false} onClick={() => {}} isDragOverlay />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Expanded task tree view */}
          {expandedTask && (
            <div className="w-1/2 pl-6 animate-in slide-in-from-right duration-300">
              <TaskTreeExpanded
                task={expandedTask}
                onTaskClick={openTaskDetail}
                onClose={() => setExpandedTaskId(null)}
              />
            </div>
          )}
        </div>
      </main>

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
