import { useMemo, useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import BootLoader from "../components/BootLoader";
import Sidebar from "../components/Sidebar";

/* ─────────────────────────────────────────────────────── Heatmap ── */
const Heatmap = ({ heatmapData = {} }) => {
  const cells = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const count = heatmapData[dateKey] || 0;
      let level = 0;
      if (count >= 10) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;
      data.push({ date: d, level, count, dateKey });
    }
    return data;
  }, [heatmapData]);

  const levels = [
    "bg-white/[0.03]",
    "bg-emerald/20",
    "bg-emerald/40",
    "bg-emerald/60",
    "bg-emerald/80",
  ];

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="space-y-2.5">
      <div className="flex gap-[3px] ml-8">
        {weeks.map((week, wi) => {
          const firstDay = week[0]?.date;
          const showLabel = firstDay && firstDay.getDate() <= 7;
          return (
            <div key={wi} className="w-[12px] shrink-0">
              {showLabel && (
                <span className="text-[9px] text-text-tertiary font-medium">
                  {months[firstDay.getMonth()]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] text-[9px] text-text-muted w-7 shrink-0">
          <span className="h-[12px]" />
          <span className="h-[12px] flex items-center">Mon</span>
          <span className="h-[12px]" />
          <span className="h-[12px] flex items-center">Wed</span>
          <span className="h-[12px]" />
          <span className="h-[12px] flex items-center">Fri</span>
          <span className="h-[12px]" />
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) => (
                <div
                  key={ci}
                  role="img"
                  aria-label={`${cell.dateKey}: ${cell.count} submission${cell.count !== 1 ? "s" : ""}`}
                  className={`w-[12px] h-[12px] rounded-[3px] ${levels[cell.level]} hover:ring-1 hover:ring-accent/40 transition-all duration-150 cursor-crosshair`}
                  title={`${cell.dateKey} — ${cell.count} submission${cell.count !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-0.5">
        <span className="text-[9px] text-text-muted">Less</span>
        {levels.map((l, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${l}`} />
        ))}
        <span className="text-[9px] text-text-muted">More</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────── Mini Sparkline SVG ── */
const Sparkline = ({ data, color = "#e2b340", width = 64, height = 28 }) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="opacity-30 flex items-end">
      <div className="w-full h-px" style={{ background: color }} />
    </div>;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-50 group-hover:opacity-90 transition-opacity duration-300">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts.join(" ")} />
      <polygon fill={`url(#grad-${color.replace("#", "")})`} points={`0,${height} ${pts.join(" ")} ${width},${height}`} />
    </svg>
  );
};

/* ─────────────────────────────────── Circular Progress Ring ── */
const ProgressRing = ({ value, max, size = 48, strokeWidth = 3.5, color = "#e2b340" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={circumference - progress}
        strokeLinecap="round" className="transition-all duration-700" style={{ filter: `drop-shadow(0 0 4px ${color}40)` }} />
    </svg>
  );
};

/* ─────────────────────────────────────── Platform SVG Icons ── */
const PlatformIcon = ({ platform, size = 16, className = "" }) => {
  switch (platform) {
    case "Codeforces":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-1C2.672 21 2 20.328 2 19.5V9c0-.828.672-1.5 1.5-1.5h1zm7-4.5c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5h-1c-.828 0-1.5-.672-1.5-1.5v-15c0-.828.672-1.5 1.5-1.5h1zm7 9c.828 0 1.5.672 1.5 1.5v6c0 .828-.672 1.5-1.5 1.5h-1c-.828 0-1.5-.672-1.5-1.5v-6c0-.828.672-1.5 1.5-1.5h1z" />
        </svg>
      );
    case "LeetCode":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
        </svg>
      );
    case "CodeChef":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M11.257.004C10.47.058 9.8.327 9.173.81c-.391.306-.634.576-.927 1.032a10.31 10.31 0 0 0-.342.584c-.063.121-.122.218-.131.218s-.088-.051-.176-.114c-.618-.442-1.313-.63-2.145-.582-.482.031-.744.09-1.12.257-.698.306-1.208.862-1.528 1.664-.142.353-.2.603-.259 1.114a5.327 5.327 0 0 0 .034 1.214c.03.147.055.278.055.29 0 .015-.088.031-.196.041a4.1 4.1 0 0 0-.924.222 3.547 3.547 0 0 0-1.343.889c-.376.387-.573.697-.788 1.235-.127.32-.178.529-.238.967-.069.524-.043 1.122.073 1.687.095.45.353 1.143.53 1.424.042.065.065.122.055.131-.013.006-.075.042-.142.078A3.6 3.6 0 0 0 .06 13.62c-.282.55-.135 1.345.35 1.895.178.2.568.494.81.608.12.059.218.114.218.124a.792.792 0 0 1-.088.147c-.177.295-.29.644-.39 1.188-.048.255-.055.396-.055.895 0 .611.01.716.11 1.17.165.747.468 1.555.782 2.082l.131.222-.088.171c-.226.444-.265.852-.118 1.218.06.149.298.503.403.6.339.31.91.43 1.573.33.182-.028.341-.045.355-.037.013.008.045.11.072.227.108.459.282.864.559 1.291.395.612.948 1.065 1.659 1.361.367.153.624.208 1.06.222.587.019 1.065-.084 1.555-.335.176-.092.321-.159.321-.151.003.011.039.116.078.237.152.437.465.902.851 1.267.53.499 1.09.753 1.8.818.386.036.94-.032 1.321-.16.228-.077.594-.259.768-.38l.131-.092.171.116c.467.316 1.125.505 1.769.511.746.003 1.29-.182 1.832-.625.381-.31.67-.676.895-1.135.069-.141.131-.257.141-.257.006 0 .112.055.232.124.473.263.937.38 1.478.375.764-.01 1.357-.235 1.906-.724.481-.431.81-.978.993-1.655l.069-.259.182.013c.499.034 1.015-.069 1.399-.283.39-.218.712-.559.89-.937.11-.238.118-.277.118-.556 0-.263-.01-.324-.092-.507a2.073 2.073 0 0 0-.28-.462l-.143-.174.04-.067c.254-.399.524-1.045.674-1.615.182-.702.234-1.09.234-1.79 0-.485-.01-.64-.058-.895-.106-.556-.218-.903-.414-1.274-.024-.045.024-.08.174-.13.538-.175.97-.459 1.252-.822.46-.592.515-1.331.15-1.96-.158-.269-.614-.709-.868-.834a3.08 3.08 0 0 0-.145-.066c.01-.015.088-.155.178-.31.223-.389.39-.782.521-1.222.187-.629.259-1.096.264-1.703.007-.721-.086-1.196-.34-1.744-.213-.455-.43-.748-.812-1.1-.424-.387-.843-.602-1.395-.712l-.227-.045.003-.131c.018-.504-.041-.968-.18-1.407-.27-.858-.748-1.444-1.497-1.837a3.3 3.3 0 0 0-1.109-.349c-.8-.106-1.57.082-2.22.543-.134.095-.251.172-.258.172-.007 0-.062-.095-.122-.214a4.557 4.557 0 0 0-.542-.82C13.702.365 13.118.072 12.397.012a4.177 4.177 0 0 0-1.14-.008z" />
        </svg>
      );
    default:
      return <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>code</span>;
  }
};

/* ─────────────────────────────── Platform rank helpers ── */
const getRankForPlatform = (platform, rating) => {
  if (!rating || rating === 0) return "Unrated";
  if (platform === "Codeforces") {
    if (rating >= 2400) return "Grandmaster";
    if (rating >= 2100) return "Master";
    if (rating >= 1900) return "Candidate Master";
    if (rating >= 1600) return "Expert";
    if (rating >= 1400) return "Specialist";
    if (rating >= 1200) return "Pupil";
    return "Newbie";
  }
  if (platform === "LeetCode") {
    if (rating >= 2400) return "Guardian";
    if (rating >= 2000) return "Knight";
    if (rating >= 1600) return "Competitor";
    return "Participant";
  }
  if (platform === "CodeChef") {
    if (rating >= 2500) return "7★";
    if (rating >= 2200) return "6★";
    if (rating >= 2000) return "5★";
    if (rating >= 1800) return "4★";
    if (rating >= 1600) return "3★";
    if (rating >= 1400) return "2★";
    return "1★";
  }
  return "Unrated";
};

const getPlatformColor = (platform) => {
  switch (platform) {
    case "Codeforces": return "#60a5fa";
    case "LeetCode":   return "#fbbf24";
    case "CodeChef":   return "#fb923c";
    default:           return "#8a8f98";
  }
};

/* ─────────────────── Countdown formatter ── */
const formatCountdown = (startTimeISO) => {
  const diff = new Date(startTimeISO) - Date.now();
  if (diff <= 0) return "Live now";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatContestTime = (startTimeISO) => {
  const d = new Date(startTimeISO);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

/* ── Global Cache for Fast Navigation ── */
let cachedStats = null;
let cachedContests = null;
let cachedPrepCounts = null;

/* ═══════════════════════════════════════════════════ Main Component ══ */
const Home = () => {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const userName    = user?.firstName || user?.username || "Guest";
  const userAvatar  = user?.imageUrl;

  /* ── Stats state ── */
  const [stats, setStats] = useState(() => cachedStats || {
    solvedCount: 0, streak: 0, heatmapData: {},
    platformRatings: [], targetRating: 1500,
    activeDays: 0, avgPerDay: 0, contestsParticipated: 0,
    platformHandles: { codeforces: "", leetcode: "", codechef: "" },
  });
  const [statsLoading, setStatsLoading] = useState(!cachedStats);

  /* ── Contest state ── */
  const [contests, setContests] = useState(() => cachedContests || []);
  const [contestsLoading, setContestsLoading] = useState(!cachedContests);

  /* ── Prep card counts ── */
  const [prepCounts, setPrepCounts] = useState(() => cachedPrepCounts || { LeetCode: 0, Codeforces: 0, CodeChef: 0 });

  /* ── Sync button ── */
  const [syncing, setSyncing] = useState(false);

  /* ── Toast notification (replaces alert()) ── */
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) { setStatsLoading(false); return; }
      const res = await api.get("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      cachedStats = res.data;
      setStats(res.data);

      // Removed modal trigger
    } catch (err) {
      console.log("Stats not loaded:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [getToken]);

  /* ── Fetch contests ── */
  const fetchContests = useCallback(async () => {
    try {
      const res = await api.get("/api/contests/upcoming");
      const fetched = res.data.contests || [];
      // Only show CodeChef starter contests, keep all other platforms
      const filtered = fetched.filter(c => 
        c.platformKey !== "CC" || c.title.toLowerCase().includes("starter")
      );
      cachedContests = filtered;
      setContests(filtered);
    } catch (err) {
      console.log("Contests not loaded:", err);
    } finally {
      setContestsLoading(false);
    }
  }, []);

  /* ── Fetch problem counts per platform ── */
  const fetchPrepCounts = useCallback(async () => {
    try {
      const [lcRes, cfRes, ccRes] = await Promise.all([
        api.get("/api/problems?platform=LeetCode&limit=1"),
        api.get("/api/problems?platform=Codeforces&limit=1"),
        api.get("/api/problems?platform=CodeChef&limit=1"),
      ]);
      const data = {
        LeetCode: Number(lcRes.data.total) || 0,
        Codeforces: Number(cfRes.data.total) || 0,
        CodeChef: Number(ccRes.data.total) || 0,
      };
      cachedPrepCounts = data;
      setPrepCounts(data);
    } catch (err) {
      console.log("Prep counts not loaded:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchContests();
    fetchPrepCounts();
  }, [fetchStats, fetchContests, fetchPrepCounts]);

  /* ── Sync handler ── */
  const handleSync = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setSyncing(true);
      const token = await getToken();
      await api.post("/api/users/sync",
        { email: user?.primaryEmailAddress?.emailAddress, name: user?.fullName },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 
        }
      );
      await fetchStats();
    } catch (err) {
      console.error("Sync failed:", err);
      setToast({ type: "error", message: err.code === "ECONNABORTED" ? "Sync timed out — please try again" : "Sync failed — check your connection" });
    } finally {
      setSyncing(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* ── Platform cards data ── */
  const handles = stats.platformHandles || {};
  const platforms = stats.platformRatings && stats.platformRatings.length > 0
    ? stats.platformRatings.map((p) => ({
        name:      p.name,
        rating:    p.rating || 0,
        maxRating: p.maxRating || 0,
        rank:      getRankForPlatform(p.name, p.rating),
        handle:    handles[p.name.toLowerCase()] || handles[p.name === "Codeforces" ? "codeforces" : p.name === "LeetCode" ? "leetcode" : "codechef"] || "",
        delta:     p.sparkline?.length >= 2 ? p.rating - p.sparkline[p.sparkline.length - 2] : 0,
        color:     getPlatformColor(p.name),
        sparkline: p.sparkline?.length >= 2 ? p.sparkline : [p.rating || 0],
      }))
    : [
        { name: "Codeforces", rating: 0, maxRating: 0, rank: "Unrated", handle: handles.codeforces || "", delta: 0, color: "#60a5fa", sparkline: [0] },
        { name: "LeetCode",   rating: 0, maxRating: 0, rank: "Unrated", handle: handles.leetcode  || "", delta: 0, color: "#fbbf24", sparkline: [0] },
        { name: "CodeChef",   rating: 0, maxRating: 0, rank: "Unrated", handle: handles.codechef  || "", delta: 0, color: "#fb923c", sparkline: [0] },
      ];

  /* ── Real streak week bars (last 7 days) ── */
  const streakWeekBars = useMemo(() => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key  = d.toISOString().split("T")[0];
      const day  = days[d.getDay()];
      const active = !!(stats.heatmapData[key] && stats.heatmapData[key] > 0);
      result.push({ day, active, isToday: i === 0 });
    }
    return result;
  }, [stats.heatmapData]);

  /* ── Prep cards ── */
  const prepCards = [
    { title: "Codeforces Div 2",  desc: "Master 1200–1600 rated problems. Greedy, math, and constructive algorithms.", platform: "Codeforces", color: "#60a5fa", problems: prepCounts.Codeforces },
    { title: "LeetCode Weekly",   desc: "Recent weekly contest problems. Arrays, trees, and dynamic programming.",      platform: "LeetCode",   color: "#fbbf24", problems: prepCounts.LeetCode },
    { title: "CodeChef Starters", desc: "Starters-level problems. Speed up implementation and number theory.",          platform: "CodeChef",   color: "#fb923c", problems: prepCounts.CodeChef },
  ];

  /* ── Difficulty percentages (real data) ── */
  const difficultyPcts = useMemo(() => {
    const ext = stats.externalStats || {};
    const easy = (ext.leetcode?.easySolved || 0) + (ext.codeforces?.easySolved || 0) + (ext.codechef?.easySolved || 0);
    const med  = (ext.leetcode?.mediumSolved || 0) + (ext.codeforces?.mediumSolved || 0) + (ext.codechef?.mediumSolved || 0);
    const hard = (ext.leetcode?.hardSolved || 0) + (ext.codeforces?.hardSolved || 0) + (ext.codechef?.hardSolved || 0);
    const total = easy + med + hard;
    if (total === 0) return { easy: 33, med: 34, hard: 33 };
    return {
      easy: Math.round((easy / total) * 100),
      med:  Math.round((med / total) * 100),
      hard: Math.max(100 - Math.round((easy / total) * 100) - Math.round((med / total) * 100), 0),
    };
  }, [stats.externalStats]);

  if (!isLoaded || statsLoading) {
    return <BootLoader />;
  }

  return (
    <div className="bg-bg-deep text-text-primary min-h-screen flex overflow-hidden selection:bg-accent/20">

      <Sidebar activePage="dashboard" handles={stats.platformHandles} />

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
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

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1120px] mx-auto px-6 md:px-10 py-8 md:py-10 space-y-8">

            {/* ── Welcome ── */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
              <div>
                <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.025em] leading-tight">
                  <span className="text-gradient-white">{greeting},</span>{" "}
                  <span className="text-gradient-gold">{userName}</span>
                </h1>
                <p className="text-text-secondary text-[13px] mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald">check_circle</span>
                    {stats.solvedCount} solved
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-orange">local_fire_department</span>
                    {stats.streak} day streak
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-accent">military_tech</span>
                    {platforms[0]?.rank || "Unrated"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!user && (
                  <Link to="/login" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-accent/30 rounded-xl text-[12px] font-medium text-accent hover:bg-accent/10 transition-all duration-200">
                    Sign In
                  </Link>
                )}
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-[12px] font-medium text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-white/[0.03] transition-all duration-200 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[15px] ${syncing ? "animate-spin" : ""}`}>sync</span>
                  {syncing ? "Syncing…" : "Sync"}
                </button>
                <Link to="/problems"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-accent to-amber-500 hover:from-accent-hover hover:to-amber-400 rounded-xl text-[12px] font-semibold text-black transition-all duration-200 hover:shadow-lg group/solve">
                  <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                  Solve
                </Link>
              </div>
            </section>

            {/* ── Platform Ratings ── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {platforms.map((p, i) => (
                <div key={p.name}
                  className={`group relative glass-card rounded-2xl p-5 overflow-hidden animate-fade-in-up stagger-${i + 1}`}>
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: p.color + "12" }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl flex items-center justify-center"
                          style={{ background: p.color + "15", border: `1px solid ${p.color}20` }}>
                          <PlatformIcon platform={p.name} size={16}
                            className={`${p.name === "Codeforces" ? "text-blue" : p.name === "LeetCode" ? "text-amber" : "text-orange"}`} />
                        </div>
                        <div className="leading-none">
                          <span className="text-[13px] font-medium text-text-primary block">{p.name}</span>
                          {p.handle ? (
                            <span className="text-[10px] text-text-tertiary font-mono">@{p.handle}</span>
                          ) : (
                            <button
                              onClick={() => navigate('/settings')}
                              className="text-[10px] text-accent-secondary hover:text-violet transition-colors duration-200"
                            >
                              + Add handle
                            </button>
                          )}
                        </div>
                      </div>
                      <Sparkline data={p.sparkline} color={p.color} />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[32px] font-bold text-text-primary tracking-tight leading-none"
                          style={{ fontVariantNumeric: "tabular-nums" }}>
                          {p.rating.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2.5 mt-2.5">
                          <span className="text-[10px] font-semibold px-2 py-[3px] rounded-lg uppercase tracking-wider"
                            style={{ background: p.color + "12", color: p.color, border: `1px solid ${p.color}18` }}>
                            {p.rank}
                          </span>
                          {p.sparkline.length >= 2 && (
                            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${p.delta >= 0 ? "text-emerald" : "text-rose"}`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {p.delta >= 0 ? "trending_up" : "trending_down"}
                              </span>
                              {p.delta >= 0 ? "+" : ""}{p.delta}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-muted block">Peak</span>
                        <span className="text-[14px] font-semibold text-text-secondary font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {p.maxRating || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* ── Stats ── */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Solved */}
              <div className="glass-card rounded-2xl p-4 lg:col-span-2 relative overflow-hidden animate-fade-in-up stagger-1 active:scale-[0.99] transition-transform">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px]">check_circle</span>
                </div>
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium block mb-3">Total Solved</span>
                <span className="text-[28px] font-bold text-text-primary tracking-tight leading-none block" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {(stats.solvedCount || 0) + 
                   (stats.externalStats?.leetcode?.totalSolved || 0) + 
                   (stats.externalStats?.codeforces?.totalSolved || 0) + 
                   (stats.externalStats?.codechef?.totalSolved || 0)}
                </span>
                <div className="flex gap-0.5 mt-3 w-full h-1.5 rounded-full overflow-hidden bg-white/[0.03]">
                  <div className="bg-emerald rounded-l-full transition-all duration-700" style={{ width: `${difficultyPcts.easy}%` }} />
                  <div className="bg-amber transition-all duration-700" style={{ width: `${difficultyPcts.med}%` }} />
                  <div className="bg-rose rounded-r-full transition-all duration-700" style={{ width: `${difficultyPcts.hard}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-medium">
                  <span className="text-emerald">Easy</span>
                  <span className="text-amber">Med</span>
                  <span className="text-rose">Hard</span>
                </div>
              </div>

              {/* Streak */}
              <div className="glass-card rounded-2xl p-4 md:col-span-2 lg:col-span-3 relative overflow-hidden animate-fade-in-up stagger-2 active:scale-[0.98] transition-transform">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px] text-orange">local_fire_department</span>
                </div>
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium block mb-3">Streak</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[28px] font-bold text-text-primary tracking-tight leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {stats.streak}
                  </span>
                  <span className="text-[13px] text-text-muted font-medium">days</span>
                </div>
                {/* Real last 7 days bars */}
                <div className="flex gap-1 mt-3">
                  {streakWeekBars.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-2 rounded-sm transition-all duration-300 relative flex items-center justify-center ${d.active ? "bg-gradient-to-t from-orange to-amber" : d.isToday ? "bg-orange/20" : "bg-white/[0.04]"}`}>
                        {d.active && <span className="text-[5px] text-black/60 font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-[8px] text-text-muted font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Rating */}
              <div className="glass-card rounded-2xl p-4 lg:col-span-3 relative overflow-hidden animate-fade-in-up stagger-3 active:scale-[0.99] transition-transform">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px] text-accent-secondary">emoji_events</span>
                </div>
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium block mb-3">Best Rating</span>
                <span className="text-[28px] font-bold text-text-primary tracking-tight leading-none block" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {Math.max(...platforms.map((p) => p.maxRating), 0).toLocaleString() || "—"}
                </span>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[10px] font-semibold px-1.5 py-[3px] rounded-lg bg-amber/10 text-amber border border-amber/15 uppercase tracking-wider">
                    {platforms.reduce((best, p) => p.maxRating > best.maxRating ? p : best, platforms[0])?.rank || "Unrated"}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    on {platforms.reduce((best, p) => p.maxRating > best.maxRating ? p : best, platforms[0])?.name || "N/A"}
                  </span>
                </div>
              </div>

              {/* Submissions */}
              <div className="glass-card rounded-2xl p-4 md:col-span-2 lg:col-span-2 relative overflow-hidden animate-fade-in-up stagger-4 active:scale-[0.99] transition-transform">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px]">trophy</span>
                </div>
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium block mb-3">Submissions</span>
                <span className="text-[28px] font-bold text-text-primary tracking-tight leading-none block" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {Object.values(stats.heatmapData || {}).reduce((a, b) => a + b, 0)}
                </span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-[10px] text-text-muted">last 365 days</span>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <ProgressRing
                        value={Math.min(stats.activeDays, 365)}
                        max={365}
                        size={32}
                        strokeWidth={2.5}
                        color="#34d399"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-emerald font-mono">
                        {Math.round((stats.activeDays / 365) * 100)}%
                      </span>
                    </div>
                    <span className="text-[9px] text-text-muted leading-tight">active<br/>days</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Heatmap ── */}
            <section className="glass-card rounded-2xl p-5 md:p-6 animate-fade-in-up stagger-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-medium text-text-primary">Activity</h2>
                  <span className="text-[11px] text-text-tertiary bg-white/[0.03] px-2 py-0.5 rounded-lg border border-border font-mono">365 days</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                  <span>
                    <strong className="text-text-primary font-semibold">{stats.activeDays}</strong> active days
                  </span>
                  <span>
                    <strong className="text-text-primary font-semibold">{stats.avgPerDay}</strong> avg/day
                  </span>
                </div>
              </div>
              {statsLoading ? (
                <div className="h-32 w-full mt-4 rounded-xl bg-white/[0.02] border border-border animate-shimmer" />
              ) : stats.solvedCount === 0 ? (
                <div className="mt-4 p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-white/[0.01]">
                  <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[24px] text-accent">rocket_launch</span>
                  </div>
                  <h3 className="text-[14px] font-medium text-text-primary mb-1">Welcome to DSAstra!</h3>
                  <p className="text-[12px] text-text-secondary max-w-[280px] mb-4">
                    Your journey starts here. Link your competitive programming accounts or solve a problem to see your activity.
                  </p>
                  <div className="flex items-center gap-3">
                    <Link to="/settings" className="px-4 py-1.5 rounded-lg border border-border text-[12px] font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.03] active:scale-[0.98] transition-all">
                      Link Accounts
                    </Link>
                    <Link to="/problems" className="px-4 py-1.5 rounded-lg bg-accent text-white text-[12px] font-medium hover:bg-accent-hover active:scale-[0.98] transition-all">
                      Start Solving
                    </Link>
                  </div>
                </div>
              ) : (
                <Heatmap heatmapData={stats.heatmapData} />
              )}
            </section>

            {/* ── Contests + Practice ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Upcoming Contests */}
              <section className="lg:col-span-3 glass-panel rounded-2xl overflow-hidden animate-fade-in-up stagger-5">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <h2 className="text-[14px] font-medium text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-orange">schedule</span>
                    Upcoming Contests
                  </h2>
                </div>

                {contestsLoading ? (
                  <div className="p-5 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 rounded-xl bg-white/[0.02] animate-shimmer" />
                    ))}
                  </div>
                ) : contests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-text-muted text-[12px]">
                    <span className="material-symbols-outlined text-[32px] mb-2">event_busy</span>
                    No upcoming contests found
                  </div>
                ) : (
                  contests.slice(0, 6).map((c, i) => (
                    <a
                      key={c.id || i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 flex items-center justify-between gap-3 border-b border-border/50 last:border-b-0 hover:bg-white/[0.02] transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-2 rounded-full shrink-0" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}40` }} />
                        <div className="min-w-0">
                          <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200 block truncate">{c.title}</span>
                          <span className="text-[10px] text-text-muted">{formatContestTime(c.startTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-mono text-text-secondary bg-white/[0.03] px-2 py-0.5 rounded-md border border-border">
                          {formatCountdown(c.startTime)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                          style={{ background: c.color + "12", color: c.color, borderColor: c.color + "20" }}>
                          {c.platformKey}
                        </span>
                      </div>
                    </a>
                  ))
                )}
              </section>

              {/* Contest Prep */}
              <section className="lg:col-span-2 flex flex-col gap-3 animate-fade-in-up stagger-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-medium text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-accent">fitness_center</span>
                    Contest Prep
                  </h2>
                </div>

                {prepCards.map((card, i) => (
                  <Link
                    key={i}
                    to={`/problems?platform=${card.platform}`}
                    className="glass-card rounded-2xl p-4 group hover:border-border-hover transition-all duration-300 relative overflow-hidden block"
                  >
                    <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: card.color + "10" }} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-lg flex items-center justify-center"
                            style={{ background: card.color + "12", border: `1px solid ${card.color}18` }}>
                            <PlatformIcon platform={card.platform} size={13}
                              className={`${card.platform === "Codeforces" ? "text-blue" : card.platform === "LeetCode" ? "text-amber" : "text-orange"}`} />
                          </div>
                          <span className="text-[13px] font-medium text-text-primary">{card.title}</span>
                        </div>
                        <span className="text-[10px] text-text-muted font-mono">
                          {card.problems > 0 ? `${card.problems} problems` : "—"}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{card.desc}</p>
                      <span className="text-[11px] font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200 flex items-center gap-1">
                        Start Practice
                        <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform duration-200">arrow_forward</span>
                      </span>
                    </div>
                  </Link>
                ))}

                {/* AI Teaser */}
                <div className="rounded-2xl border border-dashed border-accent-secondary/15 p-4 flex items-start gap-3 bg-accent-secondary/[0.02] active:scale-[0.99] transition-transform cursor-default">
                  <div className="size-8 rounded-xl bg-accent-secondary/10 border border-accent-secondary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-accent-secondary">auto_awesome</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-medium text-text-primary block mb-0.5">AI Roadmaps</span>
                    <p className="text-[11px] text-text-tertiary leading-relaxed">
                      Personalized contest strategies, targeted problem sets &amp; spaced repetition —{" "}
                      <span className="text-accent-secondary font-medium">coming soon</span>
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 backdrop-blur-md ${
            toast.type === "error" 
              ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === "error" ? "error" : "check_circle"}
            </span>
            <span className="text-[13px] font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 opacity-60 hover:opacity-100 ml-2">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
