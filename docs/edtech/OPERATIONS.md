# Operations Guide

## Environment matrix

### Staging

- Purpose: CI validation + external smoke validation
- Required variables:
  - `STAGING_SUPABASE_URL`
  - `STAGING_SUPABASE_ANON_KEY`
  - `STAGING_SUPABASE_SERVICE_ROLE_KEY`
  - `STAGING_APP_URL`
  - `STAGING_SMOKE_ACCESS_TOKEN`
  - Optional `STAGING_SMOKE_ORG_ID`

### Pilot

- Purpose: customer-facing release candidate
- Required variables:
  - `PILOT_SUPABASE_URL`
  - `PILOT_SUPABASE_ANON_KEY`
  - `PILOT_SUPABASE_SERVICE_ROLE_KEY`
  - Optional `PILOT_APP_URL`
  - Optional `PILOT_SMOKE_ACCESS_TOKEN`
  - Optional `PILOT_SMOKE_ORG_ID`
- Pilot smoke is manual gated via `RUN_PILOT_SMOKE=true`.

## Release gates

Run before pilot onboarding:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run pilot:preflight
```

`npm run pilot:preflight` returns machine-readable JSON and validates:

- env matrix presence
- migration/table availability in staging and pilot Supabase
- staging live smoke flow
- optional pilot live smoke flow

## Live smoke flow

`npm run smoke:live` validates:

1. Authenticated org-membership fetch
2. Policy upload
3. Campaign generation
4. Publish
5. Learner assignment fetch
6. Quiz attempt
7. Attestation submit
8. CSV/PDF export headers + evidence checksum

Script output is JSON for release automation.

## Runbooks

### Failed publish recovery

1. Retry `POST /api/orgs/[orgId]/campaigns/[campaignId]/publish` with `Idempotency-Key`.
2. Confirm returned `alreadyPublished` state.
3. Verify assignment counts in dashboard and `assignments` table.

### Reminder resend safety

1. Use `POST .../nudges/send` with `Idempotency-Key`.
2. Verify `deduplicatedCount` and `sentCount` response values.
3. Confirm inserts in `notification_jobs`.

### Export verification

1. Download CSV and PDF exports.
2. Validate `x-evidence-checksum` response header.
3. Confirm `audit_exports` and `request_audit_logs` entries.

### Onboarding support

1. Verify the user appears in `organization_members`.
2. Confirm `GET /api/me/org-memberships` returns expected org(s).
3. For multi-org users, validate explicit org selection in product nav.

## Rollback notes

- Keep latest migration SQL and seed snapshots for both environments.
- If release regression occurs, disable pilot traffic and redeploy prior Vercel build.
- Re-run `npm run smoke:live` against staging before any re-promotion.
