import type { Task } from "./types"

// Build a tree structure from flat tasks
export function buildTaskTree(tasks: Task[]): Task[] {
  // First, create a map of all tasks by ID
  const taskMap = new Map<number, Task>()
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, subTasks: [] })
  })

  // Then, build the tree structure
  const rootTasks: Task[] = []

  tasks.forEach((task) => {
    const taskWithSubtasks = taskMap.get(task.id)!

    if (task.parent) {
      // This is a subtask, add it to its parent
      const parentTask = taskMap.get(task.parent.id)
      if (parentTask) {
        parentTask.subTasks.push(taskWithSubtasks)
      }
    } else {
      // This is a root task
      rootTasks.push(taskWithSubtasks)
    }
  })

  return rootTasks
}

// Flatten a task tree into an array
export function flattenTaskTree(tasks: Task[]): Task[] {
  const result: Task[] = []

  function traverse(task: Task) {
    result.push(task)
    task.subTasks.forEach(traverse)
  }

  tasks.forEach(traverse)
  return result
}

// Get only root tasks (tasks without parents)
export function getRootTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.parent)
}

// Find a task by ID in a tree structure
export function findTaskById(tasks: Task[], id: number): Task | null {
  for (const task of tasks) {
    if (task.id === id) {
      return task
    }

    if (task.subTasks.length > 0) {
      const found = findTaskById(task.subTasks, id)
      if (found) {
        return found
      }
    }
  }

  return null
}
