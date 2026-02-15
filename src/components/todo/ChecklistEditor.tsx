import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { useQuery } from "@evolu/react";
import { allChecklistItems } from "@/db/queries";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useTranslation } from "@/hooks/useTranslation";

interface ChecklistEditorProps {
  todoId: string;
  onAllCompleted?: () => void;
}

export function ChecklistEditor({ todoId, onAllCompleted }: ChecklistEditorProps) {
  const t = useTranslation();
  const items = useQuery(allChecklistItems);
  const { createChecklistItem, updateChecklistItem, deleteChecklistItem } =
    useTodoActions();

  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  const todoItems = items.filter((item) => item.todoId === todoId);

  function handleAdd() {
    const trimmed = newText.trim();
    if (!trimmed) return;
    createChecklistItem(todoId as never, trimmed, todoItems.length);
    setNewText("");
    newInputRef.current?.focus();
  }

  function handleToggle(id: string, isCompleted: number | null) {
    const nowCompleted = isCompleted === 1 ? 0 : 1;
    updateChecklistItem(id, { isCompleted: nowCompleted });

    if (nowCompleted === 1 && onAllCompleted) {
      const allDone = todoItems.every(
        (item) => item.id === id || item.isCompleted === 1,
      );
      if (allDone) onAllCompleted();
    }
  }

  function handleStartEdit(id: string, text: string | null) {
    setEditingId(id);
    setEditText(text ?? "");
  }

  function handleSaveEdit(id: string) {
    const trimmed = editText.trim();
    if (trimmed) {
      updateChecklistItem(id, { text: trimmed });
    }
    setEditingId(null);
    setEditText("");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function handleDelete(id: string) {
    deleteChecklistItem(id);
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-1">
      {todoItems.length > 0 && (
        <div className="space-y-0.5">
          {todoItems.map((item) => (
            <div
              key={item.id}
              className="group/item flex items-center gap-2 rounded px-1 py-0.5 hover:bg-accent/50"
            >
              <Checkbox
                checked={item.isCompleted === 1}
                onCheckedChange={() => handleToggle(item.id, item.isCompleted)}
                className="h-3.5 w-3.5"
              />
              {editingId === item.id ? (
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(item.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  onBlur={() => handleSaveEdit(item.id)}
                  className="h-6 flex-1 text-xs"
                  autoFocus
                />
              ) : (
                <span
                  className={cn(
                    "flex-1 cursor-text text-xs",
                    item.isCompleted === 1 &&
                      "text-muted-foreground line-through",
                  )}
                  onClick={() => handleStartEdit(item.id, item.text)}
                >
                  {item.text}
                </span>
              )}
              <button
                className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover/item:opacity-100"
                onClick={() => handleDelete(item.id)}
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 px-1">
        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Input
          ref={newInputRef}
          placeholder={t("checklist.addItem")}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") {
              setNewText("");
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-6 flex-1 border-none text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
