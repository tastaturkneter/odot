import { useQuery } from "@evolu/react";
import { deletedTodos } from "@/db/queries";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { Trash2, RotateCcw } from "lucide-react";
import { useTodoActions } from "@/hooks/useTodoActions";

export function TrashView() {
  const todos = useQuery(deletedTodos);
  const { restoreTodo } = useTodoActions();

  return (
    <div>
      <ViewHeader
        title="Trash"
        icon={<Trash2 className="h-6 w-6" style={{ color: "#6b7280" }} />}
      />
      {todos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Trash is empty.
        </p>
      ) : (
        <div className="space-y-0.5">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm text-muted-foreground">
                  {todo.title}
                </span>
              </div>
              <button
                className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                onClick={() => restoreTodo(todo.id)}
                title="Restore"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
