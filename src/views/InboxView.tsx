import { useState } from "react";
import { useQuery } from "@evolu/react";
import { allTodoTags } from "@/db/queries";
import { useActiveTodos } from "@/hooks/useActiveTodos";
import { filterInbox, buildTodoTagMap } from "@/lib/filters";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Inbox } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useTranslation } from "@/hooks/useTranslation";

export function InboxView() {
  const t = useTranslation();
  const { newModalOpen, setNewModalOpen } = useActiveView();
  const [showCompleted, setShowCompleted] = useState(false);
  const todos = useActiveTodos();
  const todoTags = useQuery(allTodoTags);
  const todoTagMap = buildTodoTagMap([...todoTags]);
  const filtered = filterInbox([...todos], todoTagMap, showCompleted);

  return (
    <div>
      <ViewHeader title={t("sidebar.inbox")} icon={<Inbox className="h-6 w-6" style={{ color: "#3b82f6" }} />}>
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
        emptyMessage={t("view.inboxEmpty")}
      />
      <NewTodoModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        nextPosition={todos.length}
      />
    </div>
  );
}
