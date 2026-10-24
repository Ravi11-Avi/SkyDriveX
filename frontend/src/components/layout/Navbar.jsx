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
    <header className="navbar-container glass-panel">
      {/* Mobile Hamburger & Logo */}
      <div className="navbar-left">
        <button
          className="btn-icon mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Global Search Bar */}
        <div className="navbar-search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search files, folders, tags..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="navbar-right">
        {/* System Health / Status indicator */}
        <div className="system-status-badge" title="Backend API operational & secured">
          <span className="status-dot-pulse" />
          <ShieldCheck size={14} className="status-icon" />
          <span className="status-text">Encrypted</span>
        </div>

        {/* Grid / List View Toggle */}
        {onViewModeToggle && (
          <button
            className="btn-icon view-toggle-btn"
            onClick={onViewModeToggle}
            title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
          >
            {viewMode === "grid" ? <List size={19} /> : <LayoutGrid size={19} />}
          </button>
        )}

        {/* Theme Switcher */}
        <button
          className="btn-icon theme-toggle-btn glow-effect"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={19} className="theme-sun" /> : <Moon size={19} className="theme-moon" />}
        </button>

        {/* User Mini Profile Avatar */}
        <div className="navbar-avatar-circle" title={user?.name}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
