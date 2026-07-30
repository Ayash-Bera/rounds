import { describe, expect, it } from "vitest";
import { normalizeShiftRow, type SeenShift } from "./shifts";

function freshSeen() {
  return new Map<string, SeenShift>();
}

describe("normalizeShiftRow", () => {
  it("accepts a clean key=value row", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5096", date: "2026-08-28", start_time: "09:00", end_time: "17:00", requirements: "nurses=3;doctors=0;receptionists=0" },
      freshSeen()
    );
    expect(outcome.status).toBe("ACCEPTED");
    if (outcome.status === "ACCEPTED") {
      expect(outcome.data.requirements).toEqual({ NURSE: 3, DOCTOR: 0, RECEPTIONIST: 0 });
      expect(outcome.data.overnight).toBe(false);
    }
  });

  it("treats end <= start as an overnight shift, not an error", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5103", date: "2026-08-29", start_time: "22:00", end_time: "06:00", requirements: "nurses=3;doctors=2;receptionists=1" },
      freshSeen()
    );
    expect(outcome.status).toBe("ACCEPTED");
    if (outcome.status === "ACCEPTED") {
      expect(outcome.data.overnight).toBe(true);
    }
  });

  it("rejects an impossible calendar date", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5110", date: "2026-02-30", start_time: "08:00", end_time: "16:00", requirements: "nurses=1" },
      freshSeen()
    );
    expect(outcome.status).toBe("REJECTED");
  });

  it("defaults unmentioned roles to zero", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5110b", date: "2026-08-01", start_time: "08:00", end_time: "16:00", requirements: "nurses=1" },
      freshSeen()
    );
    expect(outcome.status).toBe("ACCEPTED");
    if (outcome.status === "ACCEPTED") {
      expect(outcome.data.requirements).toEqual({ NURSE: 1, DOCTOR: 0, RECEPTIONIST: 0 });
    }
  });

  it("rejects a next-day-suffixed time that produces an implausible 26h shift", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5115", date: "2026-08-21", start_time: "08:00", end_time: "10:00+1", requirements: "nurses=2" },
      freshSeen()
    );
    expect(outcome.status).toBe("REJECTED");
    if (outcome.status === "REJECTED") {
      expect(outcome.reason).toMatch(/exceeds the plausible limit/);
    }
  });

  it("rejects a zero-length shift where start equals end", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5112", date: "2026-08-15", start_time: "12:00", end_time: "12:00", requirements: "doctors=1" },
      freshSeen()
    );
    expect(outcome.status).toBe("REJECTED");
    if (outcome.status === "REJECTED") {
      expect(outcome.reason).toMatch(/zero-length/);
    }
  });

  it("rejects a missing start_time", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5114", date: "2026-08-20", start_time: "", end_time: "16:00", requirements: "nurses=1;doctors=1" },
      freshSeen()
    );
    expect(outcome.status).toBe("REJECTED");
  });

  it("interprets free-text requirements and marks the row merged", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "5113", date: "2026-08-18", start_time: "08:00", end_time: "16:00", requirements: "two nurses and a doctor" },
      freshSeen()
    );
    expect(outcome.status).toBe("MERGED");
    if (outcome.status === "MERGED") {
      expect(outcome.data.requirements).toEqual({ NURSE: 2, DOCTOR: 1, RECEPTIONIST: 0 });
    }
  });

  it("rejects unparseable requirements", () => {
    const outcome = normalizeShiftRow(
      { shift_id: "9001", date: "2026-08-18", start_time: "08:00", end_time: "16:00", requirements: "???" },
      freshSeen()
    );
    expect(outcome.status).toBe("REJECTED");
  });

  it("merges an exact duplicate shift_id with identical data", () => {
    const seen = freshSeen();
    const rowA = { shift_id: "5020", date: "2026-08-08", start_time: "22:00", end_time: "06:00", requirements: "nurses=1;doctors=0;receptionists=0" };
    const first = normalizeShiftRow(rowA, seen);
    expect(first.status).toBe("ACCEPTED");
    if (first.dedupeKey) seen.set(first.dedupeKey, { raw: rowA });

    const second = normalizeShiftRow({ ...rowA }, seen);
    expect(second.status).toBe("MERGED");
  });

  it("rejects a repeated shift_id with conflicting data", () => {
    const seen = freshSeen();
    const rowA = { shift_id: "5099", date: "2026-08-28", start_time: "14:00", end_time: "22:00", requirements: "nurses=3;doctors=1;receptionists=0" };
    const first = normalizeShiftRow(rowA, seen);
    if (first.dedupeKey) seen.set(first.dedupeKey, { raw: rowA });

    const conflicting = normalizeShiftRow(
      { shift_id: "5099", date: "2026-08-28", start_time: "14:00", end_time: "22:00", requirements: "nurses=1;doctors=1;receptionists=0" },
      seen
    );
    expect(conflicting.status).toBe("REJECTED");
  });
});
