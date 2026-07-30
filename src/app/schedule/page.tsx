import { AlertCircle } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { computeCoverage } from "@/lib/coverage";
import { formatDate, formatRequirements, professionLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import type { RequirementMap } from "@/lib/import/types";
import { claimAction, unclaimAction } from "./actions";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const shifts = await prisma.shift.findMany({
    where: { date: { gte: today } },
    include: { claims: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Your schedule</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming shifts. Claim any that need a {user.profession ? professionLabel(user.profession) : "staff member"}.
        </p>
      </div>

      {params.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {shifts.map((shift) => {
          const requirements = shift.requirements as RequirementMap;
          const coverage = computeCoverage(requirements, shift.claims);
          const ownClaim = shift.claims.find((c) => c.staffId === user.id);
          const professionFull =
            user.profession &&
            coverage.claimedByProfession[user.profession] >= requirements[user.profession];

          return (
            <Card key={shift.id} className="border-border/70">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{formatDate(shift.date)}</p>
                    <span className="text-sm text-muted-foreground">
                      {shift.startTime}–{shift.endTime}
                      {shift.overnight ? " (overnight)" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatRequirements(requirements)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={coverage.status} />
                  {ownClaim ? (
                    <form action={unclaimAction}>
                      <input type="hidden" name="shiftId" value={shift.id} />
                      <Button type="submit" variant="outline" size="sm" className="rounded-full">
                        Unclaim
                      </Button>
                    </form>
                  ) : professionFull ? (
                    <Button variant="outline" size="sm" className="rounded-full" disabled>
                      Full
                    </Button>
                  ) : (
                    <form action={claimAction}>
                      <input type="hidden" name="shiftId" value={shift.id} />
                      <Button type="submit" size="sm" className="rounded-full">
                        Claim
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {shifts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No upcoming shifts scheduled.</p>
        )}
      </div>
    </div>
  );
}
