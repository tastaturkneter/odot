import { useState } from "react";
import { useQuery } from "@evolu/react";
import { allTodos } from "@/db/queries";
import { filterSomeday } from "@/lib/filters";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Clock } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useTranslation } from "@/hooks/useTranslation";

export function SomedayView() {
  const t = useTranslation();
  const { newModalOpen, setNewModalOpen } = useActiveView();
  const [showCompleted, setShowCompleted] = useState(false);
  const todos = useQuery(allTodos);
  const filtered = filterSomeday([...todos], showCompleted);

  return (
    <div>
      <ViewHeader title={t("sidebar.someday")} icon={<Clock className="h-6 w-6" style={{ color: "#a78bfa" }} />}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCompleted((v) => !v)}
          title={showCompleted ? t("view.hideCompleted") : t("view.showCompleted")}
        >
          {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNewModalOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("view.new")}
        </Button>
      </ViewHeader>
      <TodoList
        todos={filtered}
        emptyMessage={t("view.somedayEmpty")}
      />
      <NewTodoModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        nextPosition={todos.length}
        defaults={{ whenSomeday: true }}
      />
    </div>
  );
}
