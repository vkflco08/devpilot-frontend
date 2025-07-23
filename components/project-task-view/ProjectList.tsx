
/**
 * @file 프로젝트 목록을 렌더링하고 각 프로젝트 카드를 관리하는 컴포넌트입니다.
 * @description `HierarchyView`로부터 프로젝트 데이터와 태스크 관련 핸들러를 받아
 * 개별 `ProjectCard` 컴포넌트들을 렌더링합니다.
 */

"use client";

import { TaskStatus } from "@/lib/types"
import type { Task, Project } from "@/lib/types"
import { ProjectCard } from "./ProjectCard"

interface ProjectListProps {
    projects: Project[];
    expandedTasks: Set<number>;
    onToggleExpand: (taskId: number) => void;
    expandedProjects: Set<number>;
    onToggleProjectExpand: (projectId: number) => void;
    onToggle: (taskId: number, newStatus: TaskStatus, previousStatusToSend: TaskStatus | null) => void
    onTaskClick: (task: Task) => void;
    onAddTask: (projectId: number) => void;
    onAddSubtask: (parentTask: Task) => void;
    onDeleteTask: (taskId: number, taskTitle: string) => void;
}

export function ProjectList({
    projects,
    expandedTasks,
    onToggleExpand,
    onToggleProjectExpand,
    expandedProjects,
    onToggle,
    onTaskClick,
    onAddTask,
    onAddSubtask,
    onDeleteTask,
}: ProjectListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {projects.length === 0 ? (
                <div className="md:col-span-2 text-center py-10 text-muted-foreground">
                    프로젝트가 없습니다. 새로운 프로젝트를 추가하세요.
                </div>
            ) : (
                projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        expandedTasks={expandedTasks}
                        onToggleExpand={onToggleExpand}
                        expandedProjects={expandedProjects}
                        onToggleProjectExpand={onToggleProjectExpand}
                        onToggle={onToggle}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                        onAddSubtask={onAddSubtask}
                        onDeleteTask={onDeleteTask}
                    />
                ))
            )}
        </div>
    );
}
