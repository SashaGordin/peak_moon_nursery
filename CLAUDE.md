# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MVP Template is a Next.js 14 (App Router) starter for launching MVPs. It integrates Clerk (auth), Supabase (database), Resend (email), and Sentry (errors), deployable to Vercel.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (no emit)
npm run db:migrate   # Push Supabase migrations
npm run db:reset     # Reset Supabase database
npm run db:types     # Regenerate TypeScript types from DB schema
```

There is no test runner configured — typecheck + lint are the verification steps.

## Architecture

**Auth flow**: Clerk handles all authentication. `src/middleware.ts` protects every route except `/`, `/sign-in(*)`, `/sign-up(*)`, and `/api/health`. The root layout wraps the app in `<ClerkProvider>`.

**Database**: Supabase (Postgres). The `profiles` table links Clerk users via `clerk_id`. Row-level security is enabled — users can only access their own profile. Use `supabaseAdmin` (service role) for server-side writes that bypass RLS; use `supabase` (anon key) for client-side queries.

**Two Supabase clients** in `src/lib/supabase.ts`:
- `supabase` — client-side, anon key, respects RLS
- `supabaseAdmin` — server-side only, service role key, bypasses RLS

**Database types** live in `src/types/database.ts` and are auto-generated. Run `npm run db:types` after any schema change.

**Email** (`src/lib/email.ts`): generic `sendEmail()` plus a `welcomeEmail()` helper. Uses Resend.

**Path alias**: `@/*` maps to `src/*`.

**CI** (`.github/workflows/ci.yml`): runs lint + typecheck on push/PR to main/develop. Production deploys via `.github/workflows/deploy.yml` on push to main.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in all keys. Required services: Supabase, Clerk, Resend, Sentry. See `docs/SERVICES.md` for service links and free tier details.

Key env vars:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `RESEND_API_KEY` / `EMAIL_FROM`
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN`
