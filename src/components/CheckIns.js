"use client";
/**
 * CHECK-INS PAGE
 * ==============
 * 
 * Phase 2 of the BRD. This page serves TWO audiences:
 * 
 * EMPLOYEE VIEW:
 *   - Shows their approved goals with columns for each quarter (Q1–Q4)
 *   - Employee inputs "Actual Achievement" and selects a progress status
 *   - The system auto-computes a score based on the UoM formula
 * 
 * MANAGER VIEW:
 *   - Shows each direct report's goals with Planned vs Actual data
 *   - Manager adds a "Check-in Comment" per goal (required by BRD)
 *   - Manager can see computed scores for tracking
 * 
 * SCORING FORMULAS (from the BRD):
 *   - Min (Numeric/%): Achievement ÷ Target (higher is better)
 *   - Max (Numeric/%): Target ÷ Achievement (lower is better)
 *   - Timeline: Completion date vs Deadline
 *   - Zero: If 0 → 100%, else 0%
 */

import { useState, useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, checkIns, users, getGoalsByUser, getDirectReports,
  computeGoalScore, generateId, uomLabels, progressStatusConfig
} from "@/lib/data";
import { Save, MessageSquare, TrendingUp, User } from "lucide-react";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function CheckInsPage() {
  const { currentUser } = useApp();

  if (currentUser.role === "employee") return <EmployeeCheckIns userId={currentUser.id} />;
  return <ManagerCheckIns managerId={currentUser.id} />;
}

// ============================
// EMPLOYEE CHECK-IN
// ============================
function EmployeeCheckIns({ userId }) {
  const [, forceUpdate] = useState(0);
  const myGoals = useMemo(() => getGoalsByUser(userId).filter(g => g.status === "approved"), [userId, forceUpdate]);
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [formData, setFormData] = useState({});
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);
  const { showNotification } = useApp();

  function getCheckIn(goalId, quarter) {
    return checkIns.find(c => c.goalId === goalId && c.quarter === quarter);
  }

  function saveCheckIn(goalId) {
    const data = formData[goalId];
    if (!data || data.actual === undefined || data.actual === "") return;

    const existing = getCheckIn(goalId, selectedQuarter);
    if (existing) {
      // Update existing check-in
      existing.actualAchievement = data.actual === "" ? null : (typeof data.actual === "string" && data.actual.includes("-") ? data.actual : Number(data.actual));
      existing.progressStatus = data.status || "on_track";
      existing.updatedAt = new Date().toISOString();
    } else {
      // Create new check-in
      checkIns.push({
        id: generateId("ci"),
        goalId,
        quarter: selectedQuarter,
        actualAchievement: data.actual === "" ? null : (typeof data.actual === "string" && data.actual.includes("-") ? data.actual : Number(data.actual)),
        progressStatus: data.status || "on_track",
        managerComment: "",
        updatedAt: new Date().toISOString(),
      });
    }

    showNotification("Check-in saved successfully!");
    refresh();
  }

  return (
    <div>
      {/* Quarter Selector */}
      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => (
          <button
            key={q}
            className={`btn ${selectedQuarter === q ? "btn-primary" : "btn-ghost"} btn-sm`}
            onClick={() => setSelectedQuarter(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {myGoals.length === 0 ? (
        <div className="glass-card p-[60px] text-center">
          <p className="text-[var(--text-muted)]">No approved goals yet. Goals must be approved before check-ins.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Goal</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Actual ({selectedQuarter})</th>
                <th>Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myGoals.map(g => {
                const ci = getCheckIn(g.id, selectedQuarter);
                const currentActual = formData[g.id]?.actual ?? ci?.actualAchievement ?? "";
                const currentStatus = formData[g.id]?.status ?? ci?.progressStatus ?? "not_started";
                const score = ci ? computeGoalScore(g, ci.actualAchievement) : null;

                return (
                  <tr key={g.id}>
                    <td>
                      <span className="font-semibold">{g.title}</span>
                      <span className="block text-xs text-[var(--text-muted)]">
                        Weight: {g.weight}%
                      </span>
                    </td>
                    <td className="text-[13px] text-[var(--text-secondary)]">
                      {uomLabels[g.uom]?.split("(")[0]?.trim()}
                    </td>
                    <td className="font-semibold">{g.target}</td>
                    <td>
                      <input
                        className="form-input w-[120px] px-2.5 py-1.5"
                        type={g.uom === "timeline" ? "date" : "number"}
                        value={currentActual}
                        placeholder="Enter actual..."
                        onChange={e => setFormData({
                          ...formData,
                          [g.id]: { ...formData[g.id], actual: e.target.value }
                        })}
                      />
                    </td>
                    <td>
                      <select
                        className="form-select w-[130px] px-2.5 py-1.5 text-[13px]"
                        value={currentStatus}
                        onChange={e => setFormData({
                          ...formData,
                          [g.id]: { ...formData[g.id], status: e.target.value }
                        })}
                      >
                        {Object.entries(progressStatusConfig).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {score !== null ? (
                        <span style={{
                          fontWeight: 700,
                          color: score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)"
                        }}>
                          {Math.round(score)}%
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => saveCheckIn(g.id)}>
                        <Save size={14} /> Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manager Comments Section (read-only for employee) */}
      {myGoals.some(g => {
        const ci = getCheckIn(g.id, selectedQuarter);
        return ci?.managerComment;
      }) && (
        <div className="glass-card p-6 mt-6">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={18} /> Manager Feedback
          </h3>
          {myGoals.map(g => {
            const ci = getCheckIn(g.id, selectedQuarter);
            if (!ci?.managerComment) return null;
            return (
              <div key={g.id} className="p-3 px-4 rounded-[10px] bg-[var(--bg-secondary)] mb-2.5">
                <span className="text-[13px] font-semibold text-[var(--accent-secondary)]">{g.title}</span>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{ci.managerComment}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================
// MANAGER CHECK-IN
// ============================
function ManagerCheckIns({ managerId }) {
  const [, forceUpdate] = useState(0);
  const reports = useMemo(() => getDirectReports(managerId), [managerId]);
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [selectedReport, setSelectedReport] = useState(reports[0]?.id || "");
  const [comments, setComments] = useState({});
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);
  const { showNotification } = useApp();

  const selectedUser = useMemo(() => users.find(u => u.id === selectedReport), [selectedReport]);
  const reportGoals = useMemo(() => getGoalsByUser(selectedReport).filter(g => g.status === "approved"), [selectedReport, forceUpdate]);

  function saveComment(goalId) {
    const comment = comments[goalId];
    if (!comment?.trim()) return;

    const ci = checkIns.find(c => c.goalId === goalId && c.quarter === selectedQuarter);
    if (ci) {
      ci.managerComment = comment;
      ci.updatedAt = new Date().toISOString();
      showNotification("Comment saved!");
      refresh();
    } else {
      showNotification("Employee has not submitted a check-in yet", "warning");
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Quarter Selector */}
        <div className="flex gap-2">
          {QUARTERS.map(q => (
            <button
              key={q}
              className={`btn ${selectedQuarter === q ? "btn-primary" : "btn-ghost"} btn-sm`}
              onClick={() => setSelectedQuarter(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Team Member Selector */}
        <select
          className="form-select w-[220px]"
          value={selectedReport}
          onChange={e => setSelectedReport(e.target.value)}
        >
          {reports.map(r => (
            <option key={r.id} value={r.id}>{r.name} — {r.department}</option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className="glass-card overflow-hidden">
          {/* Employee header */}
          <div className="p-4 px-6 border-b border-[var(--border-color)] flex items-center gap-3 bg-[rgba(108,92,231,0.05)]">
            <User size={18} className="text-[var(--accent-secondary)]" />
            <span className="font-bold">{selectedUser.name}</span>
            <span className="text-xs text-[var(--text-muted)]">· {selectedUser.department}</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Goal</th>
                <th>Target</th>
                <th>Actual</th>
                <th>Score</th>
                <th>Status</th>
                <th>Your Comment</th>
              </tr>
            </thead>
            <tbody>
              {reportGoals.map(g => {
                const ci = checkIns.find(c => c.goalId === g.id && c.quarter === selectedQuarter);
                const score = ci ? computeGoalScore(g, ci.actualAchievement) : null;

                return (
                  <tr key={g.id}>
                    <td>
                      <span className="font-semibold">{g.title}</span>
                      <span className="block text-xs text-[var(--text-muted)]">
                        {uomLabels[g.uom]?.split("(")[0]?.trim()} · Weight: {g.weight}%
                      </span>
                    </td>
                    <td className="font-semibold">{g.target}</td>
                    <td>
                      {ci ? (
                        <span className="font-semibold">{ci.actualAchievement ?? "—"}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Not submitted</span>
                      )}
                    </td>
                    <td>
                      {score !== null ? (
                        <span style={{
                          fontWeight: 700,
                          color: score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)"
                        }}>
                          {Math.round(score)}%
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {ci ? (
                        <span className={`badge ${
                          ci.progressStatus === "completed" ? "badge-green" :
                          ci.progressStatus === "on_track" ? "badge-blue" :
                          ci.progressStatus === "at_risk" ? "badge-amber" : "badge-slate"
                        }`}>
                          {progressStatusConfig[ci.progressStatus]?.label}
                        </span>
                      ) : (
                        <span className="badge badge-slate">Awaiting</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <input
                          className="form-input w-[180px] px-2.5 py-1.5 text-[13px]"
                          placeholder="Add comment..."
                          value={comments[g.id] ?? ci?.managerComment ?? ""}
                          onChange={e => setComments({ ...comments, [g.id]: e.target.value })}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => saveComment(g.id)}>
                          <Save size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {reportGoals.length === 0 && (
            <div className="p-10 text-center text-[var(--text-muted)]">
              No approved goals for this team member yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
