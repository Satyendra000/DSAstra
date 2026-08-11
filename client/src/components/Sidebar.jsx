import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";

export default function Sidebar({ activePage = "dashboard", handles }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const userName = user?.firstName || user?.username || "Guest";
  const userAvatar = user?.imageUrl;

  const navItems = [
    { to: "/problems", icon: "code",         label: "Problems",   id: "problems", active: false },
    { to: "#",         icon: "emoji_events", label: "Contests",   id: "contests", active: false, comingSoon: true },
    { to: "#",         icon: "target",       label: "Practice",   id: "practice", active: false, comingSoon: true },
    { to: "#",         icon: "bar_chart",    label: "Analytics",  id: "analytics", active: false, comingSoon: true },
  ];

  return (
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
        <Link to="/"
          className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-200 text-[13px] font-medium ${
            activePage === 'dashboard' 
              ? "nav-active bg-accent/[0.08] text-accent border border-accent/10"
              : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
          }`}>
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          Dashboard
        </Link>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <div key={item.label} className="relative group/nav">
              <Link
                to={item.to}
                onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-200 text-[13px] font-medium ${
                  item.comingSoon ? "cursor-not-allowed opacity-50" : ""
                } ${
                  isActive 
                    ? "nav-active bg-accent/[0.08] text-accent border border-accent/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
                {item.comingSoon && (
                  <span className="ml-auto text-[9px] bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/15 px-1.5 py-[2px] rounded-md font-semibold uppercase tracking-wider">
                    Soon
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="px-3 pb-2 relative z-10" />

      {user ? (
        <div className="px-3 py-3 border-t border-border relative z-10 flex items-center justify-between group">
          <Link to="/settings" className="flex items-center gap-2.5 flex-1 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-all duration-200">
            <div className="size-7 rounded-full bg-bg-hover overflow-hidden border border-border shrink-0">
              {userAvatar && <img alt="" className="w-full h-full object-cover" src={userAvatar} />}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden leading-none">
              <span className="text-[13px] font-medium text-text-primary truncate">{userName}</span>
              <span className="text-[11px] text-text-tertiary truncate mt-0.5">
                {handles 
                  ? (handles.codeforces || handles.leetcode || handles.codechef ? "Handles connected" : "Connect platforms")
                  : "Settings"}
              </span>
            </div>
          </Link>
          <button onClick={() => signOut()} className="material-symbols-outlined text-text-tertiary hover:text-rose text-[18px] opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-white/5 mr-1" title="Sign Out">
            logout
          </button>
        </div>
      ) : (
        <div className="px-4 py-4 border-t border-border relative z-10 flex flex-col gap-2">
          <p className="text-[11px] text-text-tertiary text-center mb-1">Sign in to sync your progress</p>
          <Link to="/login" className="flex justify-center items-center py-2 bg-gradient-to-r from-accent to-amber-500 hover:from-accent-hover hover:to-amber-400 text-black text-[13px] font-semibold rounded-lg shadow-[0_0_15px_rgba(226,179,64,0.15)] transition-all">
            Sign In
          </Link>
          <Link to="/register" className="flex justify-center items-center py-2 bg-white/[0.03] hover:bg-white/[0.08] text-text-secondary text-[13px] font-medium rounded-lg border border-border transition-all">
            Create Account
          </Link>
        </div>
      )}
    </aside>
  );
}
