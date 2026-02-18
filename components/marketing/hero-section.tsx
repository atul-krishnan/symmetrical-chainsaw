"use client";

import gsap from "gsap";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui/button-link";

const TRUST_MARKS = ["NorthBridge", "Axiom Health", "Vertex Cloud", "CedarPay", "Fintrek"];

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
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.82, stagger: 0.07, ease: "power3.out" },
      );
      gsap.fromTo(
        ".hero-float",
        { y: 0 },
        { y: -9, repeat: -1, yoyo: true, duration: 3.6, ease: "sine.inOut" },
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="px-4 pb-12 pt-12 sm:px-6 lg:px-8" ref={wrapperRef}>
      <div className="editorial-gradient mx-auto grid max-w-7xl gap-8 rounded-[2.2rem] border border-[#cadaf2] p-7 sm:p-9 lg:grid-cols-[1.02fr_0.98fr] lg:p-11">
        <div>
          <p className="hero-reveal inline-flex items-center gap-2 rounded-full border border-[#c4d8f8] bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2152db]">
            <Sparkles className="h-3.5 w-3.5" />
            Enterprise AI Training Operations
          </p>

          <h1 className="hero-reveal mt-5 max-w-2xl font-display text-4xl leading-[1.02] text-[#10244a] sm:text-5xl lg:text-7xl">
            From policy text to role-ready training in under 45 minutes
          </h1>

          <p className="hero-reveal mt-5 max-w-2xl text-base leading-relaxed text-[#476184]">
            PolicyPilot converts AI governance docs into role-specific modules, completion workflows, and signed evidence packs your auditors can verify.
          </p>

          <div className="hero-reveal mt-7 flex flex-wrap gap-3">
            <ButtonLink className="bg-[#1f5eff] text-white hover:bg-[#154ee6]" href="/product/auth">
              Launch Pilot Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink className="border border-[#d0dcf1] bg-white text-[#163162] hover:bg-[#f5f9ff]" href="/pilot">
              Review Pilot Scope
            </ButtonLink>
          </div>

          <div className="hero-reveal mt-8 grid gap-3 sm:grid-cols-3">
            <article className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6885b2]">Launch speed</p>
              <p className="mt-1 font-display text-4xl text-[#10326a]">45m</p>
            </article>
            <article className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6885b2]">Pilot target</p>
              <p className="mt-1 font-display text-4xl text-[#10326a]">90%+</p>
              <p className="text-xs text-[#55729d]">attestation among completers</p>
            </article>
            <article className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6885b2]">Evidence</p>
              <p className="mt-1 font-display text-4xl text-[#10326a]">CSV + PDF</p>
              <p className="text-xs text-[#55729d]">checksum-verified exports</p>
            </article>
          </div>

          <div className="hero-reveal mt-6 flex flex-wrap items-center gap-2 text-xs text-[#4c6893]">
            <ShieldCheck className="h-4 w-4 text-[#1f5eff]" />
            <span className="font-medium">Used by teams in fintech, health, and B2B SaaS pilots</span>
          </div>

          <div className="hero-reveal mt-3 flex flex-wrap gap-2">
            {TRUST_MARKS.map((name) => (
              <span
                className="rounded-full border border-[#cddcf0] bg-white/88 px-3 py-1 text-xs font-semibold text-[#34547f]"
                key={name}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-reveal relative flex items-center justify-center">
          <div className="image-frame p-4">
            <Image
              alt="PolicyPilot command center illustration with policy ingestion, campaign launch, and evidence outputs."
              className="hero-float w-full rounded-2xl border border-[#bcd0ef]"
              height={720}
              priority
              src="/marketing/policy-command-center.svg"
              width={980}
            />
          </div>

          <article className="hero-float absolute -left-2 top-6 rounded-xl border border-[#c9d8ef] bg-white/95 px-3 py-2 text-xs text-[#2d4f7f] shadow-[0_12px_24px_rgba(17,45,97,0.14)]">
            <p className="font-semibold text-[#1b50d4]">Pipeline status</p>
            <p>Policy to modules to publish</p>
          </article>
          <article className="hero-float absolute -bottom-2 right-5 rounded-xl border border-[#c9d8ef] bg-white/95 px-3 py-2 text-xs text-[#2d4f7f] shadow-[0_12px_24px_rgba(17,45,97,0.14)]">
            <p className="font-semibold text-[#1b50d4]">Audit package</p>
            <p>signed evidence generated</p>
          </article>
        </div>
      </div>
    </section>
  );
}
