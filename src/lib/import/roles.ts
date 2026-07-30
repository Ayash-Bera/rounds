import type { Profession } from "@/generated/prisma/enums";

const DOCTOR_SYNONYMS = new Set(["doctor", "physician", "md", "dr"]);
const NURSE_SYNONYMS = new Set(["nurse", "rn", "registered nurse"]);
const RECEPTIONIST_SYNONYMS = new Set([
  "receptionist",
  "reception",
  "recep",
  "front desk",
]);

/** Trims, lowercases, collapses whitespace, and strips trailing punctuation for matching. */
export function cleanRoleToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\.+$/, "")
    .replace(/\s+/g, " ");
}

export function normalizeProfession(raw: string): Profession | null {
  const cleaned = cleanRoleToken(raw);
  if (DOCTOR_SYNONYMS.has(cleaned)) return "DOCTOR";
  if (NURSE_SYNONYMS.has(cleaned)) return "NURSE";
  if (RECEPTIONIST_SYNONYMS.has(cleaned)) return "RECEPTIONIST";
  return null;
}
