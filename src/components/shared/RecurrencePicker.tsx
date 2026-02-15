import { cloneElement, isValidElement, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { PickerDropdown } from "@/components/ui/picker-dropdown";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Check, X, Settings2 } from "lucide-react";
import {
  RECURRENCE_PRESETS,
  matchPreset,
  buildRRule,
  parseRRule,
  type RRuleOptions,
} from "@/lib/rrule";
import { usePopoverKeyNav } from "@/hooks/usePopoverKeyNav";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKeys } from "@/i18n/en";

interface RecurrencePickerProps {
  value: string | null;
  onChange: (rule: string | null) => void;
  children: React.ReactNode;
  modal?: boolean;
}

const FREQ_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
const FREQ_LABEL_KEYS: Record<RRuleOptions["freq"], TranslationKeys> = {
  DAILY: "recurrence.days",
  WEEKLY: "recurrence.weeks",
  MONTHLY: "recurrence.months",
  YEARLY: "recurrence.years",
};
const WEEKDAYS = [
  { key: "MO", label: "Mo" },
  { key: "TU", label: "Tu" },
  { key: "WE", label: "We" },
  { key: "TH", label: "Th" },
  { key: "FR", label: "Fr" },
  { key: "SA", label: "Sa" },
  { key: "SU", label: "Su" },
];

type EndType = "never" | "count" | "until";

function strToDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function RecurrencePicker({
  value,
  onChange,
  children,
  modal,
}: RecurrencePickerProps) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const { listRef, handleKeyDown: handleListKeyDown } = usePopoverKeyNav(open && !showCustom);
  const triggerRef = useRef<HTMLElement>(null);

  // Custom form state
  const [freq, setFreq] = useState<RRuleOptions["freq"]>("WEEKLY");
  const [interval, setInterval] = useState(1);
  const [byDay, setByDay] = useState<string[]>([]);
  const [endType, setEndType] = useState<EndType>("never");
  const [count, setCount] = useState(10);
  const [until, setUntil] = useState("");
  const [showUntilCalendar, setShowUntilCalendar] = useState(false);

  const currentPreset = value ? matchPreset(value) : null;

  function close() {
    triggerRef.current?.focus();
    setOpen(false);
    setShowCustom(false);
    setShowUntilCalendar(false);
  }

  function pick(rule: string | null) {
    onChange(rule);
    close();
  }

  function openCustom() {
    // Pre-fill from existing value if it's a custom rule
    if (value && !matchPreset(value)) {
      const opts = parseRRule(value);
      setFreq(opts.freq);
      setInterval(opts.interval);
      setByDay(opts.byDay ?? []);
      if (opts.count != null) {
        setEndType("count");
        setCount(opts.count);
      } else if (opts.until) {
        setEndType("until");
        setUntil(opts.until);
      } else {
        setEndType("never");
      }
    } else {
      setFreq("WEEKLY");
      setInterval(1);
      setByDay([]);
      setEndType("never");
      setCount(10);
      setUntil("");
    }
    setShowUntilCalendar(false);
    setShowCustom(true);
  }

  function handleSave() {
    const opts: RRuleOptions = { freq, interval };
    if (freq === "WEEKLY" && byDay.length > 0) {
      opts.byDay = byDay;
    }
    if (endType === "count") {
      opts.count = count;
    } else if (endType === "until" && until) {
      opts.until = until;
    }
    pick(buildRRule(opts));
  }

  function toggleDay(day: string) {
    setByDay((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
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

  const customForm = (
    <div className="flex flex-col gap-3 p-3">
      {/* Frequency + Interval */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("recurrence.every")}</span>
        <input
          type="number"
          min={1}
          max={99}
          value={interval}
          onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
          className="h-8 w-14 rounded-md border border-input bg-transparent px-2 text-center text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        />
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value as RRuleOptions["freq"])}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        >
          {FREQ_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {t(FREQ_LABEL_KEYS[f])}
            </option>
          ))}
        </select>
      </div>

      {/* Weekday toggles (only for WEEKLY) */}
      {freq === "WEEKLY" && (
        <div className="flex flex-wrap gap-1">
          {WEEKDAYS.map((wd) => (
            <button
              key={wd.key}
              type="button"
              onClick={() => toggleDay(wd.key)}
              className={`flex h-8 w-9 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                byDay.includes(wd.key)
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-transparent hover:bg-accent"
              }`}
            >
              {wd.label}
            </button>
          ))}
        </div>
      )}

      {/* End options */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("recurrence.ends")}</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="end-type"
            checked={endType === "never"}
            onChange={() => { setEndType("never"); setShowUntilCalendar(false); }}
            className="h-3.5 w-3.5 shrink-0 accent-primary"
          />
          {t("recurrence.never")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="end-type"
            checked={endType === "count"}
            onChange={() => { setEndType("count"); setShowUntilCalendar(false); }}
            className="h-3.5 w-3.5 shrink-0 accent-primary"
          />
          {t("recurrence.after")}
          <input
            type="number"
            min={1}
            max={999}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={endType !== "count"}
            className="h-7 w-14 rounded-md border border-input bg-transparent px-2 text-center text-sm shadow-xs disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
          />
          {t("recurrence.times")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="end-type"
            checked={endType === "until"}
            onChange={() => setEndType("until")}
            className="h-3.5 w-3.5 shrink-0 accent-primary"
          />
          {t("recurrence.on")}
          <button
            type="button"
            disabled={endType !== "until"}
            onClick={() => setShowUntilCalendar((v) => !v)}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs disabled:opacity-50 hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
          >
            {until || t("recurrence.pickDate")}
          </button>
        </label>
        {showUntilCalendar && endType === "until" && (
          <Calendar
            mode="single"
            selected={until ? strToDate(until) : undefined}
            onSelect={(date) => {
              if (date) {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setUntil(`${y}-${m}-${d}`);
              }
              setShowUntilCalendar(false);
            }}
            autoFocus
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => { setShowCustom(false); setShowUntilCalendar(false); }}
          className="h-8 rounded-md px-3 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        >
          {t("recurrence.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          {t("recurrence.save")}
        </button>
      </div>
    </div>
  );

  const presetList = (
    <div ref={listRef} onKeyDown={handleListKeyDown} className="flex flex-col py-1">
      {RECURRENCE_PRESETS.map((preset) => (
        <button
          key={preset.rule}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          onClick={() => pick(preset.rule)}
        >
          <span className="flex-1 text-left">{preset.label}</span>
          {currentPreset?.rule === preset.rule && (
            <Check className="h-3.5 w-3.5 text-primary" />
          )}
        </button>
      ))}
      <Separator className="my-1" />
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        onClick={openCustom}
      >
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">{t("recurrence.custom")}</span>
        {value && !currentPreset && value !== null && (
          <Check className="h-3.5 w-3.5 text-primary" />
        )}
      </button>
      {value !== null && (
        <>
          <Separator className="my-1" />
          <button
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => pick(null)}
          >
            <X className="h-4 w-4" />
            {t("recurrence.noRepeat")}
          </button>
        </>
      )}
    </div>
  );

  const dropdownContent = showCustom ? customForm : presetList;
  const dropdownWidth = showCustom ? "w-72" : "w-48";

  if (modal) {
    return (
      <div className="relative inline-flex">
        {trigger}
        <PickerDropdown
          open={open}
          onClose={close}
          className={`${dropdownWidth} p-0`}
        >
          {dropdownContent}
        </PickerDropdown>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={(v) => { if (!v) close(); else setOpen(true); }}>
      <PopoverAnchor asChild>{trigger}</PopoverAnchor>
      <PopoverContent className={`${dropdownWidth} p-0`} align="start">
        {dropdownContent}
      </PopoverContent>
    </Popover>
  );
}
