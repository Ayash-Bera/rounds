import Link from "next/link";
import { requireManager } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/sign-out-button";
import { LogoMark } from "@/components/logo-mark";

const NAV = [
  { href: "/dashboard", label: "Coverage" },
  { href: "/dashboard/shifts", label: "Shifts" },
  { href: "/dashboard/import", label: "Import CSV" },
  { href: "/dashboard/import/report", label: "Import report" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireManager();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-lg font-medium">Rounds</span>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-border/70 px-6 py-2 text-sm text-muted-foreground md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
