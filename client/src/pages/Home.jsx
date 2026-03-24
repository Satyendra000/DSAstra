import { useMemo } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

/* ── Heatmap ── */
const Heatmap = () => {
  const cells = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const rand = Math.random();
      let level = 0;
      if (rand > 0.82) level = 4;
      else if (rand > 0.68) level = 3;
      else if (rand > 0.52) level = 2;
      else if (rand > 0.35) level = 1;
      data.push({ date: d, level });
    }
    return data;
  }, []);

  const levels = [
    "bg-[#161b22]",
    "bg-emerald-900/60",
    "bg-emerald-700/70",
    "bg-emerald-500/80",
    "bg-emerald-400",
  ];

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="space-y-2.5">
      <div className="flex gap-[3px] ml-8">
        {weeks.map((week, wi) => {
          const firstDay = week[0]?.date;
          const showLabel = firstDay && firstDay.getDate() <= 7;
          return (
            <div key={wi} className="w-[12px] shrink-0">
              {showLabel && <span className="text-[9px] text-zinc-500 font-medium">{months[firstDay.getMonth()]}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] text-[9px] text-zinc-600 w-7 shrink-0">
          <span className="h-[12px]"></span>
          <span className="h-[12px] flex items-center">Mon</span>
          <span className="h-[12px]"></span>
          <span className="h-[12px] flex items-center">Wed</span>
          <span className="h-[12px]"></span>
          <span className="h-[12px] flex items-center">Fri</span>
          <span className="h-[12px]"></span>
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) => (
                <div
                  key={ci}
                  className={`w-[12px] h-[12px] rounded-[3px] ${levels[cell.level]} hover:ring-1 hover:ring-zinc-500 transition-all cursor-crosshair`}
                  title={`${cell.date.toLocaleDateString()} — ${cell.level} contributions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-0.5">
        <span className="text-[9px] text-zinc-600">Less</span>
        {levels.map((l, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${l}`} />
        ))}
        <span className="text-[9px] text-zinc-600">More</span>
      </div>
    </div>
  );
};

/* ── Mini Sparkline SVG ── */
const Sparkline = ({ data, color = "#3b82f6", width = 64, height = 28 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-60 group-hover:opacity-100 transition-opacity">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts.join(" ")} />
      <polygon fill={`url(#grad-${color.replace('#','')})`} points={`0,${height} ${pts.join(" ")} ${width},${height}`} />
    </svg>
  );
};

/* ── Circular Progress Ring ── */
const ProgressRing = ({ value, max, size = 48, strokeWidth = 3.5, color = "#3b82f6" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} stroke="#27272a" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={circumference - progress}
        strokeLinecap="round" className="transition-all duration-700"
      />
    </svg>
  );
};

/* ── Platform SVG Icons ── */
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

/* ── Main ── */
const Home = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const userName = user?.firstName || user?.username || "User";
  const userAvatar = user?.imageUrl;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const platforms = [
    { name: "Codeforces", rating: 1547, maxRating: 1623, rank: "Specialist", handle: "satyendra_cf", delta: +24, color: "#3b82f6", sparkline: [1420,1390,1480,1510,1470,1530,1547] },
    { name: "LeetCode", rating: 1892, maxRating: 1920, rank: "Knight", handle: "satyendra_lc", delta: +15, color: "#f59e0b", sparkline: [1750,1780,1810,1830,1860,1875,1892] },
    { name: "CodeChef", rating: 1756, maxRating: 1812, rank: "4★", handle: "satyendra_cc", delta: -8, color: "#f97316", sparkline: [1800,1790,1810,1780,1770,1760,1756] },
  ];

  const contests = [
    { platform: "CF", title: "Codeforces Round #950 (Div 2)", time: "Tomorrow, 14:00 UTC", countdown: "02:45:10", pred: "+15", color: "#3b82f6" },
    { platform: "LC", title: "LeetCode Weekly Contest 402", time: "Sunday, 02:30 UTC", countdown: "2d 10h", pred: "+8", color: "#f59e0b" },
    { platform: "CC", title: "CodeChef Starters 140", time: "Wednesday, 14:30 UTC", countdown: "4d 6h", pred: "+12", color: "#f97316" },
    { platform: "LC", title: "LeetCode Biweekly Contest 131", time: "Saturday, 14:30 UTC", countdown: "5d 15h", pred: "+5", color: "#f59e0b" },
  ];

  const prepCards = [
    { title: "Codeforces Div 2", desc: "Master 1200–1600 rated problems. Greedy, math, and constructive algorithms.", platform: "Codeforces", color: "#3b82f6", problems: 842 },
    { title: "LeetCode Weekly", desc: "Recent weekly contest problems. Arrays, trees, and dynamic programming.", platform: "LeetCode", color: "#f59e0b", problems: 624 },
    { title: "CodeChef Starters", desc: "Starters-level problems. Speed up implementation and number theory.", platform: "CodeChef", color: "#f97316", problems: 518 },
  ];

  return (
    <div className="bg-background-dark text-white min-h-screen flex overflow-hidden selection:bg-blue-500/25">
      {/* ─── Sidebar ─── */}
      <aside className="w-[260px] border-r border-border-dark/70 hidden md:flex flex-col bg-background-dark shrink-0">
        <div className="h-14 flex items-center px-5 gap-3 border-b border-border-dark/50">
          <div className="size-7 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">code</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-[15px] tracking-tight text-white">DSAstra</span>
            <span className="text-[10px] text-subtle-text uppercase tracking-[0.16em] mt-0.5">Kinetic Monolith</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-[7px] rounded-md bg-white/[0.06] text-white font-medium text-[13px]">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>Dashboard
          </Link>
          {[
            { to: "/problems", icon: "code", label: "Problems" },
            { to: "#", icon: "emoji_events", label: "Contests" },
            { to: "#", icon: "target", label: "Practice" },
            { to: "#", icon: "bar_chart", label: "Analytics" },
          ].map((item) => (
            <Link key={item.label} to={item.to} className="flex items-center gap-2.5 px-3 py-[7px] rounded-md text-subtle-text hover:text-white hover:bg-white/[0.04] transition-colors text-[13px] font-medium">
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2.5 px-3 py-[7px] text-subtle-text text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">monitor_heart</span>System Status
          </div>
        </div>
        <div className="px-3 py-3 border-t border-border-dark/50">
          <button onClick={() => signOut()} className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors text-left group">
            <div className="size-7 rounded-full bg-zinc-800 overflow-hidden border border-border-dark shrink-0">
              {userAvatar && <img alt="" className="w-full h-full object-cover" src={userAvatar} />}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden leading-none">
              <span className="text-[13px] font-medium text-white truncate">{userName}</span>
              <span className="text-[11px] text-subtle-text truncate mt-0.5">Pro Plan</span>
            </div>
            <span className="material-symbols-outlined text-subtle-text group-hover:text-red-400 text-[16px] opacity-0 group-hover:opacity-100 transition-all">logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden h-12 border-b border-border-dark/70 flex items-center justify-between px-4 bg-background-dark/90 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">code</span>
            </div>
            <span className="font-semibold text-sm">DSAstra</span>
          </div>
          <button className="text-subtle-text hover:text-white p-1"><span className="material-symbols-outlined text-[20px]">menu</span></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1120px] mx-auto px-6 md:px-10 py-8 md:py-10 space-y-8">

            {/* ── Welcome ── */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.025em] text-white leading-tight">
                  {greeting}, {userName}
                </h1>
                <p className="text-zinc-500 text-[13px] mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>452 solved</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-orange-500">local_fire_department</span>12 day streak</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-blue-400">military_tech</span>Specialist</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-dark/60 rounded-lg text-[12px] font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
                  <span className="material-symbols-outlined text-[15px]">sync</span>Sync
                </button>
                <Link to="/problems" className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[12px] font-medium text-white transition-all">
                  <span className="material-symbols-outlined text-[15px]">play_arrow</span>Solve
                </Link>
              </div>
            </section>

            {/* ── Platform Ratings ── */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {platforms.map((p) => (
                <div key={p.name} className="group relative rounded-xl border border-border-dark/50 bg-white/[0.015] p-5 overflow-hidden hover:border-zinc-700 transition-all">
                  {/* Subtle gradient glow */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: p.color + '15' }}></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: p.color + '18', border: `1px solid ${p.color}25` }}>
                          <PlatformIcon platform={p.name} size={16} style={{ color: p.color }} className={`${p.name === 'Codeforces' ? 'text-blue-400' : p.name === 'LeetCode' ? 'text-amber-400' : 'text-orange-400'}`} />
                        </div>
                        <div className="leading-none">
                          <span className="text-[13px] font-medium text-white block">{p.name}</span>
                          <span className="text-[10px] text-zinc-600">@{p.handle}</span>
                        </div>
                      </div>
                      <Sparkline data={p.sparkline} color={p.color} />
                    </div>

                    {/* Rating */}
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[32px] font-bold text-white tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {p.rating.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2.5 mt-2.5">
                          <span className="text-[10px] font-semibold px-2 py-[3px] rounded-md uppercase tracking-wider" style={{ background: p.color + '15', color: p.color, border: `1px solid ${p.color}20` }}>
                            {p.rank}
                          </span>
                          <span className={`text-[11px] font-medium flex items-center gap-0.5 ${p.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <span className="material-symbols-outlined text-[13px]">{p.delta >= 0 ? 'trending_up' : 'trending_down'}</span>
                            {p.delta >= 0 ? '+' : ''}{p.delta}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-600 block">Peak</span>
                        <span className="text-[14px] font-semibold text-zinc-400" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.maxRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* ── Stats ── */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Solved */}
              <div className="rounded-xl border border-border-dark/50 bg-white/[0.015] p-4 relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px]">check_circle</span>
                </div>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium block mb-3">Total Solved</span>
                <span className="text-[28px] font-bold text-white tracking-tight leading-none block" style={{ fontVariantNumeric: 'tabular-nums' }}>452</span>
                <div className="flex gap-0.5 mt-3 w-full h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 rounded-l-full" style={{ width: '44%' }}></div>
                  <div className="bg-amber-500" style={{ width: '47%' }}></div>
                  <div className="bg-rose-500 rounded-r-full" style={{ width: '9%' }}></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-medium">
                  <span className="text-emerald-500">200 Easy</span>
                  <span className="text-amber-500">210 Med</span>
                  <span className="text-rose-500">42 Hard</span>
                </div>
              </div>

              {/* Streak */}
              <div className="rounded-xl border border-border-dark/50 bg-white/[0.015] p-4 relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px] text-orange-500">local_fire_department</span>
                </div>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium block mb-3">Streak</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[28px] font-bold text-white tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>12</span>
                  <span className="text-[13px] text-zinc-600 font-medium">days</span>
                </div>
                <div className="flex gap-1 mt-3">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-2 rounded-sm ${i < 5 ? 'bg-orange-500' : i === 5 ? 'bg-orange-500/30' : 'bg-zinc-800'}`}></div>
                      <span className="text-[8px] text-zinc-600 font-medium">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Rank */}
              <div className="rounded-xl border border-border-dark/50 bg-white/[0.015] p-4 relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px] text-violet-500">emoji_events</span>
                </div>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium block mb-3">Best Rating</span>
                <span className="text-[28px] font-bold text-white tracking-tight leading-none block" style={{ fontVariantNumeric: 'tabular-nums' }}>1,920</span>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[10px] font-semibold px-1.5 py-[3px] rounded-md bg-amber-500/12 text-amber-400 border border-amber-500/15 uppercase tracking-wider">Knight</span>
                  <span className="text-[10px] text-zinc-600">on LeetCode</span>
                </div>
              </div>

              {/* Contests */}
              <div className="rounded-xl border border-border-dark/50 bg-white/[0.015] p-4 relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <span className="material-symbols-outlined text-[72px]">trophy</span>
                </div>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium block mb-3">Contests</span>
                <span className="text-[28px] font-bold text-white tracking-tight leading-none block" style={{ fontVariantNumeric: 'tabular-nums' }}>38</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-[10px] text-zinc-600">participated</span>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <ProgressRing value={72} max={100} size={32} strokeWidth={2.5} color="#10b981" />
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-emerald-400">72%</span>
                    </div>
                    <span className="text-[9px] text-zinc-600 leading-tight">win<br/>rate</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Heatmap ── */}
            <section className="rounded-xl border border-border-dark/50 bg-white/[0.015] p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-medium text-zinc-200">Activity</h2>
                  <span className="text-[11px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-md border border-border-dark/40">365 days</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span><strong className="text-white font-semibold">247</strong> active days</span>
                  <span><strong className="text-white font-semibold">3.2</strong> avg/day</span>
                </div>
              </div>
              <Heatmap />
            </section>

            {/* ── Contests + Practice ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Upcoming Contests */}
              <section className="lg:col-span-3 rounded-xl border border-border-dark/50 bg-white/[0.015] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border-dark/40 flex items-center justify-between">
                  <h2 className="text-[14px] font-medium text-zinc-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-orange-400">schedule</span>
                    Upcoming Contests
                  </h2>
                  <button className="text-[11px] text-zinc-600 hover:text-white transition-colors flex items-center gap-1">
                    Calendar<span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>
                {contests.map((c, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-3 border-b border-border-dark/20 last:border-b-0 hover:bg-white/[0.01] transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="size-2 rounded-full shrink-0" style={{ background: c.color }}></div>
                      <div className="min-w-0">
                        <span className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors block truncate">{c.title}</span>
                        <span className="text-[10px] text-zinc-600">{c.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.03] px-2 py-0.5 rounded border border-border-dark/30" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.countdown}</span>
                      <span className="text-[10px] text-emerald-500 font-semibold w-6 text-right">{c.pred}</span>
                    </div>
                  </div>
                ))}
              </section>

              {/* Contest Prep */}
              <section className="lg:col-span-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-medium text-zinc-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-violet-400">fitness_center</span>
                    Contest Prep
                  </h2>
                </div>

                {prepCards.map((card, i) => (
                  <div key={i} className="rounded-xl border border-border-dark/50 bg-white/[0.015] p-4 group hover:border-zinc-700 transition-all relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: card.color + '10' }}></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-md flex items-center justify-center" style={{ background: card.color + '15', border: `1px solid ${card.color}20` }}>
                            <PlatformIcon platform={card.platform} size={13} className={`${card.platform === 'Codeforces' ? 'text-blue-400' : card.platform === 'LeetCode' ? 'text-amber-400' : 'text-orange-400'}`} />
                          </div>
                          <span className="text-[13px] font-medium text-white">{card.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">{card.problems} problems</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">{card.desc}</p>
                      <button className="text-[11px] font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group/btn">
                        Start Practice
                        <span className="material-symbols-outlined text-[13px] group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* AI Teaser */}
                <div className="rounded-xl border border-dashed border-zinc-800 p-4 flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-violet-400">auto_awesome</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-medium text-zinc-300 block mb-0.5">AI Roadmaps</span>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Personalized contest strategies, targeted problem sets & spaced repetition — <span className="text-violet-400 font-medium">coming soon</span>
                    </p>
                  </div>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
