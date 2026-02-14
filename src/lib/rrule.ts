import { RRule } from "rrule";

// Preset RRULE strings
export const RECURRENCE_PRESETS = [
  { label: "Daily", rule: "FREQ=DAILY" },
  { label: "Weekdays", rule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" },
  { label: "Weekly", rule: "FREQ=WEEKLY" },
  { label: "Monthly", rule: "FREQ=MONTHLY" },
  { label: "Yearly", rule: "FREQ=YEARLY" },
] as const;

/**
 * Get the next occurrence date after the given date.
 * Returns an ISO date string (YYYY-MM-DD) or null if no more occurrences.
 */
export function getNextOccurrence(
  ruleString: string,
  after: Date = new Date(),
): string | null {
  try {
    const rule = RRule.fromString(`DTSTART:${formatRRuleDate(after)}\n${ensureRRulePrefix(ruleString)}`);
    const next = rule.after(after, false);
    if (!next) return null;
    return next.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/**
 * Convert an RRULE string to human-readable text.
 */
export function ruleToText(ruleString: string): string {
  try {
    const rule = RRule.fromString(ensureRRulePrefix(ruleString));
    return rule.toText();
  } catch {
    return ruleString;
  }
}

/**
 * Find which preset matches the given rule string, or null.
 */
export function matchPreset(
  ruleString: string,
): (typeof RECURRENCE_PRESETS)[number] | null {
  const normalized = stripRRulePrefix(ruleString).toUpperCase();
  return (
    RECURRENCE_PRESETS.find(
      (p) => p.rule.toUpperCase() === normalized,
    ) ?? null
  );
}

// --- Custom RRULE builder / parser ---

export interface RRuleOptions {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay?: string[];   // e.g. ["MO", "WE", "FR"]
  count?: number;      // After N occurrences
  until?: string;      // ISO date string (YYYY-MM-DD)
}

export function buildRRule(opts: RRuleOptions): string {
  const parts: string[] = [`FREQ=${opts.freq}`];
  if (opts.interval > 1) {
    parts.push(`INTERVAL=${opts.interval}`);
  }
  if (opts.freq === "WEEKLY" && opts.byDay && opts.byDay.length > 0) {
    parts.push(`BYDAY=${opts.byDay.join(",")}`);
  }
  if (opts.count != null && opts.count > 0) {
    parts.push(`COUNT=${opts.count}`);
  } else if (opts.until) {
    const d = opts.until.replace(/-/g, "");
    parts.push(`UNTIL=${d}T000000Z`);
  }
  return parts.join(";");
}

export function parseRRule(rule: string): RRuleOptions {
  const stripped = stripRRulePrefix(rule).toUpperCase();
  const params = new Map<string, string>();
  for (const part of stripped.split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1) {
      params.set(part.slice(0, eq), part.slice(eq + 1));
    }
  }

  const freq = (params.get("FREQ") ?? "WEEKLY") as RRuleOptions["freq"];
  const interval = params.has("INTERVAL") ? parseInt(params.get("INTERVAL")!, 10) : 1;

  const opts: RRuleOptions = { freq, interval };

  if (params.has("BYDAY")) {
    opts.byDay = params.get("BYDAY")!.split(",");
  }
  if (params.has("COUNT")) {
    opts.count = parseInt(params.get("COUNT")!, 10);
  }
  if (params.has("UNTIL")) {
    const raw = params.get("UNTIL")!;
    // Convert 20260301T000000Z → 2026-03-01
    const dateOnly = raw.replace(/T.*$/, "");
    opts.until = `${dateOnly.slice(0, 4)}-${dateOnly.slice(4, 6)}-${dateOnly.slice(6, 8)}`;
  }

  return opts;
}

function ensureRRulePrefix(s: string): string {
  const stripped = s.replace(/^RRULE:/i, "");
  return `RRULE:${stripped}`;
}

function stripRRulePrefix(s: string): string {
  return s.replace(/^RRULE:/i, "");
}

function formatRRuleDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}T000000Z`;
}
