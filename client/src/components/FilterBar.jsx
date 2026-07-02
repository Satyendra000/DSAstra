// Remove unused useState import
export default function FilterBar({
  searchTerm,
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
}) {
  const difficultyLabel = difficultyFilter || "All Levels";
  const platformLabel = platformFilter || "All Platforms";
  const statusLabel = statusFilter || "All Status";

  const difficulties = ["", "Easy", "Medium", "Hard"];
  const platforms = ["", "LeetCode", "Codeforces", "CodeChef"];
  const statuses = ["", "solved", "unsolved"];
  const statusLabels = { "": "All Status", "solved": "Solved", "unsolved": "Unsolved" };

  const cycleDifficulty = () => {
    const idx = difficulties.indexOf(difficultyFilter);
    setDifficultyFilter(difficulties[(idx + 1) % difficulties.length]);
  };

  const cyclePlatform = () => {
    const idx = platforms.indexOf(platformFilter);
    setPlatformFilter(platforms[(idx + 1) % platforms.length]);
  };

  const cycleStatus = () => {
    const idx = statuses.indexOf(statusFilter);
    setStatusFilter(statuses[(idx + 1) % statuses.length]);
  };

  const isActive = (value) => value !== "";

  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {[
        { label: "Difficulty", value: difficultyLabel, onClick: cycleDifficulty, accent: "text-amber", active: difficultyFilter },
        { label: "Platform", value: platformLabel, onClick: cyclePlatform, accent: "text-blue", active: platformFilter },
        { label: "Status", value: statusLabels[statusFilter] || "All Status", onClick: cycleStatus, accent: "text-emerald", active: statusFilter },
      ].map((pill) => (
        <button
          key={pill.label}
          onClick={pill.onClick}
          className={`inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[12px] transition-all duration-300 cursor-pointer
            ${isActive(pill.active)
              ? "glass-card bg-white/[0.04] border-white/[0.1] text-text-primary shadow-sm"
              : "bg-white/[0.02] border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white/[0.035]"
            }`}
        >
          <span className="text-text-tertiary text-[11px]">{pill.label}:</span>
          <span className={`${pill.accent} font-medium`}>{pill.value}</span>
          {isActive(pill.active) && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5 animate-pulse" />
          )}
        </button>
      ))}

      <button
        className="inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full bg-white/[0.02] border border-border text-[12px] text-text-tertiary hover:text-text-primary hover:border-border-hover hover:bg-white/[0.035] transition-all duration-300 cursor-pointer group"
      >
        <span className="material-symbols-outlined text-[14px] group-hover:rotate-90 transition-transform duration-300">tune</span>
        <span className="font-medium uppercase tracking-wide">More Filters</span>
      </button>
    </div>
  );
}
