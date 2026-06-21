# Portfolio Tracker

A web app that replaces a Google-Sheet stock portfolio. It stores your holdings,
auto-fetches **live prices** from Yahoo Finance for NSE/BSE stocks & ETFs, and
shows Buy Value, CMP, Current Value, % Gain and Gain ₹ with totals — behind a login.

![columns](Stock · Buy Price · Qty · Buy Value · CMP · Current Value · % Gain · Gain ₹)

## Tech

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for the UI
- **Prisma** ORM — SQLite locally, Postgres (Neon) in production
- **Auth.js (NextAuth v5)** — email + password login
- **SWR** — auto-refreshes prices every 60s
- Live prices via Yahoo Finance's public chart endpoint (no API key, no crumb).
  See [`lib/yahoo.ts`](lib/yahoo.ts).

## Run locally

```bash
npm install
npx prisma migrate dev      # creates prisma/dev.db (SQLite)
npx prisma db seed          # loads the starter holdings + a login
npm run dev                 # http://localhost:3000
```

**Seeded login** (change the password after first sign-in):

```
email:    ankitkumar@tenovia.com
password: changeme123
```

Override the seed account with `SEED_EMAIL` / `SEED_PASSWORD` env vars before
running `npx prisma db seed`.

## Using it

- **Add holding** — symbol (e.g. `NTPC`), exchange (NSE/BSE), buy price, quantity.
  The Yahoo ticker is auto-built (`NTPC.NS`). For ETFs/odd tickers you can set an
  explicit Yahoo symbol override.
- **Edit / Delete** — per row in the table.
- **Refresh** — manual button; prices also auto-refresh every 60s. Quotes are
  cached server-side for 60s to be gentle on Yahoo.
- The header cards show Invested, Current Value, Unrealised Gain ₹ and Return %.

## Useful scripts

```bash
npx tsx scripts/check-quotes.ts   # prints a live price for every holding's ticker
npx prisma studio                 # browse/edit the database in a GUI
```

## Environment variables

See [`.env.example`](.env.example). Local dev needs only the defaults in `.env`.

| Variable             | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `DATABASE_URL`       | SQLite file locally; Neon Postgres URL in production |
| `AUTH_SECRET`        | Signs session JWTs (`openssl rand -base64 32`)       |
| `ALLOW_REGISTRATION` | `"false"` to lock sign-ups after creating accounts   |

## Deploy

See [DEPLOY.md](DEPLOY.md) for the Vercel + Neon Postgres walkthrough.

## Not yet built (v2 ideas)

Realised / booked-P&L tracking, multiple portfolios, dividends, crypto — the
lower section of the original sheet.
