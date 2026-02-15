import { useState } from "react";
import { useQuery } from "@evolu/react";
import { allTodos, allTags, allTodoTags } from "@/db/queries";
import { filterByTag, buildTodoTagMap } from "@/lib/filters";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Tag } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useTranslation } from "@/hooks/useTranslation";

export function TagView({ tagId }: { tagId: string }) {
  const t = useTranslation();
  const { newModalOpen, setNewModalOpen } = useActiveView();
  const [showCompleted, setShowCompleted] = useState(false);
  const todos = useQuery(allTodos);
  const tags = useQuery(allTags);
  const todoTags = useQuery(allTodoTags);
  const tag = tags.find((t) => t.id === tagId);
  const todoTagMap = buildTodoTagMap([...todoTags]);
  const filtered = filterByTag([...todos], tagId, todoTagMap, showCompleted);

  return (
    <div>
      <ViewHeader title={tag?.name ?? "Tag"} icon={<Tag className="h-6 w-6" style={{ color: tag?.color ?? undefined }} />}>
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
        emptyMessage={t("view.tagEmpty")}
      />
      <NewTodoModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        nextPosition={todos.length}
        defaults={{ tagIds: [tagId] }}
      />
    </div>
  );
}
