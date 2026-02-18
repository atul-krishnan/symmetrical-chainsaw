"use client";

import Link from "next/link";

import { useOrgContext } from "@/lib/edtech/org-context";

function withOrg(path: string, orgId: string | null): string {
  if (!orgId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}org=${orgId}`;
}

export function ProductNav() {
  const { memberships, selectedOrgId, selectedMembership, setSelectedOrgId, loading } = useOrgContext();

  return (
    <header className="border-b border-[#cfc2b4] bg-[#fbf6ee]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="font-display text-2xl text-[#10243e]" href="/">
          PolicyPilot
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Product" className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              className="rounded-full px-3 py-2 text-[#344e68] hover:bg-[#ebe0d1]"
              href={withOrg("/product/admin/policies", selectedOrgId)}
            >
              Policies
            </Link>
            <Link
              className="rounded-full px-3 py-2 text-[#344e68] hover:bg-[#ebe0d1]"
              href={withOrg("/product/admin/campaigns", selectedOrgId)}
            >
              Campaigns
            </Link>
            <Link
              className="rounded-full px-3 py-2 text-[#344e68] hover:bg-[#ebe0d1]"
              href={withOrg("/product/admin/dashboard", selectedOrgId)}
            >
              Dashboard
            </Link>
            <Link className="rounded-full px-3 py-2 text-[#344e68] hover:bg-[#ebe0d1]" href="/product/learn">
              Learner view
            </Link>
          </nav>

          {loading ? (
            <span className="text-xs text-[#5e748e]">Loading workspace...</span>
          ) : memberships.length > 1 ? (
            <label className="flex items-center gap-2 text-xs text-[#4f6379]">
              <span className="uppercase tracking-[0.12em]">Workspace</span>
              <select
                className="h-9 rounded-xl border border-[#c9bcac] bg-white px-2 text-sm text-[#10243e]"
                onChange={(event) => setSelectedOrgId(event.target.value)}
                value={selectedOrgId ?? ""}
              >
                <option value="" disabled>
                  Select org
                </option>
                {memberships.map((membership) => (
                  <option key={membership.orgId} value={membership.orgId}>
                    {membership.orgName} ({membership.role})
                  </option>
                ))}
              </select>
            </label>
          ) : selectedMembership ? (
            <span className="rounded-full border border-[#d6cabd] bg-white px-3 py-1 text-xs text-[#4f6379]">
              {selectedMembership.orgName} ({selectedMembership.role})
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
