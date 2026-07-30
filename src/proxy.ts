import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/schedule");
  const isManagerOnly = pathname.startsWith("/dashboard");

  if (!session && isProtected) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isManagerOnly && session.user.role !== "MANAGER") {
    return NextResponse.redirect(new URL("/schedule", req.nextUrl.origin));
  }

  if (session && pathname === "/login") {
    const home = session.user.role === "MANAGER" ? "/dashboard" : "/schedule";
    return NextResponse.redirect(new URL(home, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/schedule/:path*", "/login"],
};
