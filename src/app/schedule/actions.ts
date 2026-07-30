"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { claimShiftForStaff, unclaimShift } from "@/lib/claims/db";

export async function claimAction(formData: FormData) {
  const user = await requireUser();
  const shiftId = String(formData.get("shiftId"));
  const result = await claimShiftForStaff(shiftId, user.id);
  if (!result.ok) {
    redirect(`/schedule?error=${encodeURIComponent(result.reason)}`);
  }
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}

export async function unclaimAction(formData: FormData) {
  const user = await requireUser();
  const shiftId = String(formData.get("shiftId"));
  await unclaimShift(shiftId, user.id);
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
}
