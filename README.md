# PolicyPilot

PolicyPilot is a Next.js + Supabase enterprise EdTech product that converts AI policy documents into role-based compliance training workflows.

## Core outcomes

- Upload AI policy documents (PDF, DOCX, TXT)
- Generate role-specific modules (`exec`, `builder`, `general`)
- Publish assignments and track learner completion
- Capture attestation evidence with checksums
- Export audit artifacts in CSV and signed PDF formats

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Auth, Postgres, Storage)
- OpenAI Responses API with strict schema output
- Resend email notifications
- Pino structured logging
- Vitest + Playwright test suites

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Run database migration in Supabase SQL editor:

- `supabase/migrations/20260218_edtech_v1.sql`

4. Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product onboarding behavior

- Users load organization memberships from `GET /api/me/org-memberships`.
- Single-org users auto-select their org workspace.
- Multi-org users must explicitly choose a workspace in product navigation.
- Users with no org membership see an actionable no-access page.
- Local/dev builds include a `Bootstrap owner access` helper for first-user setup.

## Scripts

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
- `npm run smoke:live`
- `npm run pilot:preflight`

## Pilot hardening notes

- `publish` and `nudges/send` support optional `Idempotency-Key` headers.
- Publish endpoint is replay-safe and returns success for already-published campaigns.
- Policy upload validates MIME/extension consistency and sanitizes storage paths.
- Request audit logs persist idempotency key hash metadata.

## Documentation

See `/docs/edtech`:

- `PRD.md`
- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `OPERATIONS.md`
- `DESIGN-SYSTEM.md`
- `WALKTHROUGH.md`
