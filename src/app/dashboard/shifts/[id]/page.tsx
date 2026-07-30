import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth-helpers";
import { getShiftClaimIssues } from "@/lib/claims/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatRequirements, professionLabel } from "@/lib/format";
import { computeCoverage } from "@/lib/coverage";
import type { RequirementMap } from "@/lib/import/types";
import { assignStaffAction, removeClaimAction } from "../actions";

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

  const claimants = await prisma.user.findMany({
    where: { id: { in: shift.claims.map((c) => c.staffId) } },
  });
  const claimantById = new Map(claimants.map((c) => [c.id, c]));

  const eligibleStaff = await prisma.user.findMany({
    where: {
      role: "STAFF",
      profession: { not: null },
      id: { notIn: shift.claims.map((c) => c.staffId) },
    },
    orderBy: { fullName: "asc" },
  });

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
          <StatusBadge status={coverage.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {coverage.missing.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Missing: {coverage.missing.map((m) => `${m.count} ${professionLabel(m.profession)}`).join(", ")}
            </p>
          )}

          <ul className="divide-y divide-border rounded-lg border">
            {shift.claims.map((claim) => {
              const person = claimantById.get(claim.staffId);
              return (
                <li key={claim.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{person?.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{professionLabel(claim.profession)}</p>
                  </div>
                  <form action={removeClaimAction}>
                    <input type="hidden" name="shiftId" value={shift.id} />
                    <input type="hidden" name="staffId" value={claim.staffId} />
                    <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                      Remove
                    </Button>
                  </form>
                </li>
              );
            })}
            {shift.claims.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">Nobody has claimed this shift yet.</li>
            )}
          </ul>

          <form action={assignStaffAction} className="flex gap-2">
            <input type="hidden" name="shiftId" value={shift.id} />
            <Select name="staffId">
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Assign a staff member" />
              </SelectTrigger>
              <SelectContent>
                {eligibleStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName} — {professionLabel(s.profession!)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="rounded-full">
              Assign
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
