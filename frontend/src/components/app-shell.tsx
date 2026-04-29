"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, Menu, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api-client";
import { DEFAULT_PLAN_QUOTA, type PlanQuota } from "@/lib/message-types";
import { NAV_LINKS, SIDEBAR_ACTIONS } from "@/lib/navigation";

const NAV_ITEMS = NAV_LINKS as unknown as ReadonlyArray<{ href: string; icon: any; label?: string; name?: string }>;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOutUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [quota, setQuota] = useState<PlanQuota | null>(null);

  const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (!user) return;
    authenticatedFetch("/api/v1/user/quota")
      .then(async (res) => {
        if (res.ok) {
          setQuota((await res.json()) as PlanQuota);
          return;
        }
        setQuota(DEFAULT_PLAN_QUOTA);
      })
      .catch(() => {
        setQuota(DEFAULT_PLAN_QUOTA);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  const handleNewSession = useCallback(() => {
    if (!user) {
      if (isMobileViewport()) setIsSidebarOpen(false);
      router.push("/");
      return;
    }
    if (isMobileViewport()) setIsSidebarOpen(false);
    router.push("/session/new");
  }, [router, user]);

  const initial = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#09090b] overflow-hidden text-foreground">
      {/* Mobile Toggle */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 md:hidden shadow-lg`}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[#fafafa] dark:bg-[#0e0e10] border-r border-zinc-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${
          isMobileViewport() 
            ? (isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full")
            : (isCollapsed ? "w-[72px]" : "w-64")
        }`}
      >
        {/* Header / Toggle */}
        <div className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-white/[0.03]`}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3 px-2">
              <span className="text-lg font-bold tracking-tighter text-zinc-900 dark:text-zinc-100">
                CoComputer
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => isMobileViewport() ? setIsSidebarOpen(false) : setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-white/[0.05] transition-colors"
          >
            {isMobileViewport() ? <X className="w-5 h-5" /> : isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Actions */}
        <div className="px-3 py-4">
          <button
            onClick={handleNewSession}
            className={`w-full flex items-center gap-3 transition-all duration-200 rounded-xl ${
              isCollapsed 
                ? "justify-center p-3 bg-zinc-900 dark:bg-white text-white dark:text-black" 
                : "px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
            }`}
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            {!isCollapsed && <span className="text-sm font-bold uppercase tracking-widest">New task</span>}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
                  isCollapsed ? "justify-center p-3" : "px-4 py-3"
                } ${
                  active
                    ? "bg-zinc-200/50 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/30 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
                title={isCollapsed ? label : ""}
                onClick={() => isMobileViewport() && setIsSidebarOpen(false)}
              >
                <Icon className={`w-5 h-5 ${active ? "text-zinc-900 dark:text-white" : ""}`} />
                {!isCollapsed && <span className="text-[13.5px] tracking-tight">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Profile & Quota */}
        <div className="mt-auto p-3 border-t border-white/[0.03]">
          {!isCollapsed && quota && (
             <div className="mb-4 p-3 rounded-xl bg-zinc-200/30 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                  <span>Usage</span>
                  <span>{Math.min(100, Math.round((quota.used / quota.limit) * 100))}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-zinc-300 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                    className="h-full bg-zinc-600 dark:bg-zinc-400"
                  />
                </div>
             </div>
          )}

          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "p-2 rounded-xl bg-zinc-200/30 dark:bg-white/[0.03] border border-black/5 dark:border-white/5"}`}>
            <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt={user.displayName || "U"} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-zinc-100 dark:text-zinc-900 font-black text-sm">{initial}</span>
               )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-200 truncate leading-none">
                  {user?.displayName || "User"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-1">{user?.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleSignOut}
                disabled={isAuthLoading}
                className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isMobileViewport() ? "pt-14" : ""}`}>
          {children}
        </main>
      </div>

      {/* Desktop Spacer */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-64"
        }`}
      />

      {/* Mobile Overlay */}
      {isMobileViewport() && isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
