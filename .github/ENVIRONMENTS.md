# Environment Setup Checklist

## Overview — 3 Environments

| Environment | Branch | Supabase Project | Vercel Scope | URL |
|-------------|--------|-----------------|--------------|-----|
| Development | `dev` | `catatan-dev` | Preview → branch `dev` | `catatan-dev.vercel.app` |
| Staging | `staging` | `catatan-staging` | Preview → branch `staging` | `catatan-staging.vercel.app` |
| Production | `main` | `catatan-prod` | Production | `catatan.app` (custom domain) |

## 1. Supabase — Create 3 Projects

Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project for each:

### Development
- Name: `catatan-dev`
- Region: Southeast Asia (Singapore)
- After creation:
  ```bash
  DEV_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres pnpm db:migrate
  ```

### Staging
- Name: `catatan-staging`
- Region: Southeast Asia (Singapore)
- After creation:
  ```bash
  STAGING_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres pnpm db:migrate:staging
  ```

### Production
- Name: `catatan-prod`
- Region: Southeast Asia (Singapore)
- After creation:
  1. Run: `PRODUCTION_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres pnpm db:migrate:prod`
  2. Enable email confirmations
  3. Set custom SMTP (for branded emails)
  4. Configure Google OAuth with production redirect URLs

## 2. Vercel — Connect Repository

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select `marshielo/NoteApp`
3. Framework: Next.js
4. Root directory: `apps/web`
5. Build command: `pnpm build`
6. Install command: `pnpm install`

### How Vercel Environments Work

Vercel has 3 scopes for environment variables:
- **Production** → only applies to `main` branch deploys
- **Preview** → applies to ALL non-main branches (staging, dev, PRs, etc.)
- **Development** → only for `vercel dev` locally (you probably won't use this)

**The problem:** both `staging` and `dev` are "Preview" deploys, so by default they'd share the same env vars.

**The solution:** Vercel lets you **scope Preview variables to a specific branch**.

### Setting Env Vars in Vercel Dashboard

Go to **Project → Settings → Environment Variables**.

#### For Production (`main` branch)

Add each variable, check only **☑ Production**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://catatan.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[prod-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[prod-anon-key]` |
| `SUPABASE_SERVICE_ROLE_KEY` | `[prod-service-role-key]` |
| `XENDIT_SECRET_KEY` | `xnd_production_xxx` |
| `XENDIT_WEBHOOK_TOKEN` | `[from Xendit dashboard]` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | `[your-umami-id]` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC` | `true` |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `true` |
| `NEXT_PUBLIC_DEBUG_MODE` | `false` |

#### For Staging (`staging` branch)

Add each variable, check only **☑ Preview**, then:
1. Click **"Select Custom Branch"** (or the branch filter)
2. Type **`staging`** and select it

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_ENV` | `staging` |
| `NEXT_PUBLIC_APP_URL` | `https://catatan-staging.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[staging-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[staging-anon-key]` |
| `SUPABASE_SERVICE_ROLE_KEY` | `[staging-service-role-key]` |
| `XENDIT_SECRET_KEY` | `xnd_development_xxx` |
| `XENDIT_WEBHOOK_TOKEN` | `[from Xendit dashboard]` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `true` |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC` | `true` |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `true` |
| `NEXT_PUBLIC_DEBUG_MODE` | `true` |

#### For Development (`dev` branch)

Add each variable, check only **☑ Preview**, then:
1. Click **"Select Custom Branch"**
2. Type **`dev`** and select it

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_ENV` | `development` |
| `NEXT_PUBLIC_APP_URL` | `https://catatan-dev.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[dev-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[dev-anon-key]` |
| `SUPABASE_SERVICE_ROLE_KEY` | `[dev-service-role-key]` |
| `XENDIT_SECRET_KEY` | `xnd_development_xxx` |
| `XENDIT_WEBHOOK_TOKEN` | `[from Xendit dashboard]` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `false` |
| `NEXT_PUBLIC_ENABLE_CLOUD_SYNC` | `false` |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `false` |
| `NEXT_PUBLIC_DEBUG_MODE` | `true` |

> **Tip:** In the Vercel UI, when you check "Preview" and expand the branch selector, you'll see a text input to type the branch name. This is how you differentiate staging from dev.

### Vercel Preview Aliases

The deploy workflow automatically aliases preview deploys:
- `staging` branch → `catatan-staging.vercel.app`
- `dev` branch → `catatan-dev.vercel.app`

> **Note:** Replace `catatan` with your actual Vercel project name if different.

## 3. GitHub — Secrets & Environments

### Create GitHub Environments

Go to **GitHub → Repo Settings → Environments**:

#### `development` environment
- No required reviewers
- Deployment branch: `dev`

#### `staging` environment
- No required reviewers
- Deployment branch: `staging`

#### `production` environment
- ✅ Required reviewers: 1
- Deployment branch: `main`

### Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token ([vercel.com/account/tokens](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after `vercel link` |
| `DEV_DB_URL` | `postgresql://postgres:[pw]@db.[dev-ref].supabase.co:5432/postgres` |
| `STAGING_DB_URL` | `postgresql://postgres:[pw]@db.[staging-ref].supabase.co:5432/postgres` |
| `PRODUCTION_DB_URL` | `postgresql://postgres:[pw]@db.[prod-ref].supabase.co:5432/postgres` |

## 4. Xendit — Payment Keys

### Development & Staging
- Dashboard: [dashboard.xendit.co](https://dashboard.xendit.co)
- Use **"Test Mode"** toggle
- Key prefix: `xnd_development_`
- Webhook URL (staging): `https://catatan-staging.vercel.app/api/webhooks/xendit`

### Production
- Switch to **"Live Mode"** in Xendit dashboard
- Complete KYC verification
- Key prefix: `xnd_production_`
- Webhook URL: `https://catatan.app/api/webhooks/xendit`

## 5. Domain Setup (Production)

1. Buy domain (e.g., `catatan.app` via Google Domains/Namecheap)
2. Add to Vercel: **Project → Settings → Domains**
3. Configure DNS records as Vercel instructs
4. Update Supabase redirect URLs:
   - `https://catatan.app/auth/callback`
5. Update Xendit webhook URLs

## 6. Git Branch Flow

```
dev  →  staging  →  main
 ↑         ↑         ↑
 |         |         |
 develop   test      release
 features  & QA      to prod
```

- **dev**: Merge feature branches here first. Auto-deploys to `catatan-dev.vercel.app`.
- **staging**: Merge dev → staging when ready for QA. Auto-deploys to `catatan-staging.vercel.app`.
- **main**: Merge staging → main for production release. Auto-deploys to `catatan.app`.
