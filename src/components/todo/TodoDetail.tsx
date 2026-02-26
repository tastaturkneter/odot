import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sun,
  Sunset,
  CalendarClock,
  FolderOpen,
  Tag,
  Calendar,
  AlertCircle,
  Clock,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { formatDateShort, isOverdue } from "@/lib/dates";
import { matchPreset, ruleToText } from "@/lib/rrule";
import { WhenPicker } from "@/components/shared/WhenPicker";
import { DeadlinePicker } from "@/components/shared/DeadlinePicker";
import { ProjectPicker } from "@/components/shared/ProjectPicker";
import { TagPicker } from "@/components/shared/TagPicker";
import { RecurrencePicker } from "@/components/shared/RecurrencePicker";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { ChecklistEditor } from "./ChecklistEditor";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@evolu/react";
import { allProjects, allTags, allTodoTags } from "@/db/queries";
import type { TodoRow } from "@/db/queries";

interface TodoDetailProps {
  todo: TodoRow;
  onToggleComplete: (id: string, isCompleted: 0 | 1 | null) => void;
  onCollapse: () => void;
}

export function TodoDetail({
  todo,
  onToggleComplete,
  onCollapse,
}: TodoDetailProps) {
  const { updateTodo, deleteTodo } = useTodoActions();
  const { get: getSetting } = useSettings();
  const t = useTranslation();
  const autoComplete = getSetting("autoCompleteTodo") === "1";
  const projects = useQuery(allProjects);
  const tags = useQuery(allTags);
  const todoTags = useQuery(allTodoTags);

  const [title, setTitle] = useState(todo.title ?? "");
  const [notes, setNotes] = useState(todo.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const completed = todo.isCompleted === 1;
  const hasWhen = todo.whenDate !== null;
  const isSomeday = todo.whenSomeday === 1;
  const isEvening = todo.whenEvening === 1;
  const hasDeadline = todo.deadline !== null;
  const overdue = hasWhen && isOverdue(todo.whenDate!);

  const project = todo.projectId
    ? projects.find((p) => p.id === todo.projectId)
    : null;

  const todoTagIds = todoTags
    .filter((tt) => tt.todoId === todo.id && tt.tagId !== null)
    .map((tt) => tt.tagId!);
  const todoTagList = todoTagIds
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== todo.title) {
      updateTodo(todo.id, { title: trimmed });
    }
  }

  function handleNotesBlur() {
    const newNotes = notes.trim() || null;
    if (newNotes !== (todo.notes ?? null)) {
      updateTodo(todo.id, { notes: newNotes });
    }
  }

  function handleWhenChange(value: {
    date: string | null;
    someday: boolean;
    evening?: boolean;
  }) {
    updateTodo(todo.id, {
      whenDate: value.date,
      whenSomeday: value.someday ? 1 : null,
      whenEvening: value.evening ? 1 : null,
    });
  }

  function handleDeadlineChange(value: string | null) {
    updateTodo(todo.id, { deadline: value });
  }

  function handleProjectChange(projectId: string | null) {
    updateTodo(todo.id, { projectId });
  }

  function handleRecurrenceChange(rule: string | null) {
    updateTodo(todo.id, { recurrenceRule: rule });
  }

  const hasRecurrence = todo.recurrenceRule !== null;
  const recurrenceLabel = hasRecurrence
    ? (matchPreset(todo.recurrenceRule!)?.label ?? ruleToText(todo.recurrenceRule!))
    : null;

  return (
    <div
      data-todo-item
      className="rounded-lg border bg-card px-2 py-3"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCollapse();
        }
      }}
    >
      {/* Header: checkbox + title + delete */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={() => onToggleComplete(todo.id, todo.isCompleted)}
          className="mt-1"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className={cn(
            "h-auto border-none p-0 text-sm font-medium shadow-none focus-visible:ring-0",
            completed && "text-muted-foreground line-through",
          )}
        />
        <button
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title={t("todo.delete")}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title={t("todo.close")}
          onClick={onCollapse}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Metadata badges + pickers */}
      <div className="ml-7 mt-2 flex flex-wrap items-center gap-1.5">
        <WhenPicker
          value={{
            date: todo.whenDate ?? null,
            someday: todo.whenSomeday === 1,
            evening: todo.whenEvening === 1,
          }}
          onChange={handleWhenChange}
        >
          <button
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
              hasWhen || isSomeday
                ? overdue
                  ? "border-destructive/30 text-destructive"
                  : "border-border text-foreground"
                : "border-dashed border-muted-foreground/40 text-muted-foreground",
            )}
          >
            {overdue ? (
              <AlertCircle className="h-3 w-3" />
            ) : isSomeday ? (
              <Clock className="h-3 w-3" />
            ) : isEvening ? (
              <Sunset className="h-3 w-3 text-blue-800 dark:text-blue-400" />
            ) : hasWhen ? (
              <Calendar className="h-3 w-3" />
            ) : (
              <Sun className="h-3 w-3" />
            )}
            {hasWhen
              ? formatDateShort(todo.whenDate!, t, isEvening)
              : isSomeday
                ? t("todo.someday")
                : t("todo.when")}
          </button>
        </WhenPicker>

        <DeadlinePicker
          value={todo.deadline ?? null}
          onChange={handleDeadlineChange}
        >
          <button
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
              hasDeadline
                ? "border-orange-500/30 text-orange-500"
                : "border-dashed border-muted-foreground/40 text-muted-foreground",
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {hasDeadline ? formatDateShort(todo.deadline!, t) : t("todo.deadline")}
          </button>
        </DeadlinePicker>

        <ProjectPicker
          value={todo.projectId ?? null}
          onChange={handleProjectChange}
        >
          <button
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
              project
                ? "border-border text-foreground"
                : "border-dashed border-muted-foreground/40 text-muted-foreground",
            )}
            style={project?.color ? { color: project.color } : undefined}
          >
            <FolderOpen className="h-3 w-3" />
            {project ? project.name : t("todo.project")}
          </button>
        </ProjectPicker>

        <TagPicker todoId={todo.id}>
          <button
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
              todoTagList.length > 0
                ? "border-border text-foreground"
                : "border-dashed border-muted-foreground/40 text-muted-foreground",
            )}
          >
            <Tag className="h-3 w-3" />
            {todoTagList.length > 0
              ? todoTagList.map((t) => t.name).join(", ")
              : t("todo.tags")}
          </button>
        </TagPicker>

        <RecurrencePicker
          value={todo.recurrenceRule ?? null}
          onChange={handleRecurrenceChange}
        >
          <button
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
              hasRecurrence
                ? "border-border text-foreground"
                : "border-dashed border-muted-foreground/40 text-muted-foreground",
            )}
          >
            <Repeat className="h-3 w-3" />
            {recurrenceLabel ?? t("todo.repeat")}
          </button>
        </RecurrencePicker>
      </div>

      {/* Notes */}
      <div className="ml-7 mt-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder={t("todo.notesPlaceholder")}
          className="min-h-[2rem] resize-none border-none p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {/* Checklist */}
      <div className="ml-7 mt-3">
        <ChecklistEditor
          todoId={todo.id}
          onAllCompleted={
            autoComplete
              ? () => {
                  if (todo.isCompleted !== 1) {
                    onToggleComplete(todo.id, todo.isCompleted);
                  }
                }
              : undefined
          }
        />
      </div>

      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("confirm.deleteTodo")}
        description={t("confirm.deleteTodoDesc")}
        onConfirm={() => {
          deleteTodo(todo.id);
          onCollapse();
        }}
      />
    </div>
  );
}
