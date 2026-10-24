import React from "react";
import {
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ShieldCheck,
  LayoutGrid,
  List,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Navbar = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeToggle,
  onToggleMobile,
  mobileOpen,
}) => {
  const { theme, toggleTheme, user } = useAuth();

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#07090e]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between sticky top-0 z-30">
      {/* Left Area: Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Global Search Input */}
        <div className="relative w-full max-w-md group">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-400 transition-colors pointer-events-none"
          />
          <input
            type="text"
            className="w-full bg-[#0d101a] border border-white/[0.08] group-hover:border-white/[0.14] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-zinc-100 placeholder-zinc-500 pl-10 pr-16 py-2 rounded-xl transition-all shadow-inner outline-none"
            placeholder="Search files, folders, categories..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Right Area: System Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Security / SSL Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck size={13} />
          <span>Encrypted</span>
        </div>

        {/* Grid / List View Toggle Pill */}
        {onViewModeToggle && (
          <div className="flex items-center bg-[#0d101a] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => viewMode !== "grid" && onViewModeToggle()}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => viewMode !== "list" && onViewModeToggle()}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        )}

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-amber-400" />
          ) : (
            <Moon size={17} className="text-indigo-400" />
          )}
        </button>

        {/* Mini Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 ring-2 ring-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
          title={user?.name || "User"}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
