import type { TodoRow, TodoTagRow } from "@/db/queries";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function buildTodoTagMap(
  todoTags: TodoTagRow[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const tt of todoTags) {
    if (tt.todoId === null || tt.tagId === null) continue;
    if (!map.has(tt.todoId)) map.set(tt.todoId, new Set());
    map.get(tt.todoId)!.add(tt.tagId);
  }
  return map;
}

export function filterInbox(
  todos: TodoRow[],
  todoTagMap: Map<string, Set<string>>,
  showCompleted = false,
): TodoRow[] {
  return todos.filter(
    (t) =>
      (showCompleted || t.isCompleted === 0) &&
      t.whenDate === null &&
      (t.whenSomeday === null || t.whenSomeday === 0) &&
      t.projectId === null &&
      !todoTagMap.has(t.id),
  );
}

export function filterToday(
  todos: TodoRow[],
  showCompleted = false,
): TodoRow[] {
  const today = todayStr();
  return todos.filter(
    (t) =>
      (showCompleted || t.isCompleted === 0) &&
      t.whenDate !== null &&
      t.whenDate <= today,
  );
}

export function filterUpcoming(
  todos: TodoRow[],
  daysAhead: number = 7,
  showCompleted = false,
): TodoRow[] {
  const today = todayStr();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return todos.filter(
    (t) =>
      (showCompleted || t.isCompleted === 0) &&
      t.whenDate !== null &&
      t.whenDate > today &&
      t.whenDate <= endStr,
  );
}

export function filterSomeday(
  todos: TodoRow[],
  showCompleted = false,
): TodoRow[] {
  return todos.filter(
    (t) => (showCompleted || t.isCompleted === 0) && t.whenSomeday === 1,
  );
}

export function filterLogbook(todos: TodoRow[]): TodoRow[] {
  return todos
    .filter((t) => t.isCompleted === 1)
    .sort((a, b) => {
      const aTime = a.completedAt ?? a.updatedAt ?? "";
      const bTime = b.completedAt ?? b.updatedAt ?? "";
      return bTime.localeCompare(aTime);
    });
}

export function filterByProject(
  todos: TodoRow[],
  projectId: string,
  showCompleted = false,
): TodoRow[] {
  return todos.filter(
    (t) =>
      (showCompleted || t.isCompleted === 0) && t.projectId === projectId,
  );
}

export function filterByArea(
  todos: TodoRow[],
  projectIds: string[],
  showCompleted = false,
): TodoRow[] {
  const pidSet = new Set(projectIds);
  return todos.filter(
    (t) =>
      (showCompleted || t.isCompleted === 0) &&
      t.projectId !== null &&
      pidSet.has(t.projectId),
  );
}

export function filterByTag(
  todos: TodoRow[],
  tagId: string,
  todoTagMap: Map<string, Set<string>>,
  showCompleted = false,
): TodoRow[] {
  return todos.filter(
    (t) =>
      (showCompleted || t.isCompleted === 0) &&
      todoTagMap.get(t.id)?.has(tagId),
  );
}
