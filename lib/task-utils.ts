import type { Task } from "./types"

/**
 * 플랫한 태스크 목록을 상위-하위 관계를 가진 트리 구조로 변환합니다.
 * @param flatTasks 백엔드에서 받은 모든 태스크의 플랫 리스트
 * @returns 부모가 없는 최상위 태스크와 그 하위 태스크들이 연결된 트리 구조의 태스크 리스트
 */
export function buildTaskTree(flatTasks: Task[]): Task[] {
  if (!flatTasks || flatTasks.length === 0) {
    return [];
  }
  
  const taskMap = new Map<number, Task>(); // ID로 태스크를 빠르게 찾기 위한 맵
  const rootTasks: Task[] = []; // 최상위 태스크들을 담을 리스트

  console.log("Input flat tasks:", flatTasks);
  console.log("Output tree:", rootTasks);

  // 1단계: 모든 태스크를 맵에 저장하고 subTasks 배열 초기화
  flatTasks.forEach(task => {
    // 깊은 복사를 통해 원본 배열의 subTasks에 영향을 주지 않도록
    const currentTask = { ...task, subTasks: [] as Task[] }; 
    taskMap.set(currentTask.id, currentTask);
  });

  // 2단계: 부모-자식 관계 설정
  taskMap.forEach(task => {
    if (task.parentId !== null && task.parentId !== undefined) {
      const parentTask = taskMap.get(task.parentId);
      if (parentTask) {
        // 부모 태스크의 subTasks에 현재 태스크 추가
        parentTask.subTasks.push(task);
      } else {
        // 부모 태스크를 찾을 수 없으면 (예: 부모가 삭제됨), 이 태스크를 최상위로 간주
        console.warn(`Parent task with ID ${task.parentId} not found for task ${task.id}. Treating as root task.`);
        rootTasks.push(task);
      }
    } else {
      // parentId가 없으면 최상위 태스크
      rootTasks.push(task);
    }
  });

  // 3단계: 최상위 태스크들을 정렬 (선택 사항)
  // 예를 들어, ID 순이나 생성일자 순으로 정렬할 수 있습니다.
  rootTasks.sort((a, b) => a.id - b.id); 
  
  return rootTasks;
}

/**
 * 태스크 트리 내의 모든 태스크를 평탄화된 리스트로 반환합니다.
 * @param tasks 태스크 트리의 루트 태스크 리스트
 * @returns 모든 태스크의 플랫 리스트
 */
export function flattenTaskTree(tasks: Task[]): Task[] {
  const result: Task[] = [];
  if (!Array.isArray(tasks)) return result;
  function traverse(task: Task) {
    result.push(task);
    (task.subTasks ?? []).forEach(traverse);
  }
  tasks.forEach(traverse);
  return result;
}

/**
 * 최상위 태스크(부모가 없는 태스크)만 필터링하여 반환합니다.
 * @param tasks 모든 태스크의 플랫 리스트 또는 트리 구조
 * @returns 최상위 태스크 리스트
 */
export function getRootTasks(tasks: Task[]): Task[] {
  const taskMap = new Map<number, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  return tasks.filter(task => {
    // 부모 ID가 없거나 (null/undefined), 부모 ID가 있지만 해당 부모 태스크가 Map에 없는 경우
    // 이는 부모가 필터링되거나 존재하지 않는 경우를 의미하며, 이 태스크를 루트로 간주합니다.
    return task.parentId === null || task.parentId === undefined || !taskMap.has(task.parentId);
  });
}

/**
 * 태스크 트리에서 특정 ID를 가진 태스크를 찾습니다.
 * @param tasks 태스크 트리의 루트 태스크 리스트
 * @param id 찾을 태스크의 ID
 * @returns 찾은 태스크 객체 또는 null
 */
export function findTaskById(tasks: Task[], id: number): Task | null {
  for (const task of tasks) {
    if (task.id === id) {
      return task;
    }
    if (task.subTasks && task.subTasks.length > 0) {
      const found = findTaskById(task.subTasks, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
