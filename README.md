# Rounds

A clinic shift scheduler. Managers create shifts and see coverage at a glance; staff claim shifts
for themselves. Built for the take-home brief in `PROJECT_BRIEF.md`.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Prisma 7** + **Postgres**
- **NextAuth v5** (Credentials provider, JWT sessions, role-based access)
- **shadcn/ui** (Base UI primitives) + Tailwind v4
- **SWR** for live-updating the coverage dashboard (polling, no extra infra required)
- **Vitest** for unit tests

See `DECISIONS.md` for why these were chosen and the reasoning behind the trickier requirements
(concurrency, dirty CSV import, editing a shift that already has claims).

## Local setup

Requires Docker and Node 20.9+.

```bash
docker compose up -d        # starts Postgres on localhost:5433
npm install
npx prisma migrate dev      # applies the schema
npm run db:seed             # imports staff.csv / shifts.csv, creates the manager account
npm run dev                 # http://localhost:3000
```

`.env` is already checked in with a working local `DATABASE_URL` pointing at the docker-compose
Postgres instance — no setup needed beyond the commands above.

## Tests

```bash
npm test
```

Runs the Vitest suite: CSV normalization (role synonyms, date-format detection, dedup/merge
rules, requirement parsing) and the claim business rules (headcount limits, overlap detection,
re-validation after a shift edit).

## Seeded logins

Every seeded account uses the password **`rounds123!`**. The full staff list comes from
`staff.csv` after cleanup — these are a few to get started with:

| Role | Email | Notes |
|---|---|---|
| Manager | `manager@clinicmail.test` | Full access: shifts, coverage dashboard, CSV import, import report |
| Staff (doctor) | `chloe.hussain@clinicmail.test` | |
| Staff (nurse) | `aisha.sharma@clinicmail.test` | |
| Staff (receptionist) | `anya.nakamura@clinicmail.test` | |

## Deployment

Deployed on Vercel. The Postgres database is provisioned through Vercel's own Postgres
integration (Neon-backed) — no separate account needed, `DATABASE_URL` is injected automatically.
Cold starts: none, both the app and database run on always-warm free-tier infrastructure at this
scale.

Live URL: _(added after deploy)_

## Notable design decisions

- **Editing a shift with existing claims** doesn't silently drop or auto-fix them — it flags the
  specific claims that now violate the rules (over capacity, or newly overlapping) so a manager
  reviews and resolves them explicitly. See `DECISIONS.md`.
- **Concurrency**: claiming a shift takes a row lock (`SELECT ... FOR UPDATE`) inside a
  transaction before re-checking headcount and overlap, so two people can't both claim the last
  open slot.
- **CSV import** is the same code path whether it runs from the seed script or a manager's
  upload through the UI (`/dashboard/import`), and every row's outcome is visible on the Import
  Report page (`/dashboard/import/report`).
- **Recurring shifts** are materialized as real rows tagged with a series id, not computed
  on the fly — editing or deleting one occurrence never touches the rest of the series.
