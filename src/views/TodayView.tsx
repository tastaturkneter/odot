import { useState, useCallback, useMemo } from "react";
import { useActiveTodos } from "@/hooks/useActiveTodos";
import { filterToday } from "@/lib/filters";
import { todayStr } from "@/lib/dates";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Sun, Sunset } from "lucide-react";
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

  const today = todayStr();

  // Sort: non-evening first, then evening (today only)
  const sorted = useMemo(() => {
    const nonEvening = filtered.filter((t) => t.whenEvening !== 1);
    const evening = filtered.filter((t) => t.whenEvening === 1 && t.whenDate === today);
    return [...nonEvening, ...evening];
  }, [filtered, today]);

  // Find the first evening todo's id for the section header
  const firstEveningId = useMemo(() => {
    const first = sorted.find((t) => t.whenEvening === 1 && t.whenDate === today);
    return first?.id ?? null;
  }, [sorted, today]);

  const renderBeforeItem = useCallback(
    (todoId: string) => {
      if (todoId !== firstEveningId) return null;
      return (
        <h3 className="flex items-center gap-2 px-2 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sunset className="h-3.5 w-3.5 text-blue-800 dark:text-blue-400" />
          {t("view.todayEvening")}
          <span className="h-px flex-1 bg-border" />
        </h3>
      );
    },
    [firstEveningId, t],
  );

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
        todos={sorted}
        emptyMessage={t("view.todayEmpty")}
        renderBeforeItem={firstEveningId ? renderBeforeItem : undefined}
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
