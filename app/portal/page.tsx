"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "../components/AuthGuard";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { useAuth, getFullName } from "../lib/auth";
import { supabase, isSupabaseConfigured, type Submission } from "../lib/supabase";
import { 
  HeartPulse, 
  PlusCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Edit2,
  Calendar,
  X,
  History,
  FileText,
  User,
  Settings,
  ShieldCheck,
  Building,
  RefreshCw,
  FolderOpen,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { mockSubmissions } from "../data/mockSubmissions";

type RequestStatus = 
  | "Draft" 
  | "Submitted" 
  | "Under Review" 
  | "Need More Information" 
  | "Approved" 
  | "Rejected" 
  | "In Progress" 
  | "Completed";

export default function EmployeePortalPage() {
  const { user, role, profile } = useAuth();
  const [requests, setRequests] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedRequest, setSelectedRequest] = useState<Submission | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editPainPoint, setEditPainPoint] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSupport, setEditSupport] = useState("");
  const [editFriction, setEditFriction] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isConfigured = typeof isSupabaseConfigured !== "undefined" ? isSupabaseConfigured : true;

  // Retrieve name and info safely
  const employeeName = profile?.full_name || (user ? getFullName(user) : "Glenmark Colleague");
  const employeeEmail = profile?.email || user?.email || "";
  const employeeDept = profile?.department || "Operations";

  async function loadMyRequests() {
    if (!user) return;
    setIsLoading(true);

    if (!isConfigured || !supabase) {
      // Local Mode: Filter mock requests belonging to this user
      // Map mock submissions to match the employee's name for realistic data matching
      const userSubmissions = mockSubmissions.map((sub, idx) => {
        // Assign first two mock requests directly to the logged-in mock user for realistic demoing
        if (idx === 0 || idx === 3) {
          return {
            ...sub,
            user_id: user.id,
            employee_name: employeeName,
            department: employeeDept,
            status: sub.status === "New" ? "Submitted" : sub.status,
            updated_at: sub.created_at // initial
          } as unknown as Submission;
        }
        return {
          ...sub,
          status: sub.status === "New" ? "Submitted" : sub.status,
          updated_at: sub.created_at
        } as unknown as Submission;
      }).filter(sub => sub.user_id === user.id);

      setRequests(userSubmissions);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        setRequests([]);
      } else {
        // Map status compatibilities (e.g. New -> Submitted)
        const mapped = (data || []).map(sub => ({
          ...sub,
          status: sub.status === "New" ? "Submitted" : sub.status,
          updated_at: sub.updated_at || sub.created_at
        }));
        setRequests(mapped as Submission[]);
      }
    } catch (e) {
      console.error("Exception loading submissions:", e);
      setRequests([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadMyRequests();
    }
  }, [user, employeeName, employeeDept]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMyRequests();
  };

  // Open Details Drawer & Initialize Editing states
  const handleOpenDetails = (req: Submission) => {
    setSelectedRequest(req);
    setIsEditing(false);
    
    // De-serialize or read fields
    let painPoint = req.friction || "";
    let support = req.expected_support || "";
    try {
      const parsed = JSON.parse(req.desired_outcome || "");
      painPoint = parsed.desired_outcome_short || painPoint;
      support = parsed.expected_support || support;
    } catch (e) {}

    setEditPainPoint(painPoint);
    setEditDepartment(req.department || "");
    setEditSupport(support);
    setEditFriction(req.friction || "");
  };

  // Save Edits directly
  const handleSaveEdit = async () => {
    if (!selectedRequest || !user) return;
    setIsSavingEdit(true);

    const now = new Date().toISOString();
    const updatedFriction = editFriction;
    
    // Parse desired outcome to preserve other 15 answers state and only update edited fields
    let updatedDesiredOutcome = selectedRequest.desired_outcome || "";
    try {
      const parsed = JSON.parse(selectedRequest.desired_outcome || "");
      parsed.desired_outcome_short = editPainPoint;
      parsed.department = editDepartment;
      parsed.expected_support = editSupport;
      parsed.pain_point_desc = editFriction;
      updatedDesiredOutcome = JSON.stringify(parsed);
    } catch (e) {}

    const updatedFields = {
      department: editDepartment,
      friction: updatedFriction,
      expected_support: editSupport,
      desired_outcome: updatedDesiredOutcome,
      updated_at: now,
      employee_name: employeeName // ensure name remains locked
    };

    if (!isConfigured || !supabase) {
      // Local Mode update
      const updatedList = requests.map(req => {
        if (req.id === selectedRequest.id) {
          const updated = {
            ...req,
            ...updatedFields,
            // Flag history update
            status: req.status === "Need More Information" ? "Submitted" : req.status
          };
          // Sync details panel
          setSelectedRequest(updated);
          return updated;
        }
        return req;
      });
      setRequests(updatedList);
      setIsSavingEdit(false);
      setIsEditing(false);
      return;
    }

    try {
      // If the request was in "Need More Information", we set it back to "Submitted" on edit
      const nextStatus = selectedRequest.status === "Need More Information" ? "Submitted" : selectedRequest.status;
      
      const { error } = await supabase
        .from("submissions")
        .update({
          ...updatedFields,
          status: nextStatus
        })
        .eq("id", selectedRequest.id);

      if (error) {
        console.error("Failed to update database record:", error);
        alert("Unable to save edits. Please try again.");
      } else {
        // Success
        const updatedRecord = {
          ...selectedRequest,
          ...updatedFields,
          status: nextStatus
        };
        setSelectedRequest(updatedRecord);
        setIsEditing(false);
        loadMyRequests();
      }
    } catch (e) {
      console.error("Exception during record update:", e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // KPIs Calculations
  const kpis = useMemo(() => {
    const total = requests.length;
    const inProgress = requests.filter(r => 
      r.status === "In Progress" || 
      r.status === "Under Review" ||
      r.status === "Need More Information"
    ).length;
    const completed = requests.filter(r => 
      r.status === "Completed" || 
      r.status === "Approved"
    ).length;

    return { total, inProgress, completed };
  }, [requests]);

  // Table filtering, searching, and sorting
  const filteredAndSortedRequests = useMemo(() => {
    return requests
      .filter((req) => {
        // 1. Search Query Match
        const searchLower = searchQuery.toLowerCase().trim();
        let matchesSearch = true;
        if (searchLower !== "") {
          const painPointText = (req.friction || "").toLowerCase();
          const deptText = (req.department || "").toLowerCase();
          let parsedOutcome = "";
          try {
            const parsed = JSON.parse(req.desired_outcome || "");
            parsedOutcome = (parsed.desired_outcome_short || "").toLowerCase();
          } catch(e){}

          matchesSearch = 
            painPointText.includes(searchLower) || 
            deptText.includes(searchLower) ||
            parsedOutcome.includes(searchLower);
        }

        // 2. Status Match
        const matchesStatus = 
          statusFilter === "All" || 
          (req.status || "Submitted").toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || "").getTime();
        const timeB = new Date(b.created_at || "").getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      });
  }, [requests, searchQuery, statusFilter, sortDirection]);

  // Relative Time Helper
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    }
    if (diffHrs < 24) {
      return `${diffHrs} hours ago`;
    }
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} days ago`;
  };

  // Status Badge Colors mapping
  const statusBadges: Record<string, string> = {
    "Draft": "bg-slate-100 text-slate-700 border-slate-200",
    "Submitted": "bg-blue-50 text-blue-800 border-blue-200",
    "Under Review": "bg-amber-50 text-amber-800 border-amber-200",
    "Need More Information": "bg-rose-50 text-rose-800 border-rose-200 font-bold",
    "Approved": "bg-emerald-50 text-emerald-800 border-emerald-200",
    "Rejected": "bg-slate-100 text-slate-500 border-slate-200",
    "In Progress": "bg-indigo-50 text-indigo-800 border-indigo-200 animate-pulse",
    "Completed": "bg-emerald-50 text-emerald-800 border-emerald-200"
  };

  return (
    <AuthGuard allowedRoles={["employee", "reviewer", "admin"]}>
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden">
        {/* Subtle Background Accent */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-70" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm border border-blue-950/20">
                <HeartPulse className="h-5.5 w-5.5 stroke-[2.2]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <p className="text-slate-400 uppercase tracking-widest text-[9px] font-extrabold">
                    Glenmark Pharmaceuticals Request Dashboard
                  </p>
                </div>
                <h1 className="text-2xl font-extrabold mt-0.5 tracking-tight text-slate-900 flex items-center gap-2.5">
                  Opportunity Intake Workspace
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <button
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Queue
              </button>
              <Link
                href="/portal/new-request"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-700/10 hover:bg-blue-800 transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 stroke-[2.5]" />
                Submit New Request
              </Link>
              <ProfileDropdown />
            </div>
          </header>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* SIDEBAR PROFILE & KPI CARD */}
            <aside className="lg:col-span-1 space-y-6">
              
              {/* Profile card summary */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5.5 shadow-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 to-blue-800" />
                
                <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-extrabold text-sm shadow-inner">
                    {employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 block truncate" title={employeeName}>{employeeName}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate max-w-[150px]">{employeeEmail}</p>
                  </div>
                </div>

                <div className="space-y-3 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department</span>
                    <span className="text-slate-800 font-bold">{employeeDept}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">System Role</span>
                    <span className="inline-flex rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-wide">
                      {role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analytical Counters */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5.5 shadow-sm space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                  Dashboard Analytics
                </p>
                <div className="grid grid-cols-1 gap-3.5">
                  
                  {/* KPI 1 */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Submitted</span>
                      <span className="text-2xl font-extrabold text-slate-900 block mt-0.5">{isLoading ? "--" : kpis.total}</span>
                    </div>
                    <FileText className="size-8 text-slate-300" />
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-blue-50/20 border border-blue-100/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600/70">In Progress</span>
                      <span className="text-2xl font-extrabold text-blue-900 block mt-0.5">{isLoading ? "--" : kpis.inProgress}</span>
                    </div>
                    <Clock className="size-8 text-blue-200" />
                  </div>

                  {/* KPI 3 */}
                  <div className="bg-emerald-50/30 border border-emerald-100/30 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/80">Completed</span>
                      <span className="text-2xl font-extrabold text-emerald-700 block mt-0.5">{isLoading ? "--" : kpis.completed}</span>
                    </div>
                    <CheckCircle2 className="size-8 text-emerald-200" />
                  </div>

                </div>
              </div>

            </aside>

            {/* MY REQUESTS CONTENT AREA */}
            <section className="lg:col-span-3 space-y-6">
              
              {/* TRIAGE CONTROLS TOOLBAR */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Searching */}
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search pain points..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>

                {/* Filters and sorting */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl px-3 py-2.5 pr-8 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm appearance-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Need More Information">Need More Information</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm cursor-pointer shrink-0"
                  >
                    <Calendar className="size-3.5" />
                    Date: {sortDirection === "asc" ? "Oldest" : "Newest"}
                  </button>
                </div>

              </div>

              {/* LOADING WORKLIST */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-800" />
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Loading Opportunity Log...</p>
                </div>
              )}

              {/* EMPTY STATE */}
              {!isLoading && filteredAndSortedRequests.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-lg mx-auto shadow-sm space-y-4">
                  <FolderOpen className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700">No requests found</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed font-medium">
                      {searchQuery || statusFilter !== "All" 
                        ? "Adjust your filters or keywords search to locate submissions."
                        : "You haven't submitted any automation opportunities yet. Click 'Submit New Request' to start."}
                    </p>
                  </div>
                </div>
              )}

              {/* DATA TABLE VIEW */}
              {!isLoading && filteredAndSortedRequests.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm overflow-x-auto relative">
                  <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                        <th className="px-6 py-4 w-[110px]">Request ID</th>
                        <th className="px-4 py-4 w-[280px]">Title / Pain Point</th>
                        <th className="px-4 py-4 w-[140px]">Department</th>
                        <th className="px-4 py-4 w-[130px]">Created Date</th>
                        <th className="px-6 py-4 w-[140px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-600">
                      {filteredAndSortedRequests.map((req) => {
                        const statusVal = req.status || "Submitted";
                        
                        // Parse title
                        let requestTitle = req.friction || "";
                        try {
                          const parsed = JSON.parse(req.desired_outcome || "");
                          requestTitle = parsed.desired_outcome_short || requestTitle;
                        } catch(e){}

                        const dateCreated = req.created_at ? new Date(req.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "N/A";
                        const hasBeenUpdated = req.updated_at && req.created_at && (new Date(req.updated_at).getTime() - new Date(req.created_at).getTime()) > 5000;

                        return (
                          <tr
                            key={req.id}
                            onClick={() => handleOpenDetails(req)}
                            className="hover:bg-slate-50/60 cursor-pointer transition"
                          >
                            <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-400 truncate">
                              #{String(req.id).substring(0, 8)}
                            </td>
                            <td className="px-4 py-4 truncate">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-900 truncate" title={requestTitle}>{requestTitle}</span>
                                {hasBeenUpdated && (
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex rounded bg-blue-50 px-1 py-0.2 text-[8px] font-extrabold text-blue-700 tracking-wide uppercase border border-blue-100">
                                      Updated
                                    </span>
                                    <span className="text-[8px] text-slate-400">{getRelativeTime(req.updated_at)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 truncate text-slate-500">{req.department}</td>
                            <td className="px-4 py-4 text-slate-400 font-mono text-[10px]">{dateCreated}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusBadges[statusVal] || statusBadges["Submitted"]}`}>
                                {statusVal}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </section>

          </div>

          {/* REQUEST DETAILS & EDITING DRAWER OVERLAY */}
          <AnimatePresence>
            {selectedRequest && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.25 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedRequest(null)}
                  className="fixed inset-0 bg-black z-40"
                />

                {/* Drawer Container Panel */}
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
                >
                  
                  {/* Header */}
                  <div className="shrink-0 flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">
                        Enterprise Submission Details
                      </span>
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-1 truncate max-w-[500px]">
                        {(() => {
                          let title = selectedRequest.friction || "";
                          try {
                            const parsed = JSON.parse(selectedRequest.desired_outcome || "");
                            title = parsed.desired_outcome_short || title;
                          } catch(e){}
                          return title;
                        })()}
                      </h2>
                    </div>

                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <X className="size-4.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-6 min-h-0 overflow-y-auto pr-1 overscroll-contain">
                    
                    {/* Mode Toggle Edit vs Read */}
                    {!isEditing ? (
                      // READ VIEW
                      <div className="space-y-6">
                        
                        {/* Status Card and Triage Badge */}
                        <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">Current Triage Status</span>
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold mt-1.5 ${statusBadges[selectedRequest.status || "Submitted"] || statusBadges["Submitted"]}`}>
                              {selectedRequest.status || "Submitted"}
                            </span>
                          </div>

                          {/* Render Edit Button conditionally if status permits */}
                          {["Draft", "Submitted", "Need More Information"].includes(selectedRequest.status || "Submitted") && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                            >
                              <Edit2 className="size-3.5" />
                              Edit Request
                            </button>
                          )}
                        </div>

                        {/* Deserialized Answers Grid */}
                        <div className="space-y-4">
                          {(() => {
                            let answers: any = null;
                            try {
                              answers = JSON.parse(selectedRequest.desired_outcome || "");
                            } catch (e) {
                              answers = {
                                department: selectedRequest.department,
                                pain_point_desc: selectedRequest.friction || "",
                                expected_support: selectedRequest.expected_support,
                                affected_area: [],
                                systems_involved: selectedRequest.systems_involved || []
                              };
                            }

                            return (
                              <div className="grid gap-4.5 sm:grid-cols-2">
                                <div className="text-xs">
                                  <span className="block font-bold text-slate-400 mb-1">Colleague Name</span>
                                  <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                    {selectedRequest.employee_name}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="block font-bold text-slate-400 mb-1">Department Ownership</span>
                                  <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                    {selectedRequest.department}
                                  </span>
                                </div>
                                <div className="text-xs sm:col-span-2">
                                  <span className="block font-bold text-slate-400 mb-1">Core Pain Point Description</span>
                                  <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                    {selectedRequest.friction || "Not Specified"}
                                  </span>
                                </div>
                                <div className="text-xs sm:col-span-2">
                                  <span className="block font-bold text-slate-400 mb-1">Software Tools & Systems Involved</span>
                                  <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                    {selectedRequest.systems_involved && selectedRequest.systems_involved.length > 0 
                                      ? selectedRequest.systems_involved.join(", ") 
                                      : "Not Specified"}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="block font-bold text-slate-400 mb-1">Primary Support Required</span>
                                  <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                    {answers.expected_support || "Not Specified"}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span className="block font-bold text-slate-400 mb-1">Frequency of Process</span>
                                  <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                    {answers.frequency || "Not Specified"}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Reviewer Comments placeholder */}
                        <div className="border-t border-slate-100 pt-5 space-y-2">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Reviewer Triage Feed</h4>
                          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs text-slate-500 font-medium leading-relaxed">
                            {selectedRequest.admin_notes && (selectedRequest.admin_notes as any).length > 0 ? (
                              (selectedRequest.admin_notes as any).map((note: any) => (
                                <div key={note.id} className="border-b border-slate-100 last:border-0 pb-3 mb-3 last:pb-0 last:mb-0 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span className="font-bold text-slate-700">{note.author}</span>
                                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-600 font-semibold">{note.content}</p>
                                </div>
                              ))
                            ) : (
                              "No triage feedback logged by the Reviewers yet."
                            )}
                          </div>
                        </div>

                        {/* Version History Log Timeline */}
                        <div className="border-t border-slate-100 pt-5 space-y-3.5">
                          <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                            <History className="size-3.5 text-slate-400" />
                            Chronological Request Timeline
                          </h4>

                          <div className="relative border-l border-slate-200 pl-4.5 ml-2.5 space-y-4 text-xs font-semibold text-slate-600">
                            
                            {/* Log 1: Created */}
                            <div className="relative">
                              <span className="absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-100 border border-blue-200" />
                              <p className="text-slate-800 font-bold">Request Created</p>
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{new Date(selectedRequest.created_at || "").toLocaleString()}</span>
                            </div>

                            {/* Log 2: Updated (Conditional) */}
                            {selectedRequest.updated_at && selectedRequest.created_at && (new Date(selectedRequest.updated_at).getTime() - new Date(selectedRequest.created_at).getTime()) > 5000 && (
                              <div className="relative">
                                <span className="absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full bg-indigo-100 border border-indigo-200" />
                                <p className="text-slate-800 font-bold">
                                  Request Updated
                                  <span className="inline-flex rounded bg-blue-50 px-1 py-0.2 text-[8px] font-extrabold text-blue-700 border border-blue-100 ml-1.5">
                                    Updated
                                  </span>
                                </p>
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{new Date(selectedRequest.updated_at).toLocaleString()}</span>
                              </div>
                            )}

                            {/* Log 3: Reviewer Comments Added (Conditional) */}
                            {selectedRequest.admin_notes && (selectedRequest.admin_notes as any).length > 0 && (
                              <div className="relative">
                                <span className="absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-100 border border-amber-200" />
                                <p className="text-slate-800 font-bold">Reviewer Comment Added</p>
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Reviewer feed updated</span>
                              </div>
                            )}

                            {/* Log 4: Status Changed */}
                            {selectedRequest.status && selectedRequest.status !== "Submitted" && (
                              <div className="relative">
                                <span className="absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200" />
                                <p className="text-slate-800 font-bold">Status Triaged: {selectedRequest.status}</p>
                              </div>
                            )}

                          </div>
                        </div>

                      </div>
                    ) : (
                      // EDITING WORKSPACE PANEL
                      <div className="space-y-5 animate-fadeIn">
                        
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-[11px] leading-relaxed text-blue-800 font-semibold">
                          * Modify fields. Editing updates the active submission directly in-place and preserves the history logs.
                        </div>

                        {/* Edit Field 1: Title */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">
                            Request Short Title
                          </label>
                          <input
                            type="text"
                            value={editPainPoint}
                            onChange={(e) => setEditPainPoint(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                            required
                          />
                        </div>

                        {/* Edit Field 2: Department */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">
                            Department Ownership
                          </label>
                          <input
                            type="text"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                            required
                          />
                        </div>

                        {/* Edit Field 3: Expected support */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">
                            Technical Support Type
                          </label>
                          <input
                            type="text"
                            value={editSupport}
                            onChange={(e) => setEditSupport(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                            required
                          />
                        </div>

                        {/* Edit Field 4: Friction details */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">
                            Core Pain Point Description
                          </label>
                          <textarea
                            value={editFriction}
                            onChange={(e) => setEditFriction(e.target.value)}
                            rows={5}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                            required
                          />
                        </div>

                        {/* Edit Actions buttons */}
                        <div className="flex items-center gap-3 pt-3">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 transition disabled:opacity-60 cursor-pointer"
                          >
                            {isSavingEdit ? (
                              <>
                                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                Saving record changes...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4.5 w-4.5" />
                                Save Opportunity Updates
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setIsEditing(false)}
                            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-3.5 text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                      </div>
                    )}

                  </div>

                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      </main>
    </AuthGuard>
  );
}
