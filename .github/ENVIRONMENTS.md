# Environment Setup Checklist

## 1. Supabase — Create Projects

### Development (current)
- Project: `mfhlvlvfhjglxljasfgp` (already exists)
- Used for: local development

### Staging (create new)
Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project:
- Name: `catatan-staging`
- Region: Southeast Asia (Singapore)
- After creation:
  1. Run the migration: `STAGING_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres pnpm db:migrate:staging`
  2. Copy API keys to Vercel (Preview environment)

### Production (create new)
- Name: `catatan-prod`
- Region: Southeast Asia (Singapore)
- After creation:
  1. Run the migration: `PRODUCTION_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres pnpm db:migrate:prod`
  2. Copy API keys to Vercel (Production environment)
  3. Enable email confirmations
  4. Set custom SMTP (for branded emails)
  5. Configure Google OAuth with production redirect URLs

## 2. Vercel — Connect Repository

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select `marshielo/NoteApp`
3. Framework: Next.js
4. Root directory: `apps/web`
5. Build command: `pnpm build`
6. Install command: `pnpm install`

### Environment Variables in Vercel

**Production** (branch: main):
```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://catatan.app  (or your domain)
NEXT_PUBLIC_SUPABASE_URL=https://[prod-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]
XENDIT_SECRET_KEY=xnd_production_xxx
XENDIT_WEBHOOK_TOKEN=[from Xendit dashboard]
NEXT_PUBLIC_UMAMI_WEBSITE_ID=[your-umami-id]
```

**Preview** (branch: staging):
```
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.catatan.app
NEXT_PUBLIC_SUPABASE_URL=https://[staging-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[staging-service-role-key]
XENDIT_SECRET_KEY=xnd_development_xxx
XENDIT_WEBHOOK_TOKEN=[from Xendit dashboard]
```

## 3. GitHub — Secrets & Environments

Go to GitHub → Settings → Environments:

### Create `staging` environment
- No required reviewers
- Branch: `staging`

### Create `production` environment
- ✅ Required reviewers: 1
- Branch: `main`

### Add secrets (Settings → Secrets → Actions):
See BRANCH_PROTECTION.md for the full list.

## 4. Xendit — Environment Keys

### Development
- Dashboard: [dashboard.xendit.co](https://dashboard.xendit.co)
- Use "Test Mode" toggle
- Key prefix: `xnd_development_`

### Production
- Switch to "Live Mode" in Xendit dashboard
- Complete KYC verification
- Key prefix: `xnd_production_`
- Set webhook URL: `https://catatan.app/api/webhooks/xendit`
- Set callback token in Vercel env vars

## 5. Domain Setup (Production)

1. Buy domain (e.g., `catatan.app` via Google Domains/Namecheap)
2. Add to Vercel: Project → Settings → Domains
3. Configure DNS records as Vercel instructs
4. Update Supabase redirect URLs:
   - `https://catatan.app/auth/callback`
5. Update Xendit webhook URLs
