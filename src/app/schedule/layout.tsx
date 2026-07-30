import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/sign-out-button";
import { LogoMark } from "@/components/logo-mark";

export default async function ScheduleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/schedule" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-lg font-medium">Rounds</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
