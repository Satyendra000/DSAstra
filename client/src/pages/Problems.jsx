import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import api from "../services/api";
import ProblemTable from "../components/ProblemTable";
import FilterBar from "../components/FilterBar";
import HeroCard from "../components/HeroCard";
import { useDebounce } from "../hooks/useDebounce";

export default function Problems() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  const userName = user?.firstName || user?.username || "User";
  const userAvatar = user?.imageUrl;

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const limit = 20;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [savedProblems, setSavedProblems] = useState([]);

  // Fetch bookmarks on mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const token = await getToken();
        const res = await api.get("/api/users/bookmarks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedProblems(res.data.savedProblems || []);
      } catch (err) {
        console.log("Bookmarks not loaded (user may not be synced)", err);
      }
    };
    fetchBookmarks();
  }, [getToken]);

  const handleToggleBookmark = useCallback(async (problemId) => {
    try {
      const token = await getToken();
      const res = await api.post(`/api/users/bookmarks/${problemId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedProblems(res.data.savedProblems || []);
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  }, [getToken]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, difficultyFilter, platformFilter]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page, limit });
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (difficultyFilter) params.append("difficulty", difficultyFilter);
        if (platformFilter) params.append("platform", platformFilter);

        const res = await api.get(`/api/problems?${params.toString()}`);
        if (res.data && res.data.problems) {
          setProblems(res.data.problems);
          setTotalPages(res.data.pages);
          setTotalProblems(res.data.total);
        } else {
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
  }, [page, debouncedSearchTerm, difficultyFilter, platformFilter]);

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="bg-background-dark text-white min-h-screen flex overflow-hidden selection:bg-primary/25 selection:text-white">
      {/* ─── Sidebar ─── */}
      <aside className="w-[260px] border-r border-border-dark/70 hidden md:flex flex-col bg-background-dark shrink-0">
        {/* Brand */}
        <div className="h-14 flex items-center px-5 gap-3 border-b border-border-dark/50">
          <div className="size-7 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">code</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-[15px] tracking-tight text-white">DSAstra</span>
            <span className="text-[10px] text-subtle-text uppercase tracking-[0.16em] mt-0.5">Kinetic Monolith</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-subtle-text hover:text-white hover:bg-white/[0.04] transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Dashboard
          </Link>
          <Link to="/problems" className="flex items-center gap-2.5 px-3 py-[7px] rounded-md bg-white/[0.06] text-white font-medium text-[13px] transition-all">
            <span className="material-symbols-outlined text-[18px]">code</span>
            Problems
          </Link>
          <Link to="#" className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-subtle-text hover:text-white hover:bg-white/[0.04] transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">emoji_events</span>
            Contests
          </Link>
          <Link to="#" className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-subtle-text hover:text-white hover:bg-white/[0.04] transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">target</span>
            Practice
          </Link>
          <Link to="#" className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-subtle-text hover:text-white hover:bg-white/[0.04] transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            Analytics
          </Link>
        </nav>

        {/* System Status */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2.5 px-3 py-[7px] text-subtle-text text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
            System Status
          </div>
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-border-dark/50">
          <button onClick={() => signOut()} className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors text-left group">
            <div className="size-7 rounded-full bg-zinc-800 overflow-hidden border border-border-dark shrink-0">
              {userAvatar && <img alt="" className="w-full h-full object-cover" src={userAvatar} />}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden leading-none">
              <span className="text-[13px] font-medium text-white truncate">{userName}</span>
              <span className="text-[11px] text-subtle-text truncate mt-0.5">Pro Plan</span>
            </div>
            <span className="material-symbols-outlined text-subtle-text group-hover:text-red-400 text-[16px] opacity-0 group-hover:opacity-100 transition-all" title="Sign Out">logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-12 border-b border-border-dark/70 flex items-center justify-between px-4 bg-background-dark/90 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">code</span>
            </div>
            <span className="font-semibold text-sm">DSAstra</span>
          </div>
          <button className="text-subtle-text hover:text-white p-1">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>

        {/* Top Bar */}
        <div className="hidden md:flex h-12 items-center justify-between px-6 border-b border-border-dark/50 bg-background-dark/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2 text-[13px]">
            <Link to="/" className="text-subtle-text hover:text-white transition-colors">Home</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-white font-medium">Problems</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle-text text-[15px]">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 bg-white/[0.04] border border-border-dark/70 rounded-md py-1.5 pl-8 pr-14 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:bg-white/[0.06] transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-mono bg-white/[0.04] px-1.5 py-0.5 rounded border border-border-dark/50 leading-none">⌘K</kbd>
            </div>

            <div className="w-px h-5 bg-border-dark/50"></div>

            <button className="text-subtle-text hover:text-white transition-colors relative p-1">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            </button>
            <button className="text-subtle-text hover:text-white transition-colors p-1">
              <span className="material-symbols-outlined text-[18px]">code</span>
            </button>
            <div className="size-7 rounded-full bg-zinc-800 overflow-hidden border border-border-dark/70 cursor-pointer hover:border-zinc-600 transition-colors">
              {userAvatar && <img alt="" className="w-full h-full object-cover" src={userAvatar} />}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-8 md:py-10">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] text-white leading-tight">
                  Problem Explorer
                </h1>
                <p className="text-subtle-text text-[14px] mt-2 max-w-md leading-relaxed">
                  Technical difficulty indexed across global competitive platforms. Select a vector to begin deployment.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-1.5">
                {[
                  { key: "F", label: "Filter" },
                  { key: "S", label: "Sort" },
                  { key: "T", label: "Tags" },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-transparent border border-border-dark/60 rounded-md text-[12px] font-medium text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-white/[0.02] transition-all"
                  >
                    <kbd className="text-[10px] text-zinc-600 font-mono bg-white/[0.06] px-1 py-px rounded leading-none">{btn.key}</kbd>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero */}
            <HeroCard />

            {/* Filters */}
            <FilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              difficultyFilter={difficultyFilter}
              setDifficultyFilter={setDifficultyFilter}
              platformFilter={platformFilter}
              setPlatformFilter={setPlatformFilter}
            />

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <span className="material-symbols-outlined text-zinc-600 text-3xl animate-spin mb-3">progress_activity</span>
                <p className="text-subtle-text text-[13px]">Indexing problem vectors...</p>
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-500/8 border border-red-500/15 rounded-lg text-red-400 text-[13px]">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            ) : (
              <div className="animate-fade-in">
                <ProblemTable problems={problems} totalProblems={totalProblems} savedProblems={savedProblems} onToggleBookmark={handleToggleBookmark} />

                {page < totalPages && (
                  <div className="flex justify-center mt-10 pb-4">
                    <button
                      onClick={handleNextPage}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-white/[0.04] border border-border-dark/60 rounded-lg text-[13px] font-medium text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-white/[0.06] transition-all"
                    >
                      Fetch Next Buffer
                      <span className="material-symbols-outlined text-[15px]">expand_more</span>
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