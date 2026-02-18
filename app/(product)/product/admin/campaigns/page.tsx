"use client";

import Link from "next/link";
import { CalendarClock, PlusCircle, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminAccessGate } from "@/components/product/admin-access-gate";
import { SessionStatus } from "@/components/product/session-status";
import { useOrgContext } from "@/lib/edtech/org-context";
import { hasMinimumRole } from "@/lib/edtech/roles";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type PolicyListResponse = {
  items: Array<{
    id: string;
    title: string;
    parseStatus: string;
  }>;
};

type DashboardResponse = {
  campaigns: Array<{
    campaignId: string;
    name: string;
    completionRate: number;
    attestationRate: number;
  }>;
};

async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function withOrg(path: string, orgId: string | null): string {
  if (!orgId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}org=${orgId}`;
}

export default function CampaignsPage() {
  const { selectedMembership, selectedOrgId } = useOrgContext();
  const canView = hasMinimumRole(selectedMembership?.role, "manager");
  const canGenerate = hasMinimumRole(selectedMembership?.role, "admin");

  const [name, setName] = useState("AI Literacy Baseline");
  const [dueAt, setDueAt] = useState("");
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [policies, setPolicies] = useState<PolicyListResponse["items"]>([]);
  const [campaigns, setCampaigns] = useState<DashboardResponse["campaigns"]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readyPolicies = useMemo(
    () => policies.filter((policy) => policy.parseStatus === "ready"),
    [policies],
  );

  const loadAdminData = useCallback(async () => {
    if (!selectedOrgId || !canView) {
      return;
    }

    setError(null);

    const token = await getAccessToken();
    if (!token) {
      setError("Sign in before loading campaign data.");
      return;
    }

    setLoading(true);

    const [policiesResponse, dashboardResponse] = await Promise.all([
      fetch(`/api/orgs/${selectedOrgId}/policies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`/api/orgs/${selectedOrgId}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const policiesBody = (await policiesResponse.json()) as
      | PolicyListResponse
      | { error: { message: string } };
    const dashboardBody = (await dashboardResponse.json()) as
      | DashboardResponse
      | { error: { message: string } };

    if (!policiesResponse.ok) {
      setError("error" in policiesBody ? policiesBody.error.message : "Failed to load policies.");
      setLoading(false);
      return;
    }

    if (!dashboardResponse.ok) {
      setError(
        "error" in dashboardBody ? dashboardBody.error.message : "Failed to load campaign list.",
      );
      setLoading(false);
      return;
    }

    setPolicies((policiesBody as PolicyListResponse).items);
    setCampaigns((dashboardBody as DashboardResponse).campaigns);
    setSelectedPolicyIds((current) =>
      current.filter((policyId) =>
        (policiesBody as PolicyListResponse).items.some((item) => item.id === policyId),
      ),
    );
    setLoading(false);
  }, [canView, selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId || !canView) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canView, loadAdminData, selectedOrgId]);

  const generate = async () => {
    setError(null);
    setStatus(null);

    if (!canGenerate) {
      setError("Only admin and owner roles can generate campaigns. Next action: request elevated access.");
      return;
    }

    if (!selectedOrgId) {
      setError("Select an organization workspace before generating campaigns.");
      return;
    }

    if (selectedPolicyIds.length === 0) {
      setError("Select at least one parsed policy before generating a campaign.");
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setError("Sign in before generating campaigns.");
      return;
    }

    const response = await fetch(`/api/orgs/${selectedOrgId}/campaigns/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        policyIds: selectedPolicyIds,
        roleTracks: ["exec", "builder", "general"],
        dueAt: dueAt || null,
      }),
    });

    const body = (await response.json()) as
      | { campaignId: string; status: string }
      | { error: { message: string } };

    if (!response.ok) {
      setError("error" in body ? body.error.message : "Campaign generation failed");
      return;
    }

    const successBody = body as { campaignId: string; status: string };
    setStatus(
      `Campaign created (${successBody.campaignId}). Next action: open campaign and review modules before publish.`,
    );
    setDueAt("");
    await loadAdminData();
  };

  const togglePolicy = (policyId: string) => {
    setSelectedPolicyIds((current) =>
      current.includes(policyId)
        ? current.filter((id) => id !== policyId)
        : [...current, policyId],
    );
  };

  if (!canView) {
    return (
      <AdminAccessGate
        currentRole={selectedMembership?.role}
        orgName={selectedMembership?.orgName}
        requiredRole="manager"
        title="Campaign workspace"
      />
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5 rounded-[1.9rem] surface-card p-6 sm:p-7">
      <SessionStatus />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-[#10244a]">Campaign generation</h1>
          <p className="mt-2 text-sm text-[#4f6486]">
            Create and manage campaigns for {selectedMembership?.orgName ?? "your workspace"}.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d2ddef] bg-white px-4 text-sm font-semibold text-[#1f3b67] hover:bg-[#f4f8ff]"
          onClick={() => void loadAdminData()}
          type="button"
        >
          <RefreshCcw className="h-4 w-4" />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl soft-chip p-5">
          <h2 className="font-display text-3xl text-[#122d5b]">New draft campaign</h2>
          <p className="mt-2 text-sm text-[#4f6486]">Build role-ready training modules from parsed policy obligations.</p>

          <div className="mt-5 grid gap-3">
            <label className="space-y-1 text-sm">
              <span>Campaign name</span>
              <input
                className="h-11 rounded-xl border border-[#d3deef] bg-white px-3"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Due at (ISO datetime)</span>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#6a7fa1]" />
                <input
                  className="h-11 w-full rounded-xl border border-[#d3deef] bg-white pl-9 pr-3"
                  onChange={(event) => setDueAt(event.target.value)}
                  placeholder="2026-03-01T12:00:00.000Z"
                  value={dueAt}
                />
              </div>
            </label>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#10244a]">Source policies</p>
              {readyPolicies.length === 0 ? (
                <p className="text-sm text-[#4f6486]">Upload and parse at least one policy before generation.</p>
              ) : (
                <div className="grid gap-2">
                  {readyPolicies.map((policy) => (
                    <label className="flex items-center gap-2 rounded-xl border border-[#d3deef] bg-white px-3 py-2" key={policy.id}>
                      <input
                        checked={selectedPolicyIds.includes(policy.id)}
                        className="accent-[#1f5eff]"
                        onChange={() => togglePolicy(policy.id)}
                        type="checkbox"
                      />
                      <span className="text-sm text-[#132f61]">{policy.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f5eff] text-sm font-semibold text-white hover:bg-[#154ee6] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!canGenerate}
              onClick={() => void generate()}
              type="button"
            >
              <PlusCircle className="h-4 w-4" />
              Generate draft campaign
            </button>

            {!canGenerate ? (
              <p className="text-xs text-[#7b6182]">Campaign generation is restricted to admin/owner roles.</p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-2xl border border-[#c9d8ef] bg-[#0f2d66] p-5 text-sm text-[#d9e5ff]">
          <h3 className="font-display text-2xl text-white">Publishing checklist</h3>
          <ul className="mt-3 space-y-2">
            <li>Review module copy for policy precision.</li>
            <li>Validate pass score thresholds before publish.</li>
            <li>Publish with an `Idempotency-Key` for safe retries.</li>
            <li>Track completion and attestation in dashboard.</li>
          </ul>
        </aside>
      </div>

      {status ? <p className="text-sm text-[#12795c]">{status}</p> : null}
      {error ? <p className="text-sm text-[#a54f3a]">{error}</p> : null}

      <div className="space-y-3">
        <h2 className="font-display text-3xl text-[#10244a]">Recent campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-[#4f6486]">No campaigns found for this organization.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <article className="rounded-2xl soft-chip p-4" key={campaign.campaignId}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#132f61]">{campaign.name}</p>
                    <p className="mt-1 text-xs text-[#4f6486]">
                      Completion {(campaign.completionRate * 100).toFixed(1)}% | Attestation {(campaign.attestationRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Link
                    className="inline-flex rounded-full border border-[#d3deef] bg-white px-3 py-1.5 text-sm font-semibold text-[#1b4277] hover:bg-[#f4f8ff]"
                    href={withOrg(`/product/admin/campaigns/${campaign.campaignId}`, selectedOrgId)}
                  >
                    Open campaign
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
