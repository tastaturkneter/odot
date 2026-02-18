import { useEvolu } from "@/db/evolu";
import { getNextOccurrence } from "@/lib/rrule";
import { dateToStr } from "@/lib/dates";

interface RecurringTodoData {
  title: string | null;
  notes: string | null;
  projectId: string | null;
  recurrenceRule: string | null;
  whenDate: string | null;
  position: number | null;
}

export function useTodoActions() {
  const evolu = useEvolu();

  function createTodo(title: string, position: number) {
    return evolu.insert("todo", {
      title,
      position,
      isCompleted: 0,
    });
  }

  function updateTodo(
    id: string,
    fields: {
      title?: string;
      notes?: string | null;
      whenDate?: string | null;
      whenSomeday?: 0 | 1 | null;
      deadline?: string | null;
      projectId?: string | null;
      position?: number;
      recurrenceRule?: string | null;
    },
  ) {
    return evolu.update("todo", { id, ...fields } as never);
  }

  function toggleComplete(
    id: string,
    isCompleted: 0 | 1 | null,
    recurringData?: RecurringTodoData,
  ) {
    const nowCompleted = isCompleted === 1 ? 0 : 1;
    evolu.update("todo", {
      id,
      isCompleted: nowCompleted,
      completedAt: nowCompleted === 1 ? new Date().toISOString() : null,
    } as never);

    // If completing a recurring todo, create the next instance
    if (
      nowCompleted === 1 &&
      recurringData?.recurrenceRule &&
      recurringData.title
    ) {
      const baseDateStr = recurringData.whenDate ?? dateToStr(new Date());
      const nextDate = getNextOccurrence(
        recurringData.recurrenceRule,
        baseDateStr,
      );

      if (nextDate) {
        const result = createTodo(
          recurringData.title,
          recurringData.position ?? 0,
        );
        if (result.ok) {
          const updates: Record<string, unknown> = {
            whenDate: nextDate,
            recurrenceRule: recurringData.recurrenceRule,
          };
          if (recurringData.notes) updates.notes = recurringData.notes;
          if (recurringData.projectId)
            updates.projectId = recurringData.projectId;
          evolu.update("todo", {
            id: result.value.id,
            ...updates,
          } as never);
        }
      }
    }
  }

  function deleteTodo(id: string) {
    return evolu.update("todo", { id, isDeleted: 1 } as never);
  }

  function restoreTodo(id: string) {
    return evolu.update("todo", { id, isDeleted: 0 } as never);
  }

  // Checklist item actions

  function createChecklistItem(
    todoId: string,
    text: string,
    position: number,
  ) {
    return evolu.insert("checklistItem", {
      todoId,
      text,
      isCompleted: 0,
      position,
    } as never);
  }

  function updateChecklistItem(
    id: string,
    fields: {
      text?: string;
      isCompleted?: 0 | 1;
      position?: number;
    },
  ) {
    return evolu.update("checklistItem", { id, ...fields } as never);
  }

  function deleteChecklistItem(id: string) {
    return evolu.update("checklistItem", { id, isDeleted: 1 } as never);
  }

  return {
    createTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    restoreTodo,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
  };
}
