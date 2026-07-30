import Link from "next/link";
import { ArrowRight, CheckCircle2, FileWarning, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverageSphere } from "@/components/coverage-sphere";
import { StatusBadge } from "@/components/status-badge";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="font-display text-lg font-medium">Rounds</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#import" className="hover:text-foreground">
            Import
          </a>
          <a href="#coverage" className="hover:text-foreground">
            Coverage
          </a>
        </nav>
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline" className="rounded-full">
          Sign in
        </Button>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-4">
          <div className="relative overflow-hidden rounded-3xl bg-[#0e0f12]">
            <div className="relative grid gap-8 md:grid-cols-[1.15fr_1fr]">
              <div className="flex flex-col justify-center px-8 py-14 md:px-12">
                <span className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/70">
                  Built for clinic scheduling
                </span>
                <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-white md:text-[3.25rem]">
                  Every shift covered. No spreadsheet required.
                </h1>
                <p className="mt-5 max-w-md text-white/60">
                  Rounds turns your clinic&apos;s messy shift spreadsheet into a live schedule.
                  Staff claim their own shifts, managers see exactly who&apos;s missing, and the
                  rules — headcount, overlap, no double-booking — hold up no matter how many
                  people are clicking at once.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    render={<Link href="/login" />}
                    nativeButton={false}
                    size="lg"
                    className="gap-1.5 rounded-full bg-white text-[#0e0f12] hover:bg-white/90"
                  >
                    Sign in <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="relative min-h-[320px] md:min-h-0">
                <CoverageSphere />
              </div>
            </div>
          </div>
        </section>

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
                  <StatusBadge status="full" className="hidden sm:inline-flex" />
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
            <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-5">
              {[
                { time: "Mon · 08:00–16:00", need: "2 nurses, 1 doctor", status: "full" as const },
                { time: "Mon · 16:00–00:00", need: "1 doctor missing", status: "partial" as const },
                { time: "Tue · 22:00–06:00", need: "3 nurses, 1 doctor missing", status: "empty" as const },
              ].map((row) => (
                <div
                  key={row.time}
                  className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{row.time}</p>
                    <p className="text-xs text-muted-foreground">{row.need}</p>
                  </div>
                  <StatusBadge status={row.status} />
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
