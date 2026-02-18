"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type PropsWithChildren } from "react";

import { ProductNav } from "@/components/layout/product-nav";
import { OrgProvider, useOrgContext } from "@/lib/edtech/org-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function ProductShellBody({ children }: PropsWithChildren) {
  const { loading, error, memberships, requiresSelection, refreshMemberships } = useOrgContext();
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const canBootstrapOwner = process.env.NODE_ENV !== "production";

  const bootstrapOwner = async () => {
    setBootstrapLoading(true);
    setBootstrapError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setBootstrapError("Supabase is not configured in this environment.");
      setBootstrapLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setBootstrapError("Sign in before bootstrapping workspace access.");
      setBootstrapLoading(false);
      return;
    }

    const response = await fetch("/api/me/bootstrap-owner", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const body = (await response.json()) as { error?: { message?: string } };

    if (!response.ok) {
      setBootstrapError(
        body.error?.message ?? "Bootstrap failed. Check API logs and retry.",
      );
      setBootstrapLoading(false);
      return;
    }

    await refreshMemberships();
    setBootstrapLoading(false);
  };

  if (loading) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] surface-card p-6">
          <h1 className="font-display text-3xl text-[#10244a]">Resolving your workspace</h1>
          <p className="mt-2 text-sm text-[#4f6486]">Checking your organization memberships and permissions.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#e2c4b5] bg-white p-6 shadow-[0_20px_45px_rgba(26,45,79,0.08)]">
          <h1 className="font-display text-3xl text-[#10244a]">Workspace setup required</h1>
          <p className="mt-2 text-sm text-[#6a4e3f]">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="h-10 rounded-xl bg-[#1f5eff] px-4 text-sm font-semibold text-white hover:bg-[#154ee6]"
              onClick={() => void refreshMemberships()}
              type="button"
            >
              Retry
            </button>
            <Link
              className="inline-flex h-10 items-center rounded-xl border border-[#d2ddef] px-4 text-sm font-semibold text-[#10243e] hover:bg-[#f4f8ff]"
              href="/product/auth"
            >
              Go to sign-in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (memberships.length === 0) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] surface-card p-6">
          <h1 className="font-display text-3xl text-[#10244a]">No organization access yet</h1>
          <p className="mt-2 text-sm text-[#4f6486]">
            Ask your PolicyPilot admin to add your account to an organization, then refresh this page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="h-10 rounded-xl bg-[#1f5eff] px-4 text-sm font-semibold text-white hover:bg-[#154ee6]"
              onClick={() => void refreshMemberships()}
              type="button"
            >
              Check again
            </button>
            {canBootstrapOwner ? (
              <button
                className="h-10 rounded-xl border border-[#d2ddef] bg-white px-4 text-sm font-semibold text-[#10243e] hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={bootstrapLoading}
                onClick={() => void bootstrapOwner()}
                type="button"
              >
                {bootstrapLoading ? "Creating workspace..." : "Bootstrap owner access"}
              </button>
            ) : null}
            <Link
              className="inline-flex h-10 items-center rounded-xl border border-[#d2ddef] px-4 text-sm font-semibold text-[#10243e] hover:bg-[#f4f8ff]"
              href="/product/auth"
            >
              Switch account
            </Link>
          </div>
          {canBootstrapOwner ? (
            <p className="mt-3 text-xs text-[#6079a2]">
              Dev helper: creates owner membership for your signed-in user when no org access exists.
            </p>
          ) : null}
          {bootstrapError ? <p className="mt-2 text-sm text-[#a54f3a]">{bootstrapError}</p> : null}
        </section>
      </main>
    );
  }

  if (requiresSelection) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] surface-card p-6">
          <h1 className="font-display text-3xl text-[#10244a]">Choose an organization</h1>
          <p className="mt-2 text-sm text-[#4f6486]">
            Select the organization workspace from the top navigation before starting admin actions.
          </p>
        </section>
      </main>
    );
  }

  return <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>;
}

export function ProductShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/product/auth");

  if (isAuthRoute) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f4f7fd]">
        <div className="pointer-events-none absolute inset-0 -z-10 app-grid" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-14rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#2f6dff1a] blur-3xl" />
          <div className="absolute right-[-12rem] top-28 h-[30rem] w-[30rem] rounded-full bg-[#17a6ff1a] blur-3xl" />
        </div>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    );
  }

  return (
    <OrgProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#f4f7fd]">
        <div className="pointer-events-none absolute inset-0 -z-10 app-grid" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-14rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#2f6dff1a] blur-3xl" />
          <div className="absolute right-[-12rem] top-28 h-[30rem] w-[30rem] rounded-full bg-[#17a6ff1a] blur-3xl" />
        </div>
        <ProductNav />
        <ProductShellBody>{children}</ProductShellBody>
      </div>
    </OrgProvider>
  );
}
