"use client";

import { useCallback, useEffect, useState } from "react";

import { SessionStatus } from "@/components/product/session-status";
import { useOrgContext } from "@/lib/edtech/org-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type PolicyListResponse = {
  items: Array<{
    id: string;
    title: string;
    fileMimeType: string;
    parseStatus: string;
    createdAt: string;
    updatedAt: string;
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

export default function PoliciesPage() {
  const { selectedMembership, selectedOrgId } = useOrgContext();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<PolicyListResponse["items"]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    if (!selectedOrgId) {
      return;
    }

    setError(null);

    const token = await getAccessToken();
    if (!token) {
      setError("Please sign in before loading policies.");
      return;
    }

    setLoadingPolicies(true);
    const response = await fetch(`/api/orgs/${selectedOrgId}/policies`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = (await response.json()) as PolicyListResponse | { error: { message: string } };

    if (!response.ok) {
      setError("error" in body ? body.error.message : "Failed to load policy documents.");
      setLoadingPolicies(false);
      return;
    }

    setPolicies((body as PolicyListResponse).items);
    setLoadingPolicies(false);
  }, [selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPolicies();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPolicies, selectedOrgId]);

  const submit = async () => {
    setError(null);
    setStatus(null);

    if (!selectedOrgId) {
      setError("Select an organization workspace before uploading policies.");
      return;
    }

    if (!title || !file) {
      setError("Provide a policy title and choose a supported policy file.");
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setError("Please sign in before uploading policy files.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    const response = await fetch(`/api/orgs/${selectedOrgId}/policies`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const body = (await response.json()) as
      | { policyId: string; parseStatus: string }
      | { error: { message: string } };

    if (!response.ok) {
      setError("error" in body ? body.error.message : "Upload failed");
      return;
    }

    const successBody = body as { policyId: string; parseStatus: string };
    setStatus(`Policy uploaded. Parse status: ${successBody.parseStatus}.`);
    setTitle("");
    setFile(null);
    void loadPolicies();
  };

  return (
    <section className="mx-auto max-w-5xl rounded-[1.8rem] border border-[#cfc2b5] bg-[#fff8ef] p-6">
      <SessionStatus />
      <h1 className="mt-2 font-display text-4xl text-[#10243e]">Policy ingestion</h1>
      <p className="mt-2 text-sm text-[#4f6379]">
        Upload a policy document for {selectedMembership?.orgName ?? "your workspace"}.
      </p>

      <div className="mt-6 grid gap-3">
        <label className="space-y-1 text-sm">
          <span>Policy title</span>
          <input
            className="h-11 rounded-xl border border-[#c9bcac] bg-white px-3"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>File (PDF, DOCX, TXT)</span>
          <input
            accept=".pdf,.docx,.txt"
            className="rounded-xl border border-[#c9bcac] bg-white px-3 py-2"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>

        <button
          className="mt-2 h-11 rounded-xl bg-[#0e8c89] text-sm font-semibold text-white hover:bg-[#0c7573]"
          onClick={submit}
          type="button"
        >
          Upload and Parse
        </button>
      </div>

      {status ? <p className="mt-4 text-sm text-[#0b746e]">{status}</p> : null}
      {error ? <p className="mt-4 text-sm text-[#a04e39]">{error}</p> : null}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-[#10243e]">Recent policies</h2>
          <button
            className="rounded-xl border border-[#c7baab] bg-white px-3 py-2 text-sm font-semibold text-[#13263f] hover:bg-[#f4eadc]"
            onClick={() => void loadPolicies()}
            type="button"
          >
            {loadingPolicies ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {policies.length === 0 ? (
            <p className="text-sm text-[#4f6379]">No policy documents uploaded yet.</p>
          ) : (
            policies.map((policy) => (
              <article className="rounded-xl border border-[#d0c4b8] bg-[#f5ecdf] p-3" key={policy.id}>
                <p className="font-semibold text-[#10243e]">{policy.title}</p>
                <p className="mt-1 text-xs text-[#4d6178]">
                  {policy.parseStatus} | {new Date(policy.createdAt).toLocaleString()}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
