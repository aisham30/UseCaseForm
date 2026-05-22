"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type OptionCardProps = {
  label: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  index: number;
  multi?: boolean;
};

export function OptionCard({
  label,
  icon: Icon,
  selected,
  onSelect,
  index,
  multi = false,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-16 w-full items-center gap-3 rounded-2xl border p-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 ${
        selected
          ? "border-white/50 bg-white text-black shadow-2xl shadow-white/10"
          : "border-white/10 bg-zinc-950/70 text-white hover:border-white/25 hover:bg-white/[0.08]"
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.3 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      aria-pressed={selected}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
          selected ? "border-black/10 bg-black/5" : "border-white/10 bg-white/[0.04]"
        }`}
      >
        {Icon ? <Icon className="size-5" /> : <span className="text-sm font-medium">{index + 1}</span>}
      </span>
      <span className="flex-1 text-sm font-medium sm:text-base">{label}</span>
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition ${
          selected ? "border-black bg-black text-white" : "border-white/15 text-transparent"
        }`}
      >
        <Check className="size-3.5" />
      </span>
      <span className="sr-only">{multi ? "Toggle option" : "Select option"}</span>
    </motion.button>
  );
}
