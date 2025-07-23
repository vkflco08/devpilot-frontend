
/**
 * @file 태스크 생성 및 상세 보기 다이얼로그를 관리하는 컴포넌트입니다.
 * @description `CreateTaskDialog`와 `TaskDetailDialog`의 열림/닫힘 상태를 제어하고,
 * 각 다이얼로그에서 발생하는 태스크 생성, 수정, 삭제, 하위 태스크 추가 등의
 * 액션을 처리하는 로직을 캡슐화합니다.
 */

"use client";

import React from 'react';
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import type { Task } from "@/lib/types"; // Task, Project 타입 임포트
import type { Task as OrigTask } from "@/lib/types"; // for handleCreateTask, handleUpdateTask

interface TaskDialogsManagerProps {
    isCreateDialogOpen: boolean;
    setIsCreateDialogOpen: (open: boolean) => void;
    
    selectedTask: Task | null;
    setSelectedTask: (task: Task | null) => void; // TaskDetailDialog에서 필요

    parentTaskForCreate: Task | null;

    selectedProjectIdForCreate: number | null;

    handleCreateTask: (newTask: OrigTask) => Promise<void>;
    handleUpdateTask: (updatedTask: OrigTask) => Promise<void>;
    handleDeleteTask: (taskId: number) => Promise<void>;
    handleAddSubtask: (parentTask: Task) => void;

    projects: { id: number; name: string }[]; // 프로젝트 목록 (CreateTaskDialog용)
    existingTasks: Task[]; // 모든 태스크 목록 (CreateTaskDialog의 parent 선택용)
}

export function TaskDialogsManager({
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    selectedTask,
    setSelectedTask,
    parentTaskForCreate,
    selectedProjectIdForCreate,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddSubtask,
    projects,
    existingTasks,
}: TaskDialogsManagerProps) {

    // TaskDetailDialog의 open 상태는 selectedTask의 유무로 제어
    const isDetailDialogOpen = !!selectedTask;

    return (
        <>
            {/* Create Task Dialog */}
            <CreateTaskDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen} // 외부에서 받은 setIsCreateDialogOpen 사용
                onCreateTask={handleCreateTask}
                parentTask={parentTaskForCreate}
                existingTasks={existingTasks} // projects.flatMap(p => p.tasks || []) 결과
                projects={projects}
                defaultProjectId={selectedProjectIdForCreate}
            />

            {/* Task Detail Dialog */}
            {selectedTask && (
                <TaskDetailDialog
                    open={isDetailDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) setSelectedTask(null); // 닫히면 selectedTask 초기화
                    }}
                    task={selectedTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                />
            )}
        </>
    );
}
