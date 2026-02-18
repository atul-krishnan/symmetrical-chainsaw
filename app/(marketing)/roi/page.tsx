import type { Metadata } from "next";
import { BarChart3, CircleDollarSign, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { RoiCalculator } from "@/components/marketing/roi-calculator";

export const metadata: Metadata = {
  title: "ROI Calculator",
  description: "Estimate annual enterprise value from AI compliance training operations.",
};

const BENCHMARKS = [
  { title: "Manual campaign prep", before: "2 to 4 weeks", after: "less than 1 day" },
  { title: "Audit evidence assembly", before: "1 to 3 days", after: "under 30 seconds" },
  { title: "Learner completion visibility", before: "spreadsheet lag", after: "near real-time" },
];

export default function RoiPage() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="editorial-gradient grid gap-5 rounded-[2rem] border border-[#c9dcf2] p-7 lg:grid-cols-[1fr_0.95fr] lg:p-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#607aa5]">Business case</p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] text-[#10244a] sm:text-6xl">
              Quantify the operational value of policy-to-training automation
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4d6487]">
              This model combines effort reduction and compliance-risk avoidance so enterprise buyers can compare pilot cost versus measurable return.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="metric-tile">
                <div className="flex items-center gap-2 text-[#1f5eff]">
                  <CircleDollarSign className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">Efficiency</p>
                </div>
                <p className="mt-2 text-sm text-[#4d6487]">Hours saved from policy authoring and campaign setup.</p>
              </article>
              <article className="metric-tile">
                <div className="flex items-center gap-2 text-[#1f5eff]">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">Risk</p>
                </div>
                <p className="mt-2 text-sm text-[#4d6487]">Exposure reduction from stronger policy adoption and attestations.</p>
              </article>
              <article className="metric-tile">
                <div className="flex items-center gap-2 text-[#1f5eff]">
                  <BarChart3 className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]">Forecast</p>
                </div>
                <p className="mt-2 text-sm text-[#4d6487]">Use conservative assumptions for procurement-grade ROI projections.</p>
              </article>
            </div>
          </div>

          <aside className="ink-panel rounded-[1.7rem] p-4">
            <Image
              alt="ROI brief illustration with annual value snapshot and efficiency metrics."
              className="w-full rounded-2xl border border-white/30"
              height={560}
              src="/marketing/roi-brief.svg"
              width={860}
            />
            <p className="mt-3 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
              Default assumptions can be edited for your industry wage and incident profile.
            </p>
          </aside>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {BENCHMARKS.map((item) => (
            <article className="card p-5" key={item.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#617ca6]">{item.title}</p>
              <p className="mt-2 text-sm text-[#56719a]">Before: {item.before}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f53cb]">With PolicyPilot: {item.after}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <RoiCalculator />
          <aside className="card p-6">
            <h2 className="font-display text-4xl text-[#10244a]">Model assumptions</h2>
            <ul className="mt-4 space-y-2 text-sm text-[#4f6588]">
              <li>Annual value = labor efficiency gain + risk avoidance estimate.</li>
              <li>Risk avoidance default uses a conservative incident cost baseline.</li>
              <li>Values should be tuned with your own finance and security inputs.</li>
            </ul>
            <p className="mt-4 text-sm text-[#4f6588]">
              For enterprise procurement, export this estimate with your pilot outcomes and dashboard KPIs.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
