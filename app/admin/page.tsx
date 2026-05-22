"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, Submission, isSupabaseConfigured } from "../lib/supabase";
import { 
  Inbox, 
  Filter, 
  Flame, 
  Zap, 
  Brain, 
  Cpu, 
  LineChart, 
  Search, 
  Calendar, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Wrench, 
  Layers, 
  RefreshCw, 
  SlidersHorizontal, 
  ArrowUpDown, 
  CheckCircle2, 
  Sparkles,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FREQUENCY_SCORES: Record<string, number> = {
  "Multiple times daily": 5,
  "Daily": 4,
  "Weekly": 3,
  "Monthly": 2,
  "Occasionally": 1
};

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [supportType, setSupportType] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "frequency">("newest");

  // Safe checks for Supabase configuration
  const isConfigured = typeof isSupabaseConfigured !== "undefined" ? isSupabaseConfigured : true;

  async function loadSubmissions() {
    setIsLoading(true);
    if (!isConfigured || !supabase) {
      console.error("Supabase not configured");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setSubmissions(data || []);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSubmissions();
  };

  // Helper to map frequency to sorting score
  const getFrequencyScore = (freq?: string) => {
    if (!freq) return 0;
    return FREQUENCY_SCORES[freq] || 0;
  };

  // 1. Dynamic smart badges logic derived client-side
  const getSmartBadges = (submission: Submission) => {
    const badges = [];
    const freq = submission.frequency || "";
    const support = submission.expected_support || "";
    const work = submission.work_type || "";
    const area = submission.affected_area || "";

    if (freq === "Multiple times daily" || freq === "Daily") {
      badges.push({
        id: "high-frequency",
        label: "High Frequency",
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        icon: Zap
      });
    }

    if (
      support === "AI assistant" || 
      support === "Smart search" ||
      work.includes("Searching through files/data") ||
      work.includes("Decision-making based on data") ||
      work.includes("Reviewing documents manually")
    ) {
      badges.push({
        id: "ai-potential",
        label: "AI Potential",
        bg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        icon: Brain
      });
    }

    if (
      support === "Automation" || 
      support === "Workflow system" ||
      work.includes("Manual repetitive work") ||
      work.includes("Copy-pasting between systems") ||
      work.includes("Tracking approvals/follow-ups")
    ) {
      badges.push({
        id: "automation",
        label: "Automation Opportunity",
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        icon: Cpu
      });
    }

    if (
      support === "Dashboard/reporting" ||
      area === "Reporting" ||
      area === "Data Analysis" ||
      work.includes("Preparing recurring reports")
    ) {
      badges.push({
        id: "dashboard",
        label: "Dashboard Opportunity",
        bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        icon: LineChart
      });
    }

    return badges;
  };

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesDepartment =
        department === "All" ||
        submission.department?.trim().toLowerCase() ===
          department.trim().toLowerCase();

      const matchesSupport =
        supportType === "All" ||
        submission.expected_support?.trim().toLowerCase() ===
          supportType.trim().toLowerCase();

      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchLower === "" ||
        submission.department?.toLowerCase().includes(searchLower) ||
        submission.affected_area?.toLowerCase().includes(searchLower) ||
        submission.work_type?.toLowerCase().includes(searchLower) ||
        submission.friction?.toLowerCase().includes(searchLower) ||
        submission.desired_outcome?.toLowerCase().includes(searchLower) ||
        submission.expected_support?.toLowerCase().includes(searchLower) ||
        submission.systems_involved?.some(sys => sys.toLowerCase().includes(searchLower));

      return matchesDepartment && matchesSupport && matchesSearch;
    });
  }, [submissions, department, supportType, searchQuery]);

  // Sort Submissions
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      if (sortBy === "newest") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === "frequency") {
        const scoreA = getFrequencyScore(a.frequency);
        const scoreB = getFrequencyScore(b.frequency);
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        // Fallback to newest
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [filteredSubmissions, sortBy]);

  // Derived Stats
  const totalSubmissions = submissions.length;
  const visibleSubmissions = filteredSubmissions.length;
  
  const highFrequencySubmissions = useMemo(() => {
    return submissions.filter(
      (s) => s.frequency === "Multiple times daily" || s.frequency === "Daily"
    ).length;
  }, [submissions]);

  // Unique departments for filter list (derived from data dynamically or hardcoded)
  const availableDepartments = ["All", "Sales", "HR", "Finance", "Supply Chain", "Manufacturing", "IT", "Medical", "R&D", "Other"];
  const availableSupportTypes = ["All", "Automation", "AI assistant", "Dashboard/reporting", "Smart search", "Alerts/reminders", "Workflow system", "Unsure"];

  // Date Formatter helpers
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Premium background effects */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.4]" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-semibold">
                Enterprise AI Command Center
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mt-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              AI Opportunity Queue
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-xl">
              Evaluate, prioritize, and catalog incoming team bottleneck submissions for smart interventions.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                <CheckCircle2 className="h-3 w-3" /> Live Supabase
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/15">
                <AlertTriangle className="h-3 w-3" /> Local Mode
              </span>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-2 text-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* METRICS / TOP STATS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          
          {/* Card 1: Total submissions */}
          <div className="group relative bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all duration-300 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-400 font-medium">Total Opportunities</p>
                <h3 className="text-4xl font-semibold mt-2 tracking-tight text-white">
                  {isLoading ? <span className="text-zinc-700">--</span> : totalSubmissions}
                </h3>
                <p className="text-xs text-zinc-500 mt-2">Aggregated system bottlenecks</p>
              </div>
              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-indigo-400">
                <Inbox className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Visible Submissions */}
          <div className="group relative bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all duration-300 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-400 font-medium">Filtered & Visible</p>
                <h3 className="text-4xl font-semibold mt-2 tracking-tight text-white">
                  {isLoading ? <span className="text-zinc-700">--</span> : visibleSubmissions}
                </h3>
                <p className="text-xs text-zinc-500 mt-2">Matching your active selection</p>
              </div>
              <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 text-sky-400">
                <Filter className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Card 3: High Frequency Requests */}
          <div className="group relative bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-all duration-300 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-zinc-400 font-medium">High Frequency Hotspots</p>
                <h3 className={`text-4xl font-semibold mt-2 tracking-tight ${highFrequencySubmissions > 0 ? "text-amber-400" : "text-white"}`}>
                  {isLoading ? <span className="text-zinc-700">--</span> : highFrequencySubmissions}
                </h3>
                <p className="text-xs text-zinc-500 mt-2">Daily or multiple-times-daily tasks</p>
              </div>
              <div className={`p-3 rounded-xl border transition-colors duration-300 ${highFrequencySubmissions > 0 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-zinc-900/50 border-zinc-800 text-zinc-400"}`}>
                <Flame className="h-5 w-5" />
              </div>
            </div>
          </div>

        </section>

        {/* SEARCH AND FILTERS */}
        <section className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            <span>Search & Queue Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="relative">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search outcomes, systems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none transition-all duration-200 cursor-pointer"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Support Type Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">
                Expected Support
              </label>
              <select
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none transition-all duration-200 cursor-pointer"
              >
                {availableSupportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Client-side Sorting */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                <span>Sort Order</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none transition-all duration-200 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="frequency">High Frequency First</option>
              </select>
            </div>

          </div>
        </section>

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-sm font-medium">Fetching incoming AI intake queue...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && sortedSubmissions.length === 0 && (
          <div className="bg-zinc-950/20 border border-zinc-900 rounded-3xl p-16 text-center max-w-lg mx-auto mt-8">
            <Layers className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-zinc-300">No submissions found</h4>
            <p className="text-zinc-500 text-sm mt-2">
              Try adjusting your keyword search, department, or support filters to locate matching entries.
            </p>
          </div>
        )}

        {/* SUBMISSION CARDS LIST */}
        {!isLoading && sortedSubmissions.length > 0 && (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {sortedSubmissions.map((submission) => {
                const smartBadges = getSmartBadges(submission);
                return (
                  <motion.article
                    layout
                    key={submission.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="group relative rounded-3xl border border-zinc-900 bg-zinc-950/45 p-6 hover:border-zinc-800 hover:bg-zinc-900/10 transition-all duration-300 backdrop-blur-md shadow-xl flex flex-col justify-between"
                  >
                    {/* Glowing hover accent */}
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/3 to-zinc-700/3 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div>
                      {/* Top Header Row (Department & Dynamic smart badges) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 group-hover:border-zinc-700/80 transition-colors">
                          {submission.department}
                        </span>

                        {/* Smart Badges Flexbox */}
                        {smartBadges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {smartBadges.map((badge) => {
                              const BadgeIcon = badge.icon;
                              return (
                                <span
                                  key={badge.id}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${badge.bg}`}
                                  title={badge.label}
                                >
                                  <BadgeIcon className="h-3 w-3 shrink-0" />
                                  {badge.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Affected Area Header */}
                      <div className="mb-4">
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-300 transition-all">
                          {submission.affected_area}
                        </h2>
                        
                        {/* Outcome Highlight Box */}
                        <div className="mt-3 bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                            Desired Outcome
                          </p>
                          <p className="text-zinc-200 text-sm font-medium italic leading-relaxed">
                            &ldquo;{submission.desired_outcome}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Detail Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 pt-4 border-t border-zinc-900/60 text-xs">
                        
                        {/* Current Work */}
                        <div className="flex gap-2">
                          <Activity className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-zinc-500 block font-medium">Current Work</span>
                            <span className="text-zinc-300 font-medium">{submission.work_type}</span>
                          </div>
                        </div>

                        {/* Friction Blocker */}
                        <div className="flex gap-2">
                          <AlertTriangle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-zinc-500 block font-medium">Biggest Friction</span>
                            <span className="text-zinc-300 font-medium">{submission.friction}</span>
                          </div>
                        </div>

                        {/* Frequency */}
                        <div className="flex gap-2">
                          <Clock className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-zinc-500 block font-medium">Frequency</span>
                            <span className="text-zinc-300 font-medium">{submission.frequency}</span>
                          </div>
                        </div>

                        {/* Expected Support */}
                        <div className="flex gap-2">
                          <Wrench className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-zinc-500 block font-medium">Expected Support</span>
                            <span className="text-zinc-300 font-medium">{submission.expected_support}</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer Row (Systems Involved & Dates) */}
                    <div className="pt-4 border-t border-zinc-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      
                      {/* Systems Chips */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <Database className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        {submission.systems_involved && submission.systems_involved.length > 0 ? (
                          submission.systems_involved.map((system) => (
                            <span
                              key={system}
                              className="px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 font-medium"
                            >
                              {system}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-[10px]">No connected systems</span>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] ml-auto sm:ml-0">
                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                        <span>{formatDate(submission.created_at)}</span>
                        {submission.created_at && (
                          <>
                            <span>·</span>
                            <span className="text-indigo-400/80 font-medium">
                              {getRelativeTime(submission.created_at)}
                            </span>
                          </>
                        )}
                      </div>

                    </div>

                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}