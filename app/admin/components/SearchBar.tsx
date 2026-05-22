"use client";

import React, { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalSubmissions?: number;
  filteredCount?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search department, desired outcome, work type, or systems involved...",
  totalSubmissions = 0,
  filteredCount = 0,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener to focus input on "/" keypress
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only focus if the user is not already typing in an input/textarea
      const activeElement = document.activeElement?.tagName;
      if (
        event.key === "/" &&
        activeElement !== "INPUT" &&
        activeElement !== "TEXTAREA"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <Search className="absolute left-4 size-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-300" />
        
        {/* Main Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/5 bg-zinc-900/40 py-3.5 pl-12 pr-24 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none backdrop-blur-md transition-all duration-300 focus:border-white/15 focus:bg-zinc-900/60 focus:ring-4 focus:ring-white/5"
        />

        {/* Clear and Keyboard Shortcut Indicators */}
        <div className="absolute right-4 flex items-center gap-2">
          {value && (
            <button
              onClick={() => onChange("")}
              className="flex items-center justify-center rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-colors"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}

          <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] font-mono font-medium text-zinc-500 sm:inline-flex">
            /
          </kbd>
        </div>
      </div>

      {/* Results status indicator */}
      {value && (
        <div className="mt-2 text-xs text-zinc-500 pl-4 animate-fade-in">
          Showing <span className="text-zinc-300 font-medium">{filteredCount}</span> of{" "}
          <span className="text-zinc-300 font-medium">{totalSubmissions}</span> items matching search
        </div>
      )}
    </div>
  );
}
