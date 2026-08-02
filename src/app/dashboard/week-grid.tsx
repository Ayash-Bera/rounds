"use client";

import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoonStar } from "lucide-react";
import { formatProfessionCount, formatRequirements } from "@/lib/format";
import { weekDates } from "@/lib/week";
import { CoverageMeter, STATUS_COLOR } from "@/components/coverage-meter";
import type { StaffingStatus } from "@/lib/coverage";
import type { RequirementMap } from "@/lib/import/types";
import type { Profession } from "@/generated/prisma/enums";

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
    filled: number;
    needed: number;
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
            {dayShifts.map((shift, i) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.03 }}
              >
                <ShiftCard shift={shift} />
              </motion.div>
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
  const { status, missing, filled, needed } = shift.coverage;
  return (
    <Link
      href={`/dashboard/shifts/${shift.id}`}
      className="block rounded-lg border border-border/70 border-l-2 bg-card px-3 py-2.5 text-xs transition-colors hover:border-foreground/30"
      style={{ borderLeftColor: STATUS_COLOR[status] }}
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
          {shift.startTime}–{shift.endTime}
          {shift.overnight && <MoonStar className="h-3 w-3 shrink-0 text-muted-foreground" />}
        </span>
        <CoverageMeter filled={filled} needed={needed} status={status} className="ml-auto" />
      </div>
      <p className="text-muted-foreground">{formatRequirements(shift.requirements)}</p>
      {missing.length > 0 && (
        <p className="mt-1 text-muted-foreground">
          Needs {missing.map((m) => formatProfessionCount(m.profession, m.count)).join(", ")}
        </p>
      )}
    </Link>
  );
}
