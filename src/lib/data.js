/**
 * IN-MEMORY DATA STORE
 * ====================
 * This file acts as our "database" for the hackathon demo.
 * 
 * WHY IN-MEMORY?
 * - No external database setup needed → works on any machine instantly
 * - Perfect for demos and hackathons
 * - Easy to swap out for Supabase/PostgreSQL later (same data shapes)
 * 
 * HOW IT WORKS:
 * - We export mutable arrays that act as database tables
 * - Helper functions simulate INSERT, UPDATE, SELECT queries
 * - Data persists only for the duration of the server session
 */

// ============================================
// TABLE: users
// Each user has a role and a manager_id linking them to their boss
// ============================================
export const users = [
  { id: "emp1",  name: "Aarav Sharma",    email: "aarav@company.com",    role: "employee", department: "Engineering", managerId: "mgr1" },
  { id: "emp2",  name: "Priya Patel",     email: "priya@company.com",    role: "employee", department: "Engineering", managerId: "mgr1" },
  { id: "emp3",  name: "Rohan Gupta",     email: "rohan@company.com",    role: "employee", department: "Marketing",   managerId: "mgr2" },
  { id: "emp4",  name: "Sneha Reddy",     email: "sneha@company.com",    role: "employee", department: "Sales",       managerId: "mgr2" },
  { id: "emp5",  name: "Vikram Singh",    email: "vikram@company.com",   role: "employee", department: "Engineering", managerId: "mgr1" },
  { id: "mgr1",  name: "Deepak Verma",    email: "deepak@company.com",   role: "manager",  department: "Engineering", managerId: null },
  { id: "mgr2",  name: "Anita Joshi",     email: "anita@company.com",    role: "manager",  department: "Marketing",   managerId: null },
  { id: "admin1",name: "Kavita Nair",     email: "kavita@company.com",   role: "admin",    department: "HR",          managerId: null },
];

// ============================================
// TABLE: thrust_areas  (categories for goals)
// Think of these as strategic pillars the organization cares about
// ============================================
export const thrustAreas = [
  { id: "ta1", name: "Revenue Growth" },
  { id: "ta2", name: "Customer Satisfaction" },
  { id: "ta3", name: "Operational Excellence" },
  { id: "ta4", name: "Innovation & Learning" },
  { id: "ta5", name: "People Development" },
  { id: "ta6", name: "Cost Optimization" },
];

// ============================================
// TABLE: cycles  (performance review periods)
// ============================================
export const cycles = [
  { id: "cycle-2025", name: "FY 2025-26", startDate: "2025-05-01", endDate: "2026-04-30", phase: "active" },
];

// ============================================
// TABLE: goals
// Status lifecycle: draft → pending_approval → approved (locked) → returned
// ============================================
export let goals = [
  // Aarav's goals (already approved, to show check-in flow)
  {
    id: "goal1", userId: "emp1", cycleId: "cycle-2025",
    thrustAreaId: "ta1", title: "Increase Monthly Recurring Revenue",
    description: "Grow MRR by acquiring new enterprise clients and upselling existing accounts",
    uom: "numeric_min", target: 500000, weight: 30,
    status: "approved", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-05T10:00:00Z", updatedAt: "2025-05-07T14:00:00Z",
  },
  {
    id: "goal2", userId: "emp1", cycleId: "cycle-2025",
    thrustAreaId: "ta2", title: "Achieve NPS Score Above 75",
    description: "Improve customer satisfaction through better support response times and proactive outreach",
    uom: "numeric_min", target: 75, weight: 25,
    status: "approved", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-05T10:30:00Z", updatedAt: "2025-05-07T14:00:00Z",
  },
  {
    id: "goal3", userId: "emp1", cycleId: "cycle-2025",
    thrustAreaId: "ta3", title: "Reduce Average Bug Resolution Time",
    description: "Bring down the average time to resolve critical bugs from 48h to under 24h",
    uom: "numeric_max", target: 24, weight: 20,
    status: "approved", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-05T11:00:00Z", updatedAt: "2025-05-07T14:00:00Z",
  },
  {
    id: "goal4", userId: "emp1", cycleId: "cycle-2025",
    thrustAreaId: "ta4", title: "Launch New Feature by Q2",
    description: "Design, develop, and ship the analytics dashboard feature",
    uom: "timeline", target: "2025-09-30", weight: 15,
    status: "approved", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-05T11:30:00Z", updatedAt: "2025-05-07T14:00:00Z",
  },
  {
    id: "goal5", userId: "emp1", cycleId: "cycle-2025",
    thrustAreaId: "ta3", title: "Zero Production Incidents",
    description: "Maintain zero critical production outages through better monitoring and testing",
    uom: "zero", target: 0, weight: 10,
    status: "approved", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-05T12:00:00Z", updatedAt: "2025-05-07T14:00:00Z",
  },

  // Priya's goals (pending approval, to show manager approval flow)
  {
    id: "goal6", userId: "emp2", cycleId: "cycle-2025",
    thrustAreaId: "ta1", title: "Deliver 3 Client Projects On-Time",
    description: "Complete all milestone deliverables for the three major client projects within scheduled timelines",
    uom: "numeric_min", target: 3, weight: 35,
    status: "pending_approval", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-06T09:00:00Z", updatedAt: "2025-05-06T09:00:00Z",
  },
  {
    id: "goal7", userId: "emp2", cycleId: "cycle-2025",
    thrustAreaId: "ta4", title: "Complete AWS Solutions Architect Certification",
    description: "Obtain the AWS SAA-C03 certification to strengthen cloud architecture skills",
    uom: "timeline", target: "2025-12-31", weight: 20,
    status: "pending_approval", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-06T09:30:00Z", updatedAt: "2025-05-06T09:30:00Z",
  },
  {
    id: "goal8", userId: "emp2", cycleId: "cycle-2025",
    thrustAreaId: "ta5", title: "Mentor 2 Junior Developers",
    description: "Provide weekly 1-on-1 mentorship sessions to two junior team members",
    uom: "numeric_min", target: 2, weight: 15,
    status: "pending_approval", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-06T10:00:00Z", updatedAt: "2025-05-06T10:00:00Z",
  },
  {
    id: "goal9", userId: "emp2", cycleId: "cycle-2025",
    thrustAreaId: "ta6", title: "Reduce Cloud Infra Costs by 15%",
    description: "Optimize AWS resource usage and implement cost-saving measures",
    uom: "percent_min", target: 15, weight: 20,
    status: "pending_approval", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-06T10:30:00Z", updatedAt: "2025-05-06T10:30:00Z",
  },
  {
    id: "goal10", userId: "emp2", cycleId: "cycle-2025",
    thrustAreaId: "ta3", title: "Achieve 95% Code Coverage",
    description: "Increase unit test coverage across all microservices to at least 95%",
    uom: "percent_min", target: 95, weight: 10,
    status: "pending_approval", isShared: false, sharedOwnerId: null,
    createdAt: "2025-05-06T11:00:00Z", updatedAt: "2025-05-06T11:00:00Z",
  },
];

// ============================================
// TABLE: check_ins
// Employees log actual progress against targets each quarter
// ============================================
export let checkIns = [
  // Q1 check-ins for Aarav's goals
  { id: "ci1", goalId: "goal1", quarter: "Q1", actualAchievement: 320000, progressStatus: "on_track", managerComment: "Good progress, need to push harder in Q2.", updatedAt: "2025-07-15T10:00:00Z" },
  { id: "ci2", goalId: "goal2", quarter: "Q1", actualAchievement: 68,     progressStatus: "on_track", managerComment: "Trending well, keep the focus on response times.", updatedAt: "2025-07-15T10:30:00Z" },
  { id: "ci3", goalId: "goal3", quarter: "Q1", actualAchievement: 30,     progressStatus: "on_track", managerComment: "Still above target, let's review process bottlenecks.", updatedAt: "2025-07-15T11:00:00Z" },
  { id: "ci4", goalId: "goal4", quarter: "Q1", actualAchievement: null,   progressStatus: "not_started", managerComment: "Expected to start in Q2.", updatedAt: "2025-07-15T11:30:00Z" },
  { id: "ci5", goalId: "goal5", quarter: "Q1", actualAchievement: 0,      progressStatus: "completed", managerComment: "Excellent! Zero incidents in Q1.", updatedAt: "2025-07-15T12:00:00Z" },
];

// ============================================
// TABLE: audit_logs
// Every change after goal lock is recorded here for governance
// ============================================
export let auditLogs = [
  { id: "al1", tableName: "goals", recordId: "goal1", action: "approved", field: "status", oldValue: "pending_approval", newValue: "approved", userId: "mgr1", timestamp: "2025-05-07T14:00:00Z" },
  { id: "al2", tableName: "goals", recordId: "goal2", action: "approved", field: "status", oldValue: "pending_approval", newValue: "approved", userId: "mgr1", timestamp: "2025-05-07T14:00:00Z" },
];

// ============================================
// TABLE: escalations
// ============================================
export let escalations = [];

// ============================================
// HELPER FUNCTIONS (simulate database queries)
// ============================================

let nextId = 100;
export function generateId(prefix = "id") {
  return `${prefix}${nextId++}`;
}

/** Get all goals for a specific user */
export function getGoalsByUser(userId) {
  return goals.filter(g => g.userId === userId);
}

/** Get all goals that a manager needs to review (their direct reports' pending goals) */
export function getPendingGoalsForManager(managerId) {
  const reportIds = users.filter(u => u.managerId === managerId).map(u => u.id);
  return goals.filter(g => reportIds.includes(g.userId) && g.status === "pending_approval");
}

/** Get direct reports for a manager */
export function getDirectReports(managerId) {
  return users.filter(u => u.managerId === managerId);
}

/** Compute the score for a single goal based on UoM rules from the BRD */
export function computeGoalScore(goal, actual) {
  if (actual === null || actual === undefined) return null;

  switch (goal.uom) {
    case "numeric_min":   // Higher is better (e.g., Revenue)
    case "percent_min":
      return Math.min((actual / goal.target) * 100, 100);

    case "numeric_max":   // Lower is better (e.g., Bug resolution time)
    case "percent_max":
      return actual === 0 ? 100 : Math.min((goal.target / actual) * 100, 100);

    case "timeline":      // Date-based completion
      const deadline = new Date(goal.target);
      const completionDate = new Date(actual);
      return completionDate <= deadline ? 100 : 0;

    case "zero":          // Zero = success (e.g., Safety incidents)
      return actual === 0 ? 100 : 0;

    default:
      return null;
  }
}

/** Add an audit log entry */
export function addAuditLog(tableName, recordId, action, field, oldValue, newValue, userId) {
  const entry = {
    id: generateId("al"),
    tableName,
    recordId,
    action,
    field,
    oldValue: String(oldValue),
    newValue: String(newValue),
    userId,
    timestamp: new Date().toISOString(),
  };
  auditLogs.push(entry);
  return entry;
}

/** UoM display labels */
export const uomLabels = {
  numeric_min: "Numeric (Higher is Better)",
  numeric_max: "Numeric (Lower is Better)",
  percent_min: "Percentage (Higher is Better)",
  percent_max: "Percentage (Lower is Better)",
  timeline:    "Timeline (Date-based)",
  zero:        "Zero-Based (Zero = Success)",
};

/** Status display labels & colors */
export const statusConfig = {
  draft:            { label: "Draft",            color: "bg-slate-500" },
  pending_approval: { label: "Pending Approval", color: "bg-amber-500" },
  approved:         { label: "Approved",         color: "bg-emerald-500" },
  returned:         { label: "Returned",         color: "bg-red-500" },
};

export const progressStatusConfig = {
  not_started: { label: "Not Started", color: "bg-slate-400" },
  on_track:    { label: "On Track",    color: "bg-blue-500" },
  at_risk:     { label: "At Risk",     color: "bg-amber-500" },
  completed:   { label: "Completed",   color: "bg-emerald-500" },
};
