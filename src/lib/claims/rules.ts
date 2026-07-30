import type { Profession } from "@/generated/prisma/enums";
import type { RequirementMap } from "@/lib/import/types";

export type ShiftTimeRange = {
  date: Date;
  startTime: string;
  endTime: string;
  overnight: boolean;
};

export function shiftInterval(shift: ShiftTimeRange): [Date, Date] {
  const [sh, sm] = shift.startTime.split(":").map(Number);
  const [eh, em] = shift.endTime.split(":").map(Number);

  const start = new Date(shift.date);
  start.setUTCHours(sh, sm, 0, 0);

  const end = new Date(shift.date);
  end.setUTCHours(eh, em, 0, 0);
  if (shift.overnight) end.setUTCDate(end.getUTCDate() + 1);

  return [start, end];
}

function intervalsOverlap(a: [Date, Date], b: [Date, Date]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

export function shiftsOverlap(a: ShiftTimeRange, b: ShiftTimeRange): boolean {
  return intervalsOverlap(shiftInterval(a), shiftInterval(b));
}

export type ClaimValidationInput = {
  shift: ShiftTimeRange & { requirements: RequirementMap };
  claimsOnShift: { profession: Profession }[];
  staffProfession: Profession;
  staffOtherShifts: ShiftTimeRange[];
};

export type ClaimValidationResult = { ok: true } | { ok: false; reason: string };

const PROFESSION_LABEL: Record<Profession, string> = {
  DOCTOR: "doctor",
  NURSE: "nurse",
  RECEPTIONIST: "receptionist",
};

export function validateClaim(input: ClaimValidationInput): ClaimValidationResult {
  const { shift, claimsOnShift, staffProfession, staffOtherShifts } = input;

  const needed = shift.requirements[staffProfession] ?? 0;
  const already = claimsOnShift.filter((c) => c.profession === staffProfession).length;
  if (already >= needed) {
    return {
      ok: false,
      reason: `This shift already has enough ${PROFESSION_LABEL[staffProfession]}s (${already}/${needed}).`,
    };
  }

  for (const other of staffOtherShifts) {
    if (shiftsOverlap(shift, other)) {
      return {
        ok: false,
        reason: "This overlaps with another shift you've already claimed.",
      };
    }
  }

  return { ok: true };
}

export type ClaimForIssueCheck = {
  id: string;
  profession: Profession;
  createdAt: Date;
  staffOtherShifts: ShiftTimeRange[];
};

export type ClaimIssue = {
  claimId: string;
  kind: "OVER_CAPACITY" | "OVERLAP";
  detail: string;
};

/**
 * Derives, without mutating anything, which existing claims on a shift now
 * violate the rules — used after a manager edits a shift's time or
 * requirements so claims that predate the edit can be flagged for review
 * instead of silently dropped.
 */
export function computeShiftClaimIssues(
  shift: ShiftTimeRange & { requirements: RequirementMap },
  claims: ClaimForIssueCheck[]
): ClaimIssue[] {
  const issues: ClaimIssue[] = [];

  const byProfession = new Map<Profession, ClaimForIssueCheck[]>();
  for (const claim of claims) {
    const list = byProfession.get(claim.profession) ?? [];
    list.push(claim);
    byProfession.set(claim.profession, list);
  }

  for (const [profession, group] of byProfession) {
    const needed = shift.requirements[profession] ?? 0;
    const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const claim of sorted.slice(needed)) {
      issues.push({
        claimId: claim.id,
        kind: "OVER_CAPACITY",
        detail: `${PROFESSION_LABEL[profession]} headcount now exceeds this shift's requirement of ${needed}.`,
      });
    }
  }

  for (const claim of claims) {
    if (claim.staffOtherShifts.some((other) => shiftsOverlap(shift, other))) {
      issues.push({
        claimId: claim.id,
        kind: "OVERLAP",
        detail: "This claim now overlaps with another shift this person has claimed.",
      });
    }
  }

  return issues;
}
