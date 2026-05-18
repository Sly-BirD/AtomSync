"use client";
/**
 * ESCALATIONS PAGE (Bonus Feature)
 * ==================================
 * 
 * BRD Section 5.3: Rule-based escalation module.
 * 
 * This simulates configurable escalation rules, such as:
 * - Employee hasn't submitted goals within N days
 * - Manager hasn't approved within N days
 * - Check-in window missed
 * 
 * In a real deployment, these checks would run as a Vercel Cron Job.
 * Here, we compute them on-the-fly from the data store.
 */

import { goals, users, checkIns, getDirectReports } from "@/lib/data";
import { AlertTriangle, Clock, Send, UserX, Bell } from "lucide-react";

export default function Escalations() {
  // ---- COMPUTE ESCALATION ALERTS ----

  const alerts = [];

  // Rule 1: Employees with no goals at all
  const employees = users.filter(u => u.role === "employee");
  employees.forEach(emp => {
    const empGoals = goals.filter(g => g.userId === emp.id);
    if (empGoals.length === 0) {
      alerts.push({
        id: `no-goals-${emp.id}`,
        type: "critical",
        icon: UserX,
        title: `${emp.name} has not created any goals`,
        description: `${emp.department} department — Goal creation window is open`,
        rule: "No goals created after cycle start",
        target: emp.name,
        action: "Notify employee and manager",
      });
    }
  });

  // Rule 2: Goals stuck in "pending_approval" (simulate > 3 days)
  const pendingGoals = goals.filter(g => g.status === "pending_approval");
  const uniquePendingUsers = [...new Set(pendingGoals.map(g => g.userId))];
  uniquePendingUsers.forEach(userId => {
    const user = users.find(u => u.id === userId);
    const manager = users.find(u => u.id === user?.managerId);
    const count = pendingGoals.filter(g => g.userId === userId).length;
    alerts.push({
      id: `pending-${userId}`,
      type: "warning",
      icon: Clock,
      title: `${count} goals pending approval for ${user?.name}`,
      description: `Manager: ${manager?.name || "Unassigned"} — Awaiting review`,
      rule: "Approval pending > 3 days",
      target: manager?.name || "Manager",
      action: "Send reminder to manager",
    });
  });

  // Rule 3: Approved goals without Q1 check-in
  const approvedGoals = goals.filter(g => g.status === "approved");
  const missingCheckIns = {};
  approvedGoals.forEach(g => {
    const hasQ1 = checkIns.some(c => c.goalId === g.id && c.quarter === "Q1");
    if (!hasQ1) {
      const user = users.find(u => u.id === g.userId);
      if (user) {
        if (!missingCheckIns[user.id]) {
          missingCheckIns[user.id] = { user, count: 0 };
        }
        missingCheckIns[user.id].count++;
      }
    }
  });

  // Only flag employees, not managers/admins
  Object.values(missingCheckIns).forEach(({ user, count }) => {
    if (user.role === "employee") {
      alerts.push({
        id: `missing-ci-${user.id}`,
        type: "info",
        icon: Bell,
        title: `${user.name} has ${count} goals without Q1 check-in`,
        description: `${user.department} department — Q1 check-in window is active`,
        rule: "Quarterly check-in not completed",
        target: user.name,
        action: "Send check-in reminder",
      });
    }
  });

  const typeStyles = {
    critical: { bg: "rgba(255,107,107,0.08)", border: "rgba(255,107,107,0.25)", color: "#ff6b6b" },
    warning:  { bg: "rgba(253,203,110,0.08)", border: "rgba(253,203,110,0.25)", color: "#fdcb6e" },
    info:     { bg: "rgba(116,185,255,0.08)", border: "rgba(116,185,255,0.25)", color: "#74b9ff" },
  };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Critical</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#ff6b6b", marginTop: "4px" }}>
            {alerts.filter(a => a.type === "critical").length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Warnings</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#fdcb6e", marginTop: "4px" }}>
            {alerts.filter(a => a.type === "warning").length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Info</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#74b9ff", marginTop: "4px" }}>
            {alerts.filter(a => a.type === "info").length}
          </div>
        </div>
      </div>

      {/* Escalation List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {alerts.length === 0 ? (
          <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
            <AlertTriangle size={48} style={{ color: "var(--success)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--success)" }}>All Clear!</h3>
            <p style={{ color: "var(--text-muted)" }}>No escalations required at this time.</p>
          </div>
        ) : (
          alerts.map(alert => {
            const style = typeStyles[alert.type];
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className="glass-card animate-in"
                style={{
                  padding: "20px 24px",
                  borderLeft: `3px solid ${style.color}`,
                  background: style.bg,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <Icon size={20} style={{ color: style.color, marginTop: "2px" }} />
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{alert.title}</h4>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{alert.description}</p>
                      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                        <span className="badge badge-slate" style={{ fontSize: "11px" }}>Rule: {alert.rule}</span>
                        <span className="badge badge-purple" style={{ fontSize: "11px" }}>→ {alert.target}</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm">
                    <Send size={14} /> {alert.action}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
