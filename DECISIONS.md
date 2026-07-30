# Decisions

## Stack

Next.js (App Router) + Prisma + Postgres, deployed on Vercel. Auth is NextAuth v5 with a
Credentials provider and JWT sessions — no Supabase/Auth0 account was available in the build
environment, so this keeps the app portable to any Postgres host (Neon, Vercel Postgres, Supabase,
plain RDS) with a single `DATABASE_URL` change. Live updates use SWR polling (5s interval) rather
than websockets, for the same reason: it works on any host with zero extra infrastructure.

## Editing a shift that already has claims

Editing a shift's time or requirements does **not** silently drop or auto-fix existing claims.
Instead, `computeShiftClaimIssues` (`src/lib/claims/rules.ts`) re-runs the same headcount/overlap
rules against the edited shift and flags which existing claims now violate them — over-capacity
claims are flagged oldest-claim-first (the newest claim past capacity is the one flagged), and any
claim that now overlaps another shift is flagged too. The shift detail page
(`/dashboard/shifts/[id]`) surfaces these as a warning banner naming the affected staff member and
the reason, and a manager removes the claim manually. This was chosen over automatically
un-claiming people, because silently dropping someone's shift without a manager seeing it first
felt like the wrong default for a scheduling tool people rely on for their income.

## Concurrency

Claiming (whether by a staff member or a manager assigning someone) runs inside a single Postgres
transaction that takes `SELECT ... FOR UPDATE` on the shift row before re-reading claim counts and
overlap state. This serializes concurrent claim attempts on the same shift so two people can't
both claim the last open nurse slot — the second request re-checks against the first request's
already-committed write. The same `claimShiftForStaff` function backs both the staff self-claim
flow and the manager-assign flow, so the rules can't drift between the two entry points.

## CSV import

- **Role synonyms** are resolved via an explicit allow-list (`src/lib/import/roles.ts`) —
  `RN` / `Registered Nurse` / `nurse` / `NURSE` all map to `NURSE`, etc. Anything outside the list
  (e.g. `Janitor`) is rejected rather than guessed, since silently misclassifying a role is worse
  than asking a manager to fix the row by hand.
- **Staff dedup key is normalized email**, not `staff_id`, because the dirty data has the same
  person under two different IDs (real identity signal is the email) and also has one email reused
  by two different names (an identity conflict, not a duplicate) — that second case is rejected,
  not merged, since guessing which name is correct isn't safe.
- **Dates**: three formats appear in the file. ISO (`YYYY-MM-DD`) is unambiguous. Slash dates are
  treated as day-first (`DD/MM/YYYY`) and dash dates as month-first (`MM-DD-YYYY`) — distinguishable
  in this dataset because dash dates include values like `08-25-2026` where the second number
  exceeds 12 and can't be a month. Impossible calendar dates (`2026-02-30`) are rejected outright.
- **Overnight shifts** (`end_time <= start_time`, e.g. `22:00` → `06:00`) are treated as valid and
  rolled to the next day, not as an error — they're the majority pattern in the data, not garbage.
- **Free-text requirements** ("two nurses and a doctor") get a best-effort word-to-number parse and
  are logged as `MERGED` (interpreted, not verbatim) so a manager can spot-check them on the import
  report; anything the parser can't confidently read is rejected with a reason.
- Every row's outcome (accepted / merged / rejected + reason) is written to `ImportLogRow`, so the
  Import Report page shows the exact same data whether the row came from the seed CSVs or a
  manager's upload — both paths call the same `importStaffCsv` / `importShiftsCsv` functions.

## Recurring shifts

A recurring series is **materialized**, not computed on the fly: creating one generates a real
`Shift` row for every matching day in the range, tagged with a `seriesId`. Editing or deleting one
occurrence only touches that row; editing/deleting the series touches all rows sharing the id. This
was chosen over virtual/computed occurrences because it means every other part of the app (claims,
coverage dashboard, claim-issue detection) treats a recurring shift exactly like a one-off shift —
no special-casing needed anywhere else in the codebase. The tradeoff is a capped generation limit
(260 occurrences) to stop a mistyped end-date from generating years of shifts.

## Hero video

The brief asked for a video-style hero. Rather than standing up a Remotion render pipeline (extra
build dependency, headless-Chromium render step, more that can break the deploy), the tumbling-orb
animation is pure CSS (`src/components/orb-field.tsx` + keyframes in `globals.css`) — visually a
looping video, but a static asset with zero render risk and it respects
`prefers-reduced-motion`. It also reuses the app's own status colors (green/amber/rose), so the
marketing page previews the product's own visual language.

## What I'd do differently with more time

Add Postgres row-level locking tests that actually spin up concurrent requests against a live DB
(the current claim-rule tests are unit tests against pure functions, not an integration test that
proves the `SELECT ... FOR UPDATE` genuinely serializes two simultaneous claims) — and add an
end-to-end test suite (Playwright) covering the claim/assign/import flows through the real UI, not
just the underlying logic.
