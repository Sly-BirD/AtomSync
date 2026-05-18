"use client";
/**
 * TEAM GOALS PAGE (Manager View)
 * ================================
 * 
 * Shows a manager all goals belonging to their direct reports.
 * Unlike the Approvals page (which shows only pending goals),
 * this shows ALL goals in any status — giving the manager full visibility.
 * 
 * Includes:
 * - Filter by team member
 * - Status overview per person
 * - Shared Goal push functionality (BRD requirement)
 */

import { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, users, getDirectReports, getGoalsByUser,
  thrustAreas, statusConfig, uomLabels, generateId
} from "@/lib/data";
import { Users, Target, Share2, Plus } from "lucide-react";

export default function TeamGoals() {
  const { currentUser, showNotification } = useApp();
  const [showSharedForm, setShowSharedForm] = useState(false);
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const reports = getDirectReports(currentUser.id);

  // Shared goal form state
  const [sharedGoal, setSharedGoal] = useState({
    thrustAreaId: "", title: "", uom: "numeric_min", target: "", recipients: [],
  });

  function pushSharedGoal() {
    if (!sharedGoal.title || !sharedGoal.target || sharedGoal.recipients.length === 0) {
      showNotification("Fill all fields and select recipients", "warning");
      return;
    }

    const ownerId = generateId("shared");
    sharedGoal.recipients.forEach(recipientId => {
      goals.push({
        id: generateId("goal"),
        userId: recipientId,
        cycleId: "cycle-2025",
        thrustAreaId: sharedGoal.thrustAreaId || "ta1",
        title: sharedGoal.title,
        description: `Shared departmental KPI from ${currentUser.name}`,
        uom: sharedGoal.uom,
        target: sharedGoal.uom === "timeline" ? sharedGoal.target : Number(sharedGoal.target),
        weight: 10, // Default weight, recipients can adjust
        status: "pending_approval",
        isShared: true,
        sharedOwnerId: ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    showNotification(`Shared goal pushed to ${sharedGoal.recipients.length} team members!`);
    setShowSharedForm(false);
    setSharedGoal({ thrustAreaId: "", title: "", uom: "numeric_min", target: "", recipients: [] });
    refresh();
  }

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          {reports.length} direct reports · {reports.flatMap(r => getGoalsByUser(r.id)).length} total goals
        </span>
        <button className="btn btn-primary" onClick={() => setShowSharedForm(!showSharedForm)}>
          <Share2 size={16} /> Push Shared Goal
        </button>
      </div>

      {/* Shared Goal Form */}
      {showSharedForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px", borderColor: "var(--border-active)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Share2 size={18} style={{ color: "var(--accent-secondary)" }} /> Push Shared KPI
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Recipients can adjust weightage only. Goal title and target are read-only for them.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label className="form-label">Goal Title</label>
              <input
                className="form-input"
                placeholder="e.g., Department NPS > 80"
                value={sharedGoal.title}
                onChange={e => setSharedGoal({ ...sharedGoal, title: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Target</label>
              <input
                className="form-input"
                type={sharedGoal.uom === "timeline" ? "date" : "number"}
                placeholder="e.g., 80"
                value={sharedGoal.target}
                onChange={e => setSharedGoal({ ...sharedGoal, target: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">UoM</label>
              <select
                className="form-select"
                value={sharedGoal.uom}
                onChange={e => setSharedGoal({ ...sharedGoal, uom: e.target.value })}
              >
                {Object.entries(uomLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Recipients</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {reports.map(r => {
                  const selected = sharedGoal.recipients.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      className={`btn btn-sm ${selected ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => {
                        const recs = selected
                          ? sharedGoal.recipients.filter(id => id !== r.id)
                          : [...sharedGoal.recipients, r.id];
                        setSharedGoal({ ...sharedGoal, recipients: recs });
                      }}
                    >
                      {r.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setShowSharedForm(false)}>Cancel</button>
            <button className="btn btn-success" onClick={pushSharedGoal}>
              <Share2 size={14} /> Push to Team
            </button>
          </div>
        </div>
      )}

      {/* Per-Employee Goals */}
      {reports.map(report => {
        const reportGoals = getGoalsByUser(report.id);
        const totalWeight = reportGoals.reduce((s, g) => s + g.weight, 0);
        return (
          <div key={report.id} className="glass-card" style={{ marginBottom: "20px", overflow: "hidden" }}>
            {/* Employee Header */}
            <div style={{
              padding: "14px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--accent-gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: "13px",
                }}>
                  {report.name.charAt(0)}
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>{report.name}</span>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                    {report.department} · {reportGoals.length} goals · Weight: {totalWeight}%
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {reportGoals.filter(g => g.status === "approved").length > 0 && (
                  <span className="badge badge-green">{reportGoals.filter(g => g.status === "approved").length} approved</span>
                )}
                {reportGoals.filter(g => g.status === "pending_approval").length > 0 && (
                  <span className="badge badge-amber">{reportGoals.filter(g => g.status === "pending_approval").length} pending</span>
                )}
              </div>
            </div>

            {/* Goals */}
            {reportGoals.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Goal</th>
                    <th>Thrust Area</th>
                    <th>UoM</th>
                    <th>Target</th>
                    <th>Weight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportGoals.map(g => {
                    const ta = thrustAreas.find(t => t.id === g.thrustAreaId);
                    const badgeClass =
                      g.status === "approved" ? "badge-green" :
                      g.status === "pending_approval" ? "badge-amber" :
                      g.status === "returned" ? "badge-red" : "badge-slate";
                    return (
                      <tr key={g.id}>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>{g.title}</span>
                          {g.isShared && <span className="badge badge-blue" style={{ marginLeft: "8px", fontSize: "10px" }}>Shared</span>}
                        </td>
                        <td><span className="badge badge-purple" style={{ fontSize: "11px" }}>{ta?.name}</span></td>
                        <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{uomLabels[g.uom]?.split("(")[0]?.trim()}</td>
                        <td style={{ fontWeight: 600, fontSize: "13px" }}>{g.target}</td>
                        <td style={{ fontWeight: 700 }}>{g.weight}%</td>
                        <td><span className={`badge ${badgeClass}`}>{statusConfig[g.status]?.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No goals created yet
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
