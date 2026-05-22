"use client";

import { motion } from "framer-motion";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, (current / total) * 100));

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Step {current} of {total}
        </span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.35)]"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
