import { parseFlexibleDate, parseFlexibleTime } from "./dates";
import type { NormalizedShiftRow, RequirementMap, RowOutcome } from "./types";

export type ShiftCsvRow = {
  shift_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  requirements?: string;
};

export type SeenShift = { raw: ShiftCsvRow };

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

const KEY_VALUE = /^[a-zA-Z]+\s*=\s*\d+(\s*;\s*[a-zA-Z]+\s*=\s*\d+)*$/;

function parseKeyValueRequirements(raw: string): RequirementMap | null {
  if (!KEY_VALUE.test(raw.trim())) return null;
  const result: RequirementMap = { DOCTOR: 0, NURSE: 0, RECEPTIONIST: 0 };
  for (const part of raw.split(";")) {
    const [keyRaw, valRaw] = part.split("=");
    const key = keyRaw.trim().toLowerCase();
    const value = Number(valRaw.trim());
    if (key.startsWith("doctor")) result.DOCTOR = value;
    else if (key.startsWith("nurse")) result.NURSE = value;
    else if (key.startsWith("recep")) result.RECEPTIONIST = value;
    else return null;
  }
  return result;
}

/** Best-effort word-to-number parse for free-text requirements like "two nurses and a doctor". */
function parseFreeTextRequirements(raw: string): RequirementMap | null {
  const text = raw.toLowerCase();
  const result: RequirementMap = { DOCTOR: 0, NURSE: 0, RECEPTIONIST: 0 };
  let matchedAny = false;
  const specs: [RegExp, keyof RequirementMap][] = [
    [/(\d+|[a-z]+)\s+doctors?/g, "DOCTOR"],
    [/(\d+|[a-z]+)\s+nurses?/g, "NURSE"],
    [/(\d+|[a-z]+)\s+receptionists?/g, "RECEPTIONIST"],
  ];
  for (const [pattern, profession] of specs) {
    for (const m of text.matchAll(pattern)) {
      const token = m[1];
      const n = /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS[token];
      if (n !== undefined) {
        result[profession] += n;
        matchedAny = true;
      }
    }
  }
  return matchedAny ? result : null;
}

const MAX_SHIFT_MINUTES = 16 * 60;

export function normalizeShiftRow(
  row: ShiftCsvRow,
  seen: Map<string, SeenShift>
): RowOutcome<NormalizedShiftRow> & { dedupeKey?: string } {
  const shiftKey = (row.shift_id ?? "").trim();
  if (!shiftKey) {
    return { status: "REJECTED", reason: "missing shift_id" };
  }

  const dateResult = parseFlexibleDate(row.date ?? "");
  if (!dateResult.ok) {
    return { status: "REJECTED", reason: dateResult.reason };
  }

  const startRaw = (row.start_time ?? "").trim();
  const endRaw = (row.end_time ?? "").trim();

  const start = parseFlexibleTime(startRaw);
  if (!start.ok) return { status: "REJECTED", reason: `start_time: ${start.reason}` };
  const end = parseFlexibleTime(endRaw);
  if (!end.ok) return { status: "REJECTED", reason: `end_time: ${end.reason}` };

  if (startRaw === endRaw) {
    return { status: "REJECTED", reason: "zero-length shift (start time equals end time)" };
  }

  const startTotal = start.minutesFromMidnight + start.dayOffset * 1440;
  let endTotal = end.minutesFromMidnight + end.dayOffset * 1440;
  const overnight = endTotal <= startTotal;
  if (overnight) endTotal += 1440;

  const durationMinutes = endTotal - startTotal;
  if (durationMinutes > MAX_SHIFT_MINUTES) {
    return {
      status: "REJECTED",
      reason: `shift duration of ${(durationMinutes / 60).toFixed(1)}h exceeds the plausible limit (16h)`,
    };
  }

  const requirementsRaw = row.requirements ?? "";
  let requirements = parseKeyValueRequirements(requirementsRaw);
  let usedFreeTextParse = false;
  if (!requirements) {
    requirements = parseFreeTextRequirements(requirementsRaw);
    usedFreeTextParse = true;
  }
  if (!requirements) {
    return {
      status: "REJECTED",
      reason: `could not parse staffing requirements: "${requirementsRaw}"`,
    };
  }
  if (requirements.DOCTOR === 0 && requirements.NURSE === 0 && requirements.RECEPTIONIST === 0) {
    return { status: "REJECTED", reason: "requirements are all zero — shift needs nobody" };
  }

  const normalized: NormalizedShiftRow = {
    shiftKey,
    date: dateResult.date,
    startTime: startRaw.replace(/\+\d+$/, ""),
    endTime: endRaw.replace(/\+\d+$/, ""),
    overnight,
    requirements,
  };

  const existing = seen.get(shiftKey);
  if (existing) {
    const sameData =
      existing.raw.date === row.date &&
      existing.raw.start_time === row.start_time &&
      existing.raw.end_time === row.end_time &&
      existing.raw.requirements === row.requirements;
    if (sameData) {
      return {
        status: "MERGED",
        data: normalized,
        reason: `duplicate of already-imported shift_id ${shiftKey} (identical data) — skipped`,
        resultingKey: shiftKey,
        dedupeKey: shiftKey,
      };
    }
    return {
      status: "REJECTED",
      reason: `shift_id ${shiftKey} already used with different data — cannot resolve automatically`,
    };
  }

  if (usedFreeTextParse) {
    return {
      status: "MERGED",
      data: normalized,
      reason: `interpreted free-text requirements "${requirementsRaw}" as ${JSON.stringify(requirements)}`,
      dedupeKey: shiftKey,
    };
  }

  return { status: "ACCEPTED", data: normalized, dedupeKey: shiftKey };
}
