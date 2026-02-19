import { cloneElement, isValidElement, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { PickerDropdown } from "@/components/ui/picker-dropdown";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  Sunset,
  ArrowRight,
  Palmtree,
  Calendar as CalendarIcon,
  Clock,
  Shuffle,
  X,
} from "lucide-react";
import {
  todayStr,
  tomorrowStr,
  thisWeekendStr,
  nextWeekStr,
  randomDateInRange,
  dateToStr,
  strToDate,
} from "@/lib/dates";
import { usePopoverKeyNav } from "@/hooks/usePopoverKeyNav";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/hooks/useSettings";

interface WhenPickerProps {
  value: { date: string | null; someday: boolean; evening?: boolean };
  onChange: (value: { date: string | null; someday: boolean; evening?: boolean }) => void;
  children: React.ReactNode;
  modal?: boolean;
}

export function WhenPicker({ value, onChange, children, modal }: WhenPickerProps) {
  const t = useTranslation();
  const { get } = useSettings();
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { listRef, handleKeyDown } = usePopoverKeyNav(open);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  function close() {
    triggerRef.current?.focus();
    setOpen(false);
    setShowCalendar(false);
  }

  function pick(date: string | null, someday: boolean, evening?: boolean) {
    onChange({ date, someday, evening });
    close();
  }

  function handleCalendarSelect(date: Date | undefined) {
    if (date) {
      pick(dateToStr(date), false);
    }
  }

  const trigger = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => { e.stopPropagation(); open ? close() : setOpen(true); },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? close() : setOpen(true);
          }
        },
      })
    : children;

  function focusCalendarDay() {
    requestAnimationFrame(() => {
      const c = calendarRef.current;
      if (!c) return;
      const target =
        c.querySelector<HTMLElement>('td[data-selected="true"] button') ??
        c.querySelector<HTMLElement>('td[data-today="true"] button');
      target?.focus();
    });
  }

  function handleShowCalendar() {
    setShowCalendar(true);
    requestAnimationFrame(() => focusCalendarDay());
  }

  const dropdownContent = showCalendar ? (
    <div ref={calendarRef}>
      <Calendar
        mode="single"
        selected={value.date ? strToDate(value.date) : undefined}
        onSelect={handleCalendarSelect}
        autoFocus
      />
    </div>
  ) : (
    <div ref={listRef} onKeyDown={handleKeyDown} className="flex flex-col py-1">
      <QuickOption
        icon={<Sun className="h-4 w-4 text-yellow-500" />}
        label={t("picker.today")}
        detail={formatWeekday(todayStr())}
        onClick={() => pick(todayStr(), false)}
      />
      <QuickOption
        icon={<Sunset className="h-4 w-4 text-blue-800 dark:text-blue-400" />}
        label={t("picker.thisEvening")}
        detail={formatWeekday(todayStr())}
        onClick={() => pick(todayStr(), false, true)}
      />
      <QuickOption
        icon={<ArrowRight className="h-4 w-4 text-orange-500" />}
        label={t("picker.tomorrow")}
        detail={formatWeekday(tomorrowStr())}
        onClick={() => pick(tomorrowStr(), false)}
      />
      <QuickOption
        icon={<Palmtree className="h-4 w-4 text-green-500" />}
        label={t("picker.thisWeekend")}
        detail={formatWeekday(thisWeekendStr())}
        onClick={() => pick(thisWeekendStr(), false)}
      />
      <QuickOption
        icon={<CalendarIcon className="h-4 w-4 text-blue-500" />}
        label={t("picker.nextWeek")}
        detail={formatWeekday(nextWeekStr())}
        onClick={() => pick(nextWeekStr(), false)}
      />
      <QuickOption
        icon={<Shuffle className="h-4 w-4 text-purple-500" />}
        label={t("picker.surpriseMe")}
        onClick={() => {
          const range = parseInt(get("surpriseRange") ?? "14", 10);
          pick(randomDateInRange(range), false);
        }}
      />
      <QuickOption
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        label={t("picker.someday")}
        onClick={() => pick(null, true)}
      />
      <Separator className="my-1" />
      <QuickOption
        icon={<CalendarIcon className="h-4 w-4" />}
        label={t("picker.pickDate")}
        onClick={handleShowCalendar}
      />
      {(value.date !== null || value.someday) && (
        <>
          <Separator className="my-1" />
          <QuickOption
            icon={<X className="h-4 w-4 text-destructive" />}
            label={t("picker.clear")}
            onClick={() => pick(null, false)}
          />
        </>
      )}
    </div>
  );

  if (modal) {
    return (
      <div className="relative inline-flex">
        {trigger}
        <PickerDropdown
          open={open}
          onClose={close}
          className="w-auto p-0"
        >
          {dropdownContent}
        </PickerDropdown>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {dropdownContent}
      </PopoverContent>
    </Popover>
  );
}

function QuickOption({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 px-3 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
      onClick={onClick}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
    </button>
  );
}

function formatWeekday(dateStr: string): string {
  const date = strToDate(dateStr);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}
