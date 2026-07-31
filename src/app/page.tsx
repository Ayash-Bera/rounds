import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, FileWarning, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { HeroContent } from "@/components/hero-content";
import { CoverageMeter, STATUS_COLOR } from "@/components/coverage-meter";

const PREVIEW_SHIFTS = [
  {
    day: "Mon",
    date: "Aug 3",
    time: "08:00–16:00",
    need: "2 nurses, 1 doctor",
    status: "full" as const,
    filled: 3,
    needed: 3,
  },
  {
    day: "Mon",
    date: "Aug 3",
    time: "16:00–00:00",
    need: "1 nurse, 1 doctor",
    status: "partial" as const,
    missing: "Missing 1 doctor",
    filled: 1,
    needed: 2,
  },
  {
    day: "Tue",
    date: "Aug 4",
    time: "22:00–06:00",
    need: "3 nurses, 1 doctor",
    status: "empty" as const,
    missing: "Missing 3 nurses, 1 doctor",
    filled: 0,
    needed: 4,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#0e0f12]">
        <Image
          src="/hero-visual.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-lg font-medium text-white">Rounds</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#import" className="hover:text-white">
              Import
            </a>
            <a href="#coverage" className="hover:text-white">
              Coverage
            </a>
          </nav>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            variant="outline"
            className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Button>
        </header>

        <div className="relative z-10 flex flex-1 items-center px-6">
          <div className="mx-auto w-full max-w-6xl">
            <HeroContent />
          </div>
        </div>
      </div>

      <main className="flex-1">
        <section id="import" className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 max-w-lg">
            <h2 className="font-display text-2xl font-medium md:text-3xl">
              Your spreadsheet is a mess. That&apos;s the point.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Duplicate staff, five spellings of &quot;nurse,&quot; dates in three formats, a shift
              that starts and ends at the same time. Rounds cleans it on the way in and shows you
              exactly what it did.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileWarning className="h-4 w-4" /> staff.csv, as exported
              </div>
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed text-muted-foreground">
{`131,Anya Haddad,NURSE,anya.haddad@clinicmail.test
113,Tara Rahman,Registered Nurse,tara.rahman@clinicmail.test
122,Priya Weber,Doctor,priya.weber(at)clinicmail.test
999,Zainab Volkov,NURSE,zainab.volkov@clinicmail.test
105,Zainab Volkov,NURSE,zainab.volkov@clinicmail.test`}
              </pre>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-status-full" /> after import
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                  <span>Anya Haddad — nurse</span>
                  <span className="hidden items-center gap-1 text-xs font-medium sm:inline-flex">
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: STATUS_COLOR.full }} /> matched
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                  <span>Tara Rahman — nurse</span>
                  <span className="text-xs text-muted-foreground">role synonym matched</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                  <span>Priya Weber — doctor</span>
                  <span className="text-xs text-muted-foreground">email repaired</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                  <span>Zainab Volkov (duplicate)</span>
                  <span className="text-xs">merged, skipped</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="coverage" className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-2xl font-medium md:text-3xl">
                See what&apos;s missing before it&apos;s a problem.
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">
                A week-at-a-glance dashboard shows every shift&apos;s staffing status and exactly
                which roles are still short — jump to any week to plan ahead.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Repeat className="h-4 w-4" /> Recurring shifts stay in sync automatically
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-card p-5 sm:grid-cols-3">
              {PREVIEW_SHIFTS.map((row, i) => (
                <div key={i} className="min-w-0">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {row.day} · {row.date}
                  </p>
                  <div
                    className="group cursor-default rounded-lg border border-border/70 border-l-2 bg-background px-3 py-2.5 text-xs transition-colors hover:border-foreground/30"
                    style={{ borderLeftColor: STATUS_COLOR[row.status] }}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-medium">{row.time}</span>
                      <CoverageMeter filled={row.filled} needed={row.needed} status={row.status} />
                    </div>
                    <p className="text-muted-foreground">{row.need}</p>
                    {row.missing && <p className="mt-1 text-muted-foreground">{row.missing}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground">
          <span>Rounds</span>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
