"use client";
/**
 * APPROVALS PAGE (Manager View)
 * ==============================
 * 
 * This is where managers review and approve/return goals submitted by
 * their direct reports. Per the BRD:
 * 
 * - Manager can VIEW submitted goals with all details
 * - Manager can EDIT targets/weightages inline before approving
 * - Manager can APPROVE (which locks the goal — no more edits)
 * - Manager can RETURN for rework (employee sees it as "Returned" status)
 * 
 * The approval workflow is a critical BRD requirement.
 * After approval, goals are "locked" and go to the audit trail.
 */

import { useState, useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, users, getDirectReports, getPendingGoalsForManager,
  thrustAreas, uomLabels, addAuditLog
} from "@/lib/data";
import { CheckCircle, RotateCcw, Eye, Edit3, User, ChevronDown, ChevronUp } from "lucide-react";

export default function Approvals() {
  const { currentUser, showNotification } = useApp();
  const [expandedGoal, setExpandedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const pendingGoals = useMemo(() => getPendingGoalsForManager(currentUser.id), [currentUser.id, forceUpdate]);

  // Group pending goals by employee
  const goalsByEmployee = useMemo(() => {
    const grouped = {};
    pendingGoals.forEach(g => {
      if (!grouped[g.userId]) {
        grouped[g.userId] = {
          user: users.find(u => u.id === g.userId),
          goals: [],
        };
      }
      grouped[g.userId].goals.push(g);
    });
    return grouped;
  }, [pendingGoals]);

  const thrustAreaMap = useMemo(() => {
    const map = new Map();
    thrustAreas.forEach(ta => map.set(ta.id, ta));
    return map;
  }, []);

  function approveGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // If we were editing inline, apply the edits first
    if (editValues[goalId]) {
      if (editValues[goalId].target !== undefined) {
        addAuditLog("goals", goalId, "edit", "target", goal.target, editValues[goalId].target, currentUser.id);
        goal.target = editValues[goalId].target;
      }
      if (editValues[goalId].weight !== undefined) {
        addAuditLog("goals", goalId, "edit", "weight", goal.weight, editValues[goalId].weight, currentUser.id);
        goal.weight = editValues[goalId].weight;
      }
    }

    addAuditLog("goals", goalId, "approved", "status", "pending_approval", "approved", currentUser.id);
    goal.status = "approved";
    goal.updatedAt = new Date().toISOString();
    showNotification(`✓ Approved: "${goal.title}"`);
    setEditingGoal(null);
    refresh();
  }

  function returnGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    addAuditLog("goals", goalId, "returned", "status", "pending_approval", "returned", currentUser.id);
    goal.status = "returned";
    goal.updatedAt = new Date().toISOString();
    showNotification(`↩ Returned: "${goal.title}"`, "warning");
    refresh();
  }

  function approveAll(userId) {
    const userGoals = pendingGoals.filter(g => g.userId === userId);
    userGoals.forEach(g => {
      addAuditLog("goals", g.id, "approved", "status", "pending_approval", "approved", currentUser.id);
      g.status = "approved";
      g.updatedAt = new Date().toISOString();
    });
    showNotification(`✓ Approved all ${userGoals.length} goals`);
    refresh();
  }

  if (pendingGoals.length === 0) {
    return (
      <div className="glass-card p-[60px] text-center">
        <CheckCircle size={48} className="text-[var(--success)] mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">All Caught Up!</h3>
        <p className="text-[var(--text-muted)]">No pending goal approvals at the moment.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <span className="badge badge-amber text-sm px-4 py-1.5">
          ⏳ {pendingGoals.length} goals pending your review
        </span>
      </div>

      {Object.entries(goalsByEmployee).map(([userId, { user: emp, goals: empGoals }]) => (
        <div key={userId} className="glass-card mb-5 overflow-hidden">
          {/* Employee Header */}
          <div className="p-4 px-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[rgba(108,92,231,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-bold text-sm bg-[var(--accent-gradient)]">
                {emp.name.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-[15px]">{emp.name}</span>
                <span className="text-xs text-[var(--text-muted)] block">
                  {emp.department} · {empGoals.length} goals pending
                </span>
              </div>
            </div>
            <button className="btn btn-success btn-sm" onClick={() => approveAll(userId)}>
              <CheckCircle size={14} /> Approve All
            </button>
          </div>

          {/* Goal List */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Goal Title</th>
                <th>Thrust Area</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Weight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {empGoals.map(g => {
                const ta = thrustAreaMap.get(g.thrustAreaId);
                const isEditing = editingGoal === g.id;
                return (
                  <tr key={g.id}>
                    <td>
                      <div>
                        <span className="font-semibold">{g.title}</span>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {g.description}
                        </p>
                      </div>
                    </td>
                    <td><span className="badge badge-purple">{ta?.name}</span></td>
                    <td className="text-[13px] text-[var(--text-secondary)]">
                      {uomLabels[g.uom]?.split("(")[0]?.trim()}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-input w-[100px] px-2.5 py-1.5"
                          type={g.uom === "timeline" ? "date" : "number"}
                          defaultValue={g.target}
                          onChange={e => setEditValues({
                            ...editValues,
                            [g.id]: {
                              ...editValues[g.id],
                              target: g.uom === "timeline" ? e.target.value : Number(e.target.value),
                            }
                          })}
                        />
                      ) : (
                        <span className="font-semibold">{g.target}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-input w-[70px] px-2.5 py-1.5"
                          type="number"
                          defaultValue={g.weight}
                          onChange={e => setEditValues({
                            ...editValues,
                            [g.id]: {
                              ...editValues[g.id],
                              weight: Number(e.target.value),
                            }
                          })}
                        />
                      ) : (
                        <span className="font-bold">{g.weight}%</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingGoal(isEditing ? null : g.id)}
                          title="Edit inline"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button className="btn btn-success btn-sm" onClick={() => approveGoal(g.id)} title="Approve">
                          <CheckCircle size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => returnGoal(g.id)} title="Return for rework">
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
