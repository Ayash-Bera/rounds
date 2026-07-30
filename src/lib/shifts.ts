import { prisma } from "@/lib/db";
import type { RequirementMap } from "@/lib/import/types";

export type ShiftInput = {
  date: Date;
  startTime: string;
  endTime: string;
  requirements: RequirementMap;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function computeOvernight(startTime: string, endTime: string): boolean {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em <= sh * 60 + sm;
}

export function validateShiftInput(input: {
  startTime: string;
  endTime: string;
  requirements: RequirementMap;
}): string | null {
  if (!TIME_RE.test(input.startTime)) return "Start time must be in HH:mm format.";
  if (!TIME_RE.test(input.endTime)) return "End time must be in HH:mm format.";
  if (input.startTime === input.endTime) return "Start and end time can't be the same.";

  const total = input.requirements.DOCTOR + input.requirements.NURSE + input.requirements.RECEPTIONIST;
  if (total <= 0) return "At least one role must be required.";
  if (Object.values(input.requirements).some((n) => n < 0 || !Number.isInteger(n))) {
    return "Requirements must be whole numbers, zero or more.";
  }
  return null;
}

export async function createShift(input: ShiftInput, createdById: string) {
  return prisma.shift.create({
    data: {
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      overnight: computeOvernight(input.startTime, input.endTime),
      requirements: input.requirements,
      createdById,
    },
  });
}

export async function updateShift(shiftId: string, input: ShiftInput) {
  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      overnight: computeOvernight(input.startTime, input.endTime),
      requirements: input.requirements,
    },
  });
}

export async function deleteShift(shiftId: string) {
  await prisma.shift.delete({ where: { id: shiftId } });
}

export type RecurringSeriesInput = {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  requirements: RequirementMap;
  seriesStart: Date;
  seriesEnd: Date;
};

export function generateOccurrenceDates(daysOfWeek: number[], seriesStart: Date, seriesEnd: Date): Date[] {
  const dates: Date[] = [];
  const daySet = new Set(daysOfWeek);
  const cursor = new Date(seriesStart);
  while (cursor.getTime() <= seriesEnd.getTime()) {
    if (daySet.has(cursor.getUTCDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// A weekly recurrence capped at five years of occurrences is a sane safety limit
// against a manager fat-fingering a far-future end date and generating millions of rows.
const MAX_SERIES_OCCURRENCES = 260;

export async function createRecurringSeries(input: RecurringSeriesInput, createdById: string) {
  const dates = generateOccurrenceDates(input.daysOfWeek, input.seriesStart, input.seriesEnd);
  if (dates.length === 0) {
    throw new Error("This recurrence pattern doesn't produce any occurrences in the given date range.");
  }
  if (dates.length > MAX_SERIES_OCCURRENCES) {
    throw new Error(
      `This recurrence would create ${dates.length} shifts, above the ${MAX_SERIES_OCCURRENCES}-shift safety cap.`
    );
  }

  const overnight = computeOvernight(input.startTime, input.endTime);

  return prisma.$transaction(async (tx) => {
    const series = await tx.shiftSeries.create({
      data: {
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        requirements: input.requirements,
        seriesStart: input.seriesStart,
        seriesEnd: input.seriesEnd,
        createdById,
      },
    });

    await tx.shift.createMany({
      data: dates.map((date) => ({
        date,
        startTime: input.startTime,
        endTime: input.endTime,
        overnight,
        requirements: input.requirements,
        seriesId: series.id,
        createdById,
      })),
    });

    return series;
  });
}

export async function deleteSeries(seriesId: string) {
  await prisma.$transaction([
    prisma.shift.deleteMany({ where: { seriesId } }),
    prisma.shiftSeries.delete({ where: { id: seriesId } }),
  ]);
}
