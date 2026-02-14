import { useState } from "react";
import { useQuery } from "@evolu/react";
import { allTodos } from "@/db/queries";
import { filterToday } from "@/lib/filters";
import { todayStr } from "@/lib/dates";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Sun } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";

export function TodayView() {
  const { newModalOpen, setNewModalOpen } = useActiveView();
  const [showCompleted, setShowCompleted] = useState(false);
  const todos = useQuery(allTodos);
  const filtered = filterToday([...todos], showCompleted);

  return (
    <div>
      <ViewHeader title="Today" icon={<Sun className="h-6 w-6" style={{ color: "#f59e0b" }} />}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCompleted((v) => !v)}
          title={showCompleted ? "Hide completed" : "Show completed"}
        >
          {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNewModalOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
      </ViewHeader>
      <TodoList
        todos={filtered}
        emptyMessage="Nothing scheduled for today."
      />
      <NewTodoModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        nextPosition={todos.length}
        defaults={{ whenDate: todayStr() }}
      />
    </div>
  );
}
