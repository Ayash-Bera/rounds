"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, formatWeekParam } from "@/lib/week";

export function WeekNav({ weekParam }: { weekParam: string }) {
  const router = useRouter();
  const weekStart = new Date(`${weekParam}T00:00:00.000Z`);

  function goTo(date: Date) {
    router.push(`/dashboard?week=${formatWeekParam(date)}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => goTo(addDays(weekStart, -7))} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => goTo(addDays(weekStart, 7))} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Input
        type="date"
        value={weekParam}
        onChange={(e) => e.target.value && goTo(new Date(`${e.target.value}T00:00:00.000Z`))}
        className="w-auto"
        aria-label="Jump to week containing date"
      />
      <Button variant="ghost" size="sm" onClick={() => goTo(new Date())}>
        This week
      </Button>
    </div>
  );
}
