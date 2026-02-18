"use client";

import { useCallback, useEffect, useState } from "react";

import { SessionStatus } from "@/components/product/session-status";
import { useOrgContext } from "@/lib/edtech/org-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatPercent } from "@/lib/utils";

type MetricsResponse = {
  orgId: string;
  campaigns: Array<{
    campaignId: string;
    name: string;
    assignmentsTotal: number;
    assignmentsCompleted: number;
    completionRate: number;
    attestationRate: number;
    averageScore: number;
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

export default function DashboardPage() {
  const { selectedMembership, selectedOrgId } = useOrgContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!selectedOrgId) {
      return;
    }

    setLoading(true);
    setError(null);

    const token = await getAccessToken();
    if (!token) {
      setError("Sign in before loading dashboard metrics.");
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/orgs/${selectedOrgId}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = (await response.json()) as MetricsResponse | { error: { message: string } };

    if (!response.ok) {
      setError("error" in body ? body.error.message : "Failed to load metrics");
      setLoading(false);
      return;
    }

    setMetrics(body as MetricsResponse);
    setLoading(false);
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadMetrics();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMetrics, selectedOrgId]);

  return (
    <section className="mx-auto max-w-6xl rounded-[1.8rem] border border-[#cfc2b5] bg-[#fff8ef] p-6">
      <SessionStatus />
      <h1 className="mt-2 font-display text-4xl text-[#10243e]">Compliance dashboard</h1>
      <p className="mt-2 text-sm text-[#4f6379]">
        Track completion and attestation outcomes for {selectedMembership?.orgName ?? "your workspace"}.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="h-11 rounded-xl bg-[#0e8c89] px-5 text-sm font-semibold text-white hover:bg-[#0c7573]"
          onClick={() => void loadMetrics()}
          type="button"
        >
          {loading ? "Loading..." : "Refresh Metrics"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-[#a04e39]">{error}</p> : null}

      {metrics ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {metrics.campaigns.map((campaign) => (
            <article className="rounded-xl border border-[#cfc2b5] bg-[#f4ecdf] p-4" key={campaign.campaignId}>
              <h2 className="font-display text-2xl text-[#11253e]">{campaign.name}</h2>
              <ul className="mt-3 space-y-1 text-sm text-[#425c76]">
                <li>Total assignments: {campaign.assignmentsTotal}</li>
                <li>Completed assignments: {campaign.assignmentsCompleted}</li>
                <li>Completion rate: {formatPercent(campaign.completionRate)}</li>
                <li>Attestation rate: {formatPercent(campaign.attestationRate)}</li>
                <li>Average score: {campaign.averageScore.toFixed(1)}%</li>
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
