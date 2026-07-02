import { useNavigate } from "react-router-dom";
import DifficultyBadge from "./DifficultyBadge";
import TagBadge from "./TagBadge";

export default function ProblemTable({
  problems,
  totalProblems,
  savedProblems = [],
  solvedProblemIds = [],
  onToggleBookmark,
}) {
  const navigate = useNavigate();
  const isSaved = (id) => savedProblems.includes(id);
  const isSolved = (id) => solvedProblemIds.includes(id);

  if (!problems || problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 bg-white/[0.02] rounded-2xl mb-4 border border-border">
          <span className="material-symbols-outlined text-text-muted text-3xl">
            search_off
          </span>
        </div>
        <h3 className="text-[15px] font-medium text-text-primary mb-1">
          No vectors found
        </h3>
        <p className="text-text-secondary text-[13px]">
          Adjust your search parameters to locate problem vectors.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Count */}
      <div className="flex items-center justify-end mb-2.5">
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium font-mono">
          Viewing <span className="text-text-secondary">{problems.length}</span> of{" "}
          <span className="text-text-secondary">
            {totalProblems?.toLocaleString() || problems.length}
          </span>{" "}
          entries
        </span>
      </div>

      {/* Table */}
      <div className="hidden md:block w-full border border-border rounded-2xl overflow-hidden bg-white/[0.01]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-white/[0.02]">
              <th className="py-3.5 px-3 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] w-8"></th>
              <th className="py-3.5 px-3 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] w-10"></th>
              <th className="py-3.5 px-5 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] w-[300px]">
                Problem Vector
              </th>
              <th className="py-3.5 px-5 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] w-[130px]">
                Source Node
              </th>
              <th className="py-3.5 px-5 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] w-[130px]">
                Complexity
              </th>
              <th className="py-3.5 px-5 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em]">
                Architecture
              </th>
              <th className="py-3.5 px-5 text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] w-[100px] text-right">
                Execution
              </th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr
                key={problem._id}
                className="group border-b border-border/50 last:border-b-0 hover:bg-accent/[0.02] transition-all duration-200 cursor-pointer relative"
                onClick={() => navigate(`/editor/${problem._id}`)}
              >
                {/* Hover gradient sweep */}
                <td className="absolute inset-0 bg-gradient-to-r from-accent/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Solved Status */}
                <td className="py-3.5 px-3 text-center relative">
                  {isSolved(problem._id) ? (
                    <span
                      className="material-symbols-outlined text-[16px] text-emerald"
                      title="Solved"
                    >
                      check_circle
                    </span>
                  ) : (
                    <span
                      className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-text-tertiary transition-colors"
                      title="Not solved"
                    >
                      radio_button_unchecked
                    </span>
                  )}
                </td>

                {/* Bookmark */}
                <td
                  className="py-3.5 px-3 text-center relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleBookmark?.(problem._id)}
                    className={`transition-all duration-200 p-0.5 rounded-md hover:bg-white/[0.06] hover:scale-110 ${
                      isSaved(problem._id)
                        ? "text-amber"
                        : "text-text-muted hover:text-text-tertiary"
                    }`}
                    title={
                      isSaved(problem._id) ? "Remove bookmark" : "Save problem"
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSaved(problem._id) ? "bookmark" : "bookmark_border"}
                    </span>
                  </button>
                </td>

                <td className="py-3.5 px-5 relative">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-text-muted w-7 shrink-0 tabular-nums">
                      {String(problem.problemId || index + 1).padStart(3, "0")}
                    </span>
                    <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200 truncate">
                      {problem.title}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-5 relative">
                  <span className="text-[10px] font-medium px-2 py-[3px] rounded-md bg-white/[0.03] border border-border text-text-secondary uppercase tracking-wider">
                    {problem.platform}
                  </span>
                </td>

                <td className="py-3.5 px-5 relative">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>

                <td className="py-3.5 px-5 relative">
                  <TagBadge tags={problem.tags} />
                </td>

                <td
                  className="py-3.5 px-5 text-right relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => navigate(`/editor/${problem._id}`)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-text-tertiary hover:text-accent transition-colors duration-200 group/btn"
                  >
                    {isSolved(problem._id) ? "Review" : "Solve"}
                    <span className="material-symbols-outlined text-[13px] group-hover/btn:translate-x-0.5 transition-transform duration-200">
                      arrow_forward
                    </span>
                  </button>
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
            className="glass-card rounded-xl p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-transform duration-150"
            onClick={() => navigate(`/editor/${problem._id}`)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isSolved(problem._id) && (
                  <span
                    className="material-symbols-outlined text-[16px] text-emerald"
                    title="Solved"
                  >
                    check_circle
                  </span>
                )}
                <span className="text-[10px] font-medium px-2 py-[3px] rounded-md bg-white/[0.03] border border-border text-text-secondary uppercase tracking-wider">
                  {problem.platform}
                </span>
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark?.(problem._id);
                }}
                className={`transition-all duration-200 p-0.5 rounded-md ${
                  isSaved(problem._id) ? "text-amber" : "text-text-muted"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSaved(problem._id) ? "bookmark" : "bookmark_border"}
                </span>
              </button>
            </div>

            <h3 className="text-[15px] font-medium text-text-primary">
              {problem.title}
            </h3>
            <TagBadge tags={problem.tags} />
          </div>
        ))}
      </div>
    </>
  );
}
