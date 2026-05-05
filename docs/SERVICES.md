# Services Reference

| Service | Purpose | Free Tier | Link |
|---|---|---|---|
| Vercel | Frontend hosting + serverless | Generous | vercel.com |
| Supabase | Postgres DB + auth | 500MB, 50k rows | supabase.com |
| Clerk | User authentication | 10k MAU | clerk.com |
| Resend | Transactional email | 3k/mo | resend.com |
| Cloudflare | DNS + CDN + domain | Free | cloudflare.com |
| Sentry | Error monitoring | 5k errors/mo | sentry.io |
| UptimeRobot | Uptime monitoring | 50 monitors | uptimerobot.com |
| Google Workspace | Business email | $6/user/mo | workspace.google.com |

## Environment Variables Needed Per Service

### Supabase
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### Clerk
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

### Resend
- RESEND_API_KEY
- EMAIL_FROM

### Sentry
- NEXT_PUBLIC_SENTRY_DSN
- SENTRY_AUTH_TOKEN
