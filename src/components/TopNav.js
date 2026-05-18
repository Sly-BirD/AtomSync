"use client";

import { useApp } from "@/context/AppContext";
import {
  Target, CheckSquare, Users, BarChart3,
  ClipboardList, AlertTriangle, FileText, LogOut, Sun, Moon
} from "lucide-react";

const navConfig = {
  employee: [
    { id: "dashboard",  label: "Dashboard",    icon: BarChart3 },
    { id: "my-goals",   label: "My Goals",     icon: Target },
    { id: "check-ins",  label: "Check-ins",    icon: CheckSquare },
  ],
  manager: [
    { id: "dashboard",  label: "Dashboard",    icon: BarChart3 },
    { id: "approvals",  label: "Approvals",    icon: ClipboardList },
    { id: "team-goals", label: "Team Goals",   icon: Users },
    { id: "check-ins",  label: "Check-ins",    icon: CheckSquare },
  ],
  admin: [
    { id: "dashboard",  label: "Dashboard",    icon: BarChart3 },
    { id: "all-goals",  label: "All Goals",    icon: Target },
    { id: "audit-trail",label: "Audit Trail",  icon: FileText },
    { id: "analytics",  label: "Analytics",    icon: BarChart3 },
    { id: "escalations",label: "Escalations",  icon: AlertTriangle },
  ],
};

export default function TopNav() {
  const { currentUser, activePage, setActivePage, signOut, theme, toggleTheme } = useApp();

  const links = navConfig[currentUser.role] || [];

  return (
    <div className="top-nav-wrapper">
      <nav className="top-nav">
        {/* Brand / Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <div style={{
            background: "var(--accent-primary)",
            color: "var(--bg-secondary)",
            padding: "6px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Target size={16} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            AtomSync
          </span>
        </div>

        {/* Links / Center */}
        <div className="nav-links-center">
          {links.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                className={`nav-link ${activePage === link.id ? "active" : ""}`}
                onClick={() => setActivePage(link.id)}
              >
                <Icon size={14} />
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Profile / Right */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "16px", flex: 1 }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <div style={{ width: "1px", height: "24px", background: "var(--border-color)" }}></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{currentUser.name}</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "capitalize" }}>
              {currentUser.role}
            </span>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>
    </div>
  );
}
