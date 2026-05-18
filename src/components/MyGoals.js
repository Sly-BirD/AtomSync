"use client";
/**
 * MY GOALS PAGE (Employee View)
 * =============================
 * 
 * Shows all goals belonging to the current employee in a table.
 * Features:
 * - "New Goal" button opens the GoalForm modal
 * - Status badges (Draft, Pending, Approved, Returned)
 * - Draft goals can be submitted for approval
 * - Approved goals are locked (indicated visually)
 * - Weight validation bar at the top shows total weight usage
 */

import { useState, useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, getGoalsByUser, thrustAreas, uomLabels, statusConfig
} from "@/lib/data";
import GoalForm from "./GoalForm";
import { Plus, Send, Lock, Trash2, Edit3 } from "lucide-react";

export default function MyGoals() {
  const { currentUser, showNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const myGoals = useMemo(() => getGoalsByUser(currentUser.id), [currentUser.id, forceUpdate]);
  const totalWeight = useMemo(() => myGoals.reduce((s, g) => s + g.weight, 0), [myGoals]);

  const thrustAreaMap = useMemo(() => {
    const map = new Map();
    thrustAreas.forEach(ta => map.set(ta.id, ta));
    return map;
  }, []);

  function submitGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.status = "pending_approval";
      goal.updatedAt = new Date().toISOString();
      showNotification(`"${goal.title}" submitted for approval`);
      refresh();
    }
  }

  function deleteGoal(goalId) {
    const idx = goals.findIndex(g => g.id === goalId);
    if (idx !== -1) {
      const title = goals[idx].title;
      goals.splice(idx, 1);
      showNotification(`"${title}" deleted`, "warning");
      refresh();
    }
  }

  // Status badge renderer
  function StatusBadge({ status }) {
    const config = statusConfig[status];
    const badgeClass =
      status === "approved" ? "badge-green" :
      status === "pending_approval" ? "badge-amber" :
      status === "returned" ? "badge-red" : "badge-slate";
    return <span className={`badge ${badgeClass}`}>{config?.label || status}</span>;
  }

  return (
    <div>
      {/* Weight Progress Bar */}
      <div className="glass-card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Weight Allocation</span>
          <span className="text-xs font-bold" style={{ color: totalWeight === 100 ? "var(--success)" : "var(--text-primary)" }}>
            {totalWeight}% / 100%
          </span>
        </div>
        <div className="progress-bar h-[6px]">
          <div
            className={`progress-bar-fill ${totalWeight === 100 ? "success" : totalWeight > 100 ? "danger" : ""}`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-[var(--text-muted)]">
            {myGoals.length} goals · Max 8
          </span>
          {totalWeight < 100 && (
            <span className="text-xs text-[var(--warning)]">
              ⚠ {100 - totalWeight}% remaining to allocate
            </span>
          )}
          {totalWeight === 100 && (
            <span className="text-xs text-[var(--success)]">
              ✓ Weight allocation complete
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-bold">
          My Goals ({myGoals.length})
        </h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={myGoals.length >= 8}
        >
          <Plus size={14} /> New Goal
        </button>
      </div>

      {/* Goals Table */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Goal Title</th>
              <th>Thrust Area</th>
              <th>UoM</th>
              <th>Target</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myGoals.map((g, i) => {
              const ta = thrustAreaMap.get(g.thrustAreaId);
              return (
                <tr key={g.id} className="animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <td>
                    <div>
                      <span className="font-semibold text-xs">{g.title}</span>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-[250px] truncate">
                        {g.description}
                      </p>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{ta?.name}</span></td>
                  <td className="text-[13px] text-[var(--text-secondary)]">
                    {uomLabels[g.uom]?.split("(")[0]?.trim()}
                  </td>
                  <td className="font-semibold">{g.target}</td>
                  <td className="font-bold">{g.weight}%</td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      {g.status === "draft" && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => submitGoal(g.id)}>
                            <Send size={14} /> Submit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteGoal(g.id)}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      {g.status === "returned" && (
                        <button className="btn btn-primary btn-sm" onClick={() => submitGoal(g.id)}>
                          <Send size={14} /> Resubmit
                        </button>
                      )}
                      {g.status === "approved" && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Lock size={14} /> Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {myGoals.length === 0 && (
          <div className="p-[60px] text-center">
            <p className="text-base text-[var(--text-muted)] mb-4">
              No goals yet. Create your first goal to get started!
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Create Goal
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && <GoalForm onClose={() => { setShowForm(false); refresh(); }} />}
    </div>
  );
}
