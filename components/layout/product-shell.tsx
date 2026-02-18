"use client";

import Link from "next/link";
import type { PropsWithChildren } from "react";

import { ProductNav } from "@/components/layout/product-nav";
import { OrgProvider, useOrgContext } from "@/lib/edtech/org-context";

function ProductShellBody({ children }: PropsWithChildren) {
  const { loading, error, memberships, requiresSelection, refreshMemberships } = useOrgContext();

  if (loading) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#cfc2b5] bg-[#fff8ef] p-6">
          <h1 className="font-display text-3xl text-[#10243e]">Resolving your workspace</h1>
          <p className="mt-2 text-sm text-[#4f6379]">Checking your organization memberships and permissions.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#e0b8ab] bg-[#fff8ef] p-6">
          <h1 className="font-display text-3xl text-[#10243e]">Workspace setup required</h1>
          <p className="mt-2 text-sm text-[#6a4e3f]">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="h-10 rounded-xl bg-[#0e8c89] px-4 text-sm font-semibold text-white hover:bg-[#0c7573]"
              onClick={() => void refreshMemberships()}
              type="button"
            >
              Retry
            </button>
            <Link
              className="inline-flex h-10 items-center rounded-xl border border-[#cabdab] px-4 text-sm font-semibold text-[#10243e] hover:bg-[#f4ecdf]"
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
        <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#d2c6b8] bg-[#fff8ef] p-6">
          <h1 className="font-display text-3xl text-[#10243e]">No organization access yet</h1>
          <p className="mt-2 text-sm text-[#4f6379]">
            Ask your PolicyPilot admin to add your account to an organization, then refresh this page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="h-10 rounded-xl bg-[#0e8c89] px-4 text-sm font-semibold text-white hover:bg-[#0c7573]"
              onClick={() => void refreshMemberships()}
              type="button"
            >
              Check again
            </button>
            <Link
              className="inline-flex h-10 items-center rounded-xl border border-[#cabdab] px-4 text-sm font-semibold text-[#10243e] hover:bg-[#f4ecdf]"
              href="/product/auth"
            >
              Switch account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (requiresSelection) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.8rem] border border-[#d2c6b8] bg-[#fff8ef] p-6">
          <h1 className="font-display text-3xl text-[#10243e]">Choose an organization</h1>
          <p className="mt-2 text-sm text-[#4f6379]">
            Select the organization workspace from the top navigation before starting admin actions.
          </p>
        </section>
      </main>
    );
  }

  return <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>;
}

export function ProductShell({ children }: PropsWithChildren) {
  return (
    <OrgProvider>
      <div className="min-h-screen bg-[#f3ede2]">
        <ProductNav />
        <ProductShellBody>{children}</ProductShellBody>
      </div>
    </OrgProvider>
  );
}
