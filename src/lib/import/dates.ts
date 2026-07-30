export type DateParseResult =
  | { ok: true; date: Date }
  | { ok: false; reason: string };

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
// Slash-separated dates in this dataset are day-first: DD/MM/YYYY.
const SLASH = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
// Dash-separated (non-ISO) dates are month-first: MM-DD-YYYY. Distinguishable
// from DD/MM because several rows have a second component > 12 (e.g. 08-25-2026).
const DASH = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

export function parseFlexibleDate(raw: string): DateParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "date is missing" };

  let year: number;
  let month: number;
  let day: number;

  let match = trimmed.match(ISO);
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else if ((match = trimmed.match(SLASH))) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  } else if ((match = trimmed.match(DASH))) {
    month = Number(match[1]);
    day = Number(match[2]);
    year = Number(match[3]);
  } else {
    return { ok: false, reason: `unrecognized date format: "${trimmed}"` };
  }

  if (!isRealCalendarDate(year, month, day)) {
    return { ok: false, reason: `"${trimmed}" is not a real calendar date` };
  }

  return { ok: true, date: new Date(Date.UTC(year, month - 1, day)) };
}

const TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export type TimeParseResult =
  | { ok: true; minutesFromMidnight: number; dayOffset: number }
  | { ok: false; reason: string };

/** Parses "HH:mm" optionally suffixed with "+N" (explicit next-day marker, e.g. "10:00+1"). */
export function parseFlexibleTime(raw: string): TimeParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "time is missing" };

  const offsetMatch = trimmed.match(/^(.*?)\+(\d+)$/);
  const timePart = offsetMatch ? offsetMatch[1] : trimmed;
  const dayOffset = offsetMatch ? Number(offsetMatch[2]) : 0;

  const match = timePart.match(TIME);
  if (!match) return { ok: false, reason: `unrecognized time: "${trimmed}"` };

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return { ok: true, minutesFromMidnight: hours * 60 + minutes, dayOffset };
}
