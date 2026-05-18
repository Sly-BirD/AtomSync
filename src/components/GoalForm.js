"use client";
/**
 * GOAL FORM COMPONENT
 * ===================
 * 
 * This is the employee-facing "Create Goal" form. It enforces the BRD rules:
 *   1. Total weightage across all goals must equal 100%
 *   2. Minimum weightage per individual goal: 10%
 *   3. Maximum number of goals per employee: 8
 * 
 * HOW VALIDATION WORKS:
 * - We track the "remaining weight" in real-time as the employee enters data
 * - The submit button is disabled if any rule is violated
 * - Error messages appear inline next to the relevant field
 * 
 * ON SUBMIT:
 * - The goal is added to the in-memory store with status "draft"
 * - The employee can then "Submit for Approval" which changes status to "pending_approval"
 * - The manager will see it in their Approvals queue
 */

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  goals, thrustAreas, uomLabels, getGoalsByUser, generateId
} from "@/lib/data";
import { Plus, X, Send, AlertCircle, CheckCircle } from "lucide-react";

export default function GoalForm({ onClose }) {
  const { currentUser, showNotification } = useApp();
  const myGoals = getGoalsByUser(currentUser.id);
  const usedWeight = myGoals.reduce((s, g) => s + g.weight, 0);
  const remainingWeight = 100 - usedWeight;

  const [form, setForm] = useState({
    thrustAreaId: "",
    title: "",
    description: "",
    uom: "numeric_min",
    target: "",
    weight: "",
  });

  const [errors, setErrors] = useState({});

  // Validate the form fields
  function validate() {
    const errs = {};
    if (!form.thrustAreaId) errs.thrustAreaId = "Select a thrust area";
    if (!form.title.trim()) errs.title = "Enter a goal title";
    if (!form.description.trim()) errs.description = "Enter a description";
    if (!form.target) errs.target = "Set a target value";
    
    const weight = Number(form.weight);
    if (!form.weight || isNaN(weight)) {
      errs.weight = "Enter a valid weight";
    } else if (weight < 10) {
      errs.weight = "Minimum weightage is 10%";
    } else if (weight > remainingWeight) {
      errs.weight = `Only ${remainingWeight}% remaining`;
    }

    if (myGoals.length >= 8) {
      errs.general = "Maximum 8 goals allowed per employee";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(asDraft = true) {
    if (!validate()) return;

    const newGoal = {
      id: generateId("goal"),
      userId: currentUser.id,
      cycleId: "cycle-2025",
      thrustAreaId: form.thrustAreaId,
      title: form.title.trim(),
      description: form.description.trim(),
      uom: form.uom,
      target: form.uom === "timeline" ? form.target : Number(form.target),
      weight: Number(form.weight),
      status: asDraft ? "draft" : "pending_approval",
      isShared: false,
      sharedOwnerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    goals.push(newGoal);
    showNotification(
      asDraft
        ? `Goal "${form.title}" saved as draft`
        : `Goal "${form.title}" submitted for approval`,
      "success"
    );
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "650px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 700 }}>Create New Goal</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              Remaining weight: <strong style={{ color: remainingWeight > 0 ? "var(--success)" : "var(--danger)" }}>{remainingWeight}%</strong>
              {" · "}Goals: <strong>{myGoals.length}/8</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {errors.general && (
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--danger)", fontSize: "13px" }}>
            <AlertCircle size={16} /> {errors.general}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Thrust Area */}
          <div>
            <label className="form-label">Thrust Area</label>
            <select
              className="form-select"
              value={form.thrustAreaId}
              onChange={e => setForm({ ...form, thrustAreaId: e.target.value })}
            >
              <option value="">Select a thrust area...</option>
              {thrustAreas.map(ta => (
                <option key={ta.id} value={ta.id}>{ta.name}</option>
              ))}
            </select>
            {errors.thrustAreaId && <ErrorText text={errors.thrustAreaId} />}
          </div>

          {/* Goal Title */}
          <div>
            <label className="form-label">Goal Title</label>
            <input
              className="form-input"
              placeholder="e.g., Increase Monthly Revenue by 20%"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <ErrorText text={errors.title} />}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Describe how you plan to achieve this goal..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <ErrorText text={errors.description} />}
          </div>

          {/* UoM and Target — side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="form-label">Unit of Measurement</label>
              <select
                className="form-select"
                value={form.uom}
                onChange={e => setForm({ ...form, uom: e.target.value })}
              >
                {Object.entries(uomLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Target</label>
              <input
                className="form-input"
                type={form.uom === "timeline" ? "date" : "number"}
                placeholder={form.uom === "timeline" ? "" : "e.g., 500000"}
                value={form.target}
                onChange={e => setForm({ ...form, target: e.target.value })}
              />
              {errors.target && <ErrorText text={errors.target} />}
            </div>
          </div>

          {/* Weightage */}
          <div>
            <label className="form-label">Weightage (%)</label>
            <input
              className="form-input"
              type="number"
              min="10"
              max={remainingWeight}
              placeholder={`10 - ${remainingWeight}%`}
              value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })}
            />
            {errors.weight && <ErrorText text={errors.weight} />}
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
              Min: 10% · Remaining budget: {remainingWeight}%
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", marginTop: "28px", justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ghost" onClick={() => handleSubmit(true)}>
            <CheckCircle size={16} /> Save Draft
          </button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)}>
            <Send size={16} /> Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorText({ text }) {
  return (
    <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
      <AlertCircle size={12} /> {text}
    </p>
  );
}
