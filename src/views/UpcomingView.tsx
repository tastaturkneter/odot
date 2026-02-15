import { useState } from "react";
import { useQuery } from "@evolu/react";
import { allTodos } from "@/db/queries";
import { filterUpcoming } from "@/lib/filters";
import { todayStr, tomorrowStr, formatDateLabel, strToDate, dateToStr } from "@/lib/dates";
import type { TodoRow } from "@/db/queries";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { TodoList } from "@/components/todo/TodoList";
import { NewTodoModal } from "@/components/todo/NewTodoModal";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Calendar } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [7, 14, 30] as const;

type DaySlot =
  | { type: "day"; dateKey: string; todos: TodoRow[] }
  | { type: "empty-range"; from: string; to: string };

function buildDaySlots(todos: TodoRow[], daysAhead: number): DaySlot[] {
  const groups = new Map<string, TodoRow[]>();
  for (const todo of todos) {
    const dateKey = todo.whenDate ?? "No date";
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(todo);
  }

  const today = strToDate(todayStr());
  const raw: [string, TodoRow[]][] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = dateToStr(d);
    raw.push([key, groups.get(key) ?? []]);
  }

  const slots: DaySlot[] = [];
  let emptyStart: string | null = null;
  let emptyEnd: string | null = null;

  for (const [dateKey, dateTodos] of raw) {
    if (dateTodos.length === 0) {
      if (!emptyStart) emptyStart = dateKey;
      emptyEnd = dateKey;
    } else {
      if (emptyStart) {
        slots.push({ type: "empty-range", from: emptyStart, to: emptyEnd! });
        emptyStart = null;
        emptyEnd = null;
      }
      slots.push({ type: "day", dateKey, todos: dateTodos });
    }
  }
  if (emptyStart) {
    slots.push({ type: "empty-range", from: emptyStart, to: emptyEnd! });
  }

  return slots;
}

function emptyRangeLabel(from: string, to: string): string {
  if (from === to) return formatDateLabel(from);
  return `${formatDateLabel(from)} – ${formatDateLabel(to)}`;
}

export function UpcomingView() {
  const t = useTranslation();
  const { newModalOpen, setNewModalOpen } = useActiveView();
  const [showCompleted, setShowCompleted] = useState(false);
  const { get, set } = useSettings();
  const todos = useQuery(allTodos);

  const savedRange = get("upcomingRange");
  const daysAhead = savedRange ? parseInt(savedRange, 10) : 7;
  const filtered = filterUpcoming([...todos], daysAhead, showCompleted);
  const slots = buildDaySlots(filtered, daysAhead);

  return (
    <div>
      <ViewHeader title={t("sidebar.upcoming")} icon={<Calendar className="h-6 w-6" style={{ color: "#ef4444" }} />}>
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          {RANGE_OPTIONS.map((days) => (
            <button
              key={days}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                daysAhead === days
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => set("upcomingRange", String(days))}
            >
              {days}d
            </button>
          ))}
        </div>
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
      <div className="space-y-1">
        {slots.map((slot) =>
          slot.type === "day" ? (
            <div key={slot.dateKey}>
              <h3 className="flex items-center gap-2 px-2 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDateLabel(slot.dateKey)}
                <span className="h-px flex-1 bg-border" />
              </h3>
              <TodoList todos={slot.todos} />
            </div>
          ) : (
            <div key={slot.from} className="flex items-center gap-2 px-2 pt-3 pb-1">
              <span className="text-xs italic text-muted-foreground/50">
                {emptyRangeLabel(slot.from, slot.to)}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          ),
        )}
      </div>
      <NewTodoModal
        open={newModalOpen}
        onOpenChange={setNewModalOpen}
        nextPosition={todos.length}
        defaults={{ whenDate: tomorrowStr() }}
      />
    </div>
  );
}
