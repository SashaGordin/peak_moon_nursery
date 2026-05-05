# MVP Template

A batteries-included starter for launching MVPs fast. Built on Next.js 14, Supabase, Clerk, and Resend — deployable to Vercel in minutes.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Clerk |
| Email | Resend |
| Hosting | Vercel |
| Monitoring | Sentry |

## Quick Start

```bash
# 1. Clone and setup
git clone <your-repo>
cd mvp-template
bash scripts/setup.sh

# 2. Fill in environment variables
# Edit .env.local with your API keys

# 3. Run database migrations
npm run db:migrate

# 4. Start dev server
npm run dev
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/health/         # Health check endpoint
│   │   ├── auth/               # Sign in / Sign up pages (Clerk)
│   │   ├── dashboard/          # Protected dashboard
│   │   ├── layout.tsx          # Root layout with ClerkProvider
│   │   └── page.tsx            # Home page
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client (client + admin)
│   │   └── email.ts            # Resend email helpers
│   ├── types/
│   │   └── database.ts         # Auto-generated Supabase types
│   └── middleware.ts           # Clerk auth middleware
├── supabase/
│   └── migrations/             # SQL migration files
├── .github/workflows/          # CI/CD (lint, typecheck, deploy)
├── scripts/
│   └── setup.sh                # One-time project setup
├── docs/
│   ├── CHECKLIST.md            # Pre-launch checklist
│   └── SERVICES.md             # Services reference & env vars
└── .env.example                # All required environment variables
```

## Docs

- [Launch Checklist](docs/CHECKLIST.md)
- [Services Reference](docs/SERVICES.md)

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run db:migrate   # Push migrations to Supabase
npm run db:types     # Regenerate TypeScript types from DB schema
```
