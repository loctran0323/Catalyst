# Catalyst

A Next.js dashboard for retail investors: **watchlist**, **upcoming macro and ticker timeline**, **RSS news briefing** (with optional AI summaries), and a **sector → industry market map**. Auth and data live in **Supabase**; optional digests via **Resend**.

## Features

- **Auth** — Email/password (and compatible flows) with Supabase Auth
- **Watchlist** — Tickers drive ticker-tagged headlines and company timeline rows
- **Timeline** — Merged `market_events`, rolling synthetic macro schedule, and Google News headline rows per symbol (upcoming-only filtering)
- **News briefing** — Multiple public RSS sources; All / Tickers / topic tabs; main view shows roughly the last **3 days** (older items on signed-in **Archive** when feeds still carry them); optional OpenAI-generated summary and bullish/bearish/neutral read
- **Market map** — Treemap-style sector view with Yahoo-backed quotes (best-effort)
- **Settings** — Digest frequency (daily / weekly / off) and test email when Resend is configured
- **Auto-refresh** — Dashboard polls server data on an interval while the tab is open (`dynamic` route + client `router.refresh`)

## Tech stack

- [Next.js](https://nextjs.org/) 15 (App Router) · React 19 · TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Supabase](https://supabase.com/) (Postgres, Auth, SSR client)
- [Resend](https://resend.com/) (email)
- Optional [OpenAI](https://openai.com/) API for headline briefs

## Prerequisites

- Node.js 20+ recommended
- A [Supabase](https://supabase.com) project
- (Optional) Resend account and verified sender
- (Optional) OpenAI API key

## Local setup

```bash
git clone <your-repo-url>
cd StartUpIdeaMarkets
npm install
cp .env.example .env.local
```

Edit **`.env.local`** with your Supabase URL and anon (or publishable) key at minimum. See `.env.example` for all variables.

### Database

Run SQL migrations in order against your Supabase SQL editor (or CLI):

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_profiles_insert_policy.sql`

Optionally run **`supabase/seed.sql`** for sample `market_events`.

### Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then use the dashboard.

### Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Dev server (Turbopack) |
| `npm run build`| Production build   |
| `npm run start`| Start production server |
| `npm run lint` | ESLint             |

## Environment variables

Copy from **`.env.example`**. Important entries:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical site URL for auth redirects |
| `RESEND_API_KEY` | Optional | Digest / test emails |
| `RESEND_FROM_EMAIL` | Optional | From address (must be allowed in Resend) |
| `OPENAI_API_KEY` | Optional | Richer news briefs |
| `CRON_SECRET` | Cron only | Protects `/api/cron/digest` |

Never commit **`.env.local`** or service role keys.

## Deploying to Vercel

1. Push this repo to GitHub (or GitLab / Bitbucket).
2. Import the repo in [Vercel](https://vercel.com) as a Next.js project.
3. Add the same env vars as in `.env.example` (use your production URL for `NEXT_PUBLIC_SITE_URL`).
4. In Supabase **Authentication → URL configuration**, set **Site URL** and **Redirect URLs** to your Vercel domain (including `/auth/callback` if you use that route).

**Cron:** `vercel.json` schedules `/api/cron/digest` daily. Set `CRON_SECRET` in Vercel; confirm cron availability for your Vercel plan. The route is a stub you can extend for batch digests.

## Project layout (high level)

```
src/app/           # App Router pages (landing, auth, dashboard, map, settings)
src/components/    # UI components
src/lib/           # Supabase client, news RSS, events, market map data, email
supabase/migrations/
```

## Disclaimer

RSS and third-party market data are **informational only**, not investment advice. Verify material facts before acting.

## License

Private / all rights reserved unless you add an explicit license file.
