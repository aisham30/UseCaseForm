"use client";

import { Flame, Cpu, LayoutDashboard, SearchCode, Sparkles } from "lucide-react";
import { type AdminSubmission } from "../../lib/supabase";

interface PriorityBadgeProps {
  submission: AdminSubmission;
  className?: string;
}

export type BadgeInfo = {
  label: string;
  icon: React.ComponentType<any>;
  style: string;
  id: string;
};

export function getAutoBadges(submission: AdminSubmission): BadgeInfo[] {
  const badges: BadgeInfo[] = [];

  const freq = (submission.frequency || "").toLowerCase();
  const people = (submission.people_impacted || "").toLowerCase();
  const work = (submission.work_type || "").toLowerCase();
  const friction = (submission.friction || "").toLowerCase();
  const support = (submission.expected_support || "").toLowerCase();
  const area = (submission.affected_area || "").toLowerCase();

  // 1. High Frequency + Multiple Teams → High Priority
  const isHighFrequency = freq.includes("daily") || freq.includes("multiple times daily");
  const isBroadImpact = people.includes("multiple teams") || people.includes("entire department");
  if (isHighFrequency && isBroadImpact) {
    badges.push({
      id: "high_priority",
      label: "High Priority",
      icon: Flame,
      style: "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.08)]",
    });
  }

  // 2. Repetitive Manual Work → Automation Opportunity
  const isRepetitiveWork = 
    work.includes("manual repetitive") || 
    work.includes("copy-pasting") || 
    friction.includes("manual effort") ||
    support.includes("automation");
  if (isRepetitiveWork) {
    badges.push({
      id: "automation_opp",
      label: "Automation Opportunity",
      icon: Cpu,
      style: "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.08)]",
    });
  }

  // 3. Reporting/Data Analysis → Dashboard Opportunity
  const isReportingAnalysis = 
    area.includes("reporting") || 
    area.includes("data analysis") || 
    work.includes("preparing recurring reports") ||
    support.includes("dashboard");
  if (isReportingAnalysis) {
    badges.push({
      id: "dashboard_opp",
      label: "Dashboard Opportunity",
      icon: LayoutDashboard,
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.08)]",
    });
  }

  // 4. Searching Files/Documents → AI Search Potential
  const isAiSearch = 
    work.includes("searching through files") || 
    work.includes("reviewing documents") || 
    friction.includes("too many documents") || 
    support.includes("smart search") ||
    support.includes("ai assistant");
  if (isAiSearch) {
    badges.push({
      id: "ai_search",
      label: "AI Search Potential",
      icon: SearchCode,
      style: "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.08)]",
    });
  }

  // Fallback: Needs Review
  if (badges.length === 0) {
    badges.push({
      id: "needs_review",
      label: "Intake Review",
      icon: Sparkles,
      style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    });
  }

  return badges;
}

export default function PriorityBadge({ submission, className = "" }: PriorityBadgeProps) {
  const badges = getAutoBadges(submission);

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <span
            key={badge.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-sm transition-all duration-300 ${badge.style}`}
          >
            <Icon className="size-3 shrink-0" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
