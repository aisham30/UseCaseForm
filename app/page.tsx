"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";
import { sections, Question, Section } from "./data/questions";
import { supabase, type Submission } from "./lib/supabase";
import { CustomDropdown } from "./components/CustomDropdown";
import { CustomMultiSelect } from "./components/CustomMultiSelect";

type FormState = {
  employee_name: string;
  department: string;
  affected_area: string[];
  pain_point_desc: string;
  friction: string[];
  frequency: string;
  time_spent: string;
  people_impacted: string;
  business_impact: string[];
  urgency: string;
  systems_involved: string[];
  information_involved: string[];
  confidential_data: string;
  desired_outcome_short: string;
  expected_support: string;
  solution_goals: string[];
};

const initialState: FormState = {
  employee_name: "",
  department: "",
  affected_area: [],
  pain_point_desc: "",
  friction: [],
  frequency: "",
  time_spent: "",
  people_impacted: "",
  business_impact: [],
  urgency: "",
  systems_involved: [],
  information_involved: [],
  confidential_data: "",
  desired_outcome_short: "",
  expected_support: "",
  solution_goals: [],
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<FormState>(initialState);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const currentSection = sections[currentSectionIndex];

  // Validation logic: check if all questions in the current section have valid answers
  const isSectionComplete = useMemo(() => {
    return currentSection.questions.every((q) => {
      const val = answers[q.id as keyof FormState];
      if (Array.isArray(val)) {
        return val.length > 0;
      }
      return val && String(val).trim() !== "";
    });
  }, [currentSection, answers]);

  const updateAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  };

  const goNext = () => {
    if (!isSectionComplete) return;
    if (currentSectionIndex === sections.length - 1) {
      setIsReviewing(true);
      return;
    }
    setCurrentSectionIndex((index) => index + 1);
  };

  const goBack = () => {
    if (isReviewing) {
      setIsReviewing(false);
      return;
    }
    setCurrentSectionIndex((index) => Math.max(0, index - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStatus("idle");

    // Format fields cleanly to save in existing database columns
    const payload: Submission = {
      employee_name: answers.employee_name,
      department: answers.department,
      affected_area: answers.affected_area.join(", "),
      work_type: answers.friction.join(", "),
      friction: answers.pain_point_desc,
      frequency: answers.frequency,
      people_impacted: answers.people_impacted,
      expected_support: answers.expected_support,
      systems_involved: answers.systems_involved,
      desired_outcome: JSON.stringify(answers), // Serialize complete 15-question answers state
    };

    const { error } = await supabase.from("submissions").insert([payload]);

    if (error) {
      console.error(error);
      setStatus("error");
    } else {
      console.log("Submission saved!");
      setStatus("success");
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8 pb-80 relative font-sans">
      {/* Clean Corporate Background Accent */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,#EAF3FF_0%,transparent_30%),radial-gradient(circle_at_80%_80%,#F3F7FC_0%,transparent_30%)] opacity-80" />
      
      <div className="relative mx-auto max-w-5xl">
        {/* Navigation */}
        <nav className="mb-10 flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
              <HeartPulse className="h-5.5 w-5.5 stroke-[2.2]" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                FormAI
                <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
                  Glenmark
                </span>
              </p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Opportunity Intake Portal
              </p>
            </div>
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            Admin Dashboard
          </Link>
        </nav>

        {!started ? (
          <WelcomeScreen onStart={() => setStarted(true)} />
        ) : status === "success" ? (
          <SuccessState />
        ) : (
          <div className="mx-auto max-w-3xl">
            {/* Section Progress Bar */}
            {!isReviewing && (
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider text-blue-900">
                    Step {currentSectionIndex + 1} of {sections.length}: {currentSection.title}
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {Math.round(((currentSectionIndex + 1) / sections.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 border border-slate-200">
                  <motion.div
                    className="h-full rounded-full bg-blue-700"
                    initial={false}
                    animate={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Wizard Cards */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {isReviewing ? (
                  <ReviewScreen
                    answers={answers}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    status={status}
                    onEditSection={(sectionIndex) => {
                      setCurrentSectionIndex(sectionIndex);
                      setIsReviewing(false);
                    }}
                  />
                ) : (
                  <motion.section
                    key={currentSection.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                  >
                    {/* Section Description */}
                    <div className="mb-8 border-b border-slate-100 pb-5">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                        Section 0{currentSectionIndex + 1} of 0{sections.length}
                      </p>
                      <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                        {currentSection.title}
                      </h1>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                        {currentSection.explanation}
                      </p>
                    </div>

                    {/* Questions Listing */}
                    <div className="space-y-6">
                      {currentSection.questions.map((q) => {
                        const val = answers[q.id as keyof FormState];
                        
                        return (
                          <div key={q.id} className="space-y-2 animate-fadeIn">
                            <label className="block">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                {q.eyebrow}
                              </span>
                              <span className="text-xs font-bold text-slate-800 leading-tight">
                                {q.title}
                              </span>
                            </label>
                            
                            {/* Short Helper description */}
                            <p className="text-[11px] text-slate-400 leading-relaxed pb-1 font-medium">
                              {q.helper}
                            </p>

                            {/* Render inputs by type */}
                            {q.type === "single" && (
                              <CustomDropdown
                                id={q.id}
                                options={q.options || []}
                                selectedValue={val as string}
                                onChange={(value) => updateAnswer(q.id, value)}
                                placeholder="Search & select option..."
                              />
                            )}

                            {q.type === "multi" && (
                              <CustomMultiSelect
                                id={q.id}
                                options={q.options || []}
                                selectedValues={val as string[]}
                                onChange={(values) => updateAnswer(q.id, values)}
                                placeholder="Search & check options..."
                              />
                            )}

                            {q.type === "text" && (
                              <textarea
                                value={val as string}
                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                placeholder={q.placeholder}
                                rows={4}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                              />
                            )}

                            {q.type === "short_text" && (
                              <input
                                type="text"
                                value={val as string}
                                onChange={(e) => updateAnswer(q.id, e.target.value)}
                                placeholder={q.placeholder}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>

            {/* Nav Footer Actions */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goBack}
                disabled={currentSectionIndex === 0 && !isReviewing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              {!isReviewing && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!isSectionComplete}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {currentSectionIndex === sections.length - 1 ? "Review Request" : "Next Section"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center text-center sm:text-left py-12"
    >
      <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[10px] font-bold text-blue-700 shadow-sm mx-auto sm:mx-0">
        <Sparkles className="h-3.5 w-3.5" />
        AI & AUTOMATION INTAKE PORTAL
      </div>
      <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl">
        Turn operational bottlenecks into smart solutions.
      </h1>
      <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-500 font-medium border-l-2 border-blue-600 pl-4 text-left mx-auto sm:mx-0">
        A professional, structured, and easy-to-use opportunity intake wizard designed for Glenmark Pharmaceuticals to capture workflow challenges, manual redundancies, and document search tasks.
      </p>
      <div className="mt-10 flex flex-col gap-4.5 sm:flex-row justify-center sm:justify-start">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-4 text-xs font-bold text-white shadow-md shadow-blue-700/10 hover:bg-blue-800 transition cursor-pointer"
        >
          Start New Opportunity Request
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </button>
        <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold text-slate-500 shadow-sm">
          Section-by-Section Workflow
        </div>
      </div>
    </motion.section>
  );
}

function ReviewScreen({
  answers,
  onSubmit,
  isSubmitting,
  status,
  onEditSection,
}: {
  answers: FormState;
  onSubmit: () => void;
  isSubmitting: boolean;
  status: "idle" | "success" | "error";
  onEditSection: (index: number) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">Review Request</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ready to submit?</h1>
          <p className="mt-2 text-xs text-slate-400 font-medium">
            Please review your opportunity answers before submitting them to the administrative review queue.
          </p>
        </div>
        <ShieldCheck className="h-8 w-8 text-blue-700 shrink-0" />
      </div>

      {/* Render 5 sections summaries */}
      <div className="space-y-6">
        {sections.map((section, sectionIdx) => (
          <div key={section.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 relative group">
            {/* Header section edit */}
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-2 mb-4">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Section {sectionIdx + 1}: {section.title}
              </h3>
              <button
                type="button"
                onClick={() => onEditSection(sectionIdx)}
                className="text-[10px] font-bold uppercase text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
              >
                Edit Section
              </button>
            </div>

            <div className="grid gap-4.5 sm:grid-cols-2">
              {section.questions.map((q) => {
                const val = answers[q.id as keyof FormState];
                const displayVal = Array.isArray(val) 
                  ? val.map(v => v.startsWith("Other:") ? `Other (${v.substring(6).trim()})` : v).join(", ") 
                  : (val.startsWith("Other:") ? `Other: ${val.substring(6).trim()}` : val);

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

      {status === "error" && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 shadow-sm">
          Database submission failed. Please verify your Supabase configuration.
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 text-xs font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            Saving Request Opportunity...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.5]" />
            Submit AI & Automation Opportunity
          </>
        )}
      </button>
    </motion.section>
  );
}

function SuccessState() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-16 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
        <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Request Captured Successfully.</h1>
      <p className="mt-3.5 text-xs text-slate-500 leading-relaxed font-semibold">
        Thank you for submitting your AI & Automation opportunity. The Glenmark administrative team has received your request and queued it for prioritizing and resource budgeting.
      </p>
      <div className="mt-8 flex flex-col gap-3.5 sm:flex-row justify-center">
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
        >
          Open Admin Queue
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 cursor-pointer"
        >
          Submit Another Request
        </button>
      </div>
    </motion.section>
  );
}
