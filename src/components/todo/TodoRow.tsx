import { useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Calendar,
  AlertCircle,
  Sun,
  CalendarClock,
  Clock,
  FolderOpen,
  Tag,
  GripVertical,
  Repeat,
  Trash2,
  ListChecks,
} from "lucide-react";
import { formatDateShort, isOverdue } from "@/lib/dates";
import { WhenPicker } from "@/components/shared/WhenPicker";
import { DeadlinePicker } from "@/components/shared/DeadlinePicker";
import { ProjectPicker } from "@/components/shared/ProjectPicker";
import { TagPicker } from "@/components/shared/TagPicker";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useQuery } from "@evolu/react";
import { allProjects, allTags, allTodoTags, allChecklistItems } from "@/db/queries";
import { ProgressCircle } from "@/components/shared/ProgressCircle";
import type { TodoRow as TodoRowType } from "@/db/queries";

export type PickerType = "when" | "deadline" | "project" | "tag";

interface TodoRowProps {
  todo: TodoRowType;
  isSelected?: boolean;
  onToggleComplete: (id: string, isCompleted: 0 | 1 | null) => void;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  onDelete?: (id: string) => void;
  openPicker?: PickerType | null;
  onPickerOpened?: () => void;
  dragHandleRef?: (element: HTMLElement | null) => void;
  dragListeners?: Record<string, Function>;
  onNativeDragStart?: (e: React.DragEvent) => void;
}

export function TodoRow({
  todo,
  isSelected,
  onToggleComplete,
  onClick,
  onDoubleClick,
  onDelete,
  openPicker,
  onPickerOpened,
  dragHandleRef,
  dragListeners,
  onNativeDragStart,
}: TodoRowProps) {
  const { updateTodo } = useTodoActions();
  const projects = useQuery(allProjects);
  const tags = useQuery(allTags);
  const todoTags = useQuery(allTodoTags);
  const checklistItems = useQuery(allChecklistItems);

  const whenRef = useRef<HTMLButtonElement>(null);
  const deadlineRef = useRef<HTMLButtonElement>(null);
  const projectRef = useRef<HTMLButtonElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Programmatically open picker via keyboard shortcut
  useEffect(() => {
    if (!openPicker) return;
    const ref =
      openPicker === "when"
        ? whenRef
        : openPicker === "deadline"
          ? deadlineRef
          : openPicker === "project"
            ? projectRef
            : tagRef;
    ref.current?.click();
    onPickerOpened?.();
  }, [openPicker, onPickerOpened]);

  // Scroll selected row into view
  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  const completed = todo.isCompleted === 1;
  const hasWhen = todo.whenDate !== null;
  const isSomeday = todo.whenSomeday === 1;
  const hasDeadline = todo.deadline !== null;
  const hasProject = todo.projectId !== null;
  const overdue = hasWhen && isOverdue(todo.whenDate!);
  const project = hasProject
    ? projects.find((p) => p.id === todo.projectId)
    : null;

  const todoTagIds = todoTags
    .filter((tt) => tt.todoId === todo.id && tt.tagId !== null)
    .map((tt) => tt.tagId!);
  const todoTagList = todoTagIds
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  function handleWhenChange(value: {
    date: string | null;
    someday: boolean;
  }) {
    updateTodo(todo.id, {
      whenDate: value.date,
      whenSomeday: value.someday ? 1 : null,
    });
  }

  function handleDeadlineChange(value: string | null) {
    updateTodo(todo.id, { deadline: value });
  }

  function handleProjectChange(projectId: string | null) {
    updateTodo(todo.id, { projectId });
  }

  const hasRecurrence = todo.recurrenceRule !== null;
  const todoChecklistItems = checklistItems.filter((i) => i.todoId === todo.id);
  const hasChecklist = todoChecklistItems.length > 0;
  const checklistDone = todoChecklistItems.filter((i) => i.isCompleted === 1).length;
  const checklistTotal = todoChecklistItems.length;
  const checklistProgress = checklistTotal > 0 ? checklistDone / checklistTotal : 0;
  const hasBadges =
    !completed &&
    (hasWhen ||
      hasDeadline ||
      isSomeday ||
      hasProject ||
      hasRecurrence ||
      hasChecklist ||
      todoTagList.length > 0);

  return (
    <div
      ref={rowRef}
      className={cn(
        "group relative flex items-start gap-3 rounded-md px-2 py-2 transition-colors",
        "hover:bg-accent/50 select-none",
        isSelected && "bg-accent",
      )}
      draggable={!!onNativeDragStart}
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest('button, input, [role="checkbox"]')) {
          e.preventDefault();
          return;
        }
        onNativeDragStart?.(e);
      }}
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      onDoubleClick={() => onDoubleClick?.()}
    >
      <button
        ref={dragHandleRef}
        {...(dragListeners as React.HTMLAttributes<HTMLButtonElement>)}
        className="absolute -left-5 top-2.5 cursor-grab touch-none text-muted-foreground/40 opacity-40 md:opacity-0 transition-opacity md:group-hover:opacity-100 active:cursor-grabbing"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        checked={completed}
        onCheckedChange={() => onToggleComplete(todo.id, todo.isCompleted)}
        className="mt-1"
      />

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "text-sm",
            completed && "text-muted-foreground line-through",
          )}
        >
          {todo.title}
        </span>

        {hasBadges && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {hasWhen && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  overdue ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {overdue ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                {formatDateShort(todo.whenDate!)}
              </span>
            )}
            {isSomeday && !hasWhen && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Someday
              </span>
            )}
            {hasDeadline && (
              <span className="flex items-center gap-1 text-xs text-orange-500">
                <CalendarClock className="h-3 w-3" />
                Due {formatDateShort(todo.deadline!)}
              </span>
            )}
            {project && (
              <span
                className="flex items-center gap-1 text-xs text-muted-foreground"
                style={project.color ? { color: project.color } : undefined}
              >
                <FolderOpen className="h-3 w-3" />
                {project.name}
              </span>
            )}
            {todoTagList.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1 text-xs text-muted-foreground"
                style={tag.color ? { color: tag.color } : undefined}
              >
                <Tag className="h-3 w-3" />
                {tag.name}
              </span>
            ))}
            {hasChecklist && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ListChecks className="h-3 w-3" />
                <ProgressCircle progress={checklistProgress} color="#6b7280" className="h-3 w-3" />
              </span>
            )}
            {hasRecurrence && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover action buttons (also used as keyboard picker triggers) */}
      {!completed && (
        <div
          className={cn(
            "hidden md:flex shrink-0 items-center gap-0.5 transition-opacity",
            isSelected
              ? "md:opacity-100"
              : "md:opacity-0 md:group-hover:opacity-100",
          )}
        >
          <WhenPicker
            value={{
              date: todo.whenDate ?? null,
              someday: todo.whenSomeday === 1,
            }}
            onChange={handleWhenChange}
          >
            <button
              ref={whenRef}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Schedule"
              onClick={(e) => e.stopPropagation()}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
          </WhenPicker>
          <DeadlinePicker
            value={todo.deadline ?? null}
            onChange={handleDeadlineChange}
          >
            <button
              ref={deadlineRef}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Deadline"
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarClock className="h-3.5 w-3.5" />
            </button>
          </DeadlinePicker>
          <ProjectPicker
            value={todo.projectId ?? null}
            onChange={handleProjectChange}
          >
            <button
              ref={projectRef}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Project"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderOpen className="h-3.5 w-3.5" />
            </button>
          </ProjectPicker>
          <TagPicker todoId={todo.id}>
            <button
              ref={tagRef}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Tags"
              onClick={(e) => e.stopPropagation()}
            >
              <Tag className="h-3.5 w-3.5" />
            </button>
          </TagPicker>
        </div>
      )}

      {/* Delete button – always visible on hover, even for completed todos */}
      {onDelete && (
        <div
          className={cn(
            "mr-1.5 hidden md:flex shrink-0 items-center transition-opacity",
            isSelected
              ? "md:opacity-100"
              : "md:opacity-0 md:group-hover:opacity-100",
          )}
        >
          <button
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
