import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { PickerDropdown } from "@/components/ui/picker-dropdown";
import { Input } from "@/components/ui/input";
import { useQuery } from "@evolu/react";
import { allTags } from "@/db/queries";
import { useTagActions } from "@/hooks/useTagActions";
import { Tag, Check, Plus } from "lucide-react";

interface ModalTagPickerProps {
  selectedTagIds: Set<string>;
  onToggle: (tagId: string) => void;
  children: React.ReactNode;
  modal?: boolean;
}

export function ModalTagPicker({
  selectedTagIds,
  onToggle,
  children,
  modal,
}: ModalTagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const tags = useQuery(allTags);
  const { createTag } = useTagActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  function close() {
    triggerRef.current?.focus();
    setOpen(false);
  }

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

  function handleCreateAndToggle() {
    const trimmed = search.trim();
    if (!trimmed || exactMatch) return;
    const result = createTag(trimmed, tags.length);
    if (result.ok) {
      onToggle(result.value.id);
      setSearch("");
    }
  }

  const trigger = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        ref: triggerRef,
        onClick: () => (open ? close() : setOpen(true)),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? close() : setOpen(true);
          }
        },
      })
    : children;

  const dropdownContent = (
    <>
      <div className="p-2">
        <Input
          ref={inputRef}
          placeholder="Search or create..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim() && !exactMatch) {
              handleCreateAndToggle();
            }
          }}
          className="h-7 text-sm"
        />
      </div>
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.map((tag) => (
          <button
            key={tag.id}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => onToggle(tag.id)}
          >
            <Tag
              className="h-3.5 w-3.5 shrink-0"
              style={tag.color ? { color: tag.color } : undefined}
            />
            <span className="flex-1 truncate text-left">{tag.name}</span>
            {selectedTagIds.has(tag.id) && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </button>
        ))}
        {search.trim() && !exactMatch && (
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={handleCreateAndToggle}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create &quot;{search.trim()}&quot;</span>
          </button>
        )}
        {filtered.length === 0 && !search.trim() && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No tags yet
          </p>
        )}
      </div>
    </>
  );

  if (modal) {
    return (
      <div className="relative inline-flex">
        {trigger}
        <PickerDropdown
          open={open}
          onClose={close}
          className="w-52 p-0"
        >
          {dropdownContent}
        </PickerDropdown>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent className="w-52 p-0" align="start">
        {dropdownContent}
      </PopoverContent>
    </Popover>
  );
}
