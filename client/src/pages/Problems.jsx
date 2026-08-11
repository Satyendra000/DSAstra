import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import api from "../services/api";
import ProblemTable from "../components/ProblemTable";
import FilterBar from "../components/FilterBar";
import HeroCard from "../components/HeroCard";
import Sidebar from "../components/Sidebar";
import { useDebounce } from "../hooks/useDebounce";

/* ── Global Cache for Fast Navigation ── */
let cachedProblems = [];
let cachedTotalPages = 1;
let cachedTotalProblems = 0;
let cachedSavedProblems = [];
let cachedSolvedProblemIds = [];

export default function Problems() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const navigate = useNavigate();

  // Search input ref for Cmd+K shortcut
  const searchInputRef = useRef(null);

  // Read platform from URL query string (e.g., ?platform=LeetCode from prep cards)
  const [searchParams] = useSearchParams();

  const [problems, setProblems] = useState(() => cachedProblems || []);
  const [loading, setLoading] = useState(cachedProblems.length === 0);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(() => cachedTotalPages || 1);
  const [totalProblems, setTotalProblems] = useState(() => cachedTotalProblems || 0);
  const limit = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState(searchParams.get("platform") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") || "");
  const [savedProblems, setSavedProblems] = useState(() => cachedSavedProblems || []);
  const [solvedProblemIds, setSolvedProblemIds] = useState(() => cachedSolvedProblemIds || []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await getToken();
        const bookmarksRes = await api.get("/api/users/bookmarks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        cachedSavedProblems = bookmarksRes.data.savedProblems || [];
        setSavedProblems(cachedSavedProblems);
        const solvedRes = await api.get("/api/users/solved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        cachedSolvedProblemIds = solvedRes.data.solvedProblemIds || [];
        setSolvedProblemIds(cachedSolvedProblemIds);
      } catch (err) {
        console.log("User data not loaded (user may not be synced)", err);
      }
    };
    fetchUserData();
  }, [getToken]);

  const handleToggleBookmark = useCallback(async (problemId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const token = await getToken();
      const res = await api.post(`/api/users/bookmarks/${problemId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedProblems(res.data.savedProblems || []);
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  }, [getToken, user, navigate]);

  useEffect(() => { setPage(1); }, [debouncedSearchTerm, difficultyFilter, platformFilter, statusFilter, tagFilter]);

  // Keyboard shortcut listener (Cmd/Ctrl + K to focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page, limit });
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (difficultyFilter) params.append("difficulty", difficultyFilter);
        if (platformFilter) params.append("platform", platformFilter);
        if (tagFilter) params.append("tag", tagFilter);
        if (statusFilter && solvedProblemIds.length > 0) {
          params.append("status", statusFilter);
          params.append("solvedIds", solvedProblemIds.join(","));
        }
        const res = await api.get(`/api/problems?${params.toString()}`);
        if (res.data && res.data.problems) {
          cachedProblems = res.data.problems;
          cachedTotalPages = res.data.pages;
          cachedTotalProblems = res.data.total;
          
          setProblems(res.data.problems);
          setTotalPages(res.data.pages);
          setTotalProblems(res.data.total);
        } else {
          cachedProblems = res.data;
          cachedTotalPages = 1;
          cachedTotalProblems = res.data.length;
          
          setProblems(res.data);
          setTotalPages(1);
          setTotalProblems(res.data.length);
        }
      } catch (err) {
        setError("Failed to fetch problems. Please try again later.");
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [page, debouncedSearchTerm, difficultyFilter, platformFilter, statusFilter, tagFilter, solvedProblemIds]);

  const handleNextPage = () => setPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="bg-bg-deep text-text-primary min-h-screen flex overflow-hidden selection:bg-accent/20">
      <Sidebar activePage="problems" />

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="md:hidden h-12 border-b border-border flex items-center justify-between px-4 glass-panel sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-[6px] bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-black text-[14px]">code</span>
            </div>
            <span className="font-semibold text-sm">DSAstra</span>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <Link to="/login" className="px-3 py-1 bg-white/[0.02] hover:bg-white/[0.06] border border-border rounded-lg text-[11px] font-medium text-text-secondary hover:text-text-primary transition-all duration-200">
                Sign In
              </Link>
            )}
            <button aria-label="Open menu" className="text-text-secondary hover:text-text-primary p-1 transition-colors">
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          </div>
        </div>

        {/* Top Bar */}
        <div className="hidden md:flex h-14 items-center justify-between px-6 border-b border-border/40 bg-bg-deep/80 backdrop-blur-md shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative group w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[16px] group-focus-within:text-accent transition-colors duration-300">search</span>
              <input type="text" ref={searchInputRef} placeholder="Search problems, algorithms, or topics..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-elevated/30 hover:bg-bg-elevated/50 border border-border/50 rounded-xl py-1.5 pl-9 pr-14 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/40 focus:bg-accent/[0.02] focus:ring-1 focus:ring-accent/20 transition-all duration-300" />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-mono bg-bg-deep px-1.5 py-0.5 rounded-md border border-border/50 leading-none">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <Link to="/login" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-border rounded-lg text-[12px] font-medium text-text-secondary hover:text-text-primary transition-all duration-200">
                Sign In
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-8 md:py-10">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
              <div>
                <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] leading-tight">
                  <span className="text-gradient-white">Problem Explorer</span>
                </h1>
                <p className="text-text-secondary text-[14px] mt-2 max-w-md leading-relaxed">
                  Browse, filter, and practice algorithmic problems across top competitive platforms.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                {[
                  { key: "F", label: "Filter" },
                  { key: "S", label: "Sort" },

                ].map((btn) => (
                  <button key={btn.key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-transparent border border-border rounded-xl text-[12px] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white/[0.02] transition-all duration-200">
                    <kbd className="text-[10px] text-text-muted font-mono bg-white/[0.04] px-1 py-px rounded-md leading-none">{btn.key}</kbd>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <HeroCard />
            <FilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              difficultyFilter={difficultyFilter} setDifficultyFilter={setDifficultyFilter}
              platformFilter={platformFilter} setPlatformFilter={setPlatformFilter}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
              tagFilter={tagFilter} setTagFilter={setTagFilter} />

            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-[68px] w-full rounded-xl bg-white/[0.02] border border-border animate-shimmer flex items-center px-5">
                    <div className="w-9 h-9 rounded-full bg-white/[0.04] shrink-0" />
                    <div className="ml-4 flex-1 space-y-2.5">
                      <div className="h-3.5 w-1/3 bg-white/[0.04] rounded-md" />
                      <div className="h-2.5 w-1/4 bg-white/[0.04] rounded-md" />
                    </div>
                    <div className="h-6 w-20 bg-white/[0.04] rounded-md" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-rose/[0.06] border border-rose/15 rounded-xl text-rose text-[13px]">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            ) : (
              <div className="animate-fade-in">
                <ProblemTable problems={problems} totalProblems={totalProblems} savedProblems={savedProblems} solvedProblemIds={solvedProblemIds} onToggleBookmark={handleToggleBookmark} />
                {page < totalPages && (
                  <div className="flex justify-center mt-10 pb-4">
                    <button onClick={handleNextPage}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-white/[0.03] border border-border rounded-xl text-[13px] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white/[0.05] transition-all duration-200 group">
                      Fetch Next Buffer
                      <span className="material-symbols-outlined text-[15px] group-hover:translate-y-0.5 transition-transform duration-200">expand_more</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}