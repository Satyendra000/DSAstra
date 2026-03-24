import { Link } from "react-router-dom";

export default function HeroCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border-dark/60 mb-10 group">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-[#0c0f1a] to-violet-950/30"></div>
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/8 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-16 left-1/4 w-48 h-48 bg-violet-500/6 rounded-full blur-[60px] pointer-events-none"></div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }}></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-8 md:px-10 md:py-9 gap-8">
        <div className="flex-1 space-y-3.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/15 text-blue-400 text-[11px] font-semibold uppercase tracking-wider">
            <span className="text-amber-400 text-xs">⚡</span>
            Daily Challenge
          </div>

          {/* Title */}
          <h2 className="text-[26px] md:text-[30px] font-semibold text-white tracking-[-0.02em] leading-tight">
            Valid Sudoku
          </h2>

          {/* Desc */}
          <p className="text-zinc-500 text-[13px] md:text-[14px] max-w-md leading-relaxed">
            Determine if a 9 × 9 Sudoku board is valid. Only the filled cells need to be validated according to the mentioned rules.
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 uppercase tracking-wider">
              Medium
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-border-dark/60 uppercase tracking-wider">
              Matrix
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-border-dark/60 uppercase tracking-wider">
              Hash Table
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <Link
            to="#"
            className="glow-cta inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold rounded-lg transition-all duration-200 hover:-translate-y-px border border-blue-500/30"
          >
            Solve Challenge
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
