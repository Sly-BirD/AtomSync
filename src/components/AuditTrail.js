"use client";
/**
 * AUDIT TRAIL PAGE (Admin View)
 * ==============================
 * 
 * BRD Requirement: "System must log all changes made to goals after the 
 * lock date — capturing who changed what and when."
 * 
 * Every time a goal is approved, returned, or edited by a manager,
 * the addAuditLog() function in data.js creates a record. This page
 * displays that log in a sortable table.
 * 
 * This is a governance/compliance feature — evaluators will check if
 * changes are being tracked correctly.
 */

import { useMemo } from "react";
import { auditLogs, users, goals } from "@/lib/data";
import { FileText, Download } from "lucide-react";

export default function AuditTrail() {
  // Sort by most recent first, memoized to prevent re-sorting on every render
  const sortedLogs = useMemo(() => {
    return [...auditLogs].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, []);

  // O(1) lookups for users and goals to prevent O(N*M) lookups in the map function
  const userMap = useMemo(() => {
    const map = new Map();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, []);

  const goalMap = useMemo(() => {
    const map = new Map();
    goals.forEach(g => map.set(g.id, g));
    return map;
  }, []);

  function exportCSV() {
    const headers = "Timestamp,Action,Table,Record,Field,Old Value,New Value,Changed By\n";
    const rows = sortedLogs.map(l => {
      const user = userMap.get(l.userId);
      return `${l.timestamp},${l.action},${l.tableName},${l.recordId},${l.field},${l.oldValue},${l.newValue},${user?.name || l.userId}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_trail.csv";
    a.click();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <span className="text-sm text-[var(--text-muted)]">
            {sortedLogs.length} logged events
          </span>
        </div>
        <button className="btn btn-ghost" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Audit Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Goal</th>
              <th>Field</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Changed By</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map(l => {
              const user = userMap.get(l.userId);
              const goal = goalMap.get(l.recordId);
              const actionBadge =
                l.action === "approved" ? "badge-green" :
                l.action === "returned" ? "badge-red" :
                l.action === "edit" ? "badge-amber" : "badge-slate";

              return (
                <tr key={l.id}>
                  <td className="text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${actionBadge} capitalize`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="font-semibold text-[13px]">
                    {goal?.title || l.recordId}
                  </td>
                  <td className="font-medium text-[13px]">{l.field}</td>
                  <td className="text-[var(--danger)] text-[13px]">{l.oldValue}</td>
                  <td className="text-[var(--success)] text-[13px]">{l.newValue}</td>
                  <td className="text-[13px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[11px]" style={{ background: "var(--accent-gradient)" }}>
                        {user?.name?.charAt(0) || "?"}
                      </div>
                      {user?.name || l.userId}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedLogs.length === 0 && (
          <div className="p-[60px] text-center">
            <FileText size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">No audit events recorded yet.</p>
            <p className="text-[var(--text-muted)] text-[13px] mt-1">
              Events will appear here when managers approve, return, or edit goals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
