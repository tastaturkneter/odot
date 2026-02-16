import { useState } from "react";
import { useActiveTodos } from "@/hooks/useActiveTodos";
import { filterToday } from "@/lib/filters";
import { todayStr } from "@/lib/dates";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Sun } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";

export function TodayView() {
  const t = useTranslation();
  const { newModalOpen, setNewModalOpen } = useActiveView();
  const { get } = useSettings();
  const keepVisible = get("completedVisibility") === "show";
  const [showCompleted, setShowCompleted] = useState(false);
  const todos = useActiveTodos();
  const filtered = filterToday([...todos], keepVisible || showCompleted);

  return (
    <div>
      <ViewHeader title={t("sidebar.today")} icon={<Sun className="h-6 w-6" style={{ color: "#f59e0b" }} />}>
        {!keepVisible && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCompleted((v) => !v)}
            title={showCompleted ? t("view.hideCompleted") : t("view.showCompleted")}
          >
            {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setNewModalOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("view.new")}
        </Button>
      </ViewHeader>
      <TodoList
        todos={filtered}
        emptyMessage={t("view.todayEmpty")}
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
