import type { Profession } from "@/generated/prisma/enums";
import type { RequirementMap } from "@/lib/import/types";

export type StaffingStatus = "full" | "partial" | "empty";

export type CoverageSummary = {
  status: StaffingStatus;
  missing: { profession: Profession; count: number }[];
  claimedByProfession: Record<Profession, number>;
};

export function computeCoverage(
  requirements: RequirementMap,
  claims: { profession: Profession }[]
): CoverageSummary {
  const claimedByProfession: Record<Profession, number> = { DOCTOR: 0, NURSE: 0, RECEPTIONIST: 0 };
  for (const claim of claims) claimedByProfession[claim.profession]++;

  const missing = (Object.keys(requirements) as Profession[])
    .filter((p) => claimedByProfession[p] < requirements[p])
    .map((p) => ({ profession: p, count: requirements[p] - claimedByProfession[p] }));

  const totalClaimedTowardNeed =
    Math.min(claimedByProfession.DOCTOR, requirements.DOCTOR) +
    Math.min(claimedByProfession.NURSE, requirements.NURSE) +
    Math.min(claimedByProfession.RECEPTIONIST, requirements.RECEPTIONIST);

  let status: StaffingStatus;
  if (missing.length === 0) status = "full";
  else if (totalClaimedTowardNeed === 0) status = "empty";
  else status = "partial";

  return { status, missing, claimedByProfession };
}
