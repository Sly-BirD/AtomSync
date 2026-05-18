"use client";
/**
 * MAIN PAGE (page.js)
 * ====================
 * 
 * This is the single-page application entry point.
 * 
 * HOW NAVIGATION WORKS (without a router):
 * Instead of using Next.js file-based routing (which would create separate
 * URL paths for each page), we use a simple state-based "page switcher".
 * 
 * WHY? For a hackathon demo:
 * - No page reloads = smoother UX
 * - Role switching works instantly
 * - All state (goals, check-ins) persists in memory across "page" changes
 * - Simpler to demo: evaluators stay on one URL
 * 
 * The AppContext tracks `activePage`, and this component renders the 
 * matching component. The Sidebar updates `activePage` on click.
 */

import { AppProvider, useApp } from "@/context/AppContext";
import TopNav from "@/components/TopNav";
import Dashboard from "@/components/Dashboard";
import MyGoals from "@/components/MyGoals";
import Approvals from "@/components/Approvals";
import CheckIns from "@/components/CheckIns";
import TeamGoals from "@/components/TeamGoals";
import AllGoals from "@/components/AllGoals";
import AuditTrail from "@/components/AuditTrail";
import Analytics from "@/components/Analytics";
import Escalations from "@/components/Escalations";
import Login from "@/components/Login";
import { Loader2 } from "lucide-react";
import {
  BarChart3, Target, CheckSquare, ClipboardList,
  Users, FileText, AlertTriangle
} from "lucide-react";

// Maps the activePage string to the component that should render
const PAGE_MAP = {
  "dashboard":   { component: Dashboard,    title: "Dashboard",       description: "Overview of your goals and progress" },
  "my-goals":    { component: MyGoals,      title: "My Goals",        description: "Create, manage, and track your goals" },
  "check-ins":   { component: CheckIns,     title: "Check-ins",       description: "Quarterly achievement tracking" },
  "approvals":   { component: Approvals,    title: "Approvals",       description: "Review and approve team goals" },
  "team-goals":  { component: TeamGoals,    title: "Team Goals",      description: "View and manage your team's goals" },
  "all-goals":   { component: AllGoals,     title: "All Goals",       description: "Organization-wide goal overview" },
  "audit-trail": { component: AuditTrail,   title: "Audit Trail",     description: "Track all changes and actions" },
  "analytics":   { component: Analytics,    title: "Analytics",       description: "Organization-wide performance insights" },
  "escalations": { component: Escalations,  title: "Escalations",     description: "Rule-based alerts and notifications" },
};

function AppShell() {
  const { activePage, currentUser, notification, isAuthLoading } = useApp();
  const pageConfig = PAGE_MAP[activePage] || PAGE_MAP["dashboard"];
  const PageComponent = pageConfig.component;

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--primary-color)' }} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <TopNav />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h2>{pageConfig.title}</h2>
            <p>{pageConfig.description}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge badge-slate" style={{ textTransform: "capitalize" }}>
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Page Body */}
        <div className="page-body">
          <PageComponent />
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            padding: "14px 24px",
            borderRadius: "12px",
            background: notification.type === "success"
              ? "linear-gradient(135deg, #00b894, #00d2a0)"
              : notification.type === "warning"
              ? "linear-gradient(135deg, #e17055, #fdcb6e)"
              : "linear-gradient(135deg, #d63031, #ff6b6b)",
            color: "white",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
            zIndex: 100,
            animation: "slideUp 0.3s ease",
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
