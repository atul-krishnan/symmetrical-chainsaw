"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SessionStatus } from "@/components/product/session-status";
import { useOrgContext } from "@/lib/edtech/org-context";
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
    if (!selectedOrgId) {
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
      current.filter((policyId) => (policiesBody as PolicyListResponse).items.some((item) => item.id === policyId)),
    );
    setLoading(false);
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAdminData, selectedOrgId]);

  const generate = async () => {
    setError(null);
    setStatus(null);

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
    setStatus(`Campaign created with ID ${successBody.campaignId}. Next action: open and review modules.`);
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

  return (
    <section className="mx-auto max-w-5xl rounded-[1.8rem] border border-[#cfc2b5] bg-[#fff8ef] p-6">
      <SessionStatus />
      <h1 className="mt-2 font-display text-4xl text-[#10243e]">Campaign generation</h1>
      <p className="mt-2 text-sm text-[#4f6379]">
        Create a draft campaign for {selectedMembership?.orgName ?? "your workspace"}.
      </p>

      <div className="mt-6 grid gap-3">
        <label className="space-y-1 text-sm">
          <span>Campaign name</span>
          <input
            className="h-11 rounded-xl border border-[#c9bcac] bg-white px-3"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Due at (ISO datetime)</span>
          <input
            className="h-11 rounded-xl border border-[#c9bcac] bg-white px-3"
            onChange={(event) => setDueAt(event.target.value)}
            placeholder="2026-03-01T12:00:00.000Z"
            value={dueAt}
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#10243e]">Source policies</p>
          {readyPolicies.length === 0 ? (
            <p className="text-sm text-[#4f6379]">Upload and parse at least one policy before generation.</p>
          ) : (
            <div className="grid gap-2">
              {readyPolicies.map((policy) => (
                <label className="flex items-center gap-2 rounded-xl border border-[#d0c4b8] bg-[#f5ecdf] px-3 py-2" key={policy.id}>
                  <input
                    checked={selectedPolicyIds.includes(policy.id)}
                    className="accent-[#0e8c89]"
                    onChange={() => togglePolicy(policy.id)}
                    type="checkbox"
                  />
                  <span className="text-sm text-[#13263f]">{policy.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          className="mt-2 h-11 rounded-xl bg-[#0e8c89] text-sm font-semibold text-white hover:bg-[#0c7573]"
          onClick={() => void generate()}
          type="button"
        >
          Generate Draft Campaign
        </button>
      </div>

      {status ? <p className="mt-4 text-sm text-[#0b746e]">{status}</p> : null}
      {error ? <p className="mt-4 text-sm text-[#a04e39]">{error}</p> : null}

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-[#10243e]">Recent campaigns</h2>
          <button
            className="rounded-xl border border-[#c7baab] bg-white px-3 py-2 text-sm font-semibold text-[#13263f] hover:bg-[#f4eadc]"
            onClick={() => void loadAdminData()}
            type="button"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-[#4f6379]">No campaigns found for this organization.</p>
          ) : (
            campaigns.map((campaign) => (
              <article className="rounded-xl border border-[#d0c4b8] bg-[#f5ecdf] p-3" key={campaign.campaignId}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#10243e]">{campaign.name}</p>
                    <p className="mt-1 text-xs text-[#4d6178]">
                      Completion {(campaign.completionRate * 100).toFixed(1)}% | Attestation {(campaign.attestationRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Link
                    className="inline-flex rounded-full border border-[#c7baab] bg-white px-3 py-1.5 text-sm font-semibold text-[#13263f] hover:bg-[#f4eadc]"
                    href={withOrg(`/product/admin/campaigns/${campaign.campaignId}`, selectedOrgId)}
                  >
                    Open campaign
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
