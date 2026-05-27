"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeartPulse, ArrowRight, ShieldCheck, Database, Lock, Search } from "lucide-react";
import { useAuth } from "./lib/auth";

export default function Home() {
  const { user, role, loading } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Background aesthetics */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-80" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(241,245,249,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(241,245,249,0.5)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      {/* Header */}
      <header className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm border border-blue-950/20">
            <HeartPulse className="h-5.5 w-5.5 stroke-[2.2]" />
          </span>
          <div>
            <p className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              FormAI
              <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
                Glenmark
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <Link
              href={role === "admin" ? "/admin" : role === "reviewer" ? "/review" : "/portal"}
              className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-xs font-bold text-blue-800 shadow-sm transition hover:bg-blue-50 hover:border-blue-300"
            >
              Open Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Employee Login
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[10px] font-extrabold text-blue-700 shadow-sm uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            GxP Secure AI & Automation Workspace
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl mb-6">
            Intelligent Process Triage for Pharma Operations
          </h1>
          <p className="text-base text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            Submit, evaluate, and prioritize workflow optimizations across Glenmark's global enterprise. Securely authenticated, fully auditable, and seamlessly integrated.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/portal/new-request" : "/login?next=/portal/new-request"}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-800 px-8 py-4 text-xs font-bold text-white shadow-md shadow-blue-800/10 hover:bg-blue-900 transition"
            >
              Start New Opportunity Request
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-6 mt-24 text-left max-w-4xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Role-Based Security</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Enterprise-grade Row Level Security ensures employees only access their own data, while reviewers and admins maintain global oversight.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mb-4">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">GxP Audit Logging</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Every creation, modification, and deletion is cryptographically tracked in immutable version history logs for strict regulatory compliance.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Centralized Triage</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Reviewers and admins evaluate operational bottlenecks through dynamic dashboards with robust filtering, search, and KPI calculations.
            </p>
          </div>
        </motion.div>
      </div>

    </main>
  );
}
