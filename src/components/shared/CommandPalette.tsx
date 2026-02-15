import { useState, useRef, useMemo, useCallback } from "react";
import { useQuery } from "@evolu/react";
import { allTodos, allProjects, allTags, allTodoTags } from "@/db/queries";
import { useActiveView } from "@/hooks/useActiveView";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useSettings } from "@/hooks/useSettings";
import { useTagActions } from "@/hooks/useTagActions";
import { useTranslation } from "@/hooks/useTranslation";
import { buildTodoTagMap } from "@/lib/filters";
import { parseQuickAdd } from "@/lib/quickAddParser";
import { formatDateShort, todayStr } from "@/lib/dates";
import { toast } from "sonner";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderOpen,
  Tag,
  Inbox,
  Sun,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  CalendarClock,
  AlertCircle,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AutocompleteContext {
  kind: "project" | "tag" | "schedule" | "deadline";
  partial: string;
  startIndex: number;
  endIndex: number;
}

function getAutocompleteContext(
  value: string,
  cursorPos: number,
): AutocompleteContext | null {
  // Walk backward from cursor to find @, #, !, or ^
  let i = cursorPos - 1;
  while (i >= 0) {
    const ch = value[i];
    if (ch === " " || ch === "\n" || ch === "\t") return null;
    if (ch === "@" || ch === "#" || ch === "!" || ch === "^") {
      const partial = value.slice(i + 1, cursorPos);
      let kind: AutocompleteContext["kind"];
      if (ch === "@") kind = "project";
      else if (ch === "#") kind = "tag";
      else if (ch === "!") kind = "schedule";
      else kind = "deadline";
      // Don't autocomplete if partial looks like a date (contains . or -)
      if ((kind === "schedule" || kind === "deadline") && /[.\-]/.test(partial))
        return null;
      return {
        kind,
        partial,
        startIndex: i,
        endIndex: cursorPos,
      };
    }
    i--;
  }
  return null;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { setActiveView } = useActiveView();
  const { createTodo, updateTodo } = useTodoActions();
  const { addTagToTodo } = useTagActions();
  const { get: getSetting } = useSettings();
  const t = useTranslation();
  const dateFormat = getSetting("dateFormat") === "month-first" ? "month-first" : "day-first" as const;

  const todos = useQuery(allTodos);
  const projects = useQuery(allProjects);
  const tags = useQuery(allTags);
  const todoTags = useQuery(allTodoTags);
  const todoTagMap = buildTodoTagMap([...todoTags]);

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const SCHEDULE_OPTIONS = useMemo(() => [
    { label: t("schedule.today"), keyword: "today" },
    { label: t("schedule.tomorrow"), keyword: "tomorrow" },
    { label: t("schedule.weekend"), keyword: "weekend" },
    { label: t("schedule.nextWeek"), keyword: "nextweek" },
    { label: t("schedule.someday"), keyword: "someday" },
  ], [t]);

  const DEADLINE_OPTIONS = useMemo(() => [
    { label: t("deadline.today"), keyword: "today" },
    { label: t("deadline.tomorrow"), keyword: "tomorrow" },
    { label: t("deadline.monday"), keyword: "monday" },
    { label: t("deadline.tuesday"), keyword: "tuesday" },
    { label: t("deadline.wednesday"), keyword: "wednesday" },
    { label: t("deadline.thursday"), keyword: "thursday" },
    { label: t("deadline.friday"), keyword: "friday" },
    { label: t("deadline.saturday"), keyword: "saturday" },
    { label: t("deadline.sunday"), keyword: "sunday" },
  ], [t]);

  const activeTodos = useMemo(
    () => [...todos].filter((t) => t.isCompleted !== 1),
    [todos],
  );

  const acContext = useMemo(
    () => getAutocompleteContext(inputValue, cursorPos),
    [inputValue, cursorPos],
  );

  const isAutocompleting = acContext !== null;

  const filteredSuggestions = useMemo(() => {
    if (!acContext) return [];
    const lower = acContext.partial.toLowerCase();
    if (acContext.kind === "project") {
      return projects.filter((p) =>
        p.name?.toLowerCase().includes(lower),
      );
    }
    if (acContext.kind === "tag") {
      return tags.filter((t) =>
        t.name?.toLowerCase().includes(lower),
      );
    }
    // schedule and deadline are handled separately
    return [];
  }, [acContext, projects, tags]);

  const filteredDateOptions = useMemo(() => {
    if (!acContext) return [];
    const lower = acContext.partial.toLowerCase();
    if (acContext.kind === "schedule") {
      return SCHEDULE_OPTIONS.filter((o) =>
        o.keyword.includes(lower) || o.label.toLowerCase().includes(lower),
      );
    }
    if (acContext.kind === "deadline") {
      return DEADLINE_OPTIONS.filter((o) =>
        o.keyword.includes(lower) || o.label.toLowerCase().includes(lower),
      );
    }
    return [];
  }, [acContext, SCHEDULE_OPTIONS, DEADLINE_OPTIONS]);

  const parsed = useMemo(() => {
    if (!inputValue.trim()) return null;
    return parseQuickAdd(inputValue, [...projects], [...tags], dateFormat);
  }, [inputValue, projects, tags, dateFormat]);

  const insertSuggestion = useCallback(
    (name: string) => {
      if (!acContext) return;
      const needsQuotes = name.includes(" ");
      const replacement = needsQuotes ? `"${name}" ` : `${name} `;
      // Replace from startIndex+1 (after @ or #) to endIndex
      const before = inputValue.slice(0, acContext.startIndex + 1);
      const after = inputValue.slice(acContext.endIndex);
      const newValue = before + replacement + after;
      const newCursor = before.length + replacement.length;
      setInputValue(newValue);
      setCursorPos(newCursor);
      // Restore focus and cursor position after React re-render
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(newCursor, newCursor);
        }
      });
    },
    [acContext, inputValue],
  );

  const insertDateKeyword = useCallback(
    (keyword: string) => {
      if (!acContext) return;
      const replacement = `${keyword} `;
      const before = inputValue.slice(0, acContext.startIndex + 1);
      const after = inputValue.slice(acContext.endIndex);
      const newValue = before + replacement + after;
      const newCursor = before.length + replacement.length;
      setInputValue(newValue);
      setCursorPos(newCursor);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(newCursor, newCursor);
        }
      });
    },
    [acContext, inputValue],
  );

  function handleCreateTodo() {
    if (!parsed || !parsed.title) return;

    const result = createTodo(parsed.title, todos.length);
    if (!result.ok) return;

    const todoId = result.value.id;

    const updates: Record<string, unknown> = {};
    if (parsed.whenDate) updates.whenDate = parsed.whenDate;
    if (parsed.whenSomeday) updates.whenSomeday = 1;
    if (parsed.deadline) updates.deadline = parsed.deadline;
    if (parsed.projectId) updates.projectId = parsed.projectId;

    if (Object.keys(updates).length > 0) {
      updateTodo(todoId, updates as never);
    }

    for (const tagId of parsed.tagIds) {
      addTagToTodo(todoId as never, tagId as never);
    }

    const locationLabel = parsed.projectId
      ? parsed.projectName ?? t("sidebar.inbox")
      : parsed.whenDate === todayStr()
        ? t("sidebar.today")
        : parsed.whenDate
          ? t("sidebar.upcoming")
          : parsed.whenSomeday
            ? t("sidebar.someday")
            : t("sidebar.inbox");
    toast(t("commandPalette.todoCreatedIn", { location: locationLabel }));

    setInputValue("");
    setCursorPos(0);
    onOpenChange(false);
  }

  function handleSelectTodo(todoId: string) {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    if (todo.projectId) {
      setActiveView({ kind: "project", projectId: todo.projectId });
    } else if (todo.whenSomeday === 1) {
      setActiveView({ kind: "someday" });
    } else if (todo.whenDate !== null) {
      const today = new Date().toISOString().slice(0, 10);
      if (todo.whenDate <= today) {
        setActiveView({ kind: "today" });
      } else {
        setActiveView({ kind: "upcoming" });
      }
    } else {
      const hasTags = todoTagMap.has(todo.id);
      if (hasTags) {
        const firstTagId = todoTagMap.get(todo.id)!.values().next().value;
        if (firstTagId) {
          setActiveView({ kind: "tag", tagId: firstTagId });
        } else {
          setActiveView({ kind: "inbox" });
        }
      } else {
        setActiveView({ kind: "inbox" });
      }
    }
    onOpenChange(false);
  }

  function handleSelectProject(projectId: string) {
    setActiveView({ kind: "project", projectId });
    onOpenChange(false);
  }

  function handleSelectTag(tagId: string) {
    setActiveView({ kind: "tag", tagId });
    onOpenChange(false);
  }

  function handleSelectView(view: Parameters<typeof setActiveView>[0]) {
    setActiveView(view);
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setInputValue("");
      setCursorPos(0);
    }
    onOpenChange(nextOpen);
  }

  function handleInputChange(value: string) {
    setInputValue(value);
    // Track cursor from the input element
    const el = inputRef.current;
    if (el) {
      setCursorPos(el.selectionStart ?? value.length);
    } else {
      setCursorPos(value.length);
    }
  }

  function handleInputKeyDown() {
    // Update cursor position on key navigation
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        setCursorPos(el.selectionStart ?? inputValue.length);
      }
    });
  }

  function handleInputClick() {
    const el = inputRef.current;
    if (el) {
      setCursorPos(el.selectionStart ?? inputValue.length);
    }
  }

  const isDateAutocomplete =
    acContext?.kind === "schedule" || acContext?.kind === "deadline";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t("commandPalette.title")}</DialogTitle>
        <DialogDescription>
          {t("commandPalette.description")}
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <Command
          shouldFilter={!isAutocompleting}
          className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            ref={inputRef}
            placeholder={t("commandPalette.placeholder")}
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onClick={handleInputClick}
          />
          <div className="text-muted-foreground flex gap-4 border-b px-4 py-1.5 text-xs">
            <span>@project</span>
            <span>#tag</span>
            <span>!schedule</span>
            <span>^deadline</span>
          </div>
          <CommandList>
            {isAutocompleting ? (
              <>
                {isDateAutocomplete ? (
                  <>
                    {filteredDateOptions.length === 0 ? (
                      <CommandEmpty>
                        {acContext.kind === "schedule"
                          ? t("commandPalette.noScheduleOptions")
                          : t("commandPalette.noDeadlineOptions")}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup
                        heading={
                          acContext.kind === "schedule"
                            ? t("commandPalette.schedule")
                            : t("commandPalette.deadline")
                        }
                      >
                        {filteredDateOptions.map((option) => (
                          <CommandItem
                            key={option.keyword}
                            value={option.keyword}
                            onSelect={() =>
                              insertDateKeyword(option.keyword)
                            }
                          >
                            {acContext.kind === "schedule" ? (
                              <CalendarClock className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <span>{option.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                ) : (
                  <>
                    {filteredSuggestions.length === 0 ? (
                      <CommandEmpty>
                        {acContext.kind === "project"
                          ? t("commandPalette.noProjects")
                          : t("commandPalette.noTags")}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup
                        heading={
                          acContext.kind === "project"
                            ? t("commandPalette.projects")
                            : t("commandPalette.tags")
                        }
                      >
                        {filteredSuggestions.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name ?? ""}
                            onSelect={() =>
                              insertSuggestion(item.name ?? "")
                            }
                          >
                            {acContext.kind === "project" ? (
                              <FolderOpen
                                className="h-4 w-4"
                                style={
                                  "color" in item && item.color
                                    ? { color: item.color as string }
                                    : undefined
                                }
                              />
                            ) : (
                              <Tag
                                className="h-4 w-4"
                                style={
                                  "color" in item && item.color
                                    ? { color: item.color as string }
                                    : undefined
                                }
                              />
                            )}
                            <span>{item.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {parsed && parsed.title && (
                  <CommandGroup heading={t("commandPalette.quickAdd")}>
                    <CommandItem
                      value={`__quick_add__ ${inputValue}`}
                      onSelect={handleCreateTodo}
                    >
                      <Plus className="h-4 w-4" />
                      <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        <span className="truncate">{parsed.title}</span>
                        {parsed.projectName && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            <FolderOpen className="h-3 w-3" />
                            {parsed.projectName}
                          </Badge>
                        )}
                        {parsed.tagNames.map((name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="text-xs shrink-0"
                          >
                            <Tag className="h-3 w-3" />
                            {name}
                          </Badge>
                        ))}
                        {parsed.whenDate && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            <Calendar className="h-3 w-3" />
                            {formatDateShort(parsed.whenDate)}
                          </Badge>
                        )}
                        {parsed.whenSomeday && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            <Clock className="h-3 w-3" />
                            {t("todo.someday")}
                          </Badge>
                        )}
                        {parsed.deadline && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {t("todo.due", { date: formatDateShort(parsed.deadline) })}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                <CommandEmpty>{t("commandPalette.noResults")}</CommandEmpty>

                <CommandGroup heading={t("commandPalette.views")}>
                  <CommandItem
                    onSelect={() => handleSelectView({ kind: "inbox" })}
                  >
                    <Inbox className="h-4 w-4" />
                    <span>{t("sidebar.inbox")}</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => handleSelectView({ kind: "today" })}
                  >
                    <Sun className="h-4 w-4" />
                    <span>{t("sidebar.today")}</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => handleSelectView({ kind: "upcoming" })}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>{t("sidebar.upcoming")}</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => handleSelectView({ kind: "someday" })}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{t("sidebar.someday")}</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => handleSelectView({ kind: "logbook" })}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>{t("sidebar.logbook")}</span>
                  </CommandItem>
                </CommandGroup>

                {projects.length > 0 && (
                  <CommandGroup heading={t("commandPalette.projects")}>
                    {projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => handleSelectProject(project.id)}
                      >
                        <FolderOpen
                          className="h-4 w-4"
                          style={
                            project.color
                              ? { color: project.color }
                              : undefined
                          }
                        />
                        <span>{project.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {tags.length > 0 && (
                  <CommandGroup heading={t("commandPalette.tags")}>
                    {tags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => handleSelectTag(tag.id)}
                      >
                        <Tag
                          className="h-4 w-4"
                          style={
                            tag.color ? { color: tag.color } : undefined
                          }
                        />
                        <span>{tag.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {activeTodos.length > 0 && (
                  <CommandGroup heading={t("commandPalette.todos")}>
                    {activeTodos.map((todo) => (
                      <CommandItem
                        key={todo.id}
                        value={`${todo.title ?? ""} ${todo.notes ?? ""}`}
                        onSelect={() => handleSelectTodo(todo.id)}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{todo.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
