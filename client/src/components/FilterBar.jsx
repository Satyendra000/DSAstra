import { useState } from "react";

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  platformFilter,
  setPlatformFilter,
}) {
  const [statusFilter, setStatusFilter] = useState("");

  const difficultyLabel = difficultyFilter || "All Levels";
  const platformLabel = platformFilter || "All Platforms";
  const statusLabel = statusFilter || "Unsolved";

  const difficulties = ["", "Easy", "Medium", "Hard"];
  const platforms = ["", "LeetCode", "Codeforces"];
  const statuses = ["", "Unsolved", "Solved"];

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

  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {[
        { label: "Difficulty", value: difficultyLabel, onClick: cycleDifficulty },
        { label: "Platform", value: platformLabel, onClick: cyclePlatform },
        { label: "Status", value: statusLabel, onClick: cycleStatus },
      ].map((pill) => (
        <button
          key={pill.label}
          onClick={pill.onClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-[6px] rounded-full bg-white/[0.03] border border-border-dark/60 text-[12px] text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-white/[0.05] transition-all cursor-pointer"
        >
          <span className="text-zinc-500">{pill.label}:</span>
          <span className="text-blue-400 font-medium">{pill.value}</span>
        </button>
      ))}

      <button
        className="inline-flex items-center gap-1.5 px-3.5 py-[6px] rounded-full bg-white/[0.03] border border-border-dark/60 text-[12px] text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-white/[0.05] transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined text-[14px]">tune</span>
        <span className="font-medium uppercase tracking-wide">More Filters</span>
      </button>
    </div>
  );
}
