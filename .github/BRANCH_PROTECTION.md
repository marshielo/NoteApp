# Branch Protection Rules

Configure these in GitHub → Settings → Branches → Branch protection rules.

## `main` (Production)
- ✅ Require pull request before merging
- ✅ Require 1 approval
- ✅ Require status checks to pass: `Lint & Type Check`, `Build (production)`
- ✅ Require branches to be up to date
- ✅ Restrict who can push: only admins
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

## `staging` (Staging)
- ✅ Require pull request before merging
- ✅ Require status checks to pass: `Lint & Type Check`, `Build (staging)`
- ❌ No approval required (faster iteration)
- ✅ Do not allow force pushes

## `dev` (Development)
- ❌ No protection (free to push directly)
- Feature branches merge here first

## Recommended Workflow
```
feature/xxx → dev → staging → main
                 ↑       ↑       ↑
             (direct)  (PR)    (PR + review)
```

## GitHub Secrets Required
Set these in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `VERCEL_TOKEN` | Vercel deployment token | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel org/team ID | vercel.com → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project ID | vercel.com → Project → Settings → General |
| `STAGING_DB_URL` | Staging Supabase DB URL | Supabase dashboard → Settings → Database → URI |
| `PRODUCTION_DB_URL` | Production Supabase DB URL | Same as above for prod project |
| `STAGING_SUPABASE_URL` | Staging Supabase API URL | Supabase dashboard → Settings → API |
| `STAGING_SUPABASE_ANON_KEY` | Staging anon key | Same |
| `PROD_SUPABASE_URL` | Production Supabase API URL | Same |
| `PROD_SUPABASE_ANON_KEY` | Production anon key | Same |

## Supabase Multi-Project Setup (Recommended)
For true environment isolation, create 3 Supabase projects:
1. **catatan-dev** — local development + CI
2. **catatan-staging** — staging environment
3. **catatan-prod** — production

Each has its own:
- Database (separate data, RLS policies, triggers)
- Auth (separate user pools)
- API keys (separate anon/service role keys)
- Edge Functions (if used)
