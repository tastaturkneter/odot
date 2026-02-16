import { useState, useMemo, useCallback, useRef, useEffect, type ChangeEvent } from "react";
import { useQuery } from "@evolu/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { allTodos, allProjects, allProjectHeadings, allChecklistItems } from "@/db/queries";
import type {
  TodoRow as TodoRowType,
  ProjectHeadingRow,
} from "@/db/queries";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { SortableTodoRow } from "@/components/todo/SortableTodoRow";
import { TodoDetail } from "@/components/todo/TodoDetail";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Heading2 } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useHeadingActions } from "@/hooks/useHeadingActions";
import { useSelection } from "@/hooks/useSelection";
import {
  TodoListContext,
  type TodoListActions,
} from "@/hooks/useTodoListContext";
import { KeyboardShortcutHandler } from "@/components/todo/KeyboardShortcutHandler";
import { ProgressCircle } from "@/components/shared/ProgressCircle";
import type { PickerType } from "@/components/todo/TodoRow";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

// A project item is either a todo or a heading
type ProjectItem =
  | { kind: "todo"; data: TodoRowType }
  | { kind: "heading"; data: ProjectHeadingRow };

function getItemId(item: ProjectItem): string {
  return item.data.id;
}

function getItemPosition(item: ProjectItem): number | null {
  return item.data.position;
}

// --- SortableHeadingRow ---

function SortableHeadingRow({
  heading,
  onDelete,
  onUpdateTitle,
}: {
  heading: ProjectHeadingRow;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}) {
  const t = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: heading.id });

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(heading.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== heading.title) {
      onUpdateTitle(heading.id, trimmed);
    }
    setEditing(false);
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className="group relative flex items-center gap-3 px-2 pt-2 pb-1.5 mt-8 first:mt-0 border-b border-border"
        onDoubleClick={() => {
          setEditValue(heading.title ?? "");
          setEditing(true);
        }}
      >
        <button
          ref={setActivatorNodeRef}
          {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
          className="absolute -left-5 top-2.5 cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {editing ? (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm font-bold outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <span className="flex-1 text-sm font-bold text-foreground">
            {heading.title}
          </span>
        )}

        <button
          className="mr-1.5 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          title={t("view.deleteHeading")}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(heading.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// --- ProjectView ---

export function ProjectView({ projectId }: { projectId: string }) {
  const t = useTranslation();
  const { newModalOpen, setNewModalOpen, setActiveView } = useActiveView();
  const { deleteProject, updateProject: updateProjectFields } = useProjectActions();
  const { toggleComplete, deleteTodo, updateTodo } = useTodoActions();
  const { createHeading, updateHeading, deleteHeading } = useHeadingActions();
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pickerToOpen, setPickerToOpen] = useState<PickerType | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [confirmDeleteHeadingId, setConfirmDeleteHeadingId] = useState<string | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);
  const pendingDeleteRef = useRef<string[]>([]);

  const todos = useQuery(allTodos);
  const projects = useQuery(allProjects);
  const headings = useQuery(allProjectHeadings);
  // Preload checklist items so TodoDetail doesn't trigger Suspense on first open
  useQuery(allChecklistItems);
  const project = projects.find((p) => p.id === projectId);

  const [projectNotes, setProjectNotes] = useState(project?.notes ?? "");
  // Sync when project changes (e.g. switching between projects)
  useEffect(() => {
    setProjectNotes(project?.notes ?? "");
  }, [project?.notes]);

  function handleProjectNotesBlur() {
    const newNotes = projectNotes.trim() || null;
    if (newNotes !== (project?.notes ?? null)) {
      updateProjectFields(projectId, { notes: newNotes });
    }
  }

  // Build the merged, sorted list of active items
  const items: ProjectItem[] = useMemo(() => {
    const activeTodos: ProjectItem[] = [...todos]
      .filter((t) => t.projectId === projectId && t.isCompleted === 0)
      .map((data) => ({ kind: "todo" as const, data }));

    const activeHeadings: ProjectItem[] = [...headings]
      .filter((h) => h.projectId === projectId)
      .map((data) => ({ kind: "heading" as const, data }));

    return [...activeTodos, ...activeHeadings].sort(
      (a, b) => (getItemPosition(a) ?? 0) - (getItemPosition(b) ?? 0),
    );
  }, [todos, headings, projectId]);

  // Only todos participate in selection
  const todoItems = useMemo(
    () => items.filter((i): i is ProjectItem & { kind: "todo" } => i.kind === "todo"),
    [items],
  );

  const {
    selectedIds,
    cursorId,
    handleSelect,
    moveDown,
    moveUp,
    deselectAll,
    isSingleSelection,
    getSingleSelectedId,
    syncWithList,
  } = useSelection();

  const orderedTodoIds = useMemo(
    () => todoItems.map((t) => t.data.id),
    [todoItems],
  );

  // Sync selection with current list
  useEffect(() => {
    syncWithList(orderedTodoIds);
  }, [orderedTodoIds, syncWithList]);

  const selectedTodo = useMemo(() => {
    const singleId = getSingleSelectedId();
    if (!singleId) return null;
    return todoItems.find((t) => t.data.id === singleId)?.data ?? null;
  }, [getSingleSelectedId, todoItems]);

  // Completed todos for the "show logged" section
  const allProjectTodos = useMemo(
    () => todos.filter((t) => t.projectId === projectId),
    [todos, projectId],
  );
  const completedTodos = useMemo(
    () => allProjectTodos.filter((t) => t.isCompleted === 1),
    [allProjectTodos],
  );
  const completedCount = completedTodos.length;
  const progress =
    allProjectTodos.length > 0 ? completedCount / allProjectTodos.length : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleToggleComplete(id: string, isCompleted: 0 | 1 | null) {
    const todo = todos.find((t) => t.id === id);
    toggleComplete(
      id,
      isCompleted,
      todo
        ? {
            title: todo.title,
            notes: todo.notes,
            projectId: todo.projectId,
            recurrenceRule: todo.recurrenceRule,
            whenDate: todo.whenDate,
            position: todo.position,
          }
        : undefined,
    );
  }

  function handleClick(id: string, e: React.MouseEvent) {
    handleSelect(id, orderedTodoIds, { metaKey: e.metaKey || e.ctrlKey, shiftKey: e.shiftKey });
    // Close detail view when multi-selecting
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      setExpandedId(null);
    }
  }

  function handleNativeDragStart(todoId: string, e: React.DragEvent) {
    const ids = selectedIds.has(todoId) ? [...selectedIds] : [todoId];
    e.dataTransfer.setData("application/x-todo-ids", JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDoubleClick(id: string) {
    if (isSingleSelection() && getSingleSelectedId() === id) {
      if (expandedId === id) {
        setExpandedId(null);
      } else {
        setExpandedId(id);
      }
    }
  }

  const handlePickerOpened = useCallback(() => {
    setPickerToOpen(null);
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => getItemId(i) === active.id);
    const newIndex = items.findIndex((i) => getItemId(i) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const item = reordered[i];
      if (getItemPosition(item) !== i) {
        if (item.kind === "todo") {
          updateTodo(item.data.id, { position: i });
        } else {
          updateHeading(item.data.id, { position: i });
        }
      }
    }
  }

  function handleAddHeading() {
    // Find max position among current items, place heading at end
    const maxPos = items.reduce(
      (max, item) => Math.max(max, getItemPosition(item) ?? 0),
      -1,
    );
    createHeading(projectId, "New Heading", maxPos + 1);
  }

  const itemIds = useMemo(() => items.map(getItemId), [items]);

  const actions: TodoListActions = useMemo(
    () => ({
      moveUp: () => moveUp(orderedTodoIds),
      moveDown: () => moveDown(orderedTodoIds),
      expandSelected: () => {
        if (selectedTodo && isSingleSelection()) {
          setExpandedId((prev) =>
            prev === selectedTodo.id ? null : selectedTodo.id,
          );
        }
      },
      collapseSelected: () => {
        if (expandedId) {
          setExpandedId(null);
        } else {
          deselectAll();
        }
      },
      toggleCompleteSelected: () => {
        for (const id of selectedIds) {
          const todo = todos.find((t) => t.id === id);
          if (todo) {
            handleToggleComplete(todo.id, todo.isCompleted);
          }
        }
      },
      deleteSelected: () => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;
        pendingDeleteRef.current = ids;
        setConfirmDeleteIds(ids);
      },
      deselect: () => {
        setExpandedId(null);
        deselectAll();
      },
      getSelectedTodoId: () => getSingleSelectedId(),
      getSelectedTodoIds: () => [...selectedIds],
      openPickerOnSelected: (picker: PickerType) => {
        if (selectedTodo && selectedTodo.isCompleted !== 1 && isSingleSelection()) {
          if (expandedId === selectedTodo.id) return;
          setPickerToOpen(picker);
        }
      },
      setSomeday: () => {
        for (const id of selectedIds) {
          updateTodo(id, {
            whenDate: null,
            whenSomeday: 1,
          });
        }
      },
    }),
    [
      moveUp,
      moveDown,
      orderedTodoIds,
      selectedTodo,
      selectedIds,
      isSingleSelection,
      expandedId,
      deselectAll,
      getSingleSelectedId,
      toggleComplete,
      deleteTodo,
      updateTodo,
      todos,
    ],
  );

  return (
    <div>
      <ViewHeader
        title={project?.name ?? "Project"}
        icon={
          <ProgressCircle
            progress={progress}
            color={project?.color ?? undefined}
            className="h-6 w-6"
          />
        }
        onTitleChange={(name) => updateProjectFields(projectId, { name })}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setNewModalOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          {t("view.new")}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleAddHeading}>
          <Heading2 className="mr-1 h-4 w-4" />
          {t("view.heading")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmDeleteProject(true)}
          title={t("view.deleteProject")}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </ViewHeader>

      <div className="px-4 pb-2">
        <Textarea
          value={projectNotes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setProjectNotes(e.target.value)}
          onBlur={handleProjectNotesBlur}
          placeholder={t("todo.notesPlaceholder")}
          className="min-h-[2rem] resize-none border-none p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      <TodoListContext value={actions}>
        <KeyboardShortcutHandler />
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("view.projectEmpty")}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5">
                {items.map((item) => {
                  if (item.kind === "heading") {
                    return (
                      <SortableHeadingRow
                        key={item.data.id}
                        heading={item.data}
                        onDelete={(id) => setConfirmDeleteHeadingId(id)}
                        onUpdateTitle={(id, title) =>
                          updateHeading(id, { title })
                        }
                      />
                    );
                  }

                  const todo = item.data;

                  if (expandedId === todo.id) {
                    return (
                      <TodoDetail
                        key={todo.id}
                        todo={todo}
                        onToggleComplete={handleToggleComplete}
                        onCollapse={() => setExpandedId(null)}
                      />
                    );
                  }

                  return (
                    <SortableTodoRow
                      key={todo.id}
                      todo={todo}
                      isSelected={selectedIds.has(todo.id)}
                      onToggleComplete={handleToggleComplete}
                      onDelete={(id) => {
                        pendingDeleteRef.current = [id];
                        setConfirmDeleteIds([id]);
                      }}
                      onClick={(e) => handleClick(todo.id, e)}
                      onDoubleClick={() => handleDoubleClick(todo.id)}
                      openPicker={
                        cursorId === todo.id && isSingleSelection() ? pickerToOpen : null
                      }
                      onPickerOpened={handlePickerOpened}
                      onNativeDragStart={(e) => handleNativeDragStart(todo.id, e)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </TodoListContext>

      {completedCount > 0 && (
        <div className="mt-8 px-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowCompleted((v) => !v)}
          >
            {showCompleted
              ? t("view.hideLogged", { count: completedCount, taskWord: completedCount === 1 ? t("view.task") : t("view.tasks") })
              : t("view.showLogged", { count: completedCount, taskWord: completedCount === 1 ? t("view.task") : t("view.tasks") })}
          </button>
          {showCompleted && (
            <div className="mt-3 space-y-0.5">
              {completedTodos.map((todo) => (
                <SortableTodoRow
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onDelete={(id) => {
                    pendingDeleteRef.current = [id];
                    setConfirmDeleteIds([id]);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <NewTodoModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        nextPosition={items.length}
        defaults={{ projectId }}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteProject}
        onOpenChange={setConfirmDeleteProject}
        title={t("confirm.deleteProject")}
        description={t("confirm.deleteProjectDesc")}
        onConfirm={() => {
          deleteProject(projectId);
          setActiveView({ kind: "inbox" });
        }}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteHeadingId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteHeadingId(null);
        }}
        title={t("confirm.deleteHeading")}
        description={t("confirm.deleteHeadingDesc")}
        onConfirm={() => {
          if (confirmDeleteHeadingId) {
            deleteHeading(confirmDeleteHeadingId);
          }
          setConfirmDeleteHeadingId(null);
        }}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteIds(null);
        }}
        title={t("confirm.deleteTodo")}
        description={t("confirm.deleteTodoDesc")}
        onConfirm={() => {
          for (const id of pendingDeleteRef.current) {
            deleteTodo(id);
          }
          setConfirmDeleteIds(null);
        }}
      />
    </div>
  );
}
