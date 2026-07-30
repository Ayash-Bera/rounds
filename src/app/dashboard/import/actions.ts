"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth-helpers";
import { importShiftsCsv, importStaffCsv } from "@/lib/import/run-import";

export async function uploadStaffCsvAction(formData: FormData) {
  await requireManager();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/import?error=${encodeURIComponent("Choose a staff CSV file first.")}`);
  }

  const text = await (file as File).text();
  const result = await importStaffCsv(text, "UPLOAD", (file as File).name);
  revalidatePath("/dashboard/import/report");
  redirect(`/dashboard/import/report?batch=${result.batchId}`);
}

export async function uploadShiftsCsvAction(formData: FormData) {
  const user = await requireManager();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/import?error=${encodeURIComponent("Choose a shifts CSV file first.")}`);
  }

  const text = await (file as File).text();
  const result = await importShiftsCsv(text, "UPLOAD", (file as File).name, user.id);
  revalidatePath("/dashboard/import/report");
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard");
  redirect(`/dashboard/import/report?batch=${result.batchId}`);
}
