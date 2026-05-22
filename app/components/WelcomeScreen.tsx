"use client";

import { ArrowRight, BrainCircuit, Workflow } from "lucide-react";
import { motion } from "framer-motion";

type WelcomeScreenProps = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center"
    >
      <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300">
        <BrainCircuit className="size-4" />
        AI & Automation Intake
      </div>
      <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-7xl">
        Turn operational friction into clear AI opportunities.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
        A fast, conversational intake flow for enterprise teams to capture use cases, prioritize pain points, and route work with less typing.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-medium text-black transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          Start request
          <ArrowRight className="size-4" />
        </button>
        <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/70 px-5 py-4 text-sm text-zinc-400">
          <Workflow className="size-4 text-zinc-300" />
          One question at a time
        </div>
      </div>
    </motion.section>
  );
}
