export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function thisWeekendStr(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = day === 0 ? 6 : 6 - day;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().slice(0, 10);
}

export function nextWeekStr(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMon = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMon);
  return d.toISOString().slice(0, 10);
}

export function dateToStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function strToDate(str: string): Date {
  return new Date(str + "T00:00:00");
}

export function formatDateShort(dateStr: string): string {
  const today = todayStr();
  const tomorrow = tomorrowStr();

  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";

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
  return d.toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr: string): string {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const tomorrow = tomorrowStr();

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  if (dateStr === tomorrow) return "Tomorrow";

  const date = strToDate(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
