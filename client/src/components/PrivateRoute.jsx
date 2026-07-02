import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

// App Skeleton Loader (mimics the layout of the dashboard)
const AppSkeleton = () => {
  return (
    <div className="bg-bg-deep text-text-primary min-h-screen flex overflow-hidden">
      {/* Skeleton Sidebar */}
      <aside className="w-[260px] border-r border-border hidden md:flex flex-col bg-bg-deep shrink-0 relative p-5 gap-6">
        {/* Logo area */}
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-white/[0.03] border border-border animate-shimmer" />
          <div className="flex flex-col gap-1">
            <div className="h-3.5 w-24 bg-white/[0.03] border border-border rounded animate-shimmer" />
            <div className="h-2 w-16 bg-white/[0.02] border border-border rounded animate-shimmer" />
          </div>
        </div>
        
        {/* Nav Items */}
        <div className="flex flex-col gap-3 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-full bg-white/[0.03] border border-border rounded-lg animate-shimmer" />
          ))}
        </div>
      </aside>

      {/* Skeleton Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-4 md:px-6 justify-between shrink-0">
          <div className="h-4 w-32 bg-white/[0.03] border border-border rounded animate-shimmer md:hidden" />
          <div className="ml-auto size-8 rounded-full bg-white/[0.03] border border-border animate-shimmer" />
        </header>

        {/* Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Hero skeleton */}
          <div className="h-40 w-full bg-white/[0.03] border border-border rounded-2xl animate-shimmer" />
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/[0.03] border border-border rounded-2xl animate-shimmer" />
            ))}
          </div>

          {/* Activity skeleton */}
          <div className="h-48 w-full bg-white/[0.03] border border-border rounded-2xl animate-shimmer mt-2" />
        </div>
      </main>
    </div>
  );
};

const PrivateRoute = () => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) return <AppSkeleton />;

  return userId ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
