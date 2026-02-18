import type { Metadata } from "next";
import { CalendarRange, FileCheck2, Gauge, ShieldCheck, Users2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pilot Package",
  description: "6-week paid pilot package for enterprise AI compliance training rollout.",
};

const WORKSTREAMS = [
  {
    title: "Policy setup",
    body: "Ingest source policies, normalize obligations, align legal/security expectations, and generate first role-based drafts.",
  },
  {
    title: "Rollout operations",
    body: "Publish campaigns, assign learners, run reminder cadence, and track completion + attestation metrics by org and track.",
  },
  {
    title: "Evidence closeout",
    body: "Produce CSV and signed PDF evidence packs, verify checksums, and handoff audit-ready outputs to compliance stakeholders.",
  },
];

const TIMELINE = [
  { week: "Week 1", focus: "Policy ingestion + role-track calibration", gate: "Draft campaign approved" },
  { week: "Week 2 to 4", focus: "Live assignment rollout + nudges", gate: "Completion trend above baseline" },
  { week: "Week 5 to 6", focus: "Attestation finalization + exports", gate: "Evidence pack accepted" },
];

export default function PilotPage() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="editorial-gradient grid gap-5 rounded-[2rem] border border-[#cbdcf2] p-7 lg:grid-cols-[1fr_0.95fr] lg:p-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5f79a5]">Commercial package</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] text-[#10244a] sm:text-6xl">
              6-week external pilot with measurable compliance outcomes
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4d6385]">
              Designed for teams that need working proof quickly: role-ready training, completion progress, attestation coverage, and evidence exports.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="metric-tile">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6784b0]">Pilot scope</p>
                <p className="mt-1 font-display text-4xl text-[#11386f]">500</p>
                <p className="text-xs text-[#56739e]">learners cap</p>
              </article>
              <article className="metric-tile">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6784b0]">Tracks</p>
                <p className="mt-1 font-display text-4xl text-[#11386f]">3</p>
                <p className="text-xs text-[#56739e]">exec, builder, general</p>
              </article>
              <article className="metric-tile">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6784b0]">Primary KPI</p>
                <p className="mt-1 font-display text-4xl text-[#11386f]">2</p>
                <p className="text-xs text-[#56739e]">completion + attestation</p>
              </article>
            </div>
          </div>

          <aside className="ink-panel rounded-[1.7rem] p-4">
            <Image
              alt="Pilot playbook showing weekly execution stages and release gates."
              className="w-full rounded-2xl border border-white/30"
              height={540}
              src="/marketing/pilot-playbook.svg"
              width={820}
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
                Publish retries are idempotent
              </p>
              <p className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
                Live smoke required pre go-live
              </p>
            </div>
          </aside>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="card p-5">
            <div className="flex items-center gap-2 text-[#1f5eff]">
              <CalendarRange className="h-4 w-4" />
              <p className="text-sm font-semibold">Schedule certainty</p>
            </div>
            <p className="mt-2 text-sm text-[#4d6487]">Fixed 6-week sequence with explicit gates and no hidden rollout dependencies.</p>
          </article>
          <article className="card p-5">
            <div className="flex items-center gap-2 text-[#1f5eff]">
              <Gauge className="h-4 w-4" />
              <p className="text-sm font-semibold">Operational metrics</p>
            </div>
            <p className="mt-2 text-sm text-[#4d6487]">Daily progress visibility for completion, attestation, and at-risk learners.</p>
          </article>
          <article className="card p-5">
            <div className="flex items-center gap-2 text-[#1f5eff]">
              <FileCheck2 className="h-4 w-4" />
              <p className="text-sm font-semibold">Audit output</p>
            </div>
            <p className="mt-2 text-sm text-[#4d6487]">Evidence-ready exports with checksums to support legal and customer assurance asks.</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="card p-6">
            <h2 className="font-display text-4xl text-[#10244a]">Pilot workstreams</h2>
            <div className="mt-5 grid gap-3">
              {WORKSTREAMS.map((item) => (
                <div className="rounded-xl soft-chip p-4" key={item.title}>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5678a7]">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4f6588]">{item.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card p-6">
            <h2 className="font-display text-4xl text-[#10244a]">Success gates</h2>
            <ul className="mt-4 space-y-2 text-sm text-[#4f6588]">
              <li>75%+ completion rate</li>
              <li>90%+ attestation among completers</li>
              <li>Publish path under 45 minutes</li>
              <li>Evidence exports under 30 seconds</li>
            </ul>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-[#6079a2]">Timeline checkpoints</h3>
            <div className="mt-3 space-y-3">
              {TIMELINE.map((item) => (
                <div className="rounded-xl border border-[#d2dff0] bg-[#f8fbff] p-3" key={item.week}>
                  <p className="text-sm font-semibold text-[#15386f]">{item.week}</p>
                  <p className="mt-1 text-sm text-[#4f6588]">{item.focus}</p>
                  <p className="mt-1 text-xs text-[#6079a2]">Gate: {item.gate}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center rounded-[1.6rem] border border-[#c9daf2] bg-[linear-gradient(135deg,#eff5ff,#f8fbff)] p-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full border border-[#bdd2f2] bg-white p-2 text-[#1f5eff]">
              <Users2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-[#16366a]">Recommended customer squad</p>
              <p className="mt-1 text-sm text-[#4f6588]">
                1 compliance owner, 1 security reviewer, 1 L&amp;D operator, and 1 implementation lead.
              </p>
              <p className="mt-2 text-sm text-[#4f6588]">
                Authentication scope for this phase: magic link + Google OAuth only.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center rounded-full bg-[#1f5eff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#154ee6]"
              href="/product/auth"
            >
              Start pilot onboarding
            </Link>
            <Link
              className="inline-flex items-center rounded-full border border-[#d2ddef] bg-white px-5 py-2.5 text-sm font-semibold text-[#163162] hover:bg-[#f4f8ff]"
              href="/security"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Security review
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
