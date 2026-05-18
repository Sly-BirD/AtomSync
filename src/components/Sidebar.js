"use client";
/**
 * SIDEBAR COMPONENT
 * =================
 * 
 * The sidebar is the main navigation for the app. It does three things:
 * 1. Shows the app logo/brand
 * 2. Renders navigation links BASED ON THE USER'S ROLE
 *    - Employee sees: My Goals, Check-ins
 *    - Manager sees: Team Goals, Approvals, Check-ins
 *    - Admin sees: All Goals, Cycles, Audit Trail, Analytics
 * 3. Has a "Role Switcher" at the bottom for demo purposes
 * 
 * The active page is tracked in AppContext, and clicking a nav link
 * updates it — which causes the main content area to render the right page.
 */

import { useApp } from "@/context/AppContext";
import {
  Target, CheckSquare, Users, Shield, BarChart3,
  ClipboardList, AlertTriangle, FileText, UserCircle,
  ChevronDown, LogOut
} from "lucide-react";
import { useState } from "react";

// Navigation config per role — defines what each role sees
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

export default function Sidebar() {
  const { currentUser, activePage, setActivePage, signOut } = useApp();

  // Get nav links for the current user's role
  const links = navConfig[currentUser.role] || [];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-logo">
        <h1>GoalTracker</h1>
        <p>Performance Management</p>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {links.map(link => {
          const Icon = link.icon;
          return (
            <button
              key={link.id}
              className={`nav-link ${activePage === link.id ? "active" : ""}`}
              onClick={() => setActivePage(link.id)}
            >
              <Icon size={18} />
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--border-color)", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <UserCircle size={20} style={{ color: "var(--text-secondary)" }} />
            <span>
              <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {currentUser.name}
              </span>
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                {currentUser.role} {currentUser.department ? `· ${currentUser.department}` : ''}
              </span>
            </span>
          </span>
          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
