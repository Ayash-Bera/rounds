import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth-helpers";
import { getShiftClaimIssues } from "@/lib/claims/db";
import { shiftsOverlap } from "@/lib/claims/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CoverageMeter } from "@/components/coverage-meter";
import { formatDate, formatProfessionCount, formatRequirements } from "@/lib/format";
import { computeCoverage } from "@/lib/coverage";
import type { RequirementMap } from "@/lib/import/types";
import { assignStaffAction, removeClaimAction } from "../actions";
import { AssignChecklist, type StaffRow } from "./assign-checklist";

export default async function ShiftDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireManager();
  const { id } = await params;
  const search = await searchParams;

  const result = await getShiftClaimIssues(id);
  if (!result) notFound();
  const { shift, issues } = result;
  const requirements = shift.requirements as RequirementMap;
  const coverage = computeCoverage(requirements, shift.claims);

  const claimedIds = new Set(shift.claims.map((c) => c.staffId));

  const claimants = await prisma.user.findMany({
    where: { id: { in: [...claimedIds] } },
  });
  const claimantById = new Map(claimants.map((c) => [c.id, c]));

  const allStaff = await prisma.user.findMany({
    where: { role: "STAFF", profession: { not: null } },
    orderBy: { fullName: "asc" },
  });

  const otherClaims = await prisma.claim.findMany({
    where: { staffId: { in: allStaff.map((s) => s.id) }, shiftId: { not: shift.id } },
    include: { shift: true },
  });
  const otherShiftsByStaff = new Map<string, { date: Date; startTime: string; endTime: string; overnight: boolean }[]>();
  for (const claim of otherClaims) {
    const list = otherShiftsByStaff.get(claim.staffId) ?? [];
    list.push({
      date: claim.shift.date,
      startTime: claim.shift.startTime,
      endTime: claim.shift.endTime,
      overnight: claim.shift.overnight,
    });
    otherShiftsByStaff.set(claim.staffId, list);
  }
  const shiftRange = {
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    overnight: shift.overnight,
  };

  // Staff who already have a conflicting overlapping shift are excluded entirely — claiming
  // this shift would be rejected by the server anyway, so there's no reason to offer it.
  const staffRows: StaffRow[] = allStaff
    .filter((s) => {
      if (claimedIds.has(s.id)) return true;
      const others = otherShiftsByStaff.get(s.id) ?? [];
      return !others.some((o) => shiftsOverlap(shiftRange, o));
    })
    .map((s) => ({
      id: s.id,
      fullName: s.fullName,
      profession: s.profession!,
      claimed: claimedIds.has(s.id),
    }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">{formatDate(shift.date)}</h1>
        <p className="text-sm text-muted-foreground">
          {shift.startTime}–{shift.endTime}
          {shift.overnight ? " (overnight)" : ""} · {formatRequirements(requirements)}
        </p>
      </div>

      {search.error && (
        <Alert variant="destructive">
          <AlertDescription>{search.error}</AlertDescription>
        </Alert>
      )}

      {issues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>This shift was edited and now has claim conflicts</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {issues.map((issue) => {
                const claim = shift.claims.find((c) => c.id === issue.claimId);
                const person = claim ? claimantById.get(claim.staffId) : undefined;
                return (
                  <li key={issue.claimId}>
                    {person?.fullName ?? "A staff member"}: {issue.detail} Remove their claim below if needed.
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg font-medium">Staffing</CardTitle>
          <CoverageMeter filled={coverage.filled} needed={coverage.needed} status={coverage.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {coverage.missing.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Missing: {coverage.missing.map((m) => formatProfessionCount(m.profession, m.count)).join(", ")}
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Staff</p>
            <AssignChecklist
              shiftId={shift.id}
              staff={staffRows}
              requirements={requirements}
              assignAction={assignStaffAction}
              removeAction={removeClaimAction}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
