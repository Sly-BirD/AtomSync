"use client";
/**
 * DASHBOARD PAGE
 * ==============
 * This is the landing page for all roles. It shows:
 * 
 * FOR EMPLOYEES:
 *   - Total goals, approved goals, overall progress score
 *   - A breakdown of goals by status (nice pie chart)
 * 
 * FOR MANAGERS:
 *   - Team stats: how many direct reports, pending approvals, check-in completion
 *   - A table showing each team member's goal progress
 * 
 * FOR ADMIN:
 *   - Organization-wide stats: total employees, total goals, completion rates
 *   - Department-level breakdown
 * 
 * The dashboard uses Recharts for visualizations — it's a React charting
 * library that renders SVG charts. Much lighter than D3 for simple charts.
 */

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, checkIns, users, getGoalsByUser, getDirectReports,
  computeGoalScore, statusConfig, progressStatusConfig
} from "@/lib/data";
import { Target, Users, CheckSquare, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

export default function Dashboard() {
  const { currentUser } = useApp();

  if (currentUser.role === "employee") return <EmployeeDashboard userId={currentUser.id} />;
  if (currentUser.role === "manager")  return <ManagerDashboard managerId={currentUser.id} />;
  return <AdminDashboard />;
}

// ============================
// EMPLOYEE DASHBOARD
// ============================
function EmployeeDashboard({ userId }) {
  const myGoals = useMemo(() => getGoalsByUser(userId), [userId]);
  const approvedGoals = useMemo(() => myGoals.filter(g => g.status === "approved"), [myGoals]);
  const pendingGoals = useMemo(() => myGoals.filter(g => g.status === "pending_approval"), [myGoals]);
  const totalWeight = useMemo(() => myGoals.reduce((s, g) => s + g.weight, 0), [myGoals]);

  // Calculate overall progress score from check-ins
  const { overallScore, scoredGoals } = useMemo(() => {
    const latestCheckIns = approvedGoals.map(g => {
      const cis = checkIns.filter(c => c.goalId === g.id);
      return cis.length > 0 ? cis[cis.length - 1] : null;
    });

    let scoreSum = 0;
    let scoredCount = 0;
    latestCheckIns.forEach((ci, i) => {
      if (ci && ci.actualAchievement !== null) {
        const score = computeGoalScore(approvedGoals[i], ci.actualAchievement);
        if (score !== null) {
          scoreSum += score * (approvedGoals[i].weight / 100);
          scoredCount++;
        }
      }
    });
    return { overallScore: scoreSum, scoredGoals: scoredCount };
  }, [approvedGoals]);

  // Data for the status pie chart
  const statusData = useMemo(() => {
    return [
      { name: "Approved",  value: myGoals.filter(g => g.status === "approved").length },
      { name: "Pending",   value: myGoals.filter(g => g.status === "pending_approval").length },
      { name: "Draft",     value: myGoals.filter(g => g.status === "draft").length },
      { name: "Returned",  value: myGoals.filter(g => g.status === "returned").length },
    ].filter(d => d.value > 0);
  }, [myGoals]);

  return (
    <div>
      {/* Stat Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Target} label="Total Goals" value={myGoals.length} sublabel={`Weight: ${totalWeight}%`} />
        <StatCard icon={CheckSquare} label="Approved" value={approvedGoals.length} sublabel={`${pendingGoals.length} pending`} />
        <StatCard icon={TrendingUp} label="Overall Score" value={`${Math.round(overallScore)}%`} sublabel="Weighted average" />
        <StatCard icon={Clock} label="Current Phase" value="Q1" sublabel="Check-in active" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Goal Status Breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold mb-4">Goal Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {statusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", boxShadow: "var(--shadow-md)" }}
                itemStyle={{ color: "var(--text-primary)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Progress */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold mb-4">Goal Progress (Q1)</h3>
          <div className="flex flex-col gap-3">
            {approvedGoals.map(g => {
              const ci = checkIns.filter(c => c.goalId === g.id).pop();
              const score = ci ? computeGoalScore(g, ci.actualAchievement) : 0;
              const progressClass = score >= 80 ? "success" : score >= 50 ? "warning" : "danger";
              return (
                <div key={g.id} className="animate-in border-b border-[var(--border-color)] pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between mb-1.5 items-end">
                    <span className="text-xs font-semibold truncate pr-4">{g.title}</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">{Math.round(score || 0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-bar-fill ${progressClass}`} style={{ width: `${Math.min(score || 0, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// MANAGER DASHBOARD
// ============================
function ManagerDashboard({ managerId }) {
  const reports = useMemo(() => getDirectReports(managerId), [managerId]);

  const { allTeamGoals, pendingApprovals, approvedTeamGoals, teamSummary, chartData } = useMemo(() => {
    const allGoals = reports.flatMap(r => getGoalsByUser(r.id));
    const pending = allGoals.filter(g => g.status === "pending_approval");
    const approved = allGoals.filter(g => g.status === "approved");

    // Per-person summary
    const summary = reports.map(r => {
      const rGoals = getGoalsByUser(r.id);
      const app = rGoals.filter(g => g.status === "approved").length;
      const pend = rGoals.filter(g => g.status === "pending_approval").length;

      // Calculate average score for this person
      const approvedGoals = rGoals.filter(g => g.status === "approved");
      let totalScore = 0, count = 0;
      approvedGoals.forEach(g => {
        const ci = checkIns.filter(c => c.goalId === g.id).pop();
        if (ci && ci.actualAchievement !== null) {
          const score = computeGoalScore(g, ci.actualAchievement);
          if (score !== null) { totalScore += score; count++; }
        }
      });
      const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

      return { ...r, totalGoals: rGoals.length, approved: app, pending: pend, avgScore };
    });

    // Chart data: goals by status per team member
    const chart = summary.map(r => ({
      name: r.name.split(" ")[0], // First name only for chart
      Approved: r.approved,
      Pending: r.pending,
      Draft: r.totalGoals - r.approved - r.pending,
    }));

    return { allTeamGoals: allGoals, pendingApprovals: pending, approvedTeamGoals: approved, teamSummary: summary, chartData: chart };
  }, [reports]);

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Direct Reports" value={reports.length} sublabel={`${reports.length} team members`} />
        <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingApprovals.length} sublabel="Awaiting your review" />
        <StatCard icon={Target} label="Team Goals" value={allTeamGoals.length} sublabel={`${approvedTeamGoals.length} approved`} />
        <StatCard icon={TrendingUp} label="Avg Team Score" value={`${teamSummary.length > 0 ? Math.round(teamSummary.reduce((s, r) => s + r.avgScore, 0) / teamSummary.length) : 0}%`} sublabel="Across Q1 check-ins" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Team Progress Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold mb-4">Team Goal Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", boxShadow: "var(--shadow-md)" }}
                itemStyle={{ color: "var(--text-primary)" }}
                cursor={{ fill: 'var(--bg-tertiary)' }}
              />
              <Bar dataKey="Approved" fill="var(--chart-1)" radius={[2, 2, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Pending" fill="var(--chart-4)" radius={[2, 2, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Member Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-bold">Team Members</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Goals</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teamSummary.map(r => (
                <tr key={r.id}>
                  <td className="font-semibold text-xs">{r.name}</td>
                  <td className="text-xs">{r.totalGoals}</td>
                  <td>
                    <span className="font-bold text-xs" style={{ color: r.avgScore >= 70 ? "var(--success)" : r.avgScore >= 40 ? "var(--warning)" : "var(--danger)" }}>
                      {r.avgScore}%
                    </span>
                  </td>
                  <td>
                    {r.pending > 0 ? (
                      <span className="badge badge-amber text-[10px]">⏳ {r.pending} pending</span>
                    ) : (
                      <span className="badge badge-green text-[10px]">✓ All approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================
// ADMIN DASHBOARD
// ============================
function AdminDashboard() {
  const allEmployees = useMemo(() => users.filter(u => u.role === "employee"), []);
  const allManagers = useMemo(() => users.filter(u => u.role === "manager"), []);
  const totalGoals = goals.length;
  const approvedGoals = useMemo(() => goals.filter(g => g.status === "approved").length, []);
  const pendingGoals = useMemo(() => goals.filter(g => g.status === "pending_approval").length, []);

  // Department-level breakdown
  const deptData = useMemo(() => {
    const departments = [...new Set(users.map(u => u.department))];
    return departments.map(dept => {
      const deptUsers = users.filter(u => u.department === dept);
      const deptGoals = goals.filter(g => deptUsers.some(u => u.id === g.userId));
      return {
        name: dept,
        Goals: deptGoals.length,
        Approved: deptGoals.filter(g => g.status === "approved").length,
        Pending: deptGoals.filter(g => g.status === "pending_approval").length,
      };
    });
  }, []);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Employees" value={allEmployees.length} sublabel={`${allManagers.length} managers`} />
        <StatCard icon={Target} label="Total Goals" value={totalGoals} sublabel={`${approvedGoals} approved`} />
        <StatCard icon={AlertTriangle} label="Pending Approvals" value={pendingGoals} sublabel="Across organization" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${totalGoals > 0 ? Math.round((approvedGoals / totalGoals) * 100) : 0}%`} sublabel="Goals approved" />
      </div>

      {/* Department Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold mb-4">Goals by Department</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={deptData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", boxShadow: "var(--shadow-md)" }}
              itemStyle={{ color: "var(--text-primary)" }}
              cursor={{ fill: 'var(--bg-tertiary)' }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} iconType="circle" />
            <Bar dataKey="Approved" fill="var(--chart-1)" radius={[2, 2, 0, 0]} maxBarSize={60} />
            <Bar dataKey="Pending" fill="var(--chart-4)" radius={[2, 2, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================
// STAT CARD (reusable mini-component)
// ============================
function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="glass-card stat-card animate-in flex flex-row items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        <span className="text-[11px] text-[var(--text-muted)]">{sublabel}</span>
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
        <Icon size={18} className="text-[var(--text-primary)]" />
      </div>
    </div>
  );
}
