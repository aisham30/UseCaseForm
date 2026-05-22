"use client";

import React, { useState } from "react";
import { 
  Calendar, Users, Cpu, FileText, CheckCircle2, ChevronDown, ChevronUp, 
  MessageSquare, UserPlus, Tag, Check, HelpCircle, Laptop, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type AdminSubmission, type AdminNote } from "../../lib/supabase";
import { questions } from "../../data/questions";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import NotesPanel from "./NotesPanel";

interface SubmissionCardProps {
  submission: AdminSubmission;
  onUpdateStatus: (id: string, status: Required<AdminSubmission>["status"]) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onUpdateOwner: (id: string, owner: string) => void;
  onAddNote: (id: string, noteContent: string) => void;
  onDeleteNote?: (id: string, noteId: string) => void;
}

const AVAILABLE_TAGS = ["AI", "Automation", "Dashboard", "Process Issue", "Compliance", "Needs Discussion"];
const AVAILABLE_OWNERS = ["Unassigned", "AI Solutions Team", "Automation Team", "Analytics Support", "IT Operations", "Business Systems"];

export default function SubmissionCard({
  submission,
  onUpdateStatus,
  onUpdateTags,
  onUpdateOwner,
  onAddNote,
  onDeleteNote,
}: SubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Extract core properties with clean defaults
  const {
    id,
    department = "Other",
    affected_area = "General",
    work_type = "Not specified",
    friction = "Not specified",
    frequency = "Not specified",
    people_impacted = "Not specified",
    expected_support = "Not specified",
    systems_involved = [],
    desired_outcome = "No outcome provided",
    created_at = new Date().toISOString(),
    status = "New",
    tags = [],
    admin_notes = [],
    assigned_owner = "Unassigned"
  } = submission;

  // Toggle dynamic tags
  const handleTagToggle = (tag: string) => {
    let updatedTags = [...tags];
    if (updatedTags.includes(tag)) {
      updatedTags = updatedTags.filter((t) => t !== tag);
    } else {
      updatedTags.push(tag);
    }
    onUpdateTags(id, updatedTags);
  };

  // Helper to format any custom/future key that's not in questions.ts
  const formatKeyName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render questions dynamically - LOOSELY COUPLED structure
  const renderDynamicDetails = () => {
    // Keys to ignore since we display them on the card face or admin sections
    const ignoredKeys = [
      "id",
      "created_at",
      "status",
      "tags",
      "admin_notes",
      "assigned_owner",
      "desired_outcome",
      "department",
      "affected_area",
    ];

    // Filter submission keys to get the question/answer keys
    const detailKeys = Object.keys(submission).filter(
      (key) => !ignoredKeys.includes(key)
    );

    return (
      <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-white/5">
        {detailKeys.map((key) => {
          const rawValue = submission[key as keyof AdminSubmission];
          if (!rawValue) return null;

          // Find if there is matching metadata in questions.ts
          const questionMeta = questions.find((q) => q.id === key);
          const displayLabel = questionMeta ? questionMeta.title : formatKeyName(key);
          
          let displayValue = "";
          let IconComp = HelpCircle;

          if (Array.isArray(rawValue)) {
            displayValue = rawValue.join(", ");
          } else {
            displayValue = String(rawValue);
          }

          // If we have matching options, let's find the matching icon
          if (questionMeta && questionMeta.options) {
            const matchedOption = questionMeta.options.find(
              (opt) => opt.value === rawValue || (Array.isArray(rawValue) && (rawValue as any[]).includes(opt.value))
            );
            if (matchedOption && matchedOption.icon) {
              IconComp = matchedOption.icon;
            }
          }

          return (
            <div key={key} className="rounded-xl border border-white/[0.03] bg-zinc-900/10 p-3.5 hover:bg-zinc-900/30 transition-all">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-medium">
                <IconComp className="size-3 text-zinc-500" />
                {displayLabel}
              </div>
              <div className="text-xs text-zinc-200 leading-relaxed font-normal">
                {displayValue}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <article className="group relative rounded-2xl border border-white/5 bg-zinc-950/45 p-6 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-zinc-900/30">
      
      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-400 tracking-wide">{department}</span>
            <span>·</span>
            <span className="text-zinc-500 font-medium">{affected_area}</span>
            <span>·</span>
            <time className="font-mono text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
              {new Date(created_at).toLocaleDateString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
          
          <h2 className="mt-2.5 text-lg font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors duration-200">
            {desired_outcome}
          </h2>
        </div>

        {/* Badges Column */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Auto Priority Badges */}
      <div className="mb-4">
        <PriorityBadge submission={submission} />
      </div>

      {/* Grid of Key Standard Details */}
      <dl className="grid gap-3 text-xs grid-cols-2 sm:grid-cols-3 mb-5">
        <div className="rounded-xl border border-white/5 bg-zinc-900/10 p-3 hover:bg-zinc-900/20 transition-all">
          <dt className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Expected Support</dt>
          <dd className="text-zinc-200 font-medium">{expected_support}</dd>
        </div>
        <div className="rounded-xl border border-white/5 bg-zinc-900/10 p-3 hover:bg-zinc-900/20 transition-all">
          <dt className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Frequency</dt>
          <dd className="text-zinc-200 font-medium">{frequency}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/5 bg-zinc-900/10 p-3 hover:bg-zinc-900/20 transition-all">
          <dt className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Systems Involved</dt>
          <dd className="text-zinc-200 font-medium truncate" title={systems_involved.join(", ")}>
            {systems_involved.length > 0 ? systems_involved.join(", ") : "None"}
          </dd>
        </div>
      </dl>

      {/* Dynamic Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5 items-center">
          <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold mr-1">Admin Tags:</span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-medium px-2 py-0.5 border border-indigo-500/15"
            >
              {tag}
              <button 
                onClick={() => handleTagToggle(tag)}
                className="hover:text-rose-400 transition-colors ml-1 text-xs cursor-pointer font-bold"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Owner Badge */}
      {assigned_owner !== "Unassigned" && (
        <div className="flex items-center gap-2 mb-5 text-[11px]">
          <span className="text-zinc-500 font-medium">Assigned to:</span>
          <span className="font-semibold text-indigo-300 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Users className="size-3" />
            {assigned_owner}
          </span>
        </div>
      )}

      {/* Actions HUD & Expand button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 bg-white/[0.01] -mx-6 px-6 -mb-6 pb-4 rounded-b-2xl">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Quick Action: Mark Reviewed */}
          {status === "New" && (
            <button
              onClick={() => onUpdateStatus(id, "Under Review")}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold px-3 py-2 hover:bg-indigo-600 transition-all duration-200 shadow-[0_0_15px_rgba(99,102,241,0.25)] cursor-pointer"
            >
              <Check className="size-3.5 stroke-[3]" />
              Mark Reviewed
            </button>
          )}

          {/* Quick Action: Status Change Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowTagDropdown(false);
                setShowOwnerDropdown(false);
              }}
              className="flex items-center gap-1 rounded-xl border border-white/5 bg-zinc-900/40 text-xs text-zinc-400 px-3 py-2 hover:border-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Status
              <ChevronDown className="size-3" />
            </button>
            
            {showStatusDropdown && (
              <div className="absolute left-0 bottom-full mb-2 z-30 w-44 rounded-xl border border-white/5 bg-zinc-950 p-1.5 shadow-2xl backdrop-blur-xl">
                {["New", "Under Review", "Approved", "Rejected", "Implemented"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onUpdateStatus(id, st as any);
                      setShowStatusDropdown(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 hover:text-zinc-100 ${
                      status === st ? "text-indigo-400 font-semibold bg-indigo-500/5" : "text-zinc-400"
                    }`}
                  >
                    {st}
                    {status === st && <Check className="size-3 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action: Add Tag Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTagDropdown(!showTagDropdown);
                setShowStatusDropdown(false);
                setShowOwnerDropdown(false);
              }}
              className="flex items-center gap-1 rounded-xl border border-white/5 bg-zinc-900/40 text-xs text-zinc-400 px-3 py-2 hover:border-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Tag className="size-3" />
              Tags
            </button>
            
            {showTagDropdown && (
              <div className="absolute left-0 bottom-full mb-2 z-30 w-48 rounded-xl border border-white/5 bg-zinc-950 p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Toggle Tags</div>
                {AVAILABLE_TAGS.map((tg) => {
                  const hasTag = tags.includes(tg);
                  return (
                    <button
                      key={tg}
                      onClick={() => handleTagToggle(tg)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 hover:text-zinc-100 ${
                        hasTag ? "text-indigo-400 font-semibold bg-indigo-500/5" : "text-zinc-400"
                      }`}
                    >
                      {tg}
                      {hasTag && <Check className="size-3 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action: Assign Owner Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOwnerDropdown(!showOwnerDropdown);
                setShowStatusDropdown(false);
                setShowTagDropdown(false);
              }}
              className="flex items-center gap-1 rounded-xl border border-white/5 bg-zinc-900/40 text-xs text-zinc-400 px-3 py-2 hover:border-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <UserPlus className="size-3" />
              Assign
            </button>
            
            {showOwnerDropdown && (
              <div className="absolute left-0 bottom-full mb-2 z-30 w-48 rounded-xl border border-white/5 bg-zinc-950 p-1.5 shadow-2xl backdrop-blur-xl">
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1">Assign Owner</div>
                {AVAILABLE_OWNERS.map((own) => (
                  <button
                    key={own}
                    onClick={() => {
                      onUpdateOwner(id, own);
                      setShowOwnerDropdown(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 hover:text-zinc-100 ${
                      assigned_owner === own ? "text-indigo-400 font-semibold bg-indigo-500/5" : "text-zinc-400"
                    }`}
                  >
                    {own}
                    {assigned_owner === own && <Check className="size-3 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action: Show Notes Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition-colors cursor-pointer ${
              showNotes 
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/15" 
                : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:border-white/10 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="size-3.5" />
            Notes
            <span className="font-mono text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500 font-semibold">
              {admin_notes.length}
            </span>
          </button>
        </div>

        {/* Full Details Expander */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-xl bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white text-xs px-3.5 py-2.5 transition-colors cursor-pointer ml-auto font-medium"
        >
          {isExpanded ? (
            <>
              Hide Details
              <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              View Details
              <ChevronDown className="size-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Expandable Sections (Details & Notes) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {renderDynamicDetails()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <div className="pt-4 border-t border-white/5">
              <NotesPanel
                notes={admin_notes}
                onAddNote={(content) => onAddNote(id, content)}
                onDeleteNote={onDeleteNote ? (noteId) => onDeleteNote(id, noteId) : undefined}
                submissionId={id}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </article>
  );
}
