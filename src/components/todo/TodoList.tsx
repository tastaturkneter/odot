import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
} from "@dnd-kit/sortable";
import { useQuery } from "@evolu/react";
import { SortableTodoRow } from "./SortableTodoRow";
import { TodoDetail } from "./TodoDetail";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useSelection } from "@/hooks/useSelection";
import {
  TodoListContext,
  type TodoListActions,
} from "@/hooks/useTodoListContext";
import { allChecklistItems } from "@/db/queries";
import type { TodoRow as TodoRowType } from "@/db/queries";
import { KeyboardShortcutHandler } from "./KeyboardShortcutHandler";
import type { PickerType } from "./TodoRow";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { useTranslation } from "@/hooks/useTranslation";

interface TodoListProps {
  todos: TodoRowType[];
  emptyMessage?: string;
  renderBeforeItem?: (todoId: string) => React.ReactNode | null;
}

export function TodoList({
  todos,
  emptyMessage = "No todos",
  renderBeforeItem,
}: TodoListProps) {
  const { toggleComplete, deleteTodo, updateTodo } = useTodoActions();
  const t = useTranslation();
  // Preload checklist items so TodoDetail doesn't trigger Suspense on first open
  useQuery(allChecklistItems);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pickerToOpen, setPickerToOpen] = useState<PickerType | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);
  const pendingDeleteRef = useRef<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const orderedIds = useMemo(() => todos.map((t) => t.id), [todos]);

  // Sync selection with current list
  useEffect(() => {
    syncWithList(orderedIds);
  }, [orderedIds, syncWithList]);

  // Deselect when clicking on empty space (like a file explorer)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        target.closest("[data-todo-item]") ||
        target.closest("[role='dialog']") ||
        target.closest("[data-radix-popper-content-wrapper]")
      ) {
        return;
      }
      setExpandedId(null);
      deselectAll();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [deselectAll]);

  const selectedTodo = useMemo(() => {
    const singleId = getSingleSelectedId();
    if (!singleId) return null;
    return todos.find((t) => t.id === singleId) ?? null;
  }, [getSingleSelectedId, todos]);

  function handleToggleComplete(id: string, isCompleted: 0 | 1 | null) {
    const todo = todos.find((t) => t.id === id);
    toggleComplete(id, isCompleted, todo ? {
      title: todo.title,
      notes: todo.notes,
      projectId: todo.projectId,
      recurrenceRule: todo.recurrenceRule,
      whenDate: todo.whenDate,
      position: todo.position,
    } : undefined);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleClick(id: string, e: React.MouseEvent) {
    // On mobile: if todo is already the single selection, expand it
    if (!isDesktop && selectedIds.has(id) && isSingleSelection()) {
      setExpandedId(id);
      return;
    }
    handleSelect(id, orderedIds, { metaKey: e.metaKey || e.ctrlKey, shiftKey: e.shiftKey });
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

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Compute new order and update positions
    const reordered = arrayMove(todos, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const todo = reordered[i];
      if (todo.position !== i) {
        updateTodo(todo.id, { position: i });
      }
    }
  }

  const actions: TodoListActions = useMemo(
    () => ({
      moveUp: () => moveUp(orderedIds),
      moveDown: () => moveDown(orderedIds),
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
          if (expandedId === selectedTodo.id) {
            return;
          }
          setPickerToOpen(picker);
        }
      },
      setSomeday: () => {
        for (const id of selectedIds) {
          updateTodo(id, {
            whenDate: null,
            whenSomeday: 1,
            whenEvening: null,
          });
        }
      },
    }),
    [
      moveUp,
      moveDown,
      orderedIds,
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

  const todoIds = useMemo(() => todos.map((t) => t.id), [todos]);

  if (todos.length === 0) {
    return (
      <TodoListContext value={actions}>
        <KeyboardShortcutHandler />
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </TodoListContext>
    );
  }

  return (
    <TodoListContext value={actions}>
      <KeyboardShortcutHandler />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={todoIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {todos.map((todo) => (
              <div key={todo.id}>
                {renderBeforeItem?.(todo.id)}
                {expandedId === todo.id ? (
                  <TodoDetail
                    todo={todo}
                    onToggleComplete={handleToggleComplete}
                    onCollapse={() => setExpandedId(null)}
                  />
                ) : (
                  <SortableTodoRow
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
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
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
    </TodoListContext>
  );
}
