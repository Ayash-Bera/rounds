import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeCoverage } from "@/lib/coverage";
import { addDays, parseWeekParam } from "@/lib/week";
import type { RequirementMap } from "@/lib/import/types";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const weekStart = parseWeekParam(searchParams.get("week") ?? undefined);
  const weekEnd = addDays(weekStart, 7);

  const shifts = await prisma.shift.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
    include: { claims: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const data = shifts.map((shift) => {
    const requirements = shift.requirements as RequirementMap;
    const coverage = computeCoverage(requirements, shift.claims);
    return {
      id: shift.id,
      date: shift.date.toISOString(),
      startTime: shift.startTime,
      endTime: shift.endTime,
      overnight: shift.overnight,
      requirements,
      coverage,
    };
  });

  return NextResponse.json({ shifts: data });
}
