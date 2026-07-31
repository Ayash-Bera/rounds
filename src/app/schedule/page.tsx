import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, MoonStar } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { computeCoverage } from "@/lib/coverage";
import { formatShortDate, formatRequirements, professionLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CoverageMeter, STATUS_COLOR } from "@/components/coverage-meter";
import type { RequirementMap } from "@/lib/import/types";
import { claimAction, unclaimAction } from "./actions";

const PAGE_SIZE = 20;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where: { date: { gte: today } },
      include: { claims: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.shift.count({ where: { date: { gte: today } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const groups: { dateKey: string; label: string; shifts: typeof shifts }[] = [];
  for (const shift of shifts) {
    const dateKey = shift.date.toISOString().slice(0, 10);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.dateKey === dateKey) {
      lastGroup.shifts.push(shift);
    } else {
      groups.push({ dateKey, label: formatShortDate(shift.date), shifts: [shift] });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Your schedule</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No upcoming shifts scheduled."
            : `Claim any shift that needs a ${user.profession ? professionLabel(user.profession) : "staff member"}. Showing ${rangeStart}–${rangeEnd} of ${total}.`}
        </p>
      </div>

      {params.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.dateKey}>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{group.label}</p>
            <div className="space-y-2">
              {group.shifts.map((shift) => {
                const requirements = shift.requirements as RequirementMap;
                const coverage = computeCoverage(requirements, shift.claims);
                const ownClaim = shift.claims.find((c) => c.staffId === user.id);
                const professionFull =
                  user.profession &&
                  coverage.claimedByProfession[user.profession] >= requirements[user.profession];

                return (
                  <div
                    key={shift.id}
                    className={
                      ownClaim
                        ? "rounded-lg border border-primary/40 border-l-2 bg-primary/[0.04] px-4 py-3"
                        : "rounded-lg border border-border/70 border-l-2 bg-card px-4 py-3"
                    }
                    style={{ borderLeftColor: STATUS_COLOR[coverage.status] }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-medium">
                            {shift.startTime}–{shift.endTime}
                          </span>
                          {shift.overnight && (
                            <MoonStar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <CoverageMeter
                            filled={coverage.filled}
                            needed={coverage.needed}
                            status={coverage.status}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{formatRequirements(requirements)}</p>
                        {ownClaim && (
                          <p className="text-xs font-medium text-primary">You&apos;re claimed on this shift</p>
                        )}
                      </div>
                      {ownClaim ? (
                        <form action={unclaimAction}>
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <SubmitButton pendingLabel="Unclaiming" variant="outline" size="sm">
                            Unclaim
                          </SubmitButton>
                        </form>
                      ) : professionFull ? (
                        <span className="text-xs text-muted-foreground">No slots left for you</span>
                      ) : (
                        <form action={claimAction}>
                          <input type="hidden" name="shiftId" value={shift.id} />
                          <SubmitButton pendingLabel="Claiming" size="sm">Claim</SubmitButton>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {shifts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No upcoming shifts scheduled.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          {page <= 1 ? (
            <Button variant="outline" size="sm" disabled className="gap-1.5 rounded-full">
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
          ) : (
            <Button
              render={<Link href={`/schedule?page=${page - 1}`} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page >= totalPages ? (
            <Button variant="outline" size="sm" disabled className="gap-1.5 rounded-full">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              render={<Link href={`/schedule?page=${page + 1}`} />}
              nativeButton={false}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
