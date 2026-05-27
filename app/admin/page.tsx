"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { supabase, Submission, isSupabaseConfigured, AdminSubmission, AdminNote } from "../lib/supabase";
import { 
  Inbox, 
  Filter, 
  Flame, 
  Zap, 
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
  Database,
  HeartPulse,
  ChevronDown,
  X,
  User,
  Users,
  Check,
  Send,
  Trash2,
  Tag,
  ChevronRight,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  History
} from "lucide-react";
import { useAuth, getFullName } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";

import { sections, questions, Question } from "../data/questions";
import { AuthGuard } from "../components/AuthGuard";
import { ProfileDropdown } from "../components/ProfileDropdown";

const AVAILABLE_TAGS = ["AI", "Automation", "Dashboard", "Process Issue", "Compliance", "Needs Discussion"];
const AVAILABLE_OWNERS = ["Unassigned", "AI Solutions Team", "Automation Team", "Analytics Support", "IT Operations", "Business Systems"];

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);

  // Formatted Request Number helper (Rule 6)
  const formatRequestNumber = (id: number | string | undefined): string => {
    if (!id) return "REQ-00000";
    const numId = Number(id);
    if (isNaN(numId)) return `REQ-${String(id).substring(0, 5).toUpperCase()}`;
    return `REQ-${String(numId).padStart(5, '0')}`;
  };

  // Delete Request Workflow (Rule 8)
  const handleDeleteRequest = async (id: number | string) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this opportunity request from the system? This action is irreversible.");
    if (!confirmed) return;

    try {
      const numId = typeof id === "number" ? id : parseInt(String(id), 10);
      console.log("[DIAGNOSTIC] Admin executing Supabase DELETE for Opportunity:", numId);
      
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", numId);

      if (error) {
        console.error("Delete failed:", error);
        showToast(`Failed to delete request: ${error.message}`, "error");
      } else {
        console.log("Delete succeeded for Opportunity:", numId);
        
        // 1. Close drawer
        setSelectedSubmission(null);
        
        // 2. Remove from local state (Single Source of Truth)
        setSubmissions(prev => prev.filter(r => Number(r.id) !== numId));
        
        // 3. Success toast
        showToast("Opportunity request has been deleted successfully.", "success");
      }
    } catch (e: any) {
      console.error("Exception deleting request:", e);
      showToast(`An error occurred: ${e.message}`, "error");
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Safe checks for Supabase configuration
  const isConfigured = typeof isSupabaseConfigured !== "undefined" ? isSupabaseConfigured : true;

  // Detail Drawer state
  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmission | null>(null);

  // Version history trail states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);

  // Reactively fetch audit timeline records
  useEffect(() => {
    if (selectedSubmission && selectedSubmission.id) {
      loadAuditLogs(selectedSubmission.id);
    } else {
      setAuditLogs([]);
    }
  }, [selectedSubmission]);

  async function loadAuditLogs(submissionId: string | number) {
    setIsLoadingAuditLogs(true);
    if (!isConfigured || !supabase) {
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
        console.warn("Could not load audit timeline in Admin:", error?.message);
        setAuditLogs([]);
      }
    } catch (e) {
      console.error("Exception loading admin audit logs:", e);
      setAuditLogs([]);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSupport, setSelectedSupport] = useState("All");
  const [selectedFrequency, setSelectedFrequency] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("All");

  // Mobile filters toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Reset pagination on filter or search updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedStatus, selectedSupport, selectedFrequency, selectedDateRange]);

  async function loadSubmissions(silent = false) {
    if (!silent) setIsLoading(true);
    setErrorMessage("");
    
    if (!isConfigured || !supabase) {
      console.warn("Supabase is not configured. Admin console requires live database connection.");
      setErrorMessage("Supabase is not configured. Admin console requires live database access.");
      setSubmissions([]);
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
        console.error("DB Query error:", error);
        setErrorMessage(`Error loading from Supabase: ${error.message}`);
        if (!silent) setSubmissions([]);
      } else {
        setSubmissions((data as AdminSubmission[]) || []);
      }
    } catch (err: any) {
      console.error("Error loading submissions:", err);
      setErrorMessage(err.message || "An unexpected error occurred while loading staging opportunities.");
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

  // State updates helper: writes back to Supabase and updates local state with rollback on failure
  const updateSubmissionField = async (
    id: string | number, 
    field: keyof Submission, 
    value: any
  ) => {
    // Validate ID
    if (!id) {
      console.error("[DIAGNOSTIC] Aborting update (Admin): ID is missing/undefined!");
      showToast("Unable to save changes: Submission ID is missing.", "error");
      return;
    }

    // Capture the old value to record exact changes in GxP audit log
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

    // Capture previous state in case we need to roll back
    let previousSubmissions: AdminSubmission[] = [];
    setSubmissions((prev) => {
      previousSubmissions = prev;
      return prev.map((sub) => (String(sub.id) === String(id) ? { ...sub, [field]: value } : sub));
    });

    let previousSelected: AdminSubmission | null = null;
    setSelectedSubmission((prev) => {
      if (prev && String(prev.id) === String(id)) {
        previousSelected = prev;
        return { ...prev, [field]: value };
      }
      return prev;
    });

    if (!isConfigured || !supabase) {
      // Local Mode
      showToast(field === "status" ? "Status updated successfully" : "Field updated successfully", "success");
      return;
    }

    try {
      // Safe casting of ID targeting bigint database IDs
      const eqId = typeof id === "number" ? id : (isNaN(Number(id)) ? id : Number(id));
      
      // Map frontend field 'assigned_owner' to correct PostgreSQL column 'assigned_to'
      let dbField = field as string;
      if (dbField === "assigned_owner") {
        dbField = "assigned_to";
      }

      const updatePayload = {
        [dbField]: value,
        updated_at: new Date().toISOString()
      };

      console.log(`[DIAGNOSTIC] === BEFORE UPDATE (Admin) ===`);
      console.log("[DIAGNOSTIC] ID:", id);
      console.log("[DIAGNOSTIC] DB Field Target:", dbField);
      console.log("[DIAGNOSTIC] Update Payload:", updatePayload);
      console.log("[DIAGNOSTIC] Selected Submission State:", selectedSubmission);

      const { data: dbRecords, error } = await supabase
        .from("submissions")
        .update(updatePayload)
        .eq("id", eqId)
        .select();

      const affectedRows = dbRecords ? dbRecords.length : 0;
      let dbRecord = null;
      let updateError = error;

      if (!updateError && affectedRows === 0) {
        console.warn("⚠️ Warning: UPDATE in Admin Console returned 0 rows. Checking diagnostics...");
        const { data: existCheck } = await supabase
          .from("submissions")
          .select("id")
          .eq("id", eqId);
        const recordExists = existCheck && existCheck.length > 0;

        updateError = {
          message: recordExists 
            ? "Database update returned 0 rows. This action was blocked by RLS policies." 
            : `Record with ID ${eqId} does not exist in the database.`,
          code: "PGRST116_ADMIN_UPDATE_ZERO_ROWS",
          details: `Admin user ${user?.id} attempted to update submission ${eqId}. Record exists in DB: ${recordExists}`,
          hint: "Verify system RLS policies and table primary key consistency."
        } as any;
      } else if (dbRecords && dbRecords.length > 0) {
        dbRecord = dbRecords[0];
      }

      if (updateError) {
        console.error("[DIAGNOSTIC] === UPDATE FAILED (Admin) ===");
        console.error("error.code:", updateError.code);
        console.error("error.message:", updateError.message);
        console.error("error.details:", updateError.details);
        console.error("error.hint:", updateError.hint);
        console.error("JSON.stringify(error):", JSON.stringify(updateError));
        // Rollback state
        if (previousSubmissions.length > 0) setSubmissions(previousSubmissions);
        if (previousSelected) setSelectedSubmission(previousSelected);
        showToast(`Unable to save changes: ${updateError.message}`, "error");
      } else {
        console.log("[DIAGNOSTIC] === AFTER UPDATE (Admin) ===");
        console.log("[DIAGNOSTIC] Database Response:", dbRecord);

        // Keep local frontend state fully compatible with both column schemas
        const updatedRecord = {
          ...(previousSelected || selectedSubmission || {}),
          [field]: value,
          assigned_owner: dbRecord?.assigned_to || dbRecord?.assigned_owner || value,
          assigned_to: dbRecord?.assigned_to || value,
          ...(dbRecord || {})
        } as AdminSubmission;

        console.log("[DIAGNOSTIC] Updated Record (Admin state):", updatedRecord);

        // 1. Update selected state immediately
        setSelectedSubmission((prev) => (prev && String(prev.id) === String(id) ? updatedRecord : prev));

        // 2. Update submissions array immediately using safe string ID matching
        setSubmissions((prev) =>
          prev.map((sub) => (String(sub.id) === String(id) ? updatedRecord : sub))
        );

        showToast(field === "status" ? "Status updated successfully" : "Field updated successfully", "success");
        
        // 3. Trigger silent sync in background
        loadSubmissions(true);

        // 4. Record GxP Audit Trail Entry
        if (oldValueStr !== newValueStr) {
          const displayName = profile?.full_name || (user ? getFullName(user) : "System Administrator");
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
            console.warn("Could not insert admin audit history:", auditError.message);
          } else {
            console.log("Successfully recorded version history log for admin change:", field);
            loadAuditLogs(id);
          }
        }

        // 5. Immediate Database Verification fetch
        const { data: verifiedRecord } = await supabase
          .from("submissions")
          .select("*")
          .eq("id", eqId)
          .single();

        if (verifiedRecord) {
          console.log("[DIAGNOSTIC] Verification Fetch Success (Admin). DB Current Row:", verifiedRecord);
          console.log(`[DIAGNOSTIC] Verification Comparison: Does ${dbField} match?`, verifiedRecord[dbField] === value);
        }
      }
    } catch (e) {
      console.error("Exception updating field:", e);
      // Rollback state
      if (previousSubmissions.length > 0) setSubmissions(previousSubmissions);
      if (previousSelected) setSelectedSubmission(previousSelected);
      showToast("Unable to save changes. Please try again.", "error");
    }
  };

  // Safe employee name retriever
  const getEmployeeName = (submission: AdminSubmission) => {
    if (submission.employee_name && submission.employee_name.trim() !== "") {
      return submission.employee_name;
    }
    try {
      const parsed = JSON.parse(submission.desired_outcome || "");
      if (parsed.employee_name && parsed.employee_name.trim() !== "") {
        return parsed.employee_name;
      }
    } catch (e) {}
    return "Not Provided";
  };

  // Urgency prioritization scoring helper
  const getUrgencyScore = (urgency?: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return 4;
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 0;
    }
  };

  // Derived KPIs
  const totalRequests = submissions.length;
  const newRequests = submissions.filter((s) => s.status === "New" || !s.status).length;
  const underReviewRequests = submissions.filter((s) => s.status === "Under Review").length;
  const completedRequests = submissions.filter((s) => s.status === "Completed" || s.status === "Implemented").length;
  const rejectedRequests = submissions.filter((s) => s.status === "Rejected").length;

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      // 1. Case-insensitive, partial-match search using includes()
      const searchLower = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      
      if (searchLower !== "") {
        const employeeName = getEmployeeName(submission).toLowerCase();
        const department = (submission.department || "").toLowerCase();
        
        // Affected Area
        let affectedArea = "";
        if (Array.isArray(submission.affected_area)) {
          affectedArea = submission.affected_area.join(", ").toLowerCase();
        } else {
          affectedArea = (submission.affected_area || "").toLowerCase();
        }

        // Work Type
        const workType = (submission.work_type || "").toLowerCase();

        // Friction
        let friction = "";
        if (Array.isArray(submission.friction)) {
          friction = submission.friction.join(", ").toLowerCase();
        } else {
          friction = (submission.friction || "").toLowerCase();
        }

        // Desired Outcome
        let desiredOutcome = (submission.desired_outcome || "").toLowerCase();
        try {
          const parsed = JSON.parse(submission.desired_outcome || "");
          desiredOutcome = (
            (parsed.pain_point_desc || "") + " " + 
            (parsed.desired_outcome_short || "") + " " + 
            (parsed.expected_support || "")
          ).toLowerCase();
        } catch (e) {}

        // Systems Involved
        let systemsInvolved = "";
        if (submission.systems_involved) {
          systemsInvolved = submission.systems_involved.join(", ").toLowerCase();
        }

        matchesSearch = 
          employeeName.includes(searchLower) ||
          department.includes(searchLower) ||
          affectedArea.includes(searchLower) ||
          workType.includes(searchLower) ||
          friction.includes(searchLower) ||
          desiredOutcome.includes(searchLower) ||
          systemsInvolved.includes(searchLower);
      }

      // 2. Department Filter
      const matchesDept = 
        selectedDept === "All" || 
        submission.department?.toLowerCase() === selectedDept.toLowerCase();

      // 3. Status Filter
      const activeStatus = submission.status || "New";
      const matchesStatus = 
        selectedStatus === "All" || 
        activeStatus.toLowerCase() === selectedStatus.toLowerCase();

      // 4. Support Type Filter
      let recordSupport = submission.expected_support || "Not Specified";
      try {
        const parsed = JSON.parse(submission.desired_outcome || "");
        recordSupport = parsed.expected_support || recordSupport;
      } catch (e) {}
      const matchesSupport = 
        selectedSupport === "All" || 
        recordSupport.toLowerCase() === selectedSupport.toLowerCase();

      // 5. Frequency Filter
      const matchesFrequency = 
        selectedFrequency === "All" || 
        submission.frequency?.toLowerCase() === selectedFrequency.toLowerCase();

      // 6. Date Range Filter
      let matchesDate = true;
      if (selectedDateRange !== "All" && submission.created_at) {
        const createdDate = new Date(submission.created_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (selectedDateRange === "7days") matchesDate = diffDays <= 7;
        else if (selectedDateRange === "30days") matchesDate = diffDays <= 30;
      }

      return matchesSearch && matchesDept && matchesStatus && matchesSupport && matchesFrequency && matchesDate;
    });
  }, [submissions, searchQuery, selectedDept, selectedStatus, selectedSupport, selectedFrequency, selectedDateRange]);

  // Dedicated React state diagnostic logging hook
  useEffect(() => {
    console.log("[DIAGNOSTIC] Submissions State (submissions):", submissions);
    console.log("[DIAGNOSTIC] FilteredSubmissions State (filteredSubmissions):", filteredSubmissions);
    console.log("[DIAGNOSTIC] SelectedSubmission State (selectedSubmission):", selectedSubmission);
  }, [submissions, filteredSubmissions, selectedSubmission]);

  // Sort Submissions
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "created_at") {
        valA = a.created_at ? new Date(a.created_at).getTime() : 0;
        valB = b.created_at ? new Date(b.created_at).getTime() : 0;
      } else if (sortField === "urgency") {
        let urgA = "Medium";
        let urgB = "Medium";
        try { urgA = JSON.parse(a.desired_outcome || "").urgency || "Medium"; } catch(e){}
        try { urgB = JSON.parse(b.desired_outcome || "").urgency || "Medium"; } catch(e){}
        valA = getUrgencyScore(urgA);
        valB = getUrgencyScore(urgB);
      } else if (sortField === "department") {
        valA = a.department || "";
        valB = b.department || "";
      } else if (sortField === "employee_name") {
        valA = getEmployeeName(a);
        valB = getEmployeeName(b);
      } else if (sortField === "frequency") {
        valA = a.frequency || "";
        valB = b.frequency || "";
      } else if (sortField === "status") {
        valA = a.status || "New";
        valB = b.status || "New";
      } else if (sortField === "support_type") {
        let supA = a.expected_support || "Not Specified";
        let supB = b.expected_support || "Not Specified";
        try { supA = JSON.parse(a.desired_outcome || "").expected_support || supA; } catch(e){}
        try { supB = JSON.parse(b.desired_outcome || "").expected_support || supB; } catch(e){}
        valA = supA;
        valB = supB;
      } else if (sortField === "friction") {
        valA = a.friction || "";
        valB = b.friction || "";
      }

      if (typeof valA === "string") {
        return sortDirection === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredSubmissions, sortField, sortDirection]);

  // Paginated Submissions
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSubmissions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSubmissions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Human dates helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Workflow Status Badge colors
  const statusColors: Record<string, string> = {
    "New": "bg-slate-100 text-slate-800 border-slate-200",
    "Under Review": "bg-amber-50 text-amber-800 border-amber-200",
    "Approved": "bg-emerald-50 text-emerald-800 border-emerald-200",
    "Completed": "bg-blue-50 text-blue-800 border-blue-200",
    "Implemented": "bg-blue-50 text-blue-800 border-blue-200",
    "Rejected": "bg-rose-50 text-rose-800 border-rose-200"
  };

  const FilterFormControls = () => (
    <div className="space-y-4">
      {/* Department Filter */}
      <div>
        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
          Department
        </label>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm"
        >
          <option value="All">All Departments</option>
          {AVAILABLE_OWNERS.slice(1).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
          {["Sales", "Marketing", "HR", "Finance", "Procurement", "Supply Chain", "Manufacturing", "Quality", "Regulatory Affairs", "Medical Affairs", "Pharmacovigilance", "R&D", "IT", "Legal / Compliance", "Other"].map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
          Workflow Status
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm"
        >
          <option value="All">All Statuses</option>
          {["New", "Under Review", "Approved", "Completed", "Rejected"].map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Support Type Filter */}
      <div>
        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
          Support Type
        </label>
        <select
          value={selectedSupport}
          onChange={(e) => setSelectedSupport(e.target.value)}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm"
        >
          <option value="All">All Support Types</option>
          {["Automation", "AI Assistant / Chatbot", "Dashboard or Reporting", "Smart Search", "Alerts or Reminders", "Workflow or Approval System", "Document Summarization", "Data Extraction", "Data Analysis", "Not Sure"].map(sup => (
            <option key={sup} value={sup}>{sup}</option>
          ))}
        </select>
      </div>

      {/* Frequency Filter */}
      <div>
        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
          Frequency
        </label>
        <select
          value={selectedFrequency}
          onChange={(e) => setSelectedFrequency(e.target.value)}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm"
        >
          <option value="All">All Frequencies</option>
          {["Multiple times daily", "Daily", "Weekly", "Monthly", "Quarterly", "Occasionally"].map(freq => (
            <option key={freq} value={freq}>{freq}</option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
          Date Range
        </label>
        <select
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer transition shadow-sm"
        >
          <option value="All">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>
    </div>
  );

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <main className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden">
      {/* Background Soft Accents */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-70" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-extrabold">
                Glenmark Pharmaceuticals Opportunity Command Center
              </p>
            </div>
            <h1 className="text-2xl font-extrabold mt-1 tracking-tight text-slate-900 flex items-center gap-3">
              FormAI Opportunities Queue
              <span className="rounded-full bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                Admin Console
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 font-medium max-w-xl">
              Evaluate, filter, prioritize, and collaborate on automation and AI use cases submitted by Glenmark employees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-3 w-3 stroke-[2.5]" /> Live Supabase Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                <AlertTriangle className="h-3 w-3" /> Local Mode / Demo Data
              </span>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 transition duration-150"
            >
              Intake Form
            </Link>
            <ProfileDropdown />
          </div>
        </header>

        {/* TOP KPI CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Requests", count: totalRequests, color: "border-slate-200 text-slate-900 bg-white" },
            { label: "New Requests", count: newRequests, color: "border-indigo-100 text-indigo-700 bg-indigo-50/20" },
            { label: "Under Review", count: underReviewRequests, color: "border-amber-100 text-amber-700 bg-amber-50/20" },
            { label: "Completed", count: completedRequests, color: "border-emerald-100 text-emerald-700 bg-emerald-50/20" },
            { label: "Rejected", count: rejectedRequests, color: "border-rose-100 text-rose-700 bg-rose-50/20" },
          ].map((kpi, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4.5 shadow-sm transition-all hover:shadow-md ${kpi.color}`}
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                {kpi.label}
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                {isLoading ? "--" : kpi.count}
              </span>
            </div>
          ))}
        </section>

        {/* MAIN BODY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          
          {/* SIDEBAR FILTERS (DESKTOP) */}
          <aside className="hidden lg:block lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm self-start">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span>Triage Filters</span>
            </div>
            
            {/* Direct Quick Keyword Search */}
            <div className="mb-5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-sm"
                />
              </div>
            </div>

            <FilterFormControls />
          </aside>

          {/* TABLE & DATA PANEL */}
          <section className="lg:col-span-3 space-y-6">
            
            {/* COLLAPSIBLE MOBILE FILTERS PANEL */}
            <div className="lg:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  triage filter panel
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence>
                {showMobileFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-slate-100"
                  >
                    {/* Keyword search on mobile */}
                    <div className="mb-4">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                        Keyword Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search opportunities..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-sm"
                        />
                      </div>
                    </div>

                    <FilterFormControls />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ACTIVE FILTER CHIPS */}
            {(selectedDept !== "All" || selectedStatus !== "All" || selectedSupport !== "All" || selectedFrequency !== "All" || selectedDateRange !== "All") && (
              <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">Active Filters:</span>
                {selectedDept !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                    Dept: {selectedDept}
                    <button onClick={() => setSelectedDept("All")} className="hover:text-blue-900 cursor-pointer ml-1 text-sm font-semibold">&times;</button>
                  </span>
                )}
                {selectedStatus !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                    Status: {selectedStatus}
                    <button onClick={() => setSelectedStatus("All")} className="hover:text-blue-900 cursor-pointer ml-1 text-sm font-semibold">&times;</button>
                  </span>
                )}
                {selectedSupport !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                    Support: {selectedSupport}
                    <button onClick={() => setSelectedSupport("All")} className="hover:text-blue-900 cursor-pointer ml-1 text-sm font-semibold">&times;</button>
                  </span>
                )}
                {selectedFrequency !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                    Frequency: {selectedFrequency}
                    <button onClick={() => setSelectedFrequency("All")} className="hover:text-blue-900 cursor-pointer ml-1 text-sm font-semibold">&times;</button>
                  </span>
                )}
                {selectedDateRange !== "All" && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                    Date: {selectedDateRange === "7days" ? "Last 7 Days" : "Last 30 Days"}
                    <button onClick={() => setSelectedDateRange("All")} className="hover:text-blue-900 cursor-pointer ml-1 text-sm font-semibold">&times;</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSelectedDept("All");
                    setSelectedStatus("All");
                    setSelectedSupport("All");
                    setSelectedFrequency("All");
                    setSelectedDateRange("All");
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold ml-1 transition cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* ERROR STATE */}
            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-sm">
                {errorMessage}
              </div>
            )}

            {/* LOADING INDICATOR */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-500">Loading incoming opportunities queue...</p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && sortedSubmissions.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-lg mx-auto shadow-sm">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <h4 className="text-sm font-bold text-slate-700">No submissions found</h4>
                <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                  Try adjusting your search queries or filter attributes to locate the desired opportunity records.
                </p>
              </div>
            )}

            {/* DATA VIEW CONTAINER */}
            {!isLoading && sortedSubmissions.length > 0 && (
              <div className="space-y-6">
                
                {/* 1. TABLE VIEW FOR DESKTOP & TABLETS (md:block) */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm overflow-x-auto relative max-h-[640px]">
                  <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                    <thead className="sticky top-0 bg-slate-50 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                      <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 w-[140px]" onClick={() => handleSort("id")}>
                          <span className="flex items-center gap-1.5">
                            Request ID
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 w-[180px]" onClick={() => handleSort("employee_name")}>
                          <span className="flex items-center gap-1.5">
                            Employee Name
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 w-[140px]" onClick={() => handleSort("department")}>
                          <span className="flex items-center gap-1.5">
                            Department
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 w-[280px]" onClick={() => handleSort("friction")}>
                          <span className="flex items-center gap-1.5">
                            Issue/Pain Point
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 w-[180px]" onClick={() => handleSort("support_type")}>
                          <span className="flex items-center gap-1.5">
                            Support Type
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 w-[150px]" onClick={() => handleSort("status")}>
                          <span className="flex items-center gap-1.5">
                            Status
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 w-[130px]" onClick={() => handleSort("created_at")}>
                          <span className="flex items-center gap-1.5">
                            Created Date
                            <ArrowUpDown className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                      {paginatedSubmissions.map((sub) => {
                        const employeeName = getEmployeeName(sub);
                        const activeStatus = sub.status || "New";

                        // Parse properties dynamically
                        let recordSupport = sub.expected_support || "Not Specified";
                        try {
                          const parsed = JSON.parse(sub.desired_outcome || "");
                          recordSupport = parsed.expected_support || recordSupport;
                        } catch (e) {}

                        return (
                          <tr 
                            key={sub.id}
                            className="hover:bg-slate-50/70 transition cursor-pointer group"
                            onClick={() => setSelectedSubmission(sub)}
                          >
                            {/* Request ID */}
                            <td className="px-6 py-4 font-mono font-bold text-slate-500">
                              {formatRequestNumber(sub.id)}
                            </td>
                            {/* Name */}
                            <td className="px-6 py-4 font-bold text-slate-900 truncate" title={employeeName}>
                              {employeeName}
                            </td>

                            {/* Department */}
                            <td className="px-4 py-4 text-slate-500 truncate" title={sub.department}>
                              {sub.department}
                            </td>

                            {/* Issue/Pain Point */}
                            <td className="px-4 py-4 text-slate-600 truncate" title={sub.friction}>
                              {sub.friction}
                            </td>

                            {/* Support Requested */}
                            <td className="px-4 py-4 text-slate-600 truncate" title={recordSupport}>
                              {recordSupport}
                            </td>

                            {/* Status select box inline */}
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
                                <select
                                  value={activeStatus}
                                  onChange={(e) => updateSubmissionField(sub.id, "status", e.target.value)}
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-bold outline-none cursor-pointer shadow-sm transition hover:scale-[1.01] ${statusColors[activeStatus] || statusColors["New"]}`}
                                >
                                  <option value="New">New</option>
                                  <option value="Under Review">Under Review</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </div>
                            </td>

                            {/* Created Date */}
                            <td className="px-4 py-4 text-slate-500 font-mono text-[10px] truncate">
                              {formatDate(sub.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. CARD VIEW STACKED FOR MOBILE DEVICES (block md:hidden) */}
                <div className="block md:hidden space-y-4">
                  {paginatedSubmissions.map((sub) => {
                    const employeeName = getEmployeeName(sub);
                    const activeStatus = sub.status || "New";

                    // Parse properties dynamically
                    let recordUrgency = "Medium";
                    let recordSupport = sub.expected_support || "Not Specified";
                    try {
                      const parsed = JSON.parse(sub.desired_outcome || "");
                      recordUrgency = parsed.urgency || "Medium";
                      recordSupport = parsed.expected_support || recordSupport;
                    } catch (e) {}

                    const urgencyStyle = 
                      recordUrgency === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                      recordUrgency === "High" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      recordUrgency === "Medium" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-slate-50 text-slate-700 border-slate-200";

                    return (
                      <div 
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition cursor-pointer space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{employeeName}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{sub.department} &bull; {formatDate(sub.created_at)}</p>
                          </div>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${urgencyStyle}`}>
                            {recordUrgency}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <div>
                            <span className="block text-slate-400 font-bold uppercase text-[8px] tracking-wide">Affected Area</span>
                            <span className="text-slate-700 font-semibold">{Array.isArray(sub.affected_area) ? sub.affected_area.join(", ") : (sub.affected_area || "N/A")}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-bold uppercase text-[8px] tracking-wide">Support Type</span>
                            <span className="text-slate-700 font-semibold">{recordSupport}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Triage Status:</span>
                          <select
                            value={activeStatus}
                            onChange={(e) => updateSubmissionField(sub.id, "status", e.target.value)}
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-bold outline-none cursor-pointer shadow-sm ${statusColors[activeStatus] || statusColors["New"]}`}
                          >
                            <option value="New">New</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION CONTROLS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 px-6 py-4 rounded-3xl shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-bold text-slate-800">
                      {Math.min(currentPage * itemsPerPage, sortedSubmissions.length)}
                    </span>{" "}
                    of <span className="font-bold text-slate-800">{sortedSubmissions.length}</span> opportunities
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1 max-w-[120px] overflow-x-auto sm:max-w-none">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                            currentPage === page
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                              : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            )}
            
          </section>
        </div>

        {/* TOAST NOTIFICATION CONTAINER */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 rounded-2xl px-4 py-3.5 shadow-xl border text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
                toast.type === "success"
                  ? "bg-emerald-50/95 text-emerald-800 border-emerald-200"
                  : "bg-rose-50/90 text-rose-800 border-rose-200"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUBMISSION DETAIL DRAWER OVERLAY */}
        <AnimatePresence>
          {selectedSubmission && (
            <>
              {/* Dark backdrop shadow overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedSubmission(null)}
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
                {/* Header Section */}
                <div className="shrink-0 flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      colleague opportunity details &mdash; {formatRequestNumber(selectedSubmission.id)}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                      {getEmployeeName(selectedSubmission)}
                    </h2>
                  </div>
                  
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-6 min-h-0 overflow-y-auto pr-1 overscroll-contain scrollbar-thin">
                  {/* Deserialize 15 questions or build fallback */}
                  {(() => {
                    let answers: any = null;
                    try {
                      answers = JSON.parse(selectedSubmission.desired_outcome || "");
                    } catch (e) {
                      // Fallback answers object mapped precisely from current database columns
                      answers = {
                        department: selectedSubmission.department,
                        affected_area: Array.isArray(selectedSubmission.affected_area) 
                          ? selectedSubmission.affected_area 
                          : selectedSubmission.affected_area 
                            ? selectedSubmission.affected_area.split(", ") 
                            : [],
                        pain_point_desc: selectedSubmission.friction || selectedSubmission.desired_outcome || "",
                        friction: Array.isArray(selectedSubmission.work_type)
                          ? selectedSubmission.work_type
                          : selectedSubmission.work_type
                            ? selectedSubmission.work_type.split(", ")
                            : [],
                        frequency: selectedSubmission.frequency,
                        time_spent: "Not specified",
                        people_impacted: selectedSubmission.people_impacted,
                        business_impact: [],
                        urgency: "Medium",
                        systems_involved: selectedSubmission.systems_involved || [],
                        information_involved: [],
                        confidential_data: "Not Sure",
                        desired_outcome_short: selectedSubmission.desired_outcome || "",
                        expected_support: selectedSubmission.expected_support,
                        solution_goals: []
                      };
                    }

                    return (
                      <div className="space-y-6">
                        {sections.map((section, idx) => (
                          <div key={section.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5">
                            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-200/50 pb-2 mb-3.5">
                              Section {idx + 1}: {section.title}
                            </h3>
                            
                            <div className="space-y-3.5">
                              {section.questions.map((q) => {
                                const val = answers[q.id];
                                let displayVal = "Not specified";
                                
                                if (Array.isArray(val)) {
                                  displayVal = val.map(v => v.startsWith("Other:") ? `Other (${v.substring(6).trim()})` : v).join(", ");
                                } else if (val) {
                                  displayVal = val.startsWith("Other:") ? `Other: ${val.substring(6).trim()}` : String(val);
                                }

                                return (
                                  <div key={q.id} className="text-xs">
                                    <span className="block font-bold text-slate-400 mb-1">{q.title}</span>
                                    <span className="text-slate-800 font-semibold leading-relaxed block bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                      {displayVal || "Not specified"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Administrative Tagging section */}
                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Administrative Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_TAGS.map((tag) => {
                        const hasTag = (selectedSubmission.tags || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              const currentTags = selectedSubmission.tags || [];
                              const nextTags = hasTag
                                ? currentTags.filter((t) => t !== tag)
                                : [...currentTags, tag];
                              updateSubmissionField(selectedSubmission.id, "tags", nextTags);
                            }}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition cursor-pointer ${
                              hasTag
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Collaborative Assignments */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                    {/* Owner assignment dropdown */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Assigned Technical Owner
                      </label>
                      <select
                        value={selectedSubmission.assigned_owner || "Unassigned"}
                        onChange={(e) => updateSubmissionField(selectedSubmission.id, "assigned_owner", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer transition"
                      >
                        {AVAILABLE_OWNERS.map((own) => (
                          <option key={own} value={own}>{own}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status selection */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Opportunity Triage Status
                      </label>
                      <select
                        value={selectedSubmission.status || "New"}
                        onChange={(e) => updateSubmissionField(selectedSubmission.id, "status", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none cursor-pointer transition"
                      >
                        <option value="New">New</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Administrative Actions (Rule 8) */}
                  <div className="border-t border-slate-100 pt-5 space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block">
                      Administrative Commands
                    </label>
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-rose-800">Permanent opportunity deletion</h4>
                        <p className="text-[10px] font-medium text-rose-600/80 mt-0.5 leading-normal max-w-[320px]">
                          Warning: Deleting this request will completely remove it from the system and all queues. This is irreversible.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRequest(selectedSubmission.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-rose-700/10 transition cursor-pointer"
                      >
                        <X className="size-3.5" />
                        Delete Request
                      </button>
                    </div>
                  </div>

                  {/* Collaborative Administrative Notes Feed */}
                  <div className="border-t border-slate-100 pt-5">
                    <NotesSection
                      notes={selectedSubmission.admin_notes || []}
                      onAddNote={(content) => {
                        const newNoteObj: AdminNote = {
                          id: "note-" + Date.now(),
                          author: profile?.full_name || (user ? getFullName(user) : "Admin Coordinator"),
                          content,
                          created_at: new Date().toISOString()
                        };
                        const nextNotes = [...(selectedSubmission.admin_notes || []), newNoteObj];
                        updateSubmissionField(selectedSubmission.id, "admin_notes", nextNotes);
                      }}
                      onDeleteNote={(noteId) => {
                        const nextNotes = (selectedSubmission.admin_notes || []).filter(n => n.id !== noteId);
                        updateSubmissionField(selectedSubmission.id, "admin_notes", nextNotes);
                      }}
                    />
                  </div>

                  {/* Version History Log Timeline (Phase 5) */}
                  <div className="border-t border-slate-100 pt-5 space-y-3.5 pb-4">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                      <History className="size-3.5 text-slate-400" />
                      Chronological Request Timeline
                    </h4>

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
                              {log.editor_name || "Colleague"} ({log.field_changed === "status" ? "Status Triaged" : "Triage Updated"})
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

// Inlined NotesSection for 100% self-contained resilience and clean layout
function NotesSection({
  notes = [],
  onAddNote,
  onDeleteNote
}: {
  notes: AdminNote[];
  onAddNote: (content: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
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
          Admin Notes ({notes.length})
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