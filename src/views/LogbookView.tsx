import { useQuery } from "@evolu/react";
import { allTodos } from "@/db/queries";
import { filterLogbook } from "@/lib/filters";
import { formatDateLabel } from "@/lib/dates";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { BookOpen } from "lucide-react";
import { TodoList } from "@/components/todo/TodoList";
import type { TodoRow } from "@/db/queries";

function groupByDate(todos: TodoRow[]): [string, TodoRow[]][] {
  const groups = new Map<string, TodoRow[]>();
  for (const todo of todos) {
    const dateKey = todo.completedAt
      ? todo.completedAt.slice(0, 10)
      : todo.updatedAt
        ? todo.updatedAt.slice(0, 10)
        : "Unknown";
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(todo);
  }
  return [...groups.entries()];
}

export function LogbookView() {
  const todos = useQuery(allTodos);
  const filtered = filterLogbook([...todos]);
  const grouped = groupByDate(filtered);

  return (
    <div>
      <ViewHeader title="Logbook" icon={<BookOpen className="h-6 w-6" style={{ color: "#10b981" }} />} />
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No completed todos yet.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, dateTodos]) => (
            <div key={dateKey}>
              <h3 className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDateLabel(dateKey)}
              </h3>
              <TodoList todos={dateTodos} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
