"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  let redirectTo = typeof callbackUrl === "string" && callbackUrl ? callbackUrl : undefined;
  if (!redirectTo && typeof email === "string") {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    redirectTo = user?.role === "MANAGER" ? "/dashboard" : "/schedule";
  }
  redirectTo ??= "/schedule";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const params = new URLSearchParams({ error: "invalid" });
      if (typeof callbackUrl === "string" && callbackUrl) {
        params.set("callbackUrl", callbackUrl);
      }
      redirect(`/login?${params.toString()}`);
    }
    throw error;
  }
}
