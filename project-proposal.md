Project Proposal: PolicyPilot (Enterprise AI Policy-to-Training Copilot)
Background
Enterprises are rapidly publishing AI governance policies (acceptable use, data handling, prompt hygiene, vendor risk, regulated outputs). They then need to operationalize those policies across roles (execs, builders, general staff) with measurable completion and auditable evidence for customers, regulators, and internal risk teams. Today this is slow, manual, and hard to prove.

Problem Statement
Enterprises struggle to:

Convert policy documents into role-relevant training quickly without re-authoring content by hand.
Launch campaigns and drive completion with minimal L&D/admin effort.
Produce audit-ready evidence (who was assigned, who completed, quiz outcomes, attestations) in a defensible, repeatable way.
Reduce risk of inconsistent messaging, outdated content, and missing evidence during audits or customer security reviews.
Proposed Solution
Build and pilot PolicyPilot, a secure multi-tenant web app that:

Ingests policy documents (PDF/DOCX/TXT) and extracts obligations.
Generates role-based training modules + quizzes for exec, builder, general.
Publishes campaigns to learners with reminders (“nudges”) and dashboards for admins.
Captures learner completion + attestation and generates CSV + checksum-signed PDF evidence exports.
Enforces tenant isolation (Postgres RLS), role-based access, and structured request audit logs.
Scope
In scope (Pilot-ready release)

Authentication: Google OAuth + email/password sign-up/sign-in + magic link + password reset.
Org-aware onboarding: auto-select single org; org selector for multi-org; “no org access” state.
Admin: policy upload + parsing status, campaign generation, campaign edit, publish (idempotent), nudges.
Learner: assignment inbox, module content, quiz attempts, attestation flow.
Evidence: CSV export + signed PDF summary with checksum headers.
Reliability/Safety: strict validation (Zod), MIME/extension checks, rate limits, Idempotency-Key support, answer-key hiding for learners.
Ops/QA: CI gates, live smoke script, preflight checks, runbooks, staging vs pilot environment split.
Out of scope (Post-pilot)

SAML/SCIM, LMS integrations, multilingual generation, deep analytics expansion, custom SSO contracts.
Timeline
Phase A: 2-week pilot hardening (go-live candidate)

Days 1–2: baseline stabilization, publish retry/idempotency verification, audit-log robustness, answer-key access control.
Days 3–5: org-aware onboarding UX + removal of manual org ID entry across product pages.
Days 6–8: API hardening (upload normalization, stricter authz, request audit completeness).
Days 9–10: CI workflow + staging live smoke validation + release gating.
Days 11–14: staging vs pilot matrix finalized, preflight command, ops runbooks, RC freeze + final validation.
Phase B: 6-week paid pilot (customer execution)

Week 1: policy ingestion + calibration, first campaign generated/reviewed/published.
Weeks 2–4: rollout + nudges + completion monitoring + copy adjustments.
Weeks 5–6: finalize attestations, export evidence packs, collect outcomes and renewal inputs.
Budget (If Applicable)
One-time build/hardening (internal team)

Engineering: 1–2 full-stack engineers for 2–4 weeks (depends on remaining P1/P2 gaps and integrations).
Product/Design: 0.25–0.5 FTE for 2–3 weeks (UX polish, onboarding, enterprise copy).
QA: 0.25 FTE for 1–2 weeks (E2E + smoke + accessibility checks).
Recurring pilot infra (rough, varies by usage)

Supabase (DB/Auth/Storage), Vercel hosting, Resend email, OpenAI API usage, optional PostHog.
Typical pilot range: low hundreds to low thousands USD/month depending on learners, email volume, and LLM generation frequency.
