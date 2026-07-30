import Link from "next/link";
import { Plus, Repeat } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatRequirements } from "@/lib/format";
import { computeCoverage } from "@/lib/coverage";
import type { RequirementMap } from "@/lib/import/types";
import { ShiftDialog } from "./shift-dialog";
import { SeriesDialog } from "./series-dialog";
import { DeleteShiftButton } from "./delete-shift-button";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireManager();
  const params = await searchParams;

  const shifts = await prisma.shift.findMany({
    orderBy: { date: "asc" },
    include: { claims: true, series: true },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium">Shifts</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and delete shifts.</p>
        </div>
        <div className="flex gap-2">
          <SeriesDialog
            trigger={
              <Button variant="outline" className="gap-1.5 rounded-full">
                <Repeat className="h-4 w-4" /> New series
              </Button>
            }
          />
          <ShiftDialog
            mode="create"
            trigger={
              <Button className="gap-1.5 rounded-full">
                <Plus className="h-4 w-4" /> New shift
              </Button>
            }
          />
        </div>
      </div>

      {params.error && (
        <Alert variant="destructive">
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3">
        {shifts.map((shift) => {
          const requirements = shift.requirements as RequirementMap;
          const coverage = computeCoverage(requirements, shift.claims);
          return (
            <Card key={shift.id} className="border-border/70">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/dashboard/shifts/${shift.id}`} className="font-medium hover:underline">
                      {formatDate(shift.date)}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {shift.startTime}–{shift.endTime}
                      {shift.overnight ? " (overnight)" : ""}
                    </span>
                    {shift.seriesId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        <Repeat className="h-3 w-3" /> series
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatRequirements(requirements)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={coverage.status} />
                  <ShiftDialog
                    mode="edit"
                    shift={{
                      id: shift.id,
                      date: shift.date,
                      startTime: shift.startTime,
                      endTime: shift.endTime,
                      requirements,
                    }}
                    trigger={
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <DeleteShiftButton shiftId={shift.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {shifts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No shifts yet. Create one or import a CSV.
          </p>
        )}
      </div>
    </div>
  );
}
