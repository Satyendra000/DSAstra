import DifficultyBadge from "./DifficultyBadge";
import TagBadge from "./TagBadge";

export default function ProblemTable({ problems, totalProblems, savedProblems = [], onToggleBookmark }) {
  const isSaved = (id) => savedProblems.includes(id);

  if (!problems || problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-3 bg-white/[0.03] rounded-full mb-4 border border-border-dark/50">
          <span className="material-symbols-outlined text-zinc-600 text-3xl">search_off</span>
        </div>
        <h3 className="text-[15px] font-medium text-white mb-1">No vectors found</h3>
        <p className="text-subtle-text text-[13px]">Adjust your search parameters to locate problem vectors.</p>
      </div>
    );
  }

  return (
    <>
      {/* Count */}
      <div className="flex items-center justify-end mb-2.5">
        <span className="text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
          Viewing <span className="text-zinc-400">{problems.length}</span> of{" "}
          <span className="text-zinc-400">{totalProblems?.toLocaleString() || problems.length}</span> entries
        </span>
      </div>

      {/* Table */}
      <div className="hidden md:block w-full border border-border-dark/50 rounded-xl overflow-hidden bg-white/[0.01]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-dark/60 bg-white/[0.02]">
              <th className="py-3 px-3 text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] w-10"></th>
              <th className="py-3 px-5 text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] w-[300px]">Problem Vector</th>
              <th className="py-3 px-5 text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] w-[130px]">Source Node</th>
              <th className="py-3 px-5 text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] w-[130px]">Complexity</th>
              <th className="py-3 px-5 text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em]">Architecture</th>
              <th className="py-3 px-5 text-[11px] font-medium text-zinc-600 uppercase tracking-[0.08em] w-[100px] text-right">Execution</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr
                key={problem._id}
                className="group border-b border-border-dark/30 last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
                onClick={() => window.open(problem.url, "_blank")}
              >
                {/* Bookmark */}
                <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleBookmark?.(problem._id)}
                    className={`transition-all p-0.5 rounded hover:bg-white/[0.06] ${
                      isSaved(problem._id) ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-400'
                    }`}
                    title={isSaved(problem._id) ? "Remove bookmark" : "Save problem"}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSaved(problem._id) ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>
                </td>

                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-zinc-700 w-7 shrink-0 tabular-nums">
                      {String(problem.problemId || index + 1).padStart(3, "0")}
                    </span>
                    <span className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                      {problem.title}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-5">
                  <span className="text-[10px] font-medium px-2 py-[3px] rounded bg-white/[0.04] border border-border-dark/50 text-zinc-400 uppercase tracking-wider">
                    {problem.platform}
                  </span>
                </td>

                <td className="py-3.5 px-5">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>

                <td className="py-3.5 px-5">
                  <TagBadge tags={problem.tags} />
                </td>

                <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-white transition-colors"
                  >
                    Solve
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {problems.map((problem) => (
          <div
            key={problem._id}
            className="bg-white/[0.02] border border-border-dark/50 rounded-xl p-4 space-y-3 hover:bg-white/[0.03] transition-colors"
            onClick={() => window.open(problem.url, "_blank")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-[3px] rounded bg-white/[0.04] border border-border-dark/50 text-zinc-400 uppercase tracking-wider">
                  {problem.platform}
                </span>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(problem._id); }}
                className={`transition-all p-0.5 rounded ${
                  isSaved(problem._id) ? 'text-amber-400' : 'text-zinc-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSaved(problem._id) ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
            </div>

            <h3 className="text-[15px] font-medium text-white">{problem.title}</h3>
            <TagBadge tags={problem.tags} />
          </div>
        ))}
      </div>
    </>
  );
}
