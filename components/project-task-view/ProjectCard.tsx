"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Task, Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { TaskStatus } from "@/lib/types";
import { TaskItem } from "./TaskItem"

interface ProjectCardProps {
    project: Project
    expandedTasks: Set<number>;
    onToggleExpand: (taskId: number) => void;
    expandedProjects: Set<number>;
    onToggleProjectExpand: (projectId: number) => void;
    onToggle: (taskId: number, newStatus: TaskStatus, previousStatusToSend: TaskStatus | null) => void
    onTaskClick: (task: Task) => void
    onAddTask: (projectId: number) => void;
    onAddSubtask: (parentTask: Task) => void;
    onDeleteTask: (taskId: number, taskTitle: string) => void;
  }
  
export const ProjectCard = ({
    project,
    expandedTasks,
    onToggleExpand,
    expandedProjects,
    onToggleProjectExpand,
    onToggle,
    onTaskClick,
    onAddTask,
    onAddSubtask,
    onDeleteTask,
  }: ProjectCardProps) => {
    const isExpanded = expandedProjects.has(project.id);
  
    const getAllTasksFlat = (tasks: Task[]): Task[] => {
      let allTasks: Task[] = []
      function traverse(task: Task) {
        allTasks.push(task)
        if (task.subTasks) {
          task.subTasks.forEach(traverse)
        }
      }
      (tasks || []).forEach(traverse)
      return allTasks
    }
  
    const allTasks = getAllTasksFlat(project.tasks || [])
    const completedTasks = allTasks.filter((task) => task.status === TaskStatus.DONE)
    const completionPercentage = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0
  
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {allTasks.length} tasks
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onToggleProjectExpand(project.id)} className="h-8 w-8 p-0">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
  
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
  
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">진행률</span>
              <span className="font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
  
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-1">
              {(project.tasks || []).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onTaskClick={onTaskClick}
                  onAddSubtask={onAddSubtask}
                  onDeleteTask={onDeleteTask}
                  expandedTasks={expandedTasks}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </div>
  
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => onAddTask(project.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              태스크 추가
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }
