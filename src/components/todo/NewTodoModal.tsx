import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sun,
  CalendarClock,
  FolderOpen,
  Tag,
  Calendar,
  Clock,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateShort, todayStr } from "@/lib/dates";
import { matchPreset, ruleToText } from "@/lib/rrule";
import { WhenPicker } from "@/components/shared/WhenPicker";
import { DeadlinePicker } from "@/components/shared/DeadlinePicker";
import { ProjectPicker } from "@/components/shared/ProjectPicker";
import { RecurrencePicker } from "@/components/shared/RecurrencePicker";
import { ModalTagPicker } from "./ModalTagPicker";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useTagActions } from "@/hooks/useTagActions";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@evolu/react";
import { allProjects, allTags } from "@/db/queries";

export interface NewTodoDefaults {
  whenDate?: string | null;
  whenSomeday?: boolean;
  whenEvening?: boolean;
  deadline?: string | null;
  projectId?: string | null;
  tagIds?: string[];
}

interface NewTodoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPosition: number;
  defaults?: NewTodoDefaults;
}

export function NewTodoModal({
  open,
  onOpenChange,
  nextPosition,
  defaults,
}: NewTodoModalProps) {
  const { createTodo, updateTodo } = useTodoActions();
  const { addTagToTodo } = useTagActions();
  const t = useTranslation();
  const projects = useQuery(allProjects);
  const tags = useQuery(allTags);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [whenDate, setWhenDate] = useState<string | null>(
    defaults?.whenDate ?? null,
  );
  const [whenSomeday, setWhenSomeday] = useState(
    defaults?.whenSomeday ?? false,
  );
  const [whenEvening, setWhenEvening] = useState(
    defaults?.whenEvening ?? false,
  );
  const [deadline, setDeadline] = useState<string | null>(
    defaults?.deadline ?? null,
  );
  const [projectId, setProjectId] = useState<string | null>(
    defaults?.projectId ?? null,
  );
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(defaults?.tagIds ?? []),
  );
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTitle("");
    setNotes("");
    setWhenDate(defaults?.whenDate ?? null);
    setWhenSomeday(defaults?.whenSomeday ?? false);
    setWhenEvening(defaults?.whenEvening ?? false);
    setDeadline(defaults?.deadline ?? null);
    setProjectId(defaults?.projectId ?? null);
    setSelectedTagIds(new Set(defaults?.tagIds ?? []));
    setRecurrenceRule(null);
  }, [defaults]);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;

    const result = createTodo(trimmed, nextPosition);
    if (!result.ok) return;

    const todoId = result.value.id;

    // Apply optional fields
    const updates: Record<string, unknown> = {};
    if (notes.trim()) updates.notes = notes.trim();
    if (whenDate) updates.whenDate = whenDate;
    if (whenSomeday) updates.whenSomeday = 1;
    if (whenEvening) updates.whenEvening = 1;
    if (deadline) updates.deadline = deadline;
    if (projectId) updates.projectId = projectId;
    if (recurrenceRule) updates.recurrenceRule = recurrenceRule;

    if (Object.keys(updates).length > 0) {
      updateTodo(todoId, updates as never);
    }

    // Assign tags
    for (const tagId of selectedTagIds) {
      addTagToTodo(todoId as never, tagId as never);
    }

    const locationLabel = projectId
      ? projects.find((p) => p.id === projectId)?.name ?? t("sidebar.inbox")
      : whenDate === todayStr() ? t("sidebar.today")
      : whenDate ? t("sidebar.upcoming")
      : whenSomeday ? t("sidebar.someday")
      : t("sidebar.inbox");
    toast(t("commandPalette.todoCreatedIn", { location: locationLabel }));

    reset();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleWhenChange(value: {
    date: string | null;
    someday: boolean;
    evening?: boolean;
  }) {
    setWhenDate(value.date);
    setWhenSomeday(value.someday);
    setWhenEvening(value.evening ?? false);
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : null;

  const selectedTags = [...selectedTagIds]
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{t("newTodo.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={t("newTodo.placeholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
          />

          <Textarea
            placeholder={t("newTodo.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[3rem] resize-none text-sm"
          />

          {/* Picker pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <WhenPicker
              value={{ date: whenDate, someday: whenSomeday, evening: whenEvening }}
              onChange={handleWhenChange}
              modal
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  whenDate || whenSomeday
                    ? "border-border text-foreground"
                    : "border-dashed border-muted-foreground/40 text-muted-foreground",
                )}
              >
                {whenSomeday ? (
                  <Clock className="h-3 w-3" />
                ) : whenDate ? (
                  <Calendar className="h-3 w-3" />
                ) : (
                  <Sun className="h-3 w-3" />
                )}
                {whenDate
                  ? formatDateShort(whenDate, t, whenEvening)
                  : whenSomeday
                    ? t("todo.someday")
                    : t("todo.when")}
              </button>
            </WhenPicker>

            <DeadlinePicker value={deadline} onChange={setDeadline} modal>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  deadline
                    ? "border-orange-500/30 text-orange-500"
                    : "border-dashed border-muted-foreground/40 text-muted-foreground",
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {deadline ? formatDateShort(deadline, t) : t("todo.deadline")}
              </button>
            </DeadlinePicker>

            <ProjectPicker value={projectId} onChange={setProjectId} modal>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  project
                    ? "border-border text-foreground"
                    : "border-dashed border-muted-foreground/40 text-muted-foreground",
                )}
                style={project?.color ? { color: project.color } : undefined}
              >
                <FolderOpen className="h-3 w-3" />
                {project ? project.name : t("todo.project")}
              </button>
            </ProjectPicker>

            <ModalTagPicker
              selectedTagIds={selectedTagIds}
              onToggle={toggleTag}
              modal
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedTags.length > 0
                    ? "border-border text-foreground"
                    : "border-dashed border-muted-foreground/40 text-muted-foreground",
                )}
              >
                <Tag className="h-3 w-3" />
                <span className="truncate max-w-20">
                  {selectedTags.length === 0
                    ? t("todo.tags")
                    : selectedTags.length === 1
                      ? selectedTags[0]!.name
                      : t("todo.tagsCount", { count: selectedTags.length })}
                </span>
              </button>
            </ModalTagPicker>

            <RecurrencePicker
              value={recurrenceRule}
              onChange={setRecurrenceRule}
              modal
            >
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  recurrenceRule
                    ? "border-border text-foreground"
                    : "border-dashed border-muted-foreground/40 text-muted-foreground",
                )}
              >
                <Repeat className="h-3 w-3" />
                {recurrenceRule
                  ? (matchPreset(recurrenceRule)?.label ?? ruleToText(recurrenceRule))
                  : t("todo.repeat")}
              </button>
            </RecurrencePicker>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {t("newTodo.saveHint", { key: navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl" })}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                {t("newTodo.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!title.trim()}
                onClick={handleSubmit}
              >
                {t("newTodo.create")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
