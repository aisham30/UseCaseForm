"use client";

import { CheckCircle2, Clock, Inbox, XCircle, Zap, FileText, HelpCircle } from "lucide-react";
import { type Submission } from "../../lib/supabase";

type StatusType = Required<Submission>["status"];

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config: Record<
    StatusType,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      style: string;
    }
  > = {
    "New": {
      label: "New",
      icon: Inbox,
      style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]",
    },
    "Under Review": {
      label: "Under Review",
      icon: Clock,
      style: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    },
    "Approved": {
      label: "Approved",
      icon: CheckCircle2,
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
    },
    "Rejected": {
      label: "Rejected",
      icon: XCircle,
      style: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]",
    },
    "Implemented": {
      label: "Implemented",
      icon: Zap,
      style: "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.05)]",
    },
    "Completed": {
      label: "Completed",
      icon: CheckCircle2,
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
    },
    "Draft": {
      label: "Draft",
      icon: FileText,
      style: "bg-slate-500/10 text-slate-400 border-slate-500/20 shadow-[0_0_12px_rgba(148,163,184,0.05)]",
    },
    "Submitted": {
      label: "Submitted",
      icon: Inbox,
      style: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.05)]",
    },
    "Need More Information": {
      label: "Need Info",
      icon: HelpCircle,
      style: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    },
    "In Progress": {
      label: "In Progress",
      icon: Zap,
      style: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.05)]",
    },
  };

  const activeConfig = config[status] || config["New"];
  const Icon = activeConfig.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide backdrop-blur-sm transition-all duration-300 ${activeConfig.style} ${className}`}
    >
      <Icon className="size-3.5 shrink-0" />
      {activeConfig.label}
    </span>
  );
}
