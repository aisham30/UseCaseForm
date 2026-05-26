"use client";

import React from "react";
import { AuthGuard } from "../components/AuthGuard";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { 
  Briefcase, 
  HelpCircle, 
  Settings, 
  ChevronRight, 
  HeartPulse, 
  PlusCircle, 
  Layout, 
  Layers,
  Inbox,
  Workflow
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function EmployeePortalPage() {
  return (
    <AuthGuard allowedRoles={["employee", "admin"]}>
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden">
        {/* Soft Background Accent */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-70" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                <HeartPulse className="h-5.5 w-5.5 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <p className="text-slate-400 uppercase tracking-widest text-[9px] font-extrabold">
                    Glenmark Pharmaceuticals Opportunity Command Center
                  </p>
                </div>
                <h1 className="text-xl font-extrabold mt-0.5 tracking-tight text-slate-900 flex items-center gap-2.5">
                  Employee Dashboard
                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Portal
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3.5 self-end md:self-center">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 transition"
              >
                <PlusCircle className="size-4" />
                Submit Opportunity
              </Link>
              <ProfileDropdown />
            </div>
          </header>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* NAVIGATION SIDEBAR */}
            <aside className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 block">
                  Quick Navigation
                </p>
                <nav className="space-y-1">
                  {[
                    { label: "My Opportunities", icon: Layout, active: true },
                    { label: "Help & Documentation", icon: HelpCircle, active: false },
                    { label: "Global Settings", icon: Settings, active: false },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                        item.active 
                          ? "bg-blue-50 text-blue-800" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="size-4 shrink-0" />
                        {item.label}
                      </span>
                      <ChevronRight className="size-3 text-slate-400" />
                    </button>
                  ))}
                </nav>
              </div>

              {/* STATS PREVIEW */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Personal Analytics
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100">
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 block">Submitted</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">3</span>
                  </div>
                  <div className="bg-emerald-50/30 rounded-2xl p-4.5 border border-emerald-100/50">
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-600/80 block">Approved</span>
                    <span className="text-xl font-extrabold text-emerald-700 mt-1 block">1</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENT AREA */}
            <section className="lg:col-span-3 space-y-6">
              
              {/* WELCOME BANNER CARD */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-sm relative overflow-hidden"
              >
                {/* Brand border bottom highlight */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 to-blue-800" />
                
                <h2 className="text-base font-extrabold text-slate-900">Welcome to your Triage Workspace</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Easily submit and track your automation requests, document search bottlenecks, and workflow friction cases. Our technical Reviewers prioritize triaged submissions.
                </p>
              </motion.div>

              {/* LIST & PLACEHOLDERS CONTAINER */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-sm space-y-5">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
                  Recent Opportunities Submitted
                </h3>

                {/* Simulated list representing Veeva/Salesforce data records */}
                <div className="divide-y divide-slate-100 font-medium text-xs text-slate-700">
                  
                  {/* Item 1 */}
                  <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Regulatory Manifest Matcher</span>
                        <span className="rounded-full bg-blue-50 border border-blue-100 text-[8px] font-bold text-blue-700 px-2 py-0.5">Automation</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Submitted: 3 days ago &bull; Target: QMS Matching</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        Under Review
                      </span>
                      <ChevronRight className="size-4 text-slate-300" />
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between py-4 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Month-End Taxation Ledger Recon</span>
                        <span className="rounded-full bg-blue-50 border border-blue-100 text-[8px] font-bold text-blue-700 px-2 py-0.5">Reporting</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Submitted: 1 week ago &bull; Target: SAP Taxation</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        Approved
                      </span>
                      <ChevronRight className="size-4 text-slate-300" />
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between py-4 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Clin-Trial PDF Retrieval Index</span>
                        <span className="rounded-full bg-blue-50 border border-blue-100 text-[8px] font-bold text-blue-700 px-2 py-0.5">Smart Search</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Submitted: 2 weeks ago &bull; Target: shared folders</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                        New
                      </span>
                      <ChevronRight className="size-4 text-slate-300" />
                    </div>
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
