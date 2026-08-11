import { useState, useRef, useEffect } from 'react';

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  difficultyFilter,
  setDifficultyFilter,
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
  tagFilter,
  setTagFilter
}) {
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const dropdownRef = useRef(null);

  const difficultyLabel = difficultyFilter || "All Levels";
  const platformLabel = platformFilter || "All Platforms";
  const statusLabel = statusFilter || "All Status";

  const difficulties = ["", "Easy", "Medium", "Hard"];
  const platforms = ["", "LeetCode", "Codeforces", "CodeChef"];
  const statuses = ["", "solved", "unsolved"];
  const statusLabels = { "": "All Status", "solved": "Solved", "unsolved": "Unsolved" };

  const commonTags = [
    "", "Array", "String", "Hash Table", "Dynamic Programming", "Math", "Sorting", 
    "Greedy", "Depth-First Search", "Database", "Binary Search", "Tree", "Matrix", 
    "Two Pointers", "Bit Manipulation", "Stack", "Graph", "Prefix Sum", 
    "Sliding Window", "Backtracking", "Linked List", "Heap (Priority Queue)"
  ];

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* More Filters Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
          className={`inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[12px] transition-all duration-300 cursor-pointer group
            ${isActive(tagFilter) || isMoreFiltersOpen
              ? "glass-card bg-white/[0.04] border-white/[0.1] text-text-primary shadow-sm"
              : "bg-white/[0.02] border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover hover:bg-white/[0.035]"
            }`}
        >
          <span className="material-symbols-outlined text-[14px] group-hover:rotate-90 transition-transform duration-300">tune</span>
          <span className="font-medium uppercase tracking-wide">More Filters</span>
          {isActive(tagFilter) && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5 animate-pulse" />
          )}
        </button>

        {isMoreFiltersOpen && (
          <div className="absolute top-full mt-2 right-0 w-64 max-h-72 overflow-y-auto glass-card bg-bg-elevated/95 backdrop-blur-xl border border-white/[0.05] rounded-xl shadow-2xl z-50 p-4 custom-scrollbar animate-fade-in">
            <h3 className="text-text-primary text-[12px] font-semibold mb-3 uppercase tracking-wider opacity-60">Topics</h3>
            <div className="flex flex-col gap-0.5">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setTagFilter(tag);
                    setIsMoreFiltersOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 text-left w-full hover:bg-white/[0.05]
                    ${tagFilter === tag ? "bg-fuchsia-500/20 text-fuchsia-300" : "text-text-secondary"}`}
                >
                  {tag === "" ? "All Topics" : tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
