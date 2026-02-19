import type { Metadata } from "next";
import { FileKey2, ShieldCheck, Users2 } from "lucide-react";
import Image from "next/image";

import { ResetPasswordPanel } from "@/components/product/reset-password-panel";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Recover access to your PolicyPilot workspace account.",
};

export default function ResetPasswordPage() {
  return (
    <section className="w-full py-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <ResetPasswordPanel />

        <aside className="ink-panel rounded-[1.8rem] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9dc3ff]">Recovery context</p>
          <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl">Regain secure access in minutes</h2>
          <p className="mt-3 max-w-2xl text-sm text-[#c2d9fb]">
            Recovery links are scoped to your account and validated before password updates are accepted.
          </p>

          <Image
            alt="Security blueprint illustration representing protected authentication recovery workflow."
            className="mt-4 w-full rounded-2xl border border-white/25"
            height={560}
            src="/marketing/security-blueprint.svg"
            width={860}
          />

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <p className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs">
              <ShieldCheck className="mb-1 h-4 w-4 text-[#9dc3ff]" />
              Single-use links
            </p>
            <p className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs">
              <Users2 className="mb-1 h-4 w-4 text-[#9dc3ff]" />
              Org-safe routing
            </p>
            <p className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs">
              <FileKey2 className="mb-1 h-4 w-4 text-[#9dc3ff]" />
              Audited auth events
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
