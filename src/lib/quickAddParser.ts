import {
  todayStr,
  tomorrowStr,
  thisWeekendStr,
  nextWeekStr,
  dateToStr,
} from "@/lib/dates";

export interface ParsedQuickAdd {
  title: string;
  projectId: string | null;
  projectName: string | null;
  tagIds: string[];
  tagNames: string[];
  whenDate: string | null;
  whenSomeday: boolean;
  whenEvening: boolean;
  deadline: string | null;
}

interface NamedItem {
  id: string;
  name: string | null;
}

function nextDayOfWeek(dayIndex: number): string {
  const d = new Date();
  const current = d.getDay();
  let diff = dayIndex - current;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return dateToStr(d);
}

const dayNames: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function parseShortDate(
  input: string,
  dateFormat: "day-first" | "month-first",
): string | null {
  const m = /^(\d{1,2})[.\-](\d{1,2})\.?$/.exec(input);
  if (!m) return null;

  const first = m[1];
  const second = m[2];
  const [day, month] =
    dateFormat === "day-first" ? [first, second] : [second, first];

  const dd = day.padStart(2, "0");
  const mm = month.padStart(2, "0");
  const yyyy = new Date().getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function parseScheduleKeyword(
  keyword: string,
  dateFormat: "day-first" | "month-first" = "day-first",
): { whenDate: string | null; whenSomeday: boolean; whenEvening: boolean } | null {
  const lower = keyword.toLowerCase();
  if (lower === "tonight" || lower === "evening")
    return { whenDate: todayStr(), whenSomeday: false, whenEvening: true };
  if (lower === "today")
    return { whenDate: todayStr(), whenSomeday: false, whenEvening: false };
  if (lower === "tomorrow")
    return { whenDate: tomorrowStr(), whenSomeday: false, whenEvening: false };
  if (lower === "weekend")
    return { whenDate: thisWeekendStr(), whenSomeday: false, whenEvening: false };
  if (lower === "nextweek")
    return { whenDate: nextWeekStr(), whenSomeday: false, whenEvening: false };
  if (lower === "someday") return { whenDate: null, whenSomeday: true, whenEvening: false };
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower))
    return { whenDate: lower, whenSomeday: false, whenEvening: false };
  const shortDate = parseShortDate(keyword, dateFormat);
  if (shortDate) return { whenDate: shortDate, whenSomeday: false, whenEvening: false };
  return null;
}

function parseDeadlineKeyword(
  keyword: string,
  dateFormat: "day-first" | "month-first" = "day-first",
): string | null {
  const lower = keyword.toLowerCase();
  if (lower === "today") return todayStr();
  if (lower === "tomorrow") return tomorrowStr();
  if (dayNames[lower] !== undefined) return nextDayOfWeek(dayNames[lower]);
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) return lower;
  const shortDate = parseShortDate(keyword, dateFormat);
  if (shortDate) return shortDate;
  return null;
}

export function parseQuickAdd(
  input: string,
  projects: NamedItem[],
  tags: NamedItem[],
  dateFormat: "day-first" | "month-first" = "day-first",
): ParsedQuickAdd {
  let text = input;

  const result: ParsedQuickAdd = {
    title: "",
    projectId: null,
    projectName: null,
    tagIds: [],
    tagNames: [],
    whenDate: null,
    whenSomeday: false,
    whenEvening: false,
    deadline: null,
  };

  // 1. Extract !schedule keywords (!today, !tomorrow, !weekend, !nextweek, !someday)
  const scheduleRe = /!(\S+)/g;
  let scheduleMatch: RegExpExecArray | null;
  while ((scheduleMatch = scheduleRe.exec(text)) !== null) {
    const parsed = parseScheduleKeyword(scheduleMatch[1], dateFormat);
    if (parsed) {
      result.whenDate = parsed.whenDate;
      result.whenSomeday = parsed.whenSomeday;
      result.whenEvening = parsed.whenEvening;
      text =
        text.slice(0, scheduleMatch.index) +
        text.slice(scheduleMatch.index + scheduleMatch[0].length);
      break;
    }
  }

  // 2. Extract ^deadline keywords (^today, ^tomorrow, ^monday..^sunday, ^YYYY-MM-DD)
  const deadlineRe = /\^(\S+)/g;
  let deadlineMatch: RegExpExecArray | null;
  while ((deadlineMatch = deadlineRe.exec(text)) !== null) {
    const parsed = parseDeadlineKeyword(deadlineMatch[1], dateFormat);
    if (parsed) {
      result.deadline = parsed;
      text =
        text.slice(0, deadlineMatch.index) +
        text.slice(deadlineMatch.index + deadlineMatch[0].length);
      break;
    }
  }

  // 3. Extract @Project / @"Multi Word"
  const projectRe = /@"([^"]+)"|@(\S+)/g;
  let projectMatch: RegExpExecArray | null;
  while ((projectMatch = projectRe.exec(text)) !== null) {
    const name = projectMatch[1] ?? projectMatch[2];
    const match = projects.find(
      (p) => p.name?.toLowerCase() === name.toLowerCase(),
    );
    if (match) {
      result.projectId = match.id;
      result.projectName = match.name;
      text =
        text.slice(0, projectMatch.index) +
        text.slice(projectMatch.index + projectMatch[0].length);
      break; // first match wins
    }
  }

  // 4. Extract #Tag / #"Multi Word"
  const tagRe = /#"([^"]+)"|#(\S+)/g;
  let tagMatch: RegExpExecArray | null;
  const tagMatches: { name: string; start: number; length: number }[] = [];
  while ((tagMatch = tagRe.exec(text)) !== null) {
    const name = tagMatch[1] ?? tagMatch[2];
    const match = tags.find(
      (t) => t.name?.toLowerCase() === name.toLowerCase(),
    );
    if (match && !result.tagIds.includes(match.id)) {
      result.tagIds.push(match.id);
      result.tagNames.push(match.name ?? name);
      tagMatches.push({
        name,
        start: tagMatch.index,
        length: tagMatch[0].length,
      });
    }
  }
  // Remove tag tokens from text in reverse order to preserve indices
  for (let i = tagMatches.length - 1; i >= 0; i--) {
    const m = tagMatches[i];
    text = text.slice(0, m.start) + text.slice(m.start + m.length);
  }

  // 5. Remaining text → title
  result.title = text.replace(/\s+/g, " ").trim();

  return result;
}
