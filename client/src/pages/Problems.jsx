import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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

  const userName = user?.firstName || user?.username || "Guest";
  const userAvatar = user?.imageUrl;
  const navigate = useNavigate();

  // Read platform from URL query string (e.g., ?platform=LeetCode from prep cards)
  const [searchParams] = useSearchParams();

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
  const [platformFilter, setPlatformFilter] = useState(searchParams.get("platform") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [savedProblems, setSavedProblems] = useState([]);
  const [solvedProblemIds, setSolvedProblemIds] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await getToken();
        const bookmarksRes = await api.get("/api/users/bookmarks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedProblems(bookmarksRes.data.savedProblems || []);
        const solvedRes = await api.get("/api/users/solved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSolvedProblemIds(solvedRes.data.solvedProblemIds || []);
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
  }, [getToken]);

  useEffect(() => { setPage(1); }, [debouncedSearchTerm, difficultyFilter, platformFilter, statusFilter]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page, limit });
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (difficultyFilter) params.append("difficulty", difficultyFilter);
        if (platformFilter) params.append("platform", platformFilter);
        if (statusFilter && solvedProblemIds.length > 0) {
          params.append("status", statusFilter);
          params.append("solvedIds", solvedProblemIds.join(","));
        }
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
  }, [page, debouncedSearchTerm, difficultyFilter, platformFilter, statusFilter, solvedProblemIds]);

  const handleNextPage = () => setPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="bg-bg-deep text-text-primary min-h-screen flex overflow-hidden selection:bg-accent/20">
      {/* ─── Sidebar ─── */}
      <aside className="w-[260px] border-r border-border hidden md:flex flex-col bg-bg-deep shrink-0 relative">
        {/* Subtle ambient glow in sidebar */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent/[0.03] to-transparent pointer-events-none" />

        <div className="h-14 flex items-center px-5 gap-3 border-b border-border relative z-10">
          <div className="size-7 rounded-[8px] bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center shadow-sm" style={{ boxShadow: '0 0 12px rgba(226,179,64,0.15)' }}>
            <span className="material-symbols-outlined text-black text-[16px]">code</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-[15px] tracking-tight text-text-primary">DSAstra</span>
            <span className="text-[10px] text-text-tertiary uppercase tracking-[0.16em] mt-0.5">Kinetic Monolith</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5 relative z-10">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.03] transition-all duration-200 text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Dashboard
          </Link>
          <Link to="/problems" className="nav-active flex items-center gap-2.5 px-3 py-[7px] rounded-lg bg-accent/[0.08] text-accent font-medium text-[13px] border border-accent/10 transition-all duration-200">
            <span className="material-symbols-outlined text-[18px]">code</span>
            Problems
          </Link>
          {[
            { to: "#", icon: "emoji_events", label: "Contests" },
            { to: "#", icon: "target", label: "Practice" },
            { to: "#", icon: "bar_chart", label: "Analytics" },
          ].map((item) => (
            <Link key={item.label} to={item.to}
              className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.03] transition-all duration-200 text-[13px] font-medium">
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>


        {user ? (
          <div className="px-3 py-3 border-t border-border relative z-10">
            <button onClick={() => signOut()} className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all duration-200 text-left group">
              <div className="size-7 rounded-full bg-bg-hover overflow-hidden border border-border shrink-0">
                {userAvatar && <img alt="" className="w-full h-full object-cover" src={userAvatar} />}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden leading-none">
                <span className="text-[13px] font-medium text-text-primary truncate">{userName}</span>
                <span className="text-[11px] text-text-tertiary truncate mt-0.5">Pro Plan</span>
              </div>
              <span className="material-symbols-outlined text-text-tertiary group-hover:text-rose text-[16px] opacity-0 group-hover:opacity-100 transition-all duration-200" title="Sign Out">logout</span>
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 border-t border-border relative z-10 flex flex-col gap-2">
            <p className="text-[11px] text-text-tertiary text-center mb-1">Sign in to track progress</p>
            <Link to="/login" className="flex justify-center items-center py-2 bg-gradient-to-r from-accent to-amber-500 hover:from-accent-hover hover:to-amber-400 text-black text-[13px] font-semibold rounded-lg shadow-[0_0_15px_rgba(226,179,64,0.15)] transition-all">
              Sign In
            </Link>
            <Link to="/register" className="flex justify-center items-center py-2 bg-white/[0.03] hover:bg-white/[0.08] text-text-secondary text-[13px] font-medium rounded-lg border border-border transition-all">
              Create Account
            </Link>
          </div>
        )}
      </aside>

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
              <Link to="/login" className="text-[11px] font-semibold text-accent px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
                Sign In
              </Link>
            )}
            <button className="text-text-secondary hover:text-text-primary p-1 transition-colors">
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          </div>
        </div>

        {/* Top Bar */}
        <div className="hidden md:flex h-12 items-center justify-between px-6 border-b border-border glass-panel shrink-0">
          <div className="flex items-center gap-2 text-[13px]">
            <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors duration-200">Home</Link>
            <span className="text-text-muted">/</span>
            <span className="text-text-primary font-medium">Problems</span>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <Link to="/login" className="flex items-center gap-1.5 px-3 py-1 border border-accent/30 rounded-lg text-[12px] font-medium text-accent hover:bg-accent/10 transition-all duration-200">
                Sign In
              </Link>
            )}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-[15px]">search</span>
              <input type="text" placeholder="Search..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 bg-white/[0.03] border border-border rounded-xl py-1.5 pl-8 pr-14 text-[13px] text-text-primary placeholder-text-muted focus:outline-none input-glow focus:bg-white/[0.05] transition-all duration-200 focus:w-64" />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-mono bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-border leading-none">⌘K</kbd>
            </div>
            <div className="w-px h-5 bg-border"></div>

            <div className="size-7 rounded-full bg-bg-hover overflow-hidden border border-border cursor-pointer hover:border-border-hover transition-colors duration-200">
              {userAvatar && <img alt="" className="w-full h-full object-cover" src={userAvatar} />}
            </div>
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
                  Technical difficulty indexed across global competitive platforms. Select a vector to begin deployment.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                {[
                  { key: "F", label: "Filter" },
                  { key: "S", label: "Sort" },
                  { key: "T", label: "Tags" },
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
              statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

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