import { prisma } from "@/lib/db";
import type { RequirementMap } from "@/lib/import/types";
import { computeShiftClaimIssues, validateClaim } from "./rules";

export type ClaimResult = { ok: true; claimId: string } | { ok: false; reason: string };

/**
 * Claims (or manager-assigns) a shift for a staff member. Locks the shift
 * row for the duration of the transaction so concurrent claim attempts on
 * the same shift are serialized — the headcount/overlap check that follows
 * is always reading committed, up-to-date state.
 */
export async function claimShiftForStaff(shiftId: string, staffId: string): Promise<ClaimResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Shift" WHERE id = ${shiftId} FOR UPDATE`;

    const shift = await tx.shift.findUnique({ where: { id: shiftId }, include: { claims: true } });
    if (!shift) return { ok: false, reason: "This shift no longer exists." };

    const staff = await tx.user.findUnique({ where: { id: staffId } });
    if (!staff || staff.role !== "STAFF" || !staff.profession) {
      return { ok: false, reason: "Only staff members can claim shifts." };
    }

    if (shift.claims.some((c) => c.staffId === staffId)) {
      return { ok: false, reason: "You've already claimed this shift." };
    }

    const otherClaims = await tx.claim.findMany({
      where: { staffId, shiftId: { not: shiftId } },
      include: { shift: true },
    });

    const result = validateClaim({
      shift: {
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        overnight: shift.overnight,
        requirements: shift.requirements as RequirementMap,
      },
      claimsOnShift: shift.claims.map((c) => ({ profession: c.profession })),
      staffProfession: staff.profession,
      staffOtherShifts: otherClaims.map((c) => ({
        date: c.shift.date,
        startTime: c.shift.startTime,
        endTime: c.shift.endTime,
        overnight: c.shift.overnight,
      })),
    });

    if (!result.ok) return result;

    const claim = await tx.claim.create({
      data: { shiftId, staffId, profession: staff.profession },
    });
    return { ok: true, claimId: claim.id };
  });
}

export async function unclaimShift(shiftId: string, staffId: string): Promise<ClaimResult> {
  const claim = await prisma.claim.findUnique({
    where: { shiftId_staffId: { shiftId, staffId } },
  });
  if (!claim) return { ok: false, reason: "No claim found to remove." };
  await prisma.claim.delete({ where: { id: claim.id } });
  return { ok: true, claimId: claim.id };
}

/**
 * Computed, not stored: after a shift's time or requirements change, this
 * derives which existing claims are now over-capacity or overlapping —
 * so a manager can review and resolve them instead of claims silently
 * disappearing or the edit being blocked outright.
 */
export async function getShiftClaimIssues(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { claims: true },
  });
  if (!shift) return null;

  const claimsWithOtherShifts = await Promise.all(
    shift.claims.map(async (claim) => {
      const others = await prisma.claim.findMany({
        where: { staffId: claim.staffId, shiftId: { not: shiftId } },
        include: { shift: true },
      });
      return {
        id: claim.id,
        profession: claim.profession,
        createdAt: claim.createdAt,
        staffOtherShifts: others.map((o) => ({
          date: o.shift.date,
          startTime: o.shift.startTime,
          endTime: o.shift.endTime,
          overnight: o.shift.overnight,
        })),
      };
    })
  );

  const issues = computeShiftClaimIssues(
    {
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      overnight: shift.overnight,
      requirements: shift.requirements as RequirementMap,
    },
    claimsWithOtherShifts
  );

  return { shift, issues };
}
