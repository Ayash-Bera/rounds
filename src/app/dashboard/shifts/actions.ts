"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth-helpers";
import {
  createRecurringSeries,
  createShift,
  deleteSeries,
  deleteShift,
  updateShift,
  validateShiftInput,
} from "@/lib/shifts";
import { claimShiftForStaff, unclaimShift } from "@/lib/claims/db";
import type { RequirementMap } from "@/lib/import/types";

function parseRequirements(formData: FormData): RequirementMap {
  return {
    DOCTOR: Number(formData.get("req_doctor") ?? 0),
    NURSE: Number(formData.get("req_nurse") ?? 0),
    RECEPTIONIST: Number(formData.get("req_receptionist") ?? 0),
  };
}

function toDate(value: FormDataEntryValue | null): Date {
  return new Date(`${String(value)}T00:00:00.000Z`);
}

export async function createShiftAction(formData: FormData) {
  const user = await requireManager();
  const startTime = String(formData.get("startTime"));
  const endTime = String(formData.get("endTime"));
  const requirements = parseRequirements(formData);

  const error = validateShiftInput({ startTime, endTime, requirements });
  if (error) redirect(`/dashboard/shifts?error=${encodeURIComponent(error)}`);

  await createShift({ date: toDate(formData.get("date")), startTime, endTime, requirements }, user.id);
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard");
  redirect("/dashboard/shifts");
}

export async function updateShiftAction(formData: FormData) {
  await requireManager();
  const shiftId = String(formData.get("shiftId"));
  const startTime = String(formData.get("startTime"));
  const endTime = String(formData.get("endTime"));
  const requirements = parseRequirements(formData);

  const error = validateShiftInput({ startTime, endTime, requirements });
  if (error) redirect(`/dashboard/shifts?error=${encodeURIComponent(error)}`);

  await updateShift(shiftId, { date: toDate(formData.get("date")), startTime, endTime, requirements });
  revalidatePath("/dashboard/shifts");
  revalidatePath(`/dashboard/shifts/${shiftId}`);
  revalidatePath("/dashboard");
  redirect("/dashboard/shifts");
}

export async function deleteShiftAction(formData: FormData) {
  await requireManager();
  const shiftId = String(formData.get("shiftId"));
  await deleteShift(shiftId);
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard");
}

export async function createSeriesAction(formData: FormData) {
  const user = await requireManager();
  const daysOfWeek = formData.getAll("daysOfWeek").map(Number);
  const startTime = String(formData.get("startTime"));
  const endTime = String(formData.get("endTime"));
  const requirements = parseRequirements(formData);

  const error = validateShiftInput({ startTime, endTime, requirements });
  if (error) redirect(`/dashboard/shifts?error=${encodeURIComponent(error)}`);
  if (daysOfWeek.length === 0) {
    redirect(`/dashboard/shifts?error=${encodeURIComponent("Pick at least one day of the week.")}`);
  }

  try {
    await createRecurringSeries(
      {
        daysOfWeek,
        startTime,
        endTime,
        requirements,
        seriesStart: toDate(formData.get("seriesStart")),
        seriesEnd: toDate(formData.get("seriesEnd")),
      },
      user.id
    );
  } catch (e) {
    redirect(`/dashboard/shifts?error=${encodeURIComponent((e as Error).message)}`);
  }

  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard");
  redirect("/dashboard/shifts");
}

export async function deleteSeriesAction(formData: FormData) {
  await requireManager();
  const seriesId = String(formData.get("seriesId"));
  await deleteSeries(seriesId);
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard");
}

export async function assignStaffAction(shiftId: string, staffId: string) {
  await requireManager();
  const result = await claimShiftForStaff(shiftId, staffId);
  revalidatePath(`/dashboard/shifts/${shiftId}`);
  revalidatePath("/dashboard");
  return result;
}

export async function removeClaimAction(shiftId: string, staffId: string) {
  await requireManager();
  const result = await unclaimShift(shiftId, staffId);
  revalidatePath(`/dashboard/shifts/${shiftId}`);
  revalidatePath("/dashboard");
  return result;
}
