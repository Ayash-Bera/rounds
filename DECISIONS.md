# Decisions

Short rationale for the choices that weren't obvious, roughly in the order a reviewer would hit them.

## Stack

Next.js (App Router) + Prisma + Postgres, deployed on Vercel. Auth is NextAuth v5 with a Credentials
provider and JWT sessions — no third-party auth account was available in the build environment, and
this keeps the app portable to any Postgres host with a single `DATABASE_URL` change. The coverage
dashboard live-updates via SWR polling (5s) instead of websockets, for the same reason: it works
anywhere with zero extra infrastructure.

## Editing a shift that already has claims

Editing a shift's time or requirements never silently drops or auto-fixes existing claims.
`computeShiftClaimIssues` re-runs the headcount/overlap rules against the edit and flags exactly which
claims now violate them; a manager resolves each one explicitly from the shift detail page. Silently
un-claiming someone from a shift they're relying on for income is the wrong default for this kind of
tool.

## Concurrency

Claiming a shift — self-serve or manager-assigned — runs inside a transaction that takes
`SELECT ... FOR UPDATE` on the shift row before re-checking headcount and overlap, so two people can't
claim the last open slot at once. Both entry points call the same `claimShiftForStaff` function, so the
rules can't drift between them.

## CSV import

- Role synonyms resolve through an explicit allow-list; anything unrecognized is rejected rather than
  guessed — a wrong guess is worse than a manager fixing one row by hand.
- Staff dedup keys on normalized **email**, not `staff_id`, since that's the real identity signal in
  this data. One email shared by two different names is a conflict, not a duplicate — it's rejected,
  not merged.
- Dates: ISO is unambiguous; slash dates are treated as day-first and dash dates as month-first,
  distinguishable in this dataset by values over 12. Impossible calendar dates are rejected outright.
- Overnight shifts (`end_time <= start_time`) are valid and roll to the next day — they're the majority
  pattern in the data, not garbage.
- Free-text requirements get a best-effort parse, logged as `MERGED` so a manager can spot-check them.
- Every row's outcome is written to `ImportLogRow`, whether it came from the seed script or a manager's
  upload — both paths share the same import functions.

## Recurring shifts

A series is materialized into real `Shift` rows tagged with a `seriesId`, not computed on the fly. That
means claims, coverage, and issue-detection all treat a recurring shift exactly like a one-off, with no
special-casing elsewhere in the codebase. Capped at 260 occurrences so a mistyped end date can't
generate years of shifts.

## Visual design

The brief asked for a video-style hero; a Remotion render pipeline was more deploy risk than the payoff
justified, so the hero is a single full-bleed image instead, on a quiet grayscale shell with the app's
own status colors (green/amber/coral) as the only accent. Status indicators across the app were unified
into one component — a fill bar plus a claimed/needed fraction — replacing a colored-pill pattern that
was repeated in four places and read as generic rather than something built for this product.

## Staff assignment UX

The manager's assign UI groups staff into per-profession checklists (Nurses / Doctors / Receptionists)
with live headcounts, rather than one flat list — a flat list stopped scaling past a handful of eligible
staff. Two rules reuse the existing claim logic instead of duplicating it: staff with a conflicting
shift elsewhere are filtered out entirely, and candidates grey out once a group's headcount is met. The
checkbox toggle is optimistic — it flips instantly and reconciles with the server in the background,
rolling back only on rejection — but the server stays the source of truth, so the tradeoff never
produces an incorrect *persisted* state, only a briefly optimistic in-flight one.

## Pagination

The shift list and staff schedule page originally hard-capped at N rows with no pagination and no
signal that more existed. Both now paginate properly, with an accurate count query and disabled
boundary controls.

## CI/CD

GitHub Actions runs typecheck and the full test suite on every push and PR — no database required,
since the suite is pure-function unit tests. Deployment is handled by Vercel's native GitHub
integration rather than reimplemented in Actions, since the platform already does build caching,
rollbacks, and preview deploys better than a custom step would.

## Known limitations

- Concurrency is covered by unit tests against the pure rule functions, not an integration test that
  proves `SELECT ... FOR UPDATE` actually serializes two simultaneous claims against a live database —
  the one gap that touches a requirement the brief called out directly.
- No end-to-end UI test suite, no login rate-limiting, no audit trail for manual claim changes (CSV
  imports get one, manual assigns don't), and shift times are hardcoded UTC rather than per-clinic
  timezone.
- During polish work, local dev briefly pointed at the production database instead of the local
  container — a stale `.env.local` from an earlier `vercel env pull` took precedence over `.env`, and a
  handful of test clicks landed as real writes. Fixed by always passing `DATABASE_URL` explicitly when
  testing locally instead of trusting whichever env file happens to be present.
