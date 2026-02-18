import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#d8e2f2] bg-white/86 px-4 py-12 backdrop-blur-lg sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 text-sm md:grid-cols-[1.4fr_0.6fr] md:items-end">
        <div>
          <p className="font-display text-2xl text-[#10244a]">PolicyPilot</p>
          <p className="mt-2 max-w-xl text-[#476082]">
            Enterprise AI policy operations platform for turning governance requirements into completed, auditable training.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-[#3f5881] md:justify-end">
          <Link className="hover:text-[#184fdf]" href="/security">Security</Link>
          <Link className="hover:text-[#184fdf]" href="/pilot">Pilot package</Link>
          <Link className="hover:text-[#184fdf]" href="/roi">ROI</Link>
          <Link className="hover:text-[#184fdf]" href="/product/auth">Login</Link>
        </div>
      </div>
    </footer>
  );
}
