"use client";
/**
 * ALL GOALS PAGE (Admin View)
 * ============================
 * 
 * Admin overview of every goal in the system.
 * Includes:
 * - Filtering by status, department, employee
 * - Bulk export to CSV/Excel
 * - Goal unlock capability (Admin-only power)
 * 
 * BRD: "Admin can manage org hierarchy; oversee completion rates;
 *        exception handling; goal unlock capability"
 */

import { useState, useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, users, thrustAreas, uomLabels, statusConfig, addAuditLog
} from "@/lib/data";
import { Download, Unlock, Filter, Search } from "lucide-react";

export default function AllGoals() {
  const { currentUser, showNotification } = useApp();
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const departments = useMemo(() => [...new Set(users.map(u => u.department))], []);

  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, []);

  const thrustAreaMap = useMemo(() => {
    const map = new Map();
    thrustAreas.forEach(ta => map.set(ta.id, ta));
    return map;
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...goals];
    if (statusFilter !== "all") {
      result = result.filter(g => g.status === statusFilter);
    }
    if (deptFilter !== "all") {
      const deptUsers = new Set(users.filter(u => u.department === deptFilter).map(u => u.id));
      result = result.filter(g => deptUsers.has(g.userId));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => {
        const userName = userMap.get(g.userId)?.name || "";
        return g.title.toLowerCase().includes(q) || userName.toLowerCase().includes(q);
      });
    }
    return result;
  }, [goals, statusFilter, deptFilter, searchQuery, userMap]);

  function unlockGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    addAuditLog("goals", goalId, "unlocked", "status", goal.status, "draft", currentUser.id);
    goal.status = "draft";
    goal.updatedAt = new Date().toISOString();
    showNotification(`🔓 Goal "${goal.title}" unlocked`);
    refresh();
  }

  function exportCSV() {
    const headers = "Employee,Department,Goal Title,Thrust Area,UoM,Target,Weight,Status\n";
    const rows = filtered.map(g => {
      const user = userMap.get(g.userId);
      const ta = thrustAreaMap.get(g.thrustAreaId);
      return `"${user?.name}","${user?.department}","${g.title}","${ta?.name}","${uomLabels[g.uom]}",${g.target},${g.weight}%,${g.status}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all_goals_report.csv";
    a.click();
  }

  return (
    <div>
      {/* Filters */}
      <div className="glass-card flex flex-wrap items-center gap-3 p-4 px-5 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            className="form-input border-none bg-transparent p-1.5"
            placeholder="Search goals or employees..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: "180px" }}>
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: "180px" }}>
          <option value="all">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Results count */}
      <p className="text-[13px] text-[var(--text-muted)] mb-3">
        Showing {filtered.length} of {goals.length} goals
      </p>

      {/* Goals Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Goal Title</th>
              <th>Thrust Area</th>
              <th>Target</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => {
              const user = userMap.get(g.userId);
              const ta = thrustAreaMap.get(g.thrustAreaId);
              const badgeClass =
                g.status === "approved" ? "badge-green" :
                g.status === "pending_approval" ? "badge-amber" :
                g.status === "returned" ? "badge-red" : "badge-slate";

              return (
                <tr key={g.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[12px]" style={{ background: "var(--accent-gradient)" }}>
                        {user?.name?.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-[13px]">{user?.name}</span>
                        <span className="block text-[11px] text-[var(--text-muted)]">{user?.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="font-semibold text-[13px]">{g.title}</td>
                  <td><span className="badge badge-purple text-[11px]">{ta?.name}</span></td>
                  <td className="font-semibold text-[13px]">{g.target}</td>
                  <td className="font-bold">{g.weight}%</td>
                  <td><span className={`badge ${badgeClass}`}>{statusConfig[g.status]?.label}</span></td>
                  <td>
                    {g.status === "approved" && (
                      <button className="btn btn-ghost btn-sm" onClick={() => unlockGoal(g.id)} title="Unlock for editing">
                        <Unlock size={14} /> Unlock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
