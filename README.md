# Streaks

A habit tracker with accountability partners — track daily/weekly habits,
see your streak history as a contribution-style heatmap, and pair up with a
partner who can see your progress and nudge you when you're falling behind.

**[Live demo](#)** · **[Screenshots below](#screenshots)**

## Why this exists

Most habit-tracker portfolio projects are single-user CRUD. The interesting
part of this one is the accountability-partner relationship: it forces
real relational data modeling (partnerships between two users, not just a
user and their own rows), plus a small but genuine algorithm problem —
calculating streaks correctly across timezones, missed days, and week
boundaries. See [`src/lib/streaks.ts`](./src/lib/streaks.ts) for that logic
and its test suite.

## Features

- Email/password or Google OAuth sign-in
- Create daily or weekly habits, check them off, watch streaks build
- GitHub-style contribution heatmap per habit
- Invite a partner by email; once accepted, see their top streak on your
  dashboard and send them a nudge (rate-limited to one per 12h so it stays
  a light tap, not spam)

## Tech stack

- **Next.js 14** (App Router) — frontend + API routes in one deployable app
- **PostgreSQL** via [Neon](https://neon.tech) or [Supabase](https://supabase.com) — both have usable free tiers
- **Prisma** — schema, migrations, typed queries
- **NextAuth.js** — session management, Google OAuth + credentials providers
- **Zod** — request validation on every API route
- **Vitest** — unit tests for the streak calculation logic

## Architecture notes

A few decisions worth knowing if you're reading the code:

- **Streak math is pure functions, isolated from the DB.** `calculateStreak`
  takes an array of dates and returns `{ currentStreak, longestStreak }` —
  no side effects, no Prisma import. That's what makes it unit-testable
  without spinning up a database (see `streaks.test.ts`).
- **Dates are compared as local calendar days, not UTC timestamps.** Diffing
  raw `Date` objects breaks around timezone edges and DST; every comparison
  goes through a `YYYY-MM-DD` key first.
- **Ownership checks return 404, not 403.** If you request a habit or
  partnership that isn't yours, the API returns "not found" rather than
  "forbidden" — this avoids confirming that a given ID exists at all.
- **Check-off is a toggle, not separate create/delete endpoints.** One
  `POST /api/habits/[id]/logs` flips today's log on or off; a DB-level
  unique constraint on `(habitId, date)` prevents double-logging regardless
  of what the client sends.

## Getting started

```bash
git clone <this-repo>
cd streaks
npm install

cp .env.example .env.local
# fill in DATABASE_URL, NEXTAUTH_SECRET, and (optionally) Google OAuth creds

npx prisma migrate dev --name init
npm run dev
```

Visit `http://localhost:3000`.

### Running tests

```bash
npx vitest run
```

## Deployment

- **Frontend + API routes**: [Vercel](https://vercel.com) — connect the repo,
  set the same env vars from `.env.example` in the project settings, deploy.
- **Database**: [Neon](https://neon.tech) free tier works well with Vercel's
  serverless functions (connection pooling built in). Supabase is a solid
  alternative.
- Remember to set `NEXTAUTH_URL` to your deployed URL, and add it as an
  authorized redirect URI in the Google Cloud Console if using OAuth.

## Roadmap / not yet built

- Email reminders for habits not yet checked off today (cron job)
- Weekly summary email
- Public shareable streak badge

## Screenshots

_Add dashboard, habit detail, and partners page screenshots here before
sharing this repo — reviewers often won't clone it, so this is what they'll
actually see._
