export function dateToStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return dateToStr(new Date());
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateToStr(d);
}

export function thisWeekendStr(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = day === 0 ? 6 : 6 - day;
  d.setDate(d.getDate() + daysUntilSat);
  return dateToStr(d);
}

export function nextWeekStr(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMon = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMon);
  return dateToStr(d);
}

export function strToDate(str: string): Date {
  return new Date(str + "T00:00:00");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFn = (key: any) => string;

export function formatDateShort(
  dateStr: string,
  t?: TranslateFn,
  evening?: boolean,
): string {
  const today = todayStr();
  const tomorrow = tomorrowStr();

  if (dateStr === today && evening && t) return t("dates.thisEvening");
  if (dateStr === today) return t ? t("dates.today") : "Today";
  if (dateStr === tomorrow) return t ? t("dates.tomorrow") : "Tomorrow";

  const date = strToDate(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(dateStr: string): boolean {
  return dateStr < todayStr();
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateToStr(d);
}

export function randomDateInRange(days: number): string {
  const d = new Date();
  const offset = Math.floor(Math.random() * days) + 1;
  d.setDate(d.getDate() + offset);
  return dateToStr(d);
}

export function formatDateLabel(dateStr: string, t?: TranslateFn): string {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const tomorrow = tomorrowStr();

  if (dateStr === today) return t ? t("dates.today") : "Today";
  if (dateStr === yesterday) return t ? t("dates.yesterday") : "Yesterday";
  if (dateStr === tomorrow) return t ? t("dates.tomorrow") : "Tomorrow";

  const date = strToDate(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
