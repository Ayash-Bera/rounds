import { requireManager } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { computeCoverage } from "@/lib/coverage";
import { addDays, formatWeekParam, formatWeekRangeLabel, parseWeekParam } from "@/lib/week";
import type { RequirementMap } from "@/lib/import/types";
import { WeekGrid, type CoverageShift } from "./week-grid";
import { WeekNav } from "./week-nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireManager();
  const { week } = await searchParams;
  const weekStart = parseWeekParam(week);
  const weekEnd = addDays(weekStart, 7);
  const weekParam = formatWeekParam(weekStart);

  const shifts = await prisma.shift.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
    include: { claims: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const initialShifts: CoverageShift[] = shifts.map((shift) => {
    const requirements = shift.requirements as RequirementMap;
    return {
      id: shift.id,
      date: shift.date.toISOString(),
      startTime: shift.startTime,
      endTime: shift.endTime,
      overnight: shift.overnight,
      requirements,
      coverage: computeCoverage(requirements, shift.claims),
    };
  });

  const counts = { full: 0, partial: 0, empty: 0 };
  for (const s of initialShifts) counts[s.coverage.status]++;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium">Coverage</h1>
          <p className="text-sm text-muted-foreground">{formatWeekRangeLabel(weekStart)}</p>
        </div>
        <WeekNav weekParam={weekParam} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-status-full">{counts.full} fully staffed</span>
        <span className="text-status-partial">{counts.partial} partially staffed</span>
        <span className="text-status-empty">{counts.empty} empty</span>
      </div>

      <WeekGrid weekParam={weekParam} initialShifts={initialShifts} />
    </div>
  );
}
