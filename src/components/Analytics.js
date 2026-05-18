"use client";
/**
 * ANALYTICS PAGE (Bonus Feature)
 * ================================
 * 
 * BRD Section 5.4 — "Good to Have":
 * - QoQ achievement trends
 * - Heatmaps / progress charts
 * - Goal distribution by Thrust Area and UoM type
 * - Manager effectiveness dashboard
 * 
 * We use Recharts (a React charting library) to create:
 * 1. A bar chart showing goal completion by department
 * 2. A pie chart showing distribution by thrust area
 * 3. A bar chart showing UoM type distribution
 * 4. Manager check-in completion rates
 */

import { useMemo } from "react";
import {
  goals, users, thrustAreas, checkIns, uomLabels,
  getDirectReports, computeGoalScore
} from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const COLORS = ["#6c5ce7", "#00d2a0", "#fdcb6e", "#ff6b6b", "#74b9ff", "#a29bfe", "#fd79a8", "#00cec9"];

export default function Analytics() {
  // ---- DATA PREPARATION ----

  // 1. Goals by Department
  const deptData = useMemo(() => {
    const departments = [...new Set(users.map(u => u.department))];
    return departments.map(dept => {
      const deptUsers = users.filter(u => u.department === dept);
      const deptGoals = goals.filter(g => deptUsers.some(u => u.id === g.userId));
      return {
        name: dept,
        Total: deptGoals.length,
        Approved: deptGoals.filter(g => g.status === "approved").length,
        Pending: deptGoals.filter(g => g.status === "pending_approval").length,
      };
    });
  }, []);

  // 2. Goals by Thrust Area
  const thrustData = useMemo(() => {
    return thrustAreas.map(ta => ({
      name: ta.name,
      value: goals.filter(g => g.thrustAreaId === ta.id).length,
    })).filter(d => d.value > 0);
  }, []);

  // 3. Goals by UoM Type
  const uomData = useMemo(() => {
    const uomTypes = [...new Set(goals.map(g => g.uom))];
    return uomTypes.map(uom => ({
      name: uomLabels[uom]?.split("(")[0]?.trim() || uom,
      count: goals.filter(g => g.uom === uom).length,
    }));
  }, []);

  // 4. Manager Check-in Effectiveness
  const managerData = useMemo(() => {
    const managers = users.filter(u => u.role === "manager");
    return managers.map(m => {
      const reports = getDirectReports(m.id);
      const reportGoals = reports.flatMap(r => goals.filter(g => g.userId === r.id && g.status === "approved"));
      const goalsWithCheckIns = reportGoals.filter(g => checkIns.some(c => c.goalId === g.id));
      const rate = reportGoals.length > 0 ? Math.round((goalsWithCheckIns.length / reportGoals.length) * 100) : 0;
      return { name: m.name.split(" ")[0], "Check-in Rate": rate };
    });
  }, []);

  // 5. Status distribution overview
  const statusData = useMemo(() => {
    return [
      { name: "Approved", value: goals.filter(g => g.status === "approved").length, color: "#00d2a0" },
      { name: "Pending", value: goals.filter(g => g.status === "pending_approval").length, color: "#fdcb6e" },
      { name: "Draft", value: goals.filter(g => g.status === "draft").length, color: "#a0a0c0" },
      { name: "Returned", value: goals.filter(g => g.status === "returned").length, color: "#ff6b6b" },
    ].filter(d => d.value > 0);
  }, []);

  return (
    <div>
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MiniStat label="Total Goals" value={goals.length} color="#6c5ce7" />
        <MiniStat label="Approved" value={goals.filter(g => g.status === "approved").length} color="#00d2a0" />
        <MiniStat label="Check-ins Logged" value={checkIns.length} color="#74b9ff" />
        <MiniStat label="Avg Weight / Goal" value={`${goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.weight, 0) / goals.length) : 0}%`} color="#fdcb6e" />
      </div>

      {/* Row 1: Department + Status */}
      <div className="grid grid-cols-[3fr_2fr] gap-6 mb-6">
        <div className="glass-card p-6">
          <h3 className="text-base font-bold mb-5">Goals by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6c6c8a" fontSize={12} />
              <YAxis stroke="#6c6c8a" fontSize={12} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0f8" }} />
              <Legend wrapperStyle={{ fontSize: "13px" }} />
              <Bar dataKey="Approved" fill="#00d2a0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#fdcb6e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold mb-5">Goal Status Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0f8" }} />
              <Legend wrapperStyle={{ fontSize: "13px", color: "#a0a0c0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Thrust Area + UoM + Manager Effectiveness */}
      <div className="grid grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-base font-bold mb-5">By Thrust Area</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={thrustData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name.split(" ")[0]} (${value})`}>
                {thrustData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0f8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold mb-5">By Measurement Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={uomData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="#6c6c8a" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#6c6c8a" fontSize={11} width={80} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0f8" }} />
              <Bar dataKey="count" fill="#6c5ce7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-base font-bold mb-5">Manager Effectiveness</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={managerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6c6c8a" fontSize={12} />
              <YAxis stroke="#6c6c8a" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0f8" }} />
              <Bar dataKey="Check-in Rate" fill="#00d2a0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="glass-card p-5 px-6">
      <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
      <div className="text-[28px] font-extrabold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
