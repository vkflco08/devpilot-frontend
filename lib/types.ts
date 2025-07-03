export enum TaskStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE",
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',      // 진행 중
  COMPLETED = 'COMPLETED', // 완료됨
  ARCHIVED = 'ARCHIVED'   // 보관 또는 숨김
}

export interface Project {
  id: number
  name: string
  description?: string
  createdDate?: string
  updatedDate?: string
  status?: ProjectStatus
  tasks?: Task[]
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
