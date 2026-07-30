import type { Profession } from "@/generated/prisma/enums";
import type { RequirementMap } from "@/lib/import/types";

const LABELS: Record<Profession, { singular: string; plural: string }> = {
  DOCTOR: { singular: "doctor", plural: "doctors" },
  NURSE: { singular: "nurse", plural: "nurses" },
  RECEPTIONIST: { singular: "receptionist", plural: "receptionists" },
};

export function professionLabel(profession: Profession): string {
  return LABELS[profession].singular;
}

export function professionLabelPlural(profession: Profession): string {
  return LABELS[profession].plural;
}

export function formatRequirements(requirements: RequirementMap): string {
  const parts = (Object.keys(requirements) as Profession[])
    .filter((p) => requirements[p] > 0)
    .map((p) => `${requirements[p]} ${requirements[p] === 1 ? LABELS[p].singular : LABELS[p].plural}`);
  return parts.length ? parts.join(", ") : "no staff required";
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
