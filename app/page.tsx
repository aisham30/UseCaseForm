"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { QuestionCard } from "./components/QuestionCard";
import { ProgressBar } from "./components/ProgressBar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { questions, submissionFields } from "./data/questions";
import { supabase, type Submission } from "./lib/supabase";

type FormState = {
  department: string;
  affected_area: string;
  work_type: string;
  friction: string;
  frequency: string;
  people_impacted: string;
  expected_support: string;
  systems_involved: string[];
  desired_outcome: string;
  attachments: string[];
};

const initialState: FormState = {
  department: "",
  affected_area: "",
  work_type: "",
  friction: "",
  frequency: "",
  people_impacted: "",
  expected_support: "",
  systems_involved: [],
  desired_outcome: "",
  attachments: [],
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<FormState>(initialState);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const currentQuestion = questions[currentIndex];
  const currentValue = answers[currentQuestion.id];
  const canContinue = useMemo(() => {
    if (currentQuestion.type === "file") return true;
    if (Array.isArray(currentValue)) return currentValue.length > 0;
    return currentValue.trim().length > 0;
  }, [currentQuestion.type, currentValue]);

  const updateAnswer = (value: string | string[]) => {
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
  };

  const goNext = () => {
    if (!canContinue) return;
    if (currentIndex === questions.length - 1) {
      setIsReviewing(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  };

  const goBack = () => {
    if (isReviewing) {
      setIsReviewing(false);
      return;
    }
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

const handleSubmit = async () => {
  setIsSubmitting(true);
  setStatus("idle");

  const payload: Submission = {
    department: answers.department,
    affected_area: answers.affected_area,
    work_type: answers.work_type,
    friction: answers.friction,
    frequency: answers.frequency,
    people_impacted: answers.people_impacted,
    expected_support: answers.expected_support,
    systems_involved: answers.systems_involved,
    desired_outcome: answers.desired_outcome,
  };


  // Insert into database
  const { error } = await supabase
    .from("submissions")
    .insert([payload]);

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
    <main
      className="min-h-screen overflow-hidden bg-black px-4 py-6 text-white sm:px-6 lg:px-8"
      onKeyDown={(event) => {
        if (event.key === "Enter" && currentQuestion.type !== "text" && started && !isReviewing) {
          goNext();
        }
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.09),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(113,113,122,0.12),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">formAI</p>
            <p className="text-xs text-zinc-500">Enterprise AI intake portal</p>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/30 hover:bg-white/[0.04]"
          >
            Admin
          </Link>
        </nav>

        {!started ? (
          <WelcomeScreen onStart={() => setStarted(true)} />
        ) : status === "success" ? (
         <SuccessState configured={true} />
        ) : (
          <div className="mx-auto max-w-4xl">
            <ProgressBar current={isReviewing ? questions.length : currentIndex + 1} total={questions.length} />

            <div className="mt-8">
              <AnimatePresence mode="wait">
                {isReviewing ? (
                  <ReviewScreen answers={answers} onSubmit={handleSubmit} isSubmitting={isSubmitting} status={status} />
                ) : (
                  <QuestionCard
                    question={currentQuestion}
                    value={currentValue}
                    onChange={updateAnswer}
                    onFileChange={(files) =>
                      setAnswers((previous) => ({
                        ...previous,
                        attachments: files ? Array.from(files).map((file) => file.name) : [],
                      }))
                    }
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={currentIndex === 0 && !isReviewing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-white/30 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>

              {!isReviewing && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canContinue}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {currentIndex === questions.length - 1 ? "Review" : "Next"}
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ReviewScreen({
  answers,
  onSubmit,
  isSubmitting,
  status,
}: {
  answers: FormState;
  onSubmit: () => void;
  isSubmitting: boolean;
  status: "idle" | "success" | "error";
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Review</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready to submit?</h1>
          <p className="mt-4 text-sm text-zinc-400">Give it one quick scan. Admins will use these signals to triage the request.</p>
        </div>
        <ShieldCheck className="size-8 text-zinc-400" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {submissionFields.map((field) => {
          const value = answers[field.id as keyof FormState];
          return (
            <div key={field.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{field.eyebrow}</p>
              <p className="mt-2 text-sm font-medium text-white">{Array.isArray(value) ? value.join(", ") : value}</p>
            </div>
          );
        })}
      </div>

      {answers.attachments.length > 0 && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
          Attachments: {answers.attachments.join(", ")}
        </div>
      )}

      {status === "error" && (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          Submission failed. Check your Supabase table and environment variables.
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-medium text-black transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Submit intake
      </button>
    </motion.section>
  );
}

function SuccessState({ configured }: { configured: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-20 max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/75 p-8 text-center shadow-2xl shadow-black/40"
    >
      <CheckCircle2 className="mx-auto mb-5 size-12 text-emerald-300" />
      <h1 className="text-4xl font-semibold tracking-tight">Request captured.</h1>
      <p className="mt-4 text-zinc-400">
        {configured
          ? "Your submission is now available in the admin dashboard."
          : "Supabase env vars are not configured, so this ran in local demo mode."}
      </p>
      <Link
        href="/admin"
        className="mt-8 inline-flex rounded-2xl border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-white/30 hover:bg-white/[0.04]"
      >
        Open admin dashboard
      </Link>
    </motion.section>
  );
}
