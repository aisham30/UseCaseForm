"use client";

import { UploadCloud } from "lucide-react";
import { motion } from "framer-motion";
import type { Question } from "../data/questions";
import { OptionCard } from "./OptionCard";

type QuestionCardProps = {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onFileChange: (files: FileList | null) => void;
};

export function QuestionCard({ question, value, onChange, onFileChange }: QuestionCardProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const toggleOption = (optionValue: string) => {
    if (question.type === "multi") {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue];
      onChange(next);
      return;
    }

    onChange(optionValue);
  };

  return (
    <motion.section
      key={question.id}
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[2rem] border border-white/10 bg-zinc-950/75 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
    >
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{question.eyebrow}</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          {question.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">{question.helper}</p>
      </div>

      {(question.type === "single" || question.type === "multi") && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {question.options?.map((option, index) => (
            <OptionCard
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={selectedValues.includes(option.value)}
              onSelect={() => toggleOption(option.value)}
              index={index}
              multi={question.type === "multi"}
            />
          ))}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={question.placeholder}
          rows={4}
          autoFocus
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-5 text-lg text-white outline-none transition placeholder:text-zinc-600 focus:border-white/35 focus:ring-4 focus:ring-white/10"
          maxLength={180}
        />
      )}

      {question.type === "file" && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-12 text-center transition hover:border-white/35 hover:bg-white/[0.04]">
          <UploadCloud className="mb-4 size-9 text-zinc-300" />
          <span className="text-base font-medium text-white">Drop in a sample, screenshot, or document</span>
          <span className="mt-2 text-sm text-zinc-500">Optional. Files are kept in the browser for review.</span>
          <input className="sr-only" type="file" multiple onChange={(event) => onFileChange(event.target.files)} />
        </label>
      )}
    </motion.section>
  );
}
