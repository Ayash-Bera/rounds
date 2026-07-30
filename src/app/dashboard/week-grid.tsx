"use client";

import useSWR from "swr";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatRequirements, professionLabel } from "@/lib/format";
import { weekDates } from "@/lib/week";
import type { StaffingStatus } from "@/lib/coverage";
import type { RequirementMap } from "@/lib/import/types";
import type { Profession } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type CoverageShift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  overnight: boolean;
  requirements: RequirementMap;
  coverage: {
    status: StaffingStatus;
    missing: { profession: Profession; count: number }[];
  };
};

const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const DAY_NUM = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function WeekGrid({
  weekParam,
  initialShifts,
}: {
  weekParam: string;
  initialShifts: CoverageShift[];
}) {
  const { data } = useSWR<{ shifts: CoverageShift[] }>(`/api/coverage?week=${weekParam}`, fetcher, {
    fallbackData: { shifts: initialShifts },
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  const shifts = data?.shifts ?? initialShifts;
  const days = weekDates(new Date(`${weekParam}T00:00:00.000Z`));

  const shiftsByDay = days.map((day) => {
    const dayKey = day.toISOString().slice(0, 10);
    return {
      day,
      shifts: shifts.filter((s) => s.date.slice(0, 10) === dayKey),
    };
  });

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {shiftsByDay.map(({ day, shifts: dayShifts }) => (
        <div key={day.toISOString()} className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between md:block">
            <p className="text-sm font-medium">{DAY_LABEL.format(day)}</p>
            <p className="text-xs text-muted-foreground">{DAY_NUM.format(day)}</p>
          </div>
          <div className="space-y-2">
            {dayShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
            {dayShifts.length === 0 && (
              <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
                No shifts
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShiftCard({ shift }: { shift: CoverageShift }) {
  return (
    <Link
      href={`/dashboard/shifts/${shift.id}`}
      className={cn(
        "block rounded-lg border px-3 py-2.5 text-xs transition-colors hover:border-primary/50",
        "border-border/70 bg-card"
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-medium">
          {shift.startTime}–{shift.endTime}
          {shift.overnight ? " ⏵" : ""}
        </span>
        <StatusBadge status={shift.coverage.status} />
      </div>
      <p className="text-muted-foreground">{formatRequirements(shift.requirements)}</p>
      {shift.coverage.missing.length > 0 && (
        <p className="mt-1 font-medium text-status-empty">
          Missing {shift.coverage.missing.map((m) => `${m.count} ${professionLabel(m.profession)}`).join(", ")}
        </p>
      )}
    </Link>
  );
}
