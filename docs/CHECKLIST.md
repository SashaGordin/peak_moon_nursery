# MVP Launch Checklist

## 1. Domain & DNS
- [ ] Register domain (Cloudflare Registrar)
- [ ] Point nameservers to Cloudflare
- [ ] Add CNAME record → Vercel deployment URL
- [ ] Add MX records for email (Google Workspace or Zoho)

## 2. Services Setup
- [ ] Create Supabase project → copy URL + keys to .env.local
- [ ] Create Clerk application → copy keys to .env.local
- [ ] Create Resend account → verify domain → copy API key
- [ ] Set up Sentry project → copy DSN

## 3. Vercel Deployment
- [ ] Push repo to GitHub
- [ ] Import project in Vercel dashboard
- [ ] Add all environment variables from .env.example
- [ ] Set custom domain in Vercel → project → Settings → Domains

## 4. Email
- [ ] Add Resend DNS records (SPF, DKIM, DMARC) in Cloudflare
- [ ] Verify sending domain in Resend dashboard
- [ ] Set up business email (Google Workspace: admin.google.com)
- [ ] Test transactional email with a real address

## 5. Database
- [ ] Run initial migration: npm run db:migrate
- [ ] Regenerate types: npm run db:types
- [ ] Enable backups in Supabase dashboard (Pro plan)

## 6. Monitoring
- [ ] Sentry connected and receiving errors
- [ ] Set up UptimeRobot on /api/health endpoint (free)
- [ ] Add Vercel Analytics or Plausible

## 7. Legal (if collecting user data)
- [ ] Privacy Policy (Termly or Iubenda)
- [ ] Terms of Service
- [ ] Cookie banner (if EU users)

## 8. Pre-launch
- [ ] Test auth flow end-to-end (sign up, sign in, sign out)
- [ ] Test transactional email delivery
- [ ] Check /api/health returns 200
- [ ] Verify custom domain loads over HTTPS
- [ ] Run Lighthouse audit (score > 80)
