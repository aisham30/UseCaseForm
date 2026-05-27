"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { supabase, isSupabaseConfigured, type Submission, type AdminNote, normalizeAdminNotes, formatRequestNumber } from "../lib/supabase";
import StatusBadge from "../admin/components/StatusBadge";
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
  AlertTriangle,
  RefreshCw,
  Clock,
  User,
  ArrowUpDown,
  X,
  FileJson,
  Trash2,
  Send,
  Plus,
  Tag,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, getFullName } from "../lib/auth";

const AVAILABLE_TAGS = ["AI", "Automation", "Dashboard", "Process Issue", "Compliance", "Needs Discussion"];
const AVAILABLE_OWNERS = ["Unassigned", "AI Solutions Team", "Automation Team", "Analytics Support", "IT Operations", "Business Systems"];

export default function ReviewerPortalPage() {
  const { user, profile } = useAuth();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All"); // All, Pending, NeedsInfo, Completed, InProgress
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sorting
  const [sortAscending, setSortAscending] = useState(false);

  // GxP Audit Logs States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);

  // Retrieve Supabase config mode safely
  const isConfigured = isSupabaseConfigured;

  async function loadSubmissions(silent = false) {
    if (!silent) setIsLoading(true);
    setErrorMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage("Supabase is not configured. Reviewer dashboard requires live database access.");
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("DB Triage error:", error);
        setErrorMessage(`Database failed to load: ${error.message}`);
        if (!silent) setSubmissions([]);
      } else {
        setSubmissions((data as Submission[]) || []);
      }
    } catch (err: any) {
      console.error("Exception loading submissions for review:", err);
      setErrorMessage(err.message || "An unexpected error occurred while connecting to database.");
      if (!silent) setSubmissions([]);
    } finally {
      if (!silent) setIsLoading(false);
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

  // Reactively load GxP audit logs when a submission is selected
  useEffect(() => {
    if (selectedSubmission && selectedSubmission.id) {
      loadAuditLogs(selectedSubmission.id);
    } else {
      setAuditLogs([]);
    }
  }, [selectedSubmission]);

  async function loadAuditLogs(submissionId: string | number) {
    setIsLoadingAuditLogs(true);
    if (!isSupabaseConfigured || !supabase) {
      setAuditLogs([]);
      setIsLoadingAuditLogs(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("audit_history")
        .select("*")
        .eq("submission_id", submissionId)
        .order("timestamp", { ascending: true });

      if (!error && data) {
        setAuditLogs(data);
      } else {
        console.warn("Could not retrieve audit history:", error?.message);
        setAuditLogs([]);
      }
    } catch (e) {
      console.error("Exception loading audit history trail:", e);
      setAuditLogs([]);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }

  // Update submission triage fields (with GxP audit logging!)
  const updateSubmissionField = async (
    id: string | number, 
    field: keyof Submission, 
    value: any
  ) => {
    if (!id || !isSupabaseConfigured || !supabase) return;
    setIsUpdatingStatus(true);

    // Fetch the old value to record exact changes in audit log
    let oldValue = "";
    if (selectedSubmission) {
      let oldValRaw = selectedSubmission[field];
      if (field === "assigned_owner") {
        oldValRaw = selectedSubmission.assigned_owner || selectedSubmission.assigned_to || "Unassigned";
      }
      oldValue = Array.isArray(oldValRaw) ? oldValRaw.join(", ") : String(oldValRaw || "");
    }

    const oldValueStr = oldValue;
    const newValueStr = Array.isArray(value) ? value.join(", ") : String(value || "");

    // Keep frontend field 'assigned_owner' mapped to PostgreSQL column 'assigned_to'
    let dbField = field as string;
    if (dbField === "assigned_owner") {
      dbField = "assigned_to";
    }

    const updatePayload = {
      [dbField]: value,
      updated_at: new Date().toISOString()
    };

    try {
      const eqId = typeof id === "number" ? id : (isNaN(Number(id)) ? id : Number(id));
      console.log(`[DIAGNOSTIC] Review update - ID: ${eqId}, Payload:`, updatePayload);

      const { data: dbRecords, error } = await supabase
        .from("submissions")
        .update(updatePayload)
        .eq("id", eqId)
        .select();

      const affectedRows = dbRecords ? dbRecords.length : 0;
      let dbRecord = null;
      let updateError = error;

      if (!updateError && affectedRows === 0) {
        console.warn("⚠️ Warning: UPDATE in Review Portal returned 0 rows. Checking diagnostics...");
        const { data: existCheck } = await supabase
          .from("submissions")
          .select("id")
          .eq("id", eqId);
        const recordExists = existCheck && existCheck.length > 0;

        updateError = {
          message: recordExists 
            ? "Database update returned 0 rows. This action was blocked by RLS policies." 
            : `Record with ID ${eqId} does not exist in the database.`,
          code: "PGRST116_REVIEW_UPDATE_ZERO_ROWS",
          details: `User ${user?.id} attempted to update submission ${eqId}. Record exists in DB: ${recordExists}`,
          hint: "Ensure the record exists and that your RLS update/select policies permit reviewers to write/read."
        } as any;
      } else if (dbRecords && dbRecords.length > 0) {
        dbRecord = dbRecords[0];
      }

      if (updateError) {
        console.error("[DIAGNOSTIC] Review Field update failed:", updateError);
        alert(`Unable to save triage changes: ${updateError.message}`);
      } else {
        console.log("[DIAGNOSTIC] Review update success. DB Response:", dbRecord);
        
        const updatedRecord = {
          ...selectedSubmission,
          [field]: value,
          assigned_owner: dbRecord?.assigned_to || dbRecord?.assigned_owner || value,
          assigned_to: dbRecord?.assigned_to || value,
          ...(dbRecord || {})
        } as Submission;

        // 1. Update selected state immediately
        setSelectedSubmission(updatedRecord);

        // 2. Replace inside master submissions list
        setSubmissions(prev => prev.map(sub => String(sub.id) === String(id) ? updatedRecord : sub));

        // 3. Trigger silent refresh
        loadSubmissions(true);

        // 4. Record GxP Audit Log Entry
        if (oldValueStr !== newValueStr) {
          const displayName = profile?.full_name || (user ? getFullName(user) : "Triage Lead Reviewer");
          const auditEntry = {
            submission_id: id,
            editor_user_id: user?.id || null,
            editor_name: displayName,
            field_changed: field,
            old_value: oldValueStr,
            new_value: newValueStr,
            timestamp: new Date().toISOString()
          };

          const { error: auditError } = await supabase
            .from("audit_history")
            .insert([auditEntry]);

          if (auditError) {
            console.warn("Could not insert audit history record:", auditError.message);
          } else {
            console.log("Recorded version history log for:", field);
            loadAuditLogs(id);
          }
        }
      }
    } catch (e) {
      console.error("Exception updating submission field (Review):", e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = (statusValue: Required<Submission>["status"]) => {
    if (!selectedSubmission) return;
    updateSubmissionField(selectedSubmission.id!, "status", statusValue);
  };

  // Safe helper to extract and display urgency parsed from desired_outcome answers state
  const getUrgency = (sub: Submission): string => {
    try {
      if (sub.desired_outcome) {
        const parsed = JSON.parse(sub.desired_outcome);
        if (parsed.urgency) return parsed.urgency;
      }
    } catch (e) {}
    return "Medium"; // default
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "critical":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  // Compute live triage KPIs directly from database submissions list
  const kpis = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === "Submitted" || s.status === "New" || !s.status).length;
    const inProgress = submissions.filter(s => s.status === "Under Review" || s.status === "In Progress" || s.status === "Need More Information").length;
    const completed = submissions.filter(s => s.status === "Completed" || s.status === "Approved" || s.status === "Implemented").length;

    return { total, pending, inProgress, completed };
  }, [submissions]);

  // Filter & Search submissions list dynamically
  const filteredSubmissions = useMemo(() => {
    let list = [...submissions];

    // 1. Sidebar filter routing
    if (selectedFilter === "Pending") {
      list = list.filter(s => s.status === "Submitted" || s.status === "New" || !s.status);
    } else if (selectedFilter === "NeedsInfo") {
      list = list.filter(s => s.status === "Need More Information");
    } else if (selectedFilter === "Completed") {
      list = list.filter(s => s.status === "Completed" || s.status === "Approved" || s.status === "Implemented");
    } else if (selectedFilter === "InProgress") {
      list = list.filter(s => s.status === "Under Review" || s.status === "In Progress");
    }

    // 2. Real-time Search input filter
    const search = searchQuery.toLowerCase().trim();
    if (search !== "") {
      list = list.filter(sub => {
        const idStr = String(sub.id).toLowerCase();
        const empName = (sub.employee_name || "").toLowerCase();
        const dept = (sub.department || "").toLowerCase();
        const friction = (sub.friction || "").toLowerCase();
        const area = (sub.affected_area || "").toLowerCase();
        
        return idStr.includes(search) || 
               empName.includes(search) || 
               dept.includes(search) || 
               friction.includes(search) || 
               area.includes(search) ||
               formatRequestNumber(sub.id).toLowerCase().includes(search);
      });
    }

    // 3. Sorting by created date
    list.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortAscending ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [submissions, selectedFilter, searchQuery, sortAscending]);

  return (
    <AuthGuard allowedRoles={["reviewer", "admin"]}>
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden pb-40">
        {/* Soft Background Accent */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-70" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/10">
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
                  Triage Reviewer Console
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                    Staging Queue
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3.5 self-end md:self-center">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </button>
              <ProfileDropdown />
            </div>
          </header>

          {/* KPI STATS ROW */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Intake Opportunities", count: kpis.total, color: "border-slate-200 text-slate-900 bg-white" },
              { label: "Pending Triaging", count: kpis.pending, color: "border-amber-100 text-amber-700 bg-amber-50/20" },
              { label: "In Active Review", count: kpis.inProgress, color: "border-blue-100 text-blue-700 bg-blue-50/20" },
              { label: "Completed Triage", count: kpis.completed, color: "border-emerald-100 text-emerald-700 bg-emerald-50/20" }
            ].map((kpi, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4.5 shadow-sm transition hover:shadow-md ${kpi.color}`}
              >
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  {kpi.label}
                </span>
                <span className="text-xl font-extrabold tracking-tight">
                  {isLoading ? "..." : kpi.count}
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
                  { label: "All Submissions", value: "All" },
                  { label: "Pending Action", value: "Pending" },
                  { label: "In Active Review", value: "InProgress" },
                  { label: "Need More Info", value: "NeedsInfo" },
                  { label: "Completed Cases", value: "Completed" }
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setSelectedFilter(btn.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                      selectedFilter === btn.value
                        ? "bg-amber-500 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span>{btn.label}</span>
                    <ChevronRight className={`size-3 ${selectedFilter === btn.value ? "text-white" : "text-slate-400"}`} />
                  </button>
                ))}
              </div>
            </aside>

            {/* DATA VIEW AREA */}
            <section className="lg:col-span-3 space-y-6">
              
              {/* SEARCH & SORT PANEL */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, Employee, Department, or Pain Point..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-500 shadow-sm"
                  />
                </div>
                
                <button
                  onClick={() => setSortAscending(prev => !prev)}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                >
                  <ArrowUpDown className="size-3.5" />
                  Sort: {sortAscending ? "Oldest First" : "Newest First"}
                </button>
              </div>

              {/* DATA VIEW BOARD */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[400px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      Active Triage Queues
                      <span className="text-[10px] font-medium text-slate-400">
                        ({filteredSubmissions.length} records found)
                      </span>
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      Verify, validate, and collaborate on opportunity entries submitted by colleagues.
                    </p>
                  </div>
                  
                  <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-100">
                    <TrendingUp className="size-3" /> Triage Queue
                  </span>
                </div>

                {errorMessage && (
                  <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 flex items-center gap-2 shadow-sm">
                    <AlertTriangle className="size-4 text-rose-600" />
                    {errorMessage}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex h-60 w-full flex-col items-center justify-center gap-2.5">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                      Retrieving Staging Records...
                    </p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl py-16 px-4 text-center max-w-md mx-auto space-y-4 my-8">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-200 shadow-sm">
                      <SlidersHorizontal className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        No Submissions Registered
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        No submission records match your currently selected queue filter parameters or query string.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <th className="pb-3.5 font-bold">ID</th>
                          <th className="pb-3.5 font-bold">Employee</th>
                          <th className="pb-3.5 font-bold">Pain Point / Friction</th>
                          <th className="pb-3.5 font-bold">Department</th>
                          <th className="pb-3.5 font-bold">Urgency</th>
                          <th className="pb-3.5 font-bold">Status</th>
                          <th className="pb-3.5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((sub) => {
                          const urgencyVal = getUrgency(sub);
                          
                          return (
                            <tr 
                              key={sub.id}
                              onClick={() => setSelectedSubmission(sub)}
                              className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer group transition duration-150"
                            >
                              <td className="py-4 font-mono font-bold text-slate-500">
                                {formatRequestNumber(sub.id)}
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">
                                    <User className="size-3" />
                                  </span>
                                  <span className="font-bold text-slate-800 truncate max-w-[120px]">
                                    {sub.employee_name || "Unassigned"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 max-w-[200px] truncate pr-4">
                                <span className="font-bold text-slate-700 leading-normal block">
                                  {sub.friction || "No description provided"}
                                </span>
                              </td>
                              <td className="py-4 font-semibold text-slate-500">
                                {sub.department || "General"}
                              </td>
                              <td className="py-4">
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getUrgencyStyle(urgencyVal)}`}>
                                  {urgencyVal}
                                </span>
                              </td>
                              <td className="py-4">
                                <StatusBadge status={sub.status as any} />
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubmission(sub);
                                  }}
                                  className="inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm transition group-hover:border-amber-400 group-hover:text-amber-700 group-hover:bg-amber-50/10 cursor-pointer"
                                >
                                  Review Request
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </section>
            
          </div>

        </div>

        {/* SLIDE-OUT TRIAGE REVIEW DRAWER */}
        <AnimatePresence>
          {selectedSubmission && (
            <>
              {/* Overlay backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSubmission(null)}
                className="fixed inset-0 z-40 bg-slate-950 backdrop-blur-xs"
              />
              
              {/* Drawer Container */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto flex flex-col font-sans text-slate-800"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Triage Opportunity Verification
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                      Triage Verification Panel
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {formatRequestNumber(selectedSubmission.id)}
                      </span>
                    </h2>
                  </div>
                  
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer"
                  >
                    <X className="size-4 text-slate-500" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-1 overscroll-contain">
                  
                  {/* TRIAGING ACTIONS WORKSPACE (Phase 4) */}
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/15 p-5 shadow-sm space-y-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 border-b border-amber-200/50 pb-2">
                      <Zap className="size-3.5 shrink-0 text-amber-600" />
                      Live Triaging Workflow
                    </h3>
                    
                    {/* Status Triage Buttons */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Triage Phase Status
                      </label>
                      
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Under Review", value: "Under Review" },
                          { label: "Approved", value: "Approved" },
                          { label: "Rejected", value: "Rejected" },
                          { label: "Need Info", value: "Need More Information" },
                          { label: "In Progress", value: "In Progress" },
                          { label: "Completed", value: "Completed" }
                        ].map((badge) => (
                          <button
                            key={badge.value}
                            disabled={isUpdatingStatus}
                            onClick={() => handleUpdateStatus(badge.value as any)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition shadow-sm cursor-pointer ${
                              selectedSubmission.status === badge.value
                                ? "bg-amber-500 border-amber-500 text-white shadow-amber-500/10"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                          >
                            {badge.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Technical Assignment Select */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Assigned Technical Owner
                      </label>
                      <select
                        value={selectedSubmission.assigned_owner || selectedSubmission.assigned_to || "Unassigned"}
                        disabled={isUpdatingStatus}
                        onChange={(e) => updateSubmissionField(selectedSubmission.id!, "assigned_owner", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm focus:border-amber-500"
                      >
                        {AVAILABLE_OWNERS.map((own) => (
                          <option key={own} value={own}>{own}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Collaborative review comments (Phase 4) */}
                  <div className="border-t border-slate-100 pt-5">
                    <NotesSection
                      notes={normalizeAdminNotes(selectedSubmission.admin_notes)}
                      onAddNote={(content) => {
                        const newNoteObj: AdminNote = {
                          id: "note-" + Date.now(),
                          author: profile?.full_name || (user ? getFullName(user) : "Triage Lead Reviewer"),
                          content,
                          created_at: new Date().toISOString()
                        };
                        const nextNotes = [...normalizeAdminNotes(selectedSubmission.admin_notes), newNoteObj];
                        updateSubmissionField(selectedSubmission.id!, "admin_notes", nextNotes);
                      }}
                      onDeleteNote={(noteId) => {
                        const nextNotes = normalizeAdminNotes(selectedSubmission.admin_notes).filter(n => n.id !== noteId);
                        updateSubmissionField(selectedSubmission.id!, "admin_notes", nextNotes);
                      }}
                    />
                  </div>

                  {/* SUBMISSION SPECS */}
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <FileText className="size-3.5 text-slate-400" />
                      Opportunity Specifications
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Employee Name
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {selectedSubmission.employee_name || "Not Specified"}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Department
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {selectedSubmission.department || "Not Specified"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Affected Workspace Areas
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        {selectedSubmission.affected_area || "Not Specified"}
                      </p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Observed Friction / Bottleneck Description
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        {selectedSubmission.friction || "No description provided"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Frequency
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {selectedSubmission.frequency || "Not Specified"}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Urgency Priority
                        </span>
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mt-0.5 ${getUrgencyStyle(getUrgency(selectedSubmission))}`}>
                          {getUrgency(selectedSubmission)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 space-y-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Expected Automation Support
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                        {selectedSubmission.expected_support || "Not Specified"}
                      </p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 space-y-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Systems Involved
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSubmission.systems_involved && selectedSubmission.systems_involved.length > 0 ? (
                          selectedSubmission.systems_involved.map((sys, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm"
                            >
                              {sys}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Version History GxP chronological timeline (Phase 5) */}
                  <div className="border-t border-slate-100 pt-5 space-y-3.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <History className="size-3.5 text-slate-400" />
                      Chronological Request Timeline
                    </h3>

                    <div className="relative border-l border-slate-200 pl-4.5 ml-2.5 space-y-4 text-xs font-semibold text-slate-600">
                      
                      {/* Log 1: Created */}
                      <div className="relative animate-fadeIn">
                        <span className="absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-100 border border-blue-200" />
                        <p className="text-slate-800 font-bold">Request Created</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{new Date(selectedSubmission.created_at || "").toLocaleString()}</span>
                      </div>

                      {/* Dynamic Audit logs from database */}
                      {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                          <div key={log.id} className="relative animate-fadeIn">
                            <span className="absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-100 border border-amber-200" />
                            <p className="text-slate-800 font-bold">
                              {log.editor_name || "Reviewer"} ({log.field_changed === "status" ? "Status Triaged" : "Triage Updated"})
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                              Modified <span className="font-bold text-slate-700 capitalize">{log.field_changed.replace(/_/g, " ")}</span>:{" "}
                              <span className="text-slate-400 line-through">{log.old_value || "None"}</span> &rarr;{" "}
                              <span className="text-blue-700 font-bold">{log.new_value || "None"}</span>
                            </p>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : isLoadingAuditLogs ? (
                        <div className="text-[10px] text-slate-400 font-medium py-2">
                          Loading version control history...
                        </div>
                      ) : null}

                    </div>
                  </div>

                  {/* AUDIT METADATA TIMESTAMPS */}
                  <div className="space-y-3.5 border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Clock className="size-3.5 text-slate-400" />
                      GxP Audit Information
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-slate-500 leading-relaxed pb-4">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Opportunity Created
                        </span>
                        {selectedSubmission.created_at ? new Date(selectedSubmission.created_at).toLocaleString() : "Not logged"}
                      </div>
                      <div>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Last Updated
                        </span>
                        {selectedSubmission.updated_at ? new Date(selectedSubmission.updated_at).toLocaleString() : "Not logged"}
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </AuthGuard>
  );
}

// Inlined NotesSection for self-contained comments triaging support in Reviewer Dashboard
function NotesSection({
  notes: rawNotes = [],
  onAddNote,
  onDeleteNote
}: {
  notes: any;
  onAddNote: (content: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  const notes = normalizeAdminNotes(rawNotes);
  const [text, setText] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddNote(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 px-4 py-3 bg-slate-100/30">
        <Activity className="size-4 text-blue-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Collaborative Triage Notes ({notes.length})
        </span>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-3 max-h-[220px] overflow-y-auto overscroll-contain">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            No administrative notes captured yet.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-1 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <div className="flex size-4.5 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    <User className="size-2.5" />
                  </div>
                  <span>{note.author}</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <span>
                    {new Date(note.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed break-words pl-1 text-[11px] font-medium">
                {note.content}
              </p>
            </div>
          ))
        )}
        <div ref={feedRef} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200/60 p-3 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a collaborative notes log..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white shadow-inner"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition cursor-pointer"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
