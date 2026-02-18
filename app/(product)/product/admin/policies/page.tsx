"use client";

import { RefreshCcw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdminAccessGate } from "@/components/product/admin-access-gate";
import { SessionStatus } from "@/components/product/session-status";
import { useOrgContext } from "@/lib/edtech/org-context";
import { hasMinimumRole } from "@/lib/edtech/roles";
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

function statusStyles(status: string): string {
  if (status === "ready") {
    return "bg-[#e8f9f2] text-[#1e7e5e] border-[#bde8d3]";
  }

  if (status === "failed") {
    return "bg-[#fff1ed] text-[#a54f3a] border-[#f1cbc2]";
  }

  return "bg-[#eef4ff] text-[#305c9d] border-[#ccdff8]";
}

export default function PoliciesPage() {
  const { selectedMembership, selectedOrgId } = useOrgContext();
  const canView = hasMinimumRole(selectedMembership?.role, "manager");
  const canUpload = hasMinimumRole(selectedMembership?.role, "admin");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<PolicyListResponse["items"]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    if (!selectedOrgId || !canView) {
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
  }, [canView, selectedOrgId]);

  useEffect(() => {
    if (!selectedOrgId || !canView) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadPolicies();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canView, loadPolicies, selectedOrgId]);

  const submit = async () => {
    setError(null);
    setStatus(null);

    if (!canUpload) {
      setError("Only admin and owner roles can upload policy files. Next action: request elevated access.");
      return;
    }

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
    setStatus(`Policy uploaded. Parse status: ${successBody.parseStatus}. Next action: review readiness below.`);
    setTitle("");
    setFile(null);
    void loadPolicies();
  };

  if (!canView) {
    return (
      <AdminAccessGate
        currentRole={selectedMembership?.role}
        orgName={selectedMembership?.orgName}
        requiredRole="manager"
        title="Policy workspace"
      />
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5 rounded-[1.9rem] surface-card p-6 sm:p-7">
      <SessionStatus />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-[#10244a]">Policy ingestion</h1>
          <p className="mt-2 text-sm text-[#4f6486]">
            Upload policy documents for {selectedMembership?.orgName ?? "your workspace"} and convert obligations into training inputs.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d2ddef] bg-white px-4 text-sm font-semibold text-[#1f3b67] hover:bg-[#f4f8ff]"
          onClick={() => void loadPolicies()}
          type="button"
        >
          <RefreshCcw className="h-4 w-4" />
          {loadingPolicies ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl soft-chip p-5">
          <h2 className="font-display text-3xl text-[#122d5b]">Upload new policy</h2>
          <p className="mt-2 text-sm text-[#4f6486]">Supported formats: PDF, DOCX, TXT</p>

          <div className="mt-5 grid gap-3">
            <label className="space-y-1 text-sm">
              <span>Policy title</span>
              <input
                className="h-11 rounded-xl border border-[#d3deef] bg-white px-3"
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>File</span>
              <input
                accept=".pdf,.docx,.txt"
                className="rounded-xl border border-[#d3deef] bg-white px-3 py-2"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            <button
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f5eff] text-sm font-semibold text-white hover:bg-[#154ee6] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!canUpload}
              onClick={submit}
              type="button"
            >
              <Upload className="h-4 w-4" />
              Upload and parse
            </button>

            {!canUpload ? (
              <p className="text-xs text-[#7b6182]">
                Upload is restricted to admin/owner roles.
              </p>
            ) : null}
          </div>
        </div>

        <aside className="rounded-2xl border border-[#c9d8ef] bg-[#0f2d66] p-5 text-sm text-[#d9e5ff]">
          <h3 className="font-display text-2xl text-white">Operational notes</h3>
          <ul className="mt-3 space-y-2">
            <li>File type and extension must match.</li>
            <li>Uploads are org-scoped and stored in secure buckets.</li>
            <li>Parsing issues appear as `failed` with retry guidance.</li>
            <li>Next action after parse: generate campaign draft.</li>
          </ul>
        </aside>
      </div>

      {status ? <p className="text-sm text-[#12795c]">{status}</p> : null}
      {error ? <p className="text-sm text-[#a54f3a]">{error}</p> : null}

      <div className="space-y-3">
        <h2 className="font-display text-3xl text-[#10244a]">Recent policies</h2>
        {policies.length === 0 ? (
          <p className="text-sm text-[#4f6486]">No policy documents uploaded yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {policies.map((policy) => (
              <article className="rounded-2xl soft-chip p-4" key={policy.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[#132f61]">{policy.title}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyles(policy.parseStatus)}`}>
                    {policy.parseStatus}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#4f6486]">
                  {policy.fileMimeType} | Created {new Date(policy.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
