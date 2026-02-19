What you need to learn (in priority order) before pitching PolicyPilot)

1) The buyer’s world (language + incentives)

What a CISO cares about: risk reduction, audit readiness, sales-cycle security reviews, repeatability.
What a GRC lead cares about: controls, evidence, audit trail, exceptions, “prove it” artifacts.
What Legal/Privacy cares about: policy accuracy, attestation wording, data handling, retention.
What L&D/People Ops cares about: rollout friction, completion rates, reminders, learner UX.
2) Compliance + evidence basics (enough to talk credibly)

Controls vs policies vs procedures vs training vs attestations (how they relate).
Common frameworks your customers reference: SOC 2, ISO 27001, HIPAA (if relevant), GDPR/CCPA (privacy).
What “audit evidence” usually looks like: completion logs, timestamps, user identity, versioned content, exports.
3) Security awareness / training operations

How enterprises run training: campaigns, due dates, reminders, completion reporting, exceptions.
Where LMS/SAT tools fit vs where GRC tools fit (and why “content” is not the whole product).
What drives completion: role relevance, short modules, clear deadlines, manager visibility, nudges.
4) AI governance basics (your wedge)

What’s typically inside an “AI acceptable use / AI policy”: data rules, prohibited use, human review, IP, privacy, security, third-party tools, incident reporting.
Risks enterprises worry about: data leakage, privacy, IP, model hallucinations, prompt injection, regulated data handling.
How governance gets operationalized: training, attestations, controls, monitoring, enforcement.
5) Enterprise buying + procurement reality

How pilots get approved: champion, security review, legal/procurement, budget owner.
Typical hurdles: vendor security questionnaire, DPA, sub-processor list, data residency questions, incident response expectations.
Pricing logic: pilot fee tied to measurable outcomes; expansion tied to active learners or org size.
6) Your product’s “proof points” (what to demo and defend)

Multi-tenant isolation and access control model (roles, org membership).
Evidence integrity story (exports, checksums/signed PDF, audit logs, versioning).
Reliability story (idempotent publish, retry safety, smoke tests, release gates).
Clear boundaries: hosted LLM, no customer-data model training, retention policy.
How to learn fast (practical)

Read your own docs end-to-end: PRD.md, SECURITY.md, OPERATIONS.md, WALKTHROUGH.md, API.md.
Do 5 “discovery” calls with the right titles and ask only: current workflow, pain, evidence expectations, what triggers urgency, who signs off.
Build a repeatable pitch narrative: problem → current ugly workaround → why now (AI policy) → how pilot works → what success looks like → what evidence they get.
If you tell me who you’ll pitch first (CISO vs GRC vs L&D), I’ll tailor a 7‑day learning plan and a talk track + demo script for that persona.


GRC

7-Day Learning Plan (GRC Persona)
Day 1: GRC fundamentals (how they think)

Learn: policy vs standard vs procedure vs control; control design vs operating effectiveness; control owner; evidence; exceptions.
Output: a 1-page glossary in your own words + “where PolicyPilot fits” paragraph.
Day 2: Framework reality (what customers reference)

Learn: SOC 2 (TSC), ISO 27001, common customer security review expectations; what “audit-ready evidence” means in practice.
Output: a checklist of 15 common controls where “training + attestation” is requested (acceptable use, data handling, access control, secure SDLC, incident reporting, AI usage).
Day 3: AI governance content (what goes into AI policy)

Learn: typical AI acceptable use clauses (allowed tools, prohibited data, human review, approvals, logging, IP, privacy, vendor rules, incident escalation).
Output: a sample “AI Policy Obligations” list (20–30 obligations) and map each to exec|builder|general.
Day 4: Evidence + audit trail (what auditors will actually ask for)

Learn: evidence requirements for training (who, what version, when assigned, completion timestamp, quiz outcome, attestation statement, export integrity).
Output: your “Evidence Pack Definition” (CSV columns, PDF summary sections, checksum story, retention).
Day 5: GRC buying + rollout operations

Learn: how pilots get approved; procurement/security questionnaires; DPIA/DPA basics; sub-processors; data retention.
Output: a “Pilot Readiness” one-pager (what you need from customer, what you produce, gates, timelines).
Day 6: Discovery mastery (ask the right questions)

Learn: their current workflow (LMS, SAT tool, spreadsheets), audit calendar, control owners, approval path (Legal/Security/HR), exception handling.
Output: a 12-question discovery script (below) and a call note template.
Day 7: Pitch + demo practice

Learn: crisp positioning + objection handling, demo flow, and follow-up artifacts.
Output: a 2-minute pitch, a 10-minute demo, and a “next steps” email.
GRC Talk Track (2 minutes)
“Most teams have an AI policy document, but converting it into role-specific training and producing audit-ready evidence is slow and manual. PolicyPilot ingests your policy source, generates exec, builder, and general tracks, lets you review/edit before publishing, then runs assignments and reminders. You get measurable completion and attestation rates, plus exports: an audit CSV and a checksum-signed PDF summary that your auditors or customers can verify. The goal is to make policy adoption provable without spreadsheet stitching or running an LMS project.”

Discovery Questions (GRC-first)
Which frameworks or customer requirements are driving this (SOC 2, ISO 27001, HIPAA, privacy)?
What is the next forcing function: audit date, customer review, incident follow-up, board ask?
What policies are in scope (AI acceptable use, data handling, access control, secure SDLC)?
How do you run training today (LMS, security awareness platform, HRIS, ad-hoc)?
What evidence do you currently hand to auditors/customers for training and attestation?
Do you need role-based differentiation (exec vs builders vs general staff)?
Who approves content (Legal, Security, Privacy, HR)? What is the review workflow?
What completion and attestation targets define success in 6 weeks?
How do you handle exceptions (new hires, contractors, leaves, role changes)?
What’s your reminder cadence today (if any)? Who owns chasing?
What data constraints matter (policy confidentiality, retention window, residency)?
What would make you say “no” to a pilot (must-have integrations, SSO, SCORM)?

Demo Script (10–12 minutes, GRC-oriented)

Org context: show org membership resolution and role gating.
Policy ingestion: upload policy doc; show parse status and stored source.
Obligations view: show structured obligations extracted from policy.
Generate campaign: select policy sources, generate role tracks and quizzes.
Review/edit: show you can edit wording, pass thresholds, questions before publish.
Publish: show idempotent publish behavior and assignment creation.
Learner proof: show an assignment completion + quiz attempt + attestation.
Dashboard: show completion rate + attestation rate breakdowns.
Evidence: download CSV + signed PDF summary; explain checksum integrity and what auditors verify.

Objections You’ll Hear From GRC (and answers)

“We already have training in our LMS.”
“Great. The gap is turning your specific AI policy into role-based modules fast, running the campaign ops, and producing a clean evidence pack tied to the policy version.”
“We need evidence, not another tool.”
“PolicyPilot is evidence-first: assignments, attempts, attestations, exports, audit logs. The output is the product.”
“Legal will worry about AI-generated content.”
“Draft-only until human review; you control final copy. Evidence ties back to the reviewed content version.”
“We can do this with spreadsheets.”
“You can, but it breaks at scale: reminders, versioning, integrity, and repeatability across audits/customer reviews.”

