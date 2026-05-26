"use client";

import React, { useState } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { 
  HeartPulse, 
  Layers, 
  FileText, 
  Search, 
  Star, 
  Activity, 
  CheckCircle2, 
  Zap, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Sliders,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewerPortalPage() {
  const [filter, setFilter] = useState("All");

  return (
    <AuthGuard allowedRoles={["reviewer", "admin"]}>
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden">
        {/* Soft Background Accent */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-70" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Activity className="h-5.5 w-5.5 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                  <p className="text-slate-400 uppercase tracking-widest text-[9px] font-extrabold">
                    Glenmark Pharmaceuticals Opportunity Command Center
                  </p>
                </div>
                <h1 className="text-xl font-extrabold mt-0.5 tracking-tight text-slate-900 flex items-center gap-2.5">
                  Triage Triage Portal
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                    Reviewer
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3.5 self-end md:self-center">
              <ProfileDropdown />
            </div>
          </header>

          {/* KPI STATS ROW */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Triaged Queue", count: "14", color: "border-slate-200 text-slate-900 bg-white" },
              { label: "My Peer Reviews", count: "4", color: "border-amber-100 text-amber-700 bg-amber-50/20" },
              { label: "High Urgency Cases", count: "3", color: "border-rose-100 text-rose-700 bg-rose-50/20" },
              { label: "Avg Resolution Time", count: "4.8 Days", color: "border-blue-100 text-blue-700 bg-blue-50/20" }
            ].map((kpi, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4.5 shadow-sm transition hover:shadow-md ${kpi.color}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  {kpi.label}
                </span>
                <span className="text-xl font-extrabold tracking-tight">
                  {kpi.count}
                </span>
              </div>
            ))}
          </section>

          {/* CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* TRIAGE FILTER CONTROLS */}
            <aside className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm self-start space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Sliders className="h-3.5 w-3.5" />
                <span>Review Attributes</span>
              </div>
              
              <div className="space-y-1">
                {[
                  { label: "All Cases", value: "All" },
                  { label: "Pending Peer Review", value: "Pending" },
                  { label: "Assigned To Me", value: "Assigned" },
                  { label: "High Urgency Priority", value: "High" }
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setFilter(btn.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                      filter === btn.value
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span>{btn.label}</span>
                    <ChevronRight className={`size-3 ${filter === btn.value ? "text-white" : "text-slate-400"}`} />
                  </button>
                ))}
              </div>
            </aside>

            {/* DATA VIEW AREA */}
            <section className="lg:col-span-3 space-y-6">
              
              {/* SAP FIORI INSPIRED WORKLIST PLACEHOLDER */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Active Triaging Worklist
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      Verify, validate, and collaborate on opportunity entries submitted by colleagues.
                    </p>
                  </div>
                  
                  <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-100">
                    <TrendingUp className="size-3" /> Fiori Clinical Layout
                  </span>
                </div>

                {/* Empty State Cards or Placeholder Widgets */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-100">
                    <SlidersHorizontal className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      Select Workspace Case
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Select a triaged submission from the side panel or check queue. Peer review assignment is automatically distributed across Reviewer leads.
                    </p>
                  </div>
                </div>
              </div>

            </section>

          </div>

        </div>
      </main>
    </AuthGuard>
  );
}
