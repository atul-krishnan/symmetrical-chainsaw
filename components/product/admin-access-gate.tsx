import Link from "next/link";

import type { OrgRole } from "@/lib/types";

type AdminAccessGateProps = {
  orgName?: string;
  currentRole?: OrgRole;
  requiredRole: OrgRole;
  title: string;
};

export function AdminAccessGate({
  orgName,
  currentRole,
  requiredRole,
  title,
}: AdminAccessGateProps) {
  return (
    <section className="mx-auto max-w-5xl rounded-[1.8rem] surface-card p-7">
      <h1 className="font-display text-4xl text-[#10244a]">{title}</h1>
      <p className="mt-3 text-sm text-[#4f6486]">
        You are signed in as <span className="font-semibold text-[#163164]">{currentRole ?? "unknown"}</span>
        {orgName ? ` in ${orgName}` : ""}. This page requires <span className="font-semibold text-[#163164]">{requiredRole}</span> access.
      </p>
      <p className="mt-2 text-sm text-[#4f6486]">
        Next action: ask an organization owner/admin to adjust your role, or continue in learner view.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex items-center rounded-full bg-[#1f5eff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#154ee6]"
          href="/product/learn"
        >
          Open learner view
        </Link>
        <Link
          className="inline-flex items-center rounded-full border border-[#d3deef] bg-white px-5 py-2.5 text-sm font-semibold text-[#163162] hover:bg-[#f5f9ff]"
          href="/product/auth"
        >
          Switch account
        </Link>
      </div>
    </section>
  );
}
