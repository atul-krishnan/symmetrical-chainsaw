import type { PropsWithChildren } from "react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";

export function MarketingShell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 app-grid" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-14rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#2f6dff1a] blur-3xl" />
        <div className="absolute right-[-12rem] top-28 h-[30rem] w-[30rem] rounded-full bg-[#17a6ff1a] blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-[#7bb6ff1f] blur-3xl" />
      </div>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
