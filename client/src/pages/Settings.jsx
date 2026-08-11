import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const Settings = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("personal");
  const [totalPoints, setTotalPoints] = useState(null);
  const [totalSolved, setTotalSolved] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);

  /* ── Platform Handles State ── */
  const [handles, setHandles] = useState({ codeforces: "", leetcode: "", codechef: "" });
  const [savingHandles, setSavingHandles] = useState(false);
  const [handlesMessage, setHandlesMessage] = useState("");

  /* ── Personal Info State ── */
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await api.get("/api/users/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.platformHandles) setHandles(res.data.platformHandles);
        if (res.data.points !== undefined) setTotalPoints(res.data.points);
        if (res.data.solvedCount !== undefined) setTotalSolved(res.data.solvedCount);
        if (res.data.pointsHistory) setPointsHistory(res.data.pointsHistory);
      } catch (err) {
        console.warn("Could not fetch handles:", err);
      }
    };
    fetchStats();
  }, [getToken]);

  const handleSaveHandles = async () => {
    setSavingHandles(true);
    setHandlesMessage("");
    try {
      const token = await getToken();
      await api.post("/api/users/handles", handles, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHandlesMessage("Platform handles connected successfully.");
    } catch (err) {
      setHandlesMessage(err.response?.data?.error || "Failed to update handles.");
    } finally {
      setSavingHandles(false);
      setTimeout(() => setHandlesMessage(""), 3000);
    }
  };

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    setPersonalMessage("");
    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
      });
      setPersonalMessage("Profile information updated.");
    } catch (err) {
      setPersonalMessage(err.errors?.[0]?.message || "Failed to update profile.");
    } finally {
      setSavingPersonal(false);
      setTimeout(() => setPersonalMessage(""), 3000);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "person" },
    { id: "platform", label: "Platform Integrations", icon: "hub" },
    { id: "points", label: "Points & Progress", icon: "stars" },
    { id: "preferences", label: "Preferences", icon: "tune", comingSoon: true },
  ];

  return (
    <div className="flex h-screen bg-bg-deep text-text-primary overflow-hidden font-sans">
      
      {/* ─── Sidebar Navigation ─── */}
      <aside className="w-[280px] border-r border-border hidden md:flex flex-col bg-bg-deep shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent/[0.03] to-transparent pointer-events-none" />

        {/* Back to Dashboard */}
        <div className="h-14 flex items-center px-4 border-b border-border relative z-10">
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </Link>
        </div>

        {/* User Profile Header */}
        <div className="p-6 border-b border-border relative z-10">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-bg-hover overflow-hidden border border-border shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.03)] flex items-center justify-center">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[24px]">person</span>
              )}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-[15px] font-semibold text-white truncate">{user?.firstName || user?.username || "Guest"}</span>
              <span className="text-[12px] text-text-tertiary truncate">{user?.emailAddresses?.[0]?.emailAddress}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 relative z-10">
          <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-2">Settings</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
              disabled={tab.comingSoon}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 text-left ${
                activeTab === tab.id
                  ? "bg-accent/[0.08] text-accent border border-accent/10"
                  : tab.comingSoon
                  ? "text-text-tertiary opacity-50 cursor-not-allowed"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
              {tab.comingSoon && (
                <span className="ml-auto text-[9px] bg-white/5 text-text-tertiary border border-white/10 px-1.5 py-[2px] rounded-md uppercase tracking-wider">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-y-auto relative bg-[#0A0A0C]">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-border flex items-center px-4 glass-panel sticky top-0 z-20 gap-3">
          <Link to="/" className="text-text-secondary hover:text-text-primary">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="font-semibold text-sm">Settings</span>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 relative z-10">
          
          {/* Section: Personal Info */}
          {activeTab === "personal" && (
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Personal Information</h1>
                <p className="text-[13px] text-text-tertiary mt-1.5">Manage your personal details and how they appear across the platform.</p>
              </div>

              <div className="glass-card rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-text-secondary ml-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-bg-deep border border-border rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-text-secondary ml-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-bg-deep border border-border rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-text-secondary ml-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-[14px]">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="janedoe"
                      className="w-full bg-bg-deep border border-border rounded-xl pl-8 pr-4 py-2.5 text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                  <label className="text-[12px] font-medium text-text-secondary ml-1">Email Address</label>
                  <input
                    type="email"
                    value={user?.emailAddresses?.[0]?.emailAddress || ""}
                    disabled
                    className="w-full bg-white/[0.02] border border-border rounded-xl px-4 py-2.5 text-[14px] text-text-tertiary cursor-not-allowed"
                  />
                  <p className="text-[11px] text-text-tertiary ml-1 mt-1">Email addresses must be managed directly through Clerk.</p>
                </div>

                  <div className="pt-4 flex items-center justify-between border-t border-border/50">
                    <span className={`text-[12px] ${personalMessage.includes("Failed") ? "text-rose" : "text-emerald"} transition-opacity duration-300 ${personalMessage ? "opacity-100" : "opacity-0"}`}>
                      {personalMessage}
                    </span>
                    <button
                      onClick={handleSavePersonal}
                      disabled={savingPersonal}
                      className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 active:scale-[0.98]"
                    >
                      {savingPersonal && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                      Save Changes
                    </button>
                  </div>
              </div>
            </div>
          )}

          {/* Section: Platform Handles */}
          {activeTab === "platform" && (
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Platform Integrations</h1>
                <p className="text-[13px] text-text-tertiary mt-1.5">Connect your external competitive programming profiles to sync ratings and submissions.</p>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                {/* Platform Item: LeetCode */}
                <div className="p-6 border-b border-border/50 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-[8px] flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
                      <span className="material-symbols-outlined text-amber-500 text-[16px]">terminal</span>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium text-white">LeetCode</h3>
                      <p className="text-[11px] text-text-tertiary">Sync solved problems</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-[13px]">leetcode.com/</span>
                    <input
                      type="text"
                      value={handles.leetcode}
                      onChange={(e) => setHandles({ ...handles, leetcode: e.target.value })}
                      placeholder="username"
                      className="w-full bg-bg-deep border border-border rounded-xl pl-28 pr-4 py-2.5 text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Platform Item: Codeforces */}
                <div className="p-6 border-b border-border/50 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-[8px] flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                      <span className="material-symbols-outlined text-blue-400 text-[16px]">insights</span>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium text-white">Codeforces</h3>
                      <p className="text-[11px] text-text-tertiary">Sync contest ratings</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-[13px]">codeforces.com/profile/</span>
                    <input
                      type="text"
                      value={handles.codeforces}
                      onChange={(e) => setHandles({ ...handles, codeforces: e.target.value })}
                      placeholder="handle"
                      className="w-full bg-bg-deep border border-border rounded-xl pl-[164px] pr-4 py-2.5 text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Platform Item: CodeChef */}
                <div className="p-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-[8px] flex items-center justify-center bg-orange-500/10 border border-orange-500/20">
                      <span className="material-symbols-outlined text-orange-400 text-[16px]">code_blocks</span>
                    </div>
                    <div>
                      <h3 className="text-[13px] font-medium text-white">CodeChef</h3>
                      <p className="text-[11px] text-text-tertiary">Sync star ratings</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary text-[13px]">codechef.com/users/</span>
                    <input
                      type="text"
                      value={handles.codechef}
                      onChange={(e) => setHandles({ ...handles, codechef: e.target.value })}
                      placeholder="username"
                      className="w-full bg-bg-deep border border-border rounded-xl pl-[140px] pr-4 py-2.5 text-[14px] text-white placeholder-text-tertiary focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-[12px] ${handlesMessage.includes("Failed") ? "text-rose" : "text-emerald"} transition-opacity duration-300 ${handlesMessage ? "opacity-100" : "opacity-0"}`}>
                  {handlesMessage}
                </span>
                <button
                  onClick={handleSaveHandles}
                  disabled={savingHandles}
                  className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 text-[13px] font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingHandles && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  Save Connections
                </button>
              </div>
            </div>
          )}

          {/* Section: Points & Progress */}
          {activeTab === "points" && (
            <div className="space-y-6 animate-fade-in-up">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight">Points</h1>
                <p className="text-[13px] text-text-tertiary mt-1">Your earned points across all solved problems.</p>
              </div>

              {/* Total Points — coin style */}
              <div className="rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 p-6 flex items-center gap-5">
                <div className="size-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-400 text-[28px]">toll</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-amber-400/70 uppercase tracking-widest mb-0.5">Total Points</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-amber-400 tabular-nums tracking-tight">
                      {totalPoints !== null ? totalPoints.toLocaleString() : "—"}
                    </span>
                    <span className="text-[13px] text-amber-400/50 font-medium">pts</span>
                  </div>
                </div>
              </div>

              {/* History */}
              <div>
                <h2 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-widest mb-4">Solve History</h2>
                {pointsHistory.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-text-tertiary">
                    Solve problems to see your history here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pointsHistory.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[13px] text-zinc-200 font-medium truncate">
                            {entry.title || "Problem Solved"}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-zinc-500">
                              {entry.platform}
                            </span>
                            <span className="text-zinc-700 text-[10px]">·</span>
                            <span className="text-[10px] text-zinc-600">
                              {new Date(entry.solvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {entry.focusMode && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-400/80 bg-blue-500/10 border border-blue-500/15 px-1.5 py-[2px] rounded-md uppercase tracking-wide">
                                <span className="material-symbols-outlined text-[10px]">center_focus_strong</span>
                                Focus
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-4">
                          <span className="material-symbols-outlined text-amber-400/70 text-[14px]">toll</span>
                          <span className="text-[14px] font-bold text-amber-400">+{entry.pointsEarned}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;
