import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useQuery } from "@evolu/react";
import { allTags, allTodoTags } from "@/db/queries";
import { useTagActions } from "@/hooks/useTagActions";
import { Tag, Check, Plus } from "lucide-react";

interface TagPickerProps {
  todoId: string;
  children: React.ReactNode;
}

export function TagPicker({ todoId, children }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const tags = useQuery(allTags);
  const todoTags = useQuery(allTodoTags);
  const { addTagToTodo, removeTagFromTodo, createTag } = useTagActions();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  const assignedTodoTags = todoTags.filter((tt) => tt.todoId === todoId);
  const assignedTagIds = new Set(
    assignedTodoTags.map((tt) => tt.tagId).filter(Boolean),
  );

  const filtered = search.trim()
    ? tags.filter(
        (t) =>
          t.name !== null &&
          t.name.toLowerCase().includes(search.toLowerCase()),
      )
    : tags;

  const exactMatch = tags.find(
    (t) =>
      t.name !== null && t.name.toLowerCase() === search.trim().toLowerCase(),
  );

  function handleToggle(tagId: string) {
    if (assignedTagIds.has(tagId as never)) {
      const todoTag = assignedTodoTags.find((tt) => tt.tagId === tagId);
      if (todoTag) removeTagFromTodo(todoTag.id as never);
    } else {
      addTagToTodo(todoId as never, tagId as never);
    }
  }

  function handleCreateAndAssign() {
    const trimmed = search.trim();
    if (!trimmed || exactMatch) return;
    const result = createTag(trimmed, tags.length);
    if (result.ok) {
      addTagToTodo(todoId, result.value.id);
      setSearch("");
    }
  }

  const trigger = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); setOpen((v) => !v); },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        },
      })
    : children;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent
        className="w-52 p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const input = (e.target as HTMLElement).querySelector<HTMLElement>("input");
          input?.focus();
        }}
      >
        <div className="p-2">
          <Input
            placeholder="Search or create..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim() && !exactMatch) {
                handleCreateAndAssign();
              }
            }}
            ref={inputRef}
            className="h-7 text-sm"
          />
        </div>
        <div className="max-h-48 overflow-y-auto py-1">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              onClick={() => handleToggle(tag.id)}
            >
              <Tag
                className="h-3.5 w-3.5 shrink-0"
                style={tag.color ? { color: tag.color } : undefined}
              />
              <span className="flex-1 truncate text-left">{tag.name}</span>
              {assignedTagIds.has(tag.id) && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}
          {search.trim() && !exactMatch && (
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              onClick={handleCreateAndAssign}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create "{search.trim()}"</span>
            </button>
          )}
          {filtered.length === 0 && !search.trim() && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No tags yet
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
