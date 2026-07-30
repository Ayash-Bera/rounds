import { auth } from "@/auth";

export async function requireManager() {
  const session = await auth();
  if (!session || session.user.role !== "MANAGER") {
    throw new Error("Manager access required.");
  }
  return session.user;
}

export async function requireUser() {
  const session = await auth();
  if (!session) {
    throw new Error("Sign in required.");
  }
  return session.user;
}
