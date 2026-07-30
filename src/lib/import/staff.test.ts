import { describe, expect, it } from "vitest";
import { normalizeStaffRow, type SeenStaff } from "./staff";

function freshSeen() {
  return new Map<string, SeenStaff>();
}

describe("normalizeStaffRow", () => {
  it("accepts a clean row", () => {
    const outcome = normalizeStaffRow(
      { staff_id: "121", full_name: "Marcus Whitfield", role: "Doctor", email: "marcus.whitfield@clinicmail.test" },
      freshSeen()
    );
    expect(outcome.status).toBe("ACCEPTED");
    if (outcome.status === "ACCEPTED") {
      expect(outcome.data.profession).toBe("DOCTOR");
      expect(outcome.data.email).toBe("marcus.whitfield@clinicmail.test");
    }
  });

  it.each([
    ["NURSE", "NURSE"],
    ["RN", "NURSE"],
    ["Registered Nurse", "NURSE"],
    ["nurse", "NURSE"],
    ["receptionist", "RECEPTIONIST"],
    ["recep.", "RECEPTIONIST"],
    ["Reception", "RECEPTIONIST"],
    ["Physician", "DOCTOR"],
    ["MD", "DOCTOR"],
    ["DOCTOR ", "DOCTOR"],
  ])("normalizes role synonym %s -> %s", (raw, expected) => {
    const outcome = normalizeStaffRow(
      { full_name: "Test Person", role: raw, email: `x${Math.random()}@clinicmail.test` },
      freshSeen()
    );
    expect(outcome.status).not.toBe("REJECTED");
    if (outcome.status !== "REJECTED") {
      expect(outcome.data.profession).toBe(expected);
    }
  });

  it("rejects an unrecognized profession", () => {
    const outcome = normalizeStaffRow(
      { full_name: "Casey Morgan", role: "Janitor", email: "casey.morgan@clinicmail.test" },
      freshSeen()
    );
    expect(outcome).toEqual({ status: "REJECTED", reason: expect.stringContaining("unrecognized profession") });
  });

  it("rejects a missing full_name", () => {
    const outcome = normalizeStaffRow({ full_name: "", role: "Doctor", email: "noname@clinicmail.test" }, freshSeen());
    expect(outcome.status).toBe("REJECTED");
  });

  it("rejects a missing email", () => {
    const outcome = normalizeStaffRow({ full_name: "Robin Vale", role: "Nurse", email: "" }, freshSeen());
    expect(outcome.status).toBe("REJECTED");
  });

  it("repairs an obfuscated (at) email and marks it merged", () => {
    const outcome = normalizeStaffRow(
      { full_name: "Priya Weber", role: "Doctor", email: "priya.weber(at)clinicmail.test" },
      freshSeen()
    );
    expect(outcome.status).toBe("MERGED");
    if (outcome.status === "MERGED") {
      expect(outcome.data.email).toBe("priya.weber@clinicmail.test");
    }
  });

  it("merges an exact duplicate seen by email under the same name", () => {
    const seen = freshSeen();
    seen.set("zainab.volkov@clinicmail.test", { fullName: "Zainab Volkov" });
    const outcome = normalizeStaffRow(
      { staff_id: "999", full_name: "Zainab Volkov", role: "NURSE", email: "zainab.volkov@clinicmail.test" },
      seen
    );
    expect(outcome.status).toBe("MERGED");
    if (outcome.status === "MERGED") {
      expect(outcome.resultingKey).toBe("zainab.volkov@clinicmail.test");
    }
  });

  it("rejects a different name reusing an already-seen email", () => {
    const seen = freshSeen();
    seen.set("hiro.iyer@clinicmail.test", { fullName: "Hiro Iyer" });
    const outcome = normalizeStaffRow(
      { staff_id: "998", full_name: "J. Placeholder", role: "Nurse", email: "hiro.iyer@clinicmail.test" },
      seen
    );
    expect(outcome.status).toBe("REJECTED");
  });
});
