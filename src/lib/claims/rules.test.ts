import { describe, expect, it } from "vitest";
import { computeShiftClaimIssues, shiftsOverlap, validateClaim } from "./rules";

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("shiftsOverlap", () => {
  it("does not overlap two back-to-back day shifts", () => {
    const a = { date: day("2026-08-10"), startTime: "08:00", endTime: "16:00", overnight: false };
    const b = { date: day("2026-08-10"), startTime: "16:00", endTime: "22:00", overnight: false };
    expect(shiftsOverlap(a, b)).toBe(false);
  });

  it("overlaps two shifts sharing an hour", () => {
    const a = { date: day("2026-08-10"), startTime: "08:00", endTime: "16:00", overnight: false };
    const b = { date: day("2026-08-10"), startTime: "15:00", endTime: "23:00", overnight: false };
    expect(shiftsOverlap(a, b)).toBe(true);
  });

  it("accounts for overnight shifts spilling into the next morning", () => {
    const overnightShift = { date: day("2026-08-10"), startTime: "22:00", endTime: "06:00", overnight: true };
    const nextMorningShift = { date: day("2026-08-11"), startTime: "05:00", endTime: "13:00", overnight: false };
    expect(shiftsOverlap(overnightShift, nextMorningShift)).toBe(true);
  });

  it("does not overlap an overnight shift with the same day's morning shift", () => {
    const overnightShift = { date: day("2026-08-10"), startTime: "22:00", endTime: "06:00", overnight: true };
    const sameDayMorning = { date: day("2026-08-10"), startTime: "08:00", endTime: "16:00", overnight: false };
    expect(shiftsOverlap(overnightShift, sameDayMorning)).toBe(false);
  });
});

describe("validateClaim", () => {
  const baseShift = {
    date: day("2026-08-10"),
    startTime: "08:00",
    endTime: "16:00",
    overnight: false,
    requirements: { DOCTOR: 1, NURSE: 2, RECEPTIONIST: 0 },
  };

  it("allows a claim when there's room", () => {
    const result = validateClaim({
      shift: baseShift,
      claimsOnShift: [{ profession: "NURSE" }],
      staffProfession: "NURSE",
      staffOtherShifts: [],
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects when the profession headcount is already full", () => {
    const result = validateClaim({
      shift: baseShift,
      claimsOnShift: [{ profession: "NURSE" }, { profession: "NURSE" }],
      staffProfession: "NURSE",
      staffOtherShifts: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/enough nurses/);
  });

  it("rejects a claim that overlaps another shift the staffer already holds", () => {
    const result = validateClaim({
      shift: baseShift,
      claimsOnShift: [],
      staffProfession: "DOCTOR",
      staffOtherShifts: [
        { date: day("2026-08-10"), startTime: "07:00", endTime: "09:00", overnight: false },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/overlaps/);
  });

  it("allows a claim for a profession the shift doesn't require zero of, when another profession is full", () => {
    const result = validateClaim({
      shift: baseShift,
      claimsOnShift: [{ profession: "NURSE" }, { profession: "NURSE" }],
      staffProfession: "DOCTOR",
      staffOtherShifts: [],
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("computeShiftClaimIssues", () => {
  const shift = {
    date: day("2026-08-10"),
    startTime: "08:00",
    endTime: "16:00",
    overnight: false,
    requirements: { DOCTOR: 0, NURSE: 1, RECEPTIONIST: 0 },
  };

  it("flags claims beyond the (now-reduced) headcount, oldest claims kept first", () => {
    const claims = [
      { id: "c1", profession: "NURSE" as const, createdAt: new Date("2026-01-01"), staffOtherShifts: [] },
      { id: "c2", profession: "NURSE" as const, createdAt: new Date("2026-01-02"), staffOtherShifts: [] },
    ];
    const issues = computeShiftClaimIssues(shift, claims);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ claimId: "c2", kind: "OVER_CAPACITY" });
  });

  it("flags a claim that now overlaps another shift after a time edit", () => {
    const claims = [
      {
        id: "c1",
        profession: "NURSE" as const,
        createdAt: new Date("2026-01-01"),
        staffOtherShifts: [{ date: day("2026-08-10"), startTime: "09:00", endTime: "11:00", overnight: false }],
      },
    ];
    const issues = computeShiftClaimIssues(shift, claims);
    expect(issues.some((i) => i.kind === "OVERLAP")).toBe(true);
  });

  it("returns no issues when everything is still within bounds", () => {
    const claims = [
      { id: "c1", profession: "NURSE" as const, createdAt: new Date("2026-01-01"), staffOtherShifts: [] },
    ];
    expect(computeShiftClaimIssues(shift, claims)).toEqual([]);
  });
});
