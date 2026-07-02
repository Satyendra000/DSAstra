import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const DIFF_COLORS = {
  Easy:   "bg-emerald/10 text-emerald border-emerald/15",
  Medium: "bg-amber/10 text-amber border-amber/15",
  Hard:   "bg-rose/10 text-rose border-rose/15",
};

const PLATFORM_COLORS = {
  LeetCode:   { text: "text-amber", bg: "bg-amber/10 border-amber/15" },
  Codeforces: { text: "text-blue",  bg: "bg-blue/10 border-blue/15" },
  CodeChef:   { text: "text-orange", bg: "bg-orange/10 border-orange/15" },
};

export default function HeroCard() {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/problems/daily")
      .then((res) => setProblem(res.data))
      .catch((err) => console.warn("Daily problem fetch failed:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const platformStyle = problem ? PLATFORM_COLORS[problem.platform] || { text: "text-text-secondary", bg: "bg-white/[0.04] border-border" } : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border mb-10 group transition-all duration-500 hover:border-border-hover">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] via-bg-elevated to-accent-secondary/[0.04]" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-accent/[0.06] rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/[0.09] transition-all duration-700" />
      <div className="absolute -bottom-20 left-1/4 w-56 h-56 bg-accent-secondary/[0.04] rounded-full blur-[80px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.035] transition-opacity duration-700"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-8 md:px-10 md:py-9 gap-8">
        <div className="flex-1 space-y-3.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/15 text-accent text-[11px] font-semibold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[13px] text-accent">bolt</span>
            Daily Challenge
          </div>

          {loading ? (
            <>
              <div className="h-8 w-3/4 bg-white/[0.04] rounded-lg animate-shimmer" />
              <div className="h-4 w-full bg-white/[0.03] rounded-lg animate-shimmer stagger-1" />
              <div className="h-4 w-2/3 bg-white/[0.03] rounded-lg animate-shimmer stagger-2" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 w-16 bg-white/[0.03] rounded-lg animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </>
          ) : problem ? (
            <>
              {/* Platform + Problem number */}
              {problem.platform && (
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${platformStyle?.bg} ${platformStyle?.text}`}>
                    {problem.platform}
                  </span>
                  {problem.problemId && (
                    <span className="text-[11px] text-text-tertiary font-mono">#{problem.problemId}</span>
                  )}
                </div>
              )}

              {/* Title */}
              <h2 className="text-[26px] md:text-[30px] font-semibold text-text-primary tracking-[-0.02em] leading-tight">
                {problem.title}
              </h2>

              {/* Desc */}
              <p className="text-text-secondary text-[13px] md:text-[14px] max-w-md leading-relaxed">
                {problem.difficulty === "Easy"
                  ? "A great warm-up problem. Work through the logic step by step."
                  : problem.difficulty === "Medium"
                  ? "Requires solid understanding of data structures and algorithms."
                  : "Challenging problem that tests your algorithmic thinking."}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {problem.difficulty && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${DIFF_COLORS[problem.difficulty] || "text-text-secondary bg-white/[0.04] border-border"}`}>
                    {problem.difficulty}
                  </span>
                )}
                {problem.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue/[0.08] text-blue border border-blue/12 uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[26px] font-semibold text-text-primary">No challenge today</h2>
              <p className="text-text-secondary text-[13px]">Seed some problems to enable the daily challenge.</p>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {problem ? (
            <Link
              to={`/editor/${problem._id}`}
              className="glow-cta inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-amber-500 hover:from-accent-hover hover:to-amber-400 text-black text-[13px] font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg border border-accent/30 group/cta"
            >
              Solve Challenge
              <span className="material-symbols-outlined text-[16px] group-hover/cta:translate-x-0.5 transition-transform duration-200">arrow_forward</span>
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 bg-bg-hover text-text-tertiary text-[13px] font-semibold rounded-xl cursor-not-allowed border border-border"
            >
              No Problem Yet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
