"use client";

import gsap from "gsap";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui/button-link";

export function HeroSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-reveal",
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out" },
      );
      gsap.fromTo(
        ".hero-float",
        { y: 0 },
        { y: -8, repeat: -1, yoyo: true, duration: 3.4, ease: "sine.inOut" },
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="px-4 pb-12 pt-12 sm:px-6 lg:px-8" ref={wrapperRef}>
      <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[2.2rem] surface-card p-7 sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:p-11">
        <div>
          <p className="hero-reveal inline-flex items-center gap-2 rounded-full border border-[#d3e0f6] bg-[#f6f9ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1c4dd6]">
            <Sparkles className="h-3.5 w-3.5" />
            Powering Compliance Operations
          </p>

          <h1 className="hero-reveal mt-5 max-w-2xl font-display text-4xl leading-[1.04] text-[#10244a] sm:text-5xl lg:text-7xl">
            From AI policy docs to role-ready training in under 45 minutes
          </h1>

          <p className="hero-reveal mt-5 max-w-2xl text-base leading-relaxed text-[#4b6286]">
            Launch governance campaigns your legal, security, and L&D teams can trust, with role-based modules, pass/fail evidence, and export-ready attestations.
          </p>

          <div className="hero-reveal mt-7 flex flex-wrap gap-3">
            <ButtonLink className="bg-[#1f5eff] text-white hover:bg-[#154ee6]" href="/product/auth">
              Launch Pilot Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink className="border border-[#d3dff2] bg-white text-[#163162] hover:bg-[#f5f9ff]" href="/pilot">
              View 6-Week Pilot
            </ButtonLink>
          </div>

          <div className="hero-reveal mt-8 grid gap-3 text-sm text-[#33537f] sm:grid-cols-3">
            <p className="rounded-xl soft-chip px-4 py-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-[#1f5eff]" />
              Policy parsing with strict schemas
            </p>
            <p className="rounded-xl soft-chip px-4 py-3">
              <BadgeCheck className="mb-2 h-4 w-4 text-[#1f5eff]" />
              Role-based completion and attestations
            </p>
            <p className="rounded-xl soft-chip px-4 py-3">
              <BadgeCheck className="mb-2 h-4 w-4 text-[#1f5eff]" />
              CSV and signed PDF evidence exports
            </p>
          </div>
        </div>

        <div className="hero-reveal relative flex min-h-[26rem] items-center justify-center">
          <div className="hero-float absolute left-3 top-6 rounded-full border border-[#d7e2f2] bg-white px-3 py-1 text-xs font-semibold text-[#2a4f80] shadow-[0_8px_20px_rgba(16,42,88,0.08)]">
            Completion SLA: 93%
          </div>
          <div className="hero-float absolute bottom-8 right-2 rounded-full border border-[#d7e2f2] bg-white px-3 py-1 text-xs font-semibold text-[#2a4f80] shadow-[0_8px_20px_rgba(16,42,88,0.08)]">
            Export ready in 28s
          </div>

          <div className="relative h-[23rem] w-[23rem] rounded-full border border-[#c4d3ec] bg-[radial-gradient(circle_at_30%_25%,#f2f7ff,transparent_40%),radial-gradient(circle_at_65%_65%,#cee0ff,transparent_52%),linear-gradient(150deg,#0f2f6f,#1b59d8_65%,#45a7ff)] p-4 shadow-[0_24px_70px_rgba(16,46,108,0.22)]">
            <div className="h-full w-full rounded-full border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0.05))]" />
          </div>

          <div className="absolute right-10 top-[7.1rem] rounded-2xl border border-[#d3e0f5] bg-white/95 px-3 py-2 text-xs text-[#2d4e7c] shadow-[0_12px_26px_rgba(16,42,88,0.12)]">
            <p className="font-semibold text-[#1846cb]">Audit readiness</p>
            <p>Signed evidence generated</p>
          </div>
        </div>
      </div>
    </section>
  );
}
