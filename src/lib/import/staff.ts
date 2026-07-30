import { normalizeProfession } from "./roles";
import type { NormalizedStaffRow, RowOutcome } from "./types";

export type StaffCsvRow = {
  staff_id?: string;
  full_name?: string;
  role?: string;
  email?: string;
};

export type SeenStaff = { fullName: string };

function cleanEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Repairs the "name(at)domain" obfuscation seen in the dirty export. */
function repairEmail(raw: string): string | null {
  if (!raw.includes("(at)")) return null;
  const repaired = raw.replace(/\(at\)/g, "@");
  return looksLikeEmail(repaired) ? repaired : null;
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase().replace(/\s+/g, " ") === b.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Normalizes one staff.csv row. `seen` is keyed by normalized email and is
 * mutated by the caller (not here) once a row is accepted, so the same map
 * can be threaded across every row in the file in order.
 */
export function normalizeStaffRow(
  row: StaffCsvRow,
  seen: Map<string, SeenStaff>
): RowOutcome<NormalizedStaffRow> & { dedupeKey?: string } {
  const fullName = (row.full_name ?? "").trim().replace(/\s+/g, " ");
  if (!fullName) {
    return { status: "REJECTED", reason: "missing full_name" };
  }

  const professionRaw = row.role ?? "";
  const profession = normalizeProfession(professionRaw);
  if (!profession) {
    return {
      status: "REJECTED",
      reason: `unrecognized profession: "${professionRaw.trim()}"`,
    };
  }

  const emailRaw = (row.email ?? "").trim();
  if (!emailRaw) {
    return { status: "REJECTED", reason: "missing email (required to provision a login)" };
  }

  let email = cleanEmail(emailRaw);
  let wasRepaired = false;
  if (!looksLikeEmail(email)) {
    const repaired = repairEmail(emailRaw);
    if (!repaired) {
      return { status: "REJECTED", reason: `malformed email address: "${emailRaw}"` };
    }
    email = cleanEmail(repaired);
    wasRepaired = true;
  }

  const existing = seen.get(email);
  if (existing) {
    if (sameName(existing.fullName, fullName)) {
      return {
        status: "MERGED",
        data: { fullName, email, profession },
        reason: `duplicate of an already-imported row with the same email (${email}) — skipped`,
        resultingKey: email,
        dedupeKey: email,
      };
    }
    return {
      status: "REJECTED",
      reason: `email ${email} is already used by "${existing.fullName}" — ambiguous identity, skipped`,
    };
  }

  if (wasRepaired) {
    return {
      status: "MERGED",
      data: { fullName, email, profession },
      reason: `repaired obfuscated email "${emailRaw}" -> "${email}"`,
      dedupeKey: email,
    };
  }

  return { status: "ACCEPTED", data: { fullName, email, profession }, dedupeKey: email };
}
