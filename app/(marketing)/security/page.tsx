import type { Metadata } from "next";
import { FileLock2, ShieldCheck, Waypoints } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Security",
  description: "Security and privacy controls for PolicyPilot deployments.",
};

const SECURITY_ITEMS = [
  {
    title: "Access controls",
    body: "Magic link + Google auth, role-gated routes, and minimum-role checks across admin endpoints.",
  },
  {
    title: "Tenant isolation",
    body: "Org-scoped Postgres model with RLS policies on every tenant-bearing table and storage path prefixes.",
  },
  {
    title: "Boundary validation",
    body: "Zod validation for all API contracts, strict MIME-extension checks, and payload constraints at ingestion boundaries.",
  },
  {
    title: "Replay safety",
    body: "Publish and nudge endpoints support Idempotency-Key semantics for safe retries without duplicate side effects.",
  },
  {
    title: "Evidence integrity",
    body: "Attestation and export payloads include checksum integrity markers and signed PDF summary generation.",
  },
  {
    title: "Observability",
    body: "Structured logging with request correlation fields for API, generation, email, and export path diagnostics.",
  },
];

const CONTROL_MATRIX = [
  { control: "RLS isolation", owner: "Platform", status: "Active", evidence: "migration + policy checks" },
  { control: "Upload validation", owner: "Application", status: "Active", evidence: "MIME + extension tests" },
  { control: "Idempotent publish", owner: "Application", status: "Active", evidence: "request audit metadata" },
  { control: "Signed exports", owner: "Evidence service", status: "Active", evidence: "x-evidence-checksum header" },
];

export default function SecurityPage() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="editorial-gradient grid gap-5 rounded-[2rem] border border-[#cadcf3] p-7 lg:grid-cols-[1fr_0.96fr] lg:p-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5e78a4]">Security posture</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] text-[#10244a] sm:text-6xl">
              Secure-by-default controls for external enterprise pilots
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4f6588]">
              PolicyPilot is engineered for high-trust rollout: org isolation, boundary validation, replay-safe operations, and export integrity.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="metric-tile">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6684af]">Auth modes</p>
                <p className="mt-1 font-display text-3xl text-[#11386f]">2</p>
                <p className="text-xs text-[#57739f]">Google + magic link</p>
              </article>
              <article className="metric-tile">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6684af]">RLS coverage</p>
                <p className="mt-1 font-display text-3xl text-[#11386f]">100%</p>
                <p className="text-xs text-[#57739f]">tenant tables</p>
              </article>
              <article className="metric-tile">
                <p className="text-xs uppercase tracking-[0.15em] text-[#6684af]">Export integrity</p>
                <p className="mt-1 font-display text-3xl text-[#11386f]">HMAC</p>
                <p className="text-xs text-[#57739f]">signed PDF summary</p>
              </article>
            </div>
          </div>

          <aside className="ink-panel rounded-[1.7rem] p-4">
            <Image
              alt="Security architecture blueprint showing auth boundary, RLS tenancy, observability, and evidence integrity."
              className="w-full rounded-2xl border border-white/30"
              height={620}
              src="/marketing/security-blueprint.svg"
              width={900}
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
                No customer data used to train models
              </p>
              <p className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
                Request-level traceability by default
              </p>
            </div>
          </aside>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECURITY_ITEMS.map((item) => (
            <article className="card p-5" key={item.title}>
              <h2 className="font-display text-3xl text-[#132f61]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#495f82]">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="card overflow-hidden">
            <div className="border-b border-[#d5e0f0] px-5 py-4">
              <h2 className="font-display text-3xl text-[#10244a]">Control matrix</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Control</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTROL_MATRIX.map((row) => (
                    <tr key={row.control}>
                      <td className="font-medium text-[#15376d]">{row.control}</td>
                      <td>{row.owner}</td>
                      <td>
                        <span className="status-pill status-pill-success">{row.status}</span>
                      </td>
                      <td>{row.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="ink-panel rounded-[1.6rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#97beff]">Review focus</p>
            <h3 className="mt-2 font-display text-4xl text-white">What enterprise security teams inspect first</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#9ec3ff]" />
                  <p className="font-semibold text-white">Data isolation proof</p>
                </div>
                <p className="mt-1 text-[#c6dafd]">RLS policy set, tenant key joins, and no cross-org query paths.</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <div className="flex items-center gap-2">
                  <Waypoints className="h-4 w-4 text-[#9ec3ff]" />
                  <p className="font-semibold text-white">Operational replay safety</p>
                </div>
                <p className="mt-1 text-[#c6dafd]">Idempotent publish/reminder semantics with audit metadata for retries.</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                <div className="flex items-center gap-2">
                  <FileLock2 className="h-4 w-4 text-[#9ec3ff]" />
                  <p className="font-semibold text-white">Evidence verification</p>
                </div>
                <p className="mt-1 text-[#c6dafd]">Checksum-backed CSV/PDF headers and signed summary output.</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
