# Deploying to Vercel + Neon Postgres

Local dev uses SQLite. Vercel's filesystem is ephemeral, so production needs a
real database — we use **Neon** (free Postgres, no credit card). One-time setup,
~15 minutes.

---

## 1. Create a Neon database

1. Go to <https://neon.tech> and sign up (GitHub login is fine).
2. Create a project (any name, region close to you e.g. Singapore/Mumbai).
3. Copy the **connection string**. It looks like:
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
   Use the **pooled** connection string (the one with `-pooler`).

## 2. Switch Prisma to Postgres

In [`prisma/schema.prisma`](prisma/schema.prisma) change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Then point your local `.env` at Neon and create the tables:

```bash
# .env
DATABASE_URL="postgresql://...your neon pooled url...?sslmode=require"

npx prisma db push      # creates the tables on Neon (no migration files needed)
npx prisma db seed      # OPTIONAL: load the starter holdings + login
```

> We use `prisma db push` (schema-first) rather than `migrate deploy` so you
> don't have to regenerate the SQLite migration for Postgres. The schema is
> simple enough that this is safe.

Verify locally against Neon with `npm run dev` before deploying.

## 3. Generate a production AUTH_SECRET

```bash
openssl rand -base64 32
# or, on Windows without openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 4. Push the code to GitHub

```bash
git add -A
git commit -m "Portfolio tracker app"
git branch -M main
git remote add origin https://github.com/<you>/portfolio-tracker.git   # if not set
git push -u origin main
```

`.env` and `prisma/*.db` are gitignored — secrets and the local DB are not pushed.

## 5. Import into Vercel

1. <https://vercel.com> → **Add New… → Project** → import your `portfolio-tracker` repo.
2. Framework preset: **Next.js** (auto-detected). Build command stays
   `npm run build` (it runs `prisma generate` first).
3. Add **Environment Variables** (Production + Preview):

   | Name                 | Value                                          |
   | -------------------- | ---------------------------------------------- |
   | `DATABASE_URL`       | your Neon pooled connection string             |
   | `AUTH_SECRET`        | the value from step 3                          |
   | `ALLOW_REGISTRATION` | `true` (set to `false` after creating account) |

4. Click **Deploy**. When it's live, open the URL, register (or use the seeded
   login if you ran the seed against Neon), and you're tracking from anywhere.

## 6. Lock down sign-ups (recommended)

Once your account exists, set `ALLOW_REGISTRATION=false` in Vercel → Settings →
Environment Variables and redeploy. New registrations will be rejected; you can
still log in.

---

## Notes

- **Schema changes later:** edit `prisma/schema.prisma`, run `npx prisma db push`
  against the Neon URL, commit, and redeploy.
- **Prices:** Yahoo data is ~15 min delayed and rate-limited; the app caches
  quotes for 60s server-side. If a ticker shows `—`, set an explicit Yahoo
  symbol on that holding (Edit → Yahoo symbol override).
- **Keeping SQLite for local + Postgres for prod:** simplest is to keep
  `provider = "postgresql"` everywhere and point local `.env` at Neon too. If you
  prefer SQLite locally, flip the provider back for local work — just don't commit
  the SQLite provider if your deploy expects Postgres.
