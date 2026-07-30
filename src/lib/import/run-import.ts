import Papa from "papaparse";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { normalizeStaffRow, type StaffCsvRow, type SeenStaff } from "./staff";
import { normalizeShiftRow, type ShiftCsvRow, type SeenShift } from "./shifts";

/** Shared demo password for every account created via CSV import — documented in the README. */
export const SEEDED_PASSWORD = "rounds123!";

function toJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value));
}

export async function importStaffCsv(
  csvText: string,
  source: "SEED" | "UPLOAD",
  filename?: string
) {
  const batch = await prisma.importBatch.create({ data: { source, filename } });
  const parsed = Papa.parse<StaffCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const seen = new Map<string, SeenStaff>();
  const passwordHash = await bcrypt.hash(SEEDED_PASSWORD, 10);

  let accepted = 0;
  for (const row of parsed.data) {
    const outcome = normalizeStaffRow(row, seen);

    if (outcome.status === "REJECTED") {
      await prisma.importLogRow.create({
        data: {
          batchId: batch.id,
          entityType: "STAFF",
          status: "REJECTED",
          rawRow: toJson(row),
          reason: outcome.reason,
        },
      });
      continue;
    }

    if (outcome.status === "MERGED" && outcome.resultingKey) {
      const existingUser = await prisma.user.findUnique({
        where: { email: outcome.resultingKey },
      });
      await prisma.importLogRow.create({
        data: {
          batchId: batch.id,
          entityType: "STAFF",
          status: "MERGED",
          rawRow: toJson(row),
          reason: outcome.reason,
          resultingId: existingUser?.id,
        },
      });
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: outcome.data.email },
      update: {},
      create: {
        email: outcome.data.email,
        fullName: outcome.data.fullName,
        role: "STAFF",
        profession: outcome.data.profession,
        passwordHash,
      },
    });
    if (outcome.dedupeKey) {
      seen.set(outcome.dedupeKey, { fullName: outcome.data.fullName });
    }
    accepted++;
    await prisma.importLogRow.create({
      data: {
        batchId: batch.id,
        entityType: "STAFF",
        status: outcome.status,
        rawRow: toJson(row),
        reason: outcome.reason,
        resultingId: user.id,
      },
    });
  }

  return { batchId: batch.id, accepted, total: parsed.data.length };
}

export async function importShiftsCsv(
  csvText: string,
  source: "SEED" | "UPLOAD",
  filename?: string,
  createdById?: string
) {
  const batch = await prisma.importBatch.create({ data: { source, filename } });
  const parsed = Papa.parse<ShiftCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  const seen = new Map<string, SeenShift>();
  const createdIds = new Map<string, string>();

  let accepted = 0;
  for (const row of parsed.data) {
    const outcome = normalizeShiftRow(row, seen);

    if (outcome.status === "REJECTED") {
      await prisma.importLogRow.create({
        data: {
          batchId: batch.id,
          entityType: "SHIFT",
          status: "REJECTED",
          rawRow: toJson(row),
          reason: outcome.reason,
        },
      });
      continue;
    }

    if (outcome.status === "MERGED" && outcome.resultingKey) {
      await prisma.importLogRow.create({
        data: {
          batchId: batch.id,
          entityType: "SHIFT",
          status: "MERGED",
          rawRow: toJson(row),
          reason: outcome.reason,
          resultingId: createdIds.get(outcome.resultingKey),
        },
      });
      continue;
    }

    const shift = await prisma.shift.create({
      data: {
        date: outcome.data.date,
        startTime: outcome.data.startTime,
        endTime: outcome.data.endTime,
        overnight: outcome.data.overnight,
        requirements: outcome.data.requirements,
        createdById,
      },
    });
    if (outcome.dedupeKey) {
      seen.set(outcome.dedupeKey, { raw: row });
      createdIds.set(outcome.dedupeKey, shift.id);
    }
    accepted++;
    await prisma.importLogRow.create({
      data: {
        batchId: batch.id,
        entityType: "SHIFT",
        status: outcome.status,
        rawRow: toJson(row),
        reason: outcome.reason,
        resultingId: shift.id,
      },
    });
  }

  return { batchId: batch.id, accepted, total: parsed.data.length };
}
