import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ShieldCheck,
  LayoutGrid,
  List,
  ChevronDown,
  User,
  Settings,
  PieChart,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ProfileModal } from "../modals/ProfileModal";

export const Navbar = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeToggle,
  onToggleMobile,
  mobileOpen,
}) => {
  const { theme, toggleTheme, user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <>
      <header className="h-16 px-4 sm:px-6 bg-white/85 dark:bg-[#07090e]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
        {/* Left Area: Mobile Menu & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Global Search Input */}
          <div className="relative w-full max-w-md group">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-400 transition-colors pointer-events-none"
            />
            <input
              type="text"
              className="w-full bg-slate-100 dark:bg-[#0d101a] border border-slate-200/80 dark:border-white/[0.08] group-hover:border-slate-300 dark:group-hover:border-white/[0.14] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-10 pr-16 py-2 rounded-xl transition-all outline-none"
              placeholder="Search files, folders, categories..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-zinc-500 bg-white dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.08]">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Right Area: System Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Security / SSL Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <ShieldCheck size={13} />
            <span>Encrypted</span>
          </div>

          {/* Grid / List View Toggle Pill */}
          {onViewModeToggle && (
            <div className="flex items-center bg-slate-100 dark:bg-[#0d101a] border border-slate-200/80 dark:border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={() => viewMode !== "grid" && onViewModeToggle()}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => viewMode !== "list" && onViewModeToggle()}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
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
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            title={theme === "dark" ? "Switch to Day Mode (Light)" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} className="text-indigo-600" />
            )}
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.08] transition-all cursor-pointer"
              title="Open profile menu"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 ring-2 ring-indigo-500/20 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
                )}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-zinc-200 max-w-[100px] truncate">
                {user?.name || "Account"}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Floating Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
                {/* User Header */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111726] border border-slate-200/60 dark:border-white/[0.04] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden shadow">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || "User"}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {user?.email || "user@skydrivex.com"}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-500 dark:text-indigo-400 mt-0.5">
                      Personal Cloud Tier
                    </span>
                  </div>
                </div>

                <div className="h-px bg-slate-200/80 dark:bg-white/[0.06] my-1" />

                {/* Dropdown Options */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                >
                  <User size={15} className="text-indigo-500 dark:text-indigo-400" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                >
                  <Settings size={15} className="text-slate-500 dark:text-zinc-400" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/storage");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                >
                  <PieChart size={15} className="text-emerald-500" />
                  <span>Storage & Audits</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <Sun size={15} className="text-amber-400" />
                    ) : (
                      <Moon size={15} className="text-indigo-500" />
                    )}
                    <span>{theme === "dark" ? "Day Mode (Light)" : "Dark Mode"}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-zinc-300 font-semibold">
                    {theme === "dark" ? "Dark" : "Light"}
                  </span>
                </button>

                <div className="h-px bg-slate-200/80 dark:bg-white/[0.06] my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
