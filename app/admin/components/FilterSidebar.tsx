"use client";

import React from "react";
import { Filter, RotateCcw, Calendar, CheckSquare, Layers, Clock, Activity, SortAsc, SortDesc } from "lucide-react";
import { motion } from "framer-motion";
import { type AdminSubmission } from "../../lib/supabase";

interface FilterSidebarProps {
  // Selected filter values
  selectedDepartment: string;
  selectedFrequency: string;
  selectedSupportType: string;
  selectedStatus: string;
  sortBy: "date_desc" | "date_asc" | "impact_desc";
  
  // Handlers
  setSelectedDepartment: (value: string) => void;
  setSelectedFrequency: (value: string) => void;
  setSelectedSupportType: (value: string) => void;
  setSelectedStatus: (value: string) => void;
  setSortBy: (value: "date_desc" | "date_asc" | "impact_desc") => void;
  onReset: () => void;

  // Active dataset to calculate counts dynamically
  submissions: AdminSubmission[];
}

export default function FilterSidebar({
  selectedDepartment,
  selectedFrequency,
  selectedSupportType,
  selectedStatus,
  sortBy,
  setSelectedDepartment,
  setSelectedFrequency,
  setSelectedSupportType,
  setSelectedStatus,
  setSortBy,
  onReset,
  submissions = [],
}: FilterSidebarProps) {

  // Pre-defined options based on questions.ts
  const departments = ["All", "Sales", "HR", "Finance", "Supply Chain", "Manufacturing", "IT", "Medical", "R&D", "Other"];
  const frequencies = ["All", "Multiple times daily", "Daily", "Weekly", "Monthly", "Occasionally"];
  const supportTypes = ["All", "Automation", "AI assistant", "Dashboard/reporting", "Smart search", "Alerts/reminders", "Workflow system", "Unsure"];
  const statuses = ["All", "New", "Under Review", "Approved", "Rejected", "Implemented"];

  // Helper to compute counts for each option dynamically
  const getCount = (field: keyof AdminSubmission, value: string) => {
    if (value === "All") return submissions.length;
    return submissions.filter((item) => {
      const dbVal = item[field];
      if (Array.isArray(dbVal)) {
        return (dbVal as any[]).includes(value);
      }
      return String(dbVal || "").toLowerCase() === value.toLowerCase();
    }).length;
  };

  // Helper to check if any filters are active
  const hasActiveFilters =
    selectedDepartment !== "All" ||
    selectedFrequency !== "All" ||
    selectedSupportType !== "All" ||
    selectedStatus !== "All" ||
    sortBy !== "date_desc";

  return (
    <div className="w-full space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-indigo-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
            Filters
          </h2>
        </div>

        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs text-indigo-400 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="size-3" />
            Reset
          </motion.button>
        )}
      </div>

      {/* Sorting Control */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Activity className="size-3.5 text-zinc-600" />
          Sort Submissions
        </label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded-xl border border-white/5 bg-zinc-900/30 px-3.5 py-2.5 text-xs text-zinc-200 outline-none backdrop-blur-md transition focus:border-white/10"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="impact_desc">Highest Impact</option>
          </select>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <CheckSquare className="size-3.5 text-zinc-600" />
          Work Flow Status
        </label>
        <div className="space-y-1">
          {statuses.map((status) => {
            const count = getCount("status", status);
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/15"
                    : "text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>{status}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-900/60 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Department Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Layers className="size-3.5 text-zinc-600" />
          Department
        </label>
        <div className="space-y-1">
          {departments.map((dept) => {
            const count = getCount("department", dept);
            const isSelected = selectedDepartment === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/15"
                    : "text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>{dept}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-900/60 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Support Type Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Clock className="size-3.5 text-zinc-600" />
          Expected Support
        </label>
        <div className="space-y-1">
          {supportTypes.map((type) => {
            const count = getCount("expected_support", type);
            const isSelected = selectedSupportType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedSupportType(type)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/15"
                    : "text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>{type}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-900/60 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frequency Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Calendar className="size-3.5 text-zinc-600" />
          Frequency
        </label>
        <div className="space-y-1">
          {frequencies.map((freq) => {
            const count = getCount("frequency", freq);
            const isSelected = selectedFrequency === freq;
            return (
              <button
                key={freq}
                onClick={() => setSelectedFrequency(freq)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                  isSelected
                    ? "bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/15"
                    : "text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>{freq}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-900/60 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
