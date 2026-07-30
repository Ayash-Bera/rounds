import { describe, expect, it } from "vitest";
import { parseFlexibleDate, parseFlexibleTime } from "./dates";

describe("parseFlexibleDate", () => {
  it("parses ISO dates", () => {
    const result = parseFlexibleDate("2026-08-28");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.date.toISOString().slice(0, 10)).toBe("2026-08-28");
  });

  it("parses slash dates as day-first (DD/MM/YYYY)", () => {
    const result = parseFlexibleDate("05/08/2026");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.date.toISOString().slice(0, 10)).toBe("2026-08-05");
  });

  it("parses dash dates as month-first (MM-DD-YYYY)", () => {
    const result = parseFlexibleDate("08-25-2026");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.date.toISOString().slice(0, 10)).toBe("2026-08-25");
  });

  it("rejects an impossible calendar date", () => {
    const result = parseFlexibleDate("2026-02-30");
    expect(result.ok).toBe(false);
  });

  it("rejects missing dates", () => {
    expect(parseFlexibleDate("").ok).toBe(false);
    expect(parseFlexibleDate("   ").ok).toBe(false);
  });

  it("rejects unrecognized formats", () => {
    expect(parseFlexibleDate("August 28th 2026").ok).toBe(false);
  });
});

describe("parseFlexibleTime", () => {
  it("parses a plain HH:mm time", () => {
    const result = parseFlexibleTime("09:00");
    expect(result).toEqual({ ok: true, minutesFromMidnight: 540, dayOffset: 0 });
  });

  it("parses an explicit next-day offset", () => {
    const result = parseFlexibleTime("10:00+1");
    expect(result).toEqual({ ok: true, minutesFromMidnight: 600, dayOffset: 1 });
  });

  it("rejects missing time", () => {
    expect(parseFlexibleTime("").ok).toBe(false);
  });

  it("rejects malformed time", () => {
    expect(parseFlexibleTime("25:00").ok).toBe(false);
  });
});
