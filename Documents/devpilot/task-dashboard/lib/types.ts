export enum TaskStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE",
}

export interface Task {
  id: number
  title: string
  description?: string
  status: TaskStatus
  tags?: string
  priority?: number // 1 (high) - 5 (low)
  dueDate?: string
  estimatedTimeHours?: number
  actualTimeHours?: number
  parent?: Task
  subTasks: Task[]
  projectId?: number
}
