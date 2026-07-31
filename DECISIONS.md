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

## Landing page visual direction

The brief asked for a video-style hero. The first pass avoided a Remotion render pipeline (extra
build dependency, headless-Chromium render step, more that can break the deploy) in favor of a
tumbling-orb animation in pure CSS — visually a looping video, but a static asset with zero render
risk, respecting `prefers-reduced-motion`.

That got replaced later in a design pass toward something more deliberate and less templated. The
palette moved from a lavender/violet gradient look to a quiet grayscale shell (near-white
background, ink-black primary) with the product's own status colors — green/amber/coral — kept as
the *only* accent anywhere, since they already carry real meaning in this app and didn't need
competing with a second decorative color. The CSS orb animation itself went through one more
iteration (an SVG "orbit rings" sphere, a literal visual pun on "coverage") before landing on a
single full-bleed still image behind white overlay text — the simplest option that still reads as
intentional, with all of the hero's boldness spent in one place rather than spread across an
animated background *and* a busy layout. The eyebrow badge and pill-style buttons came out for the
same reason: fewer competing shapes, one clear signature element.

## Staff assignment UX

The manager's shift-detail page originally used a native `<select>` for assigning staff. Two
problems showed up under real use: assigning to a shift with many eligible staff meant scrolling a
single flat list, and — separately — the dropdown's selected-value display broke and started
rendering the staff member's raw database id instead of their name (a Base UI `Select.Value`
resolution quirk: without an explicit `items` map, it falls back to stringifying the raw value
rather than looking up the item's label).

Rather than patch the dropdown, the whole interaction was replaced: staff are grouped into
per-profession popovers (Nurses / Doctors / Receptionists), each a checklist with live headcount
("2 of 3") and the assigned names shown inline so a manager doesn't need to open a group just to
see who's on a shift. Two further rules come straight from the existing claim logic rather than
duplicating it:

- Staff with a conflicting overlapping shift elsewhere are filtered out of the list entirely
  (reusing `shiftsOverlap` from `src/lib/claims/rules.ts`) — offering an assignment that the server
  will reject anyway is just wasted motion.
- Once a profession's required headcount is met, remaining unclaimed candidates in that group grey
  out and can't be checked, since the server would reject them too (`validateClaim` already treats
  `already >= needed` as a hard rejection, including when `needed` is `0`).

The checkbox toggle is optimistic: it flips immediately on click and reconciles with the server in
the background, rolling back (with an inline reason) only if the request is actually rejected. A
per-row request-version counter guards against a slow, now-stale response clobbering a faster
second click on the same row. This was a deliberate tradeoff — client state can briefly disagree
with the server, but the server (`claimShiftForStaff`, `unclaimShift`) remains the sole source of
truth and always wins on conflict, so the tradeoff never produces an incorrect *persisted* state,
only a slightly-optimistic in-flight one.

## Pagination

Both the manager's shift list and the staff schedule page originally used a hard `take` cap with no
pagination — the shift list silently stopped showing anything past row 60 with no indication more
existed. Both now paginate for real (page param, `skip`/`take`, an accurate count query, and
properly-disabled boundary controls). One implementation detail worth noting: a `disabled` prop on
a `Button` rendered as a Next.js `Link` does nothing, since `disabled` isn't a valid attribute on an
anchor tag — the boundary buttons render as a plain disabled `<button>` instead of a disabled-styled
but still-clickable link.

## CI/CD

GitHub Actions runs typecheck and the full test suite on every push and pull request — no database
required, since the test suite is entirely pure-function unit tests (CSV normalization, claim
rules). Deployment itself is handled by Vercel's native GitHub integration rather than a deploy step
inside the Actions workflow: pushes to `master` build and promote to production automatically, and
the platform already handles build caching, rollback, and preview deployments better than
reimplementing the same thing in CI would.

## A note on local vs. production data

At one point during the post-submission polish work, local development accidentally ran against the
live production database instead of the local Postgres container — `.env.local` (pulled down once
via `vercel env pull` for an earlier deploy) takes precedence over `.env` in Next.js's env-loading
order, and it was carrying the production `DATABASE_URL`. A number of UI verification clicks during
that window landed as real writes against production rather than disposable local test data. It was
caught by comparing claim timestamps against what the test scripts had actually clicked, and the
fix going forward is procedural: always pass an explicit `DATABASE_URL` override when starting a
local dev server for testing, rather than trusting whichever `.env*` file happens to be present.
Recording this here because it's the kind of mistake worth being explicit about rather than quietly
tidying away.

## What I'd do differently with more time

- Add Postgres row-level locking tests that actually spin up concurrent requests against a live DB
  (the current claim-rule tests are unit tests against pure functions, not an integration test that
  proves the `SELECT ... FOR UPDATE` genuinely serializes two simultaneous claims) — this is the one
  gap that directly touches a requirement the brief explicitly called out (multiple staff acting on
  the same shift at once), rather than being purely a polish item.
- Add an end-to-end test suite (Playwright) covering the claim/assign/import flows through the real
  UI, not just the underlying logic.
- Rate-limit the login endpoint — there's currently no throttling on credential attempts.
- Add proper `error.tsx` / `not-found.tsx` boundaries in the app's own voice, instead of falling
  back to Next's default crash screen.
- Add an audit trail for claims (who assigned/removed whom, and when) — CSV imports already get
  full per-row logging via `ImportLogRow`, but manual claim changes don't, which a real clinic
  manager would likely want for resolving disputes.
- Move off hardcoded UTC shift times toward a per-clinic timezone setting.
