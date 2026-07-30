import type { Profession } from "@/generated/prisma/enums";

export type RequirementMap = Record<Profession, number>;

export type NormalizedStaffRow = {
  fullName: string;
  email: string;
  profession: Profession;
};

export type NormalizedShiftRow = {
  shiftKey: string;
  date: Date;
  startTime: string;
  endTime: string;
  overnight: boolean;
  requirements: RequirementMap;
};

export type RowOutcome<T> =
  | { status: "ACCEPTED"; data: T; reason?: undefined }
  | { status: "MERGED"; data: T; reason: string; resultingKey?: string }
  | { status: "REJECTED"; data?: undefined; reason: string };
