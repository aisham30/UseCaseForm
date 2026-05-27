"use client";

import React, { useState, useMemo, useRef, useEffect, KeyboardEvent } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import type { QuestionOption } from "../data/questions";

type CustomDropdownProps = {
  options: QuestionOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
};

export function CustomDropdown({
  options = [],
  selectedValue = "",
  onChange,
  placeholder = "Select an option...",
  id,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  
  // Extract "Other" specify text if selected value is of format "Other: [value]"
  const isOtherSelected = selectedValue.startsWith("Other:") || selectedValue === "Other";
  const otherValueText = selectedValue.startsWith("Other:") 
    ? selectedValue.substring(6).trim() 
    : "";

  // The base selected option (either "Other" or the actual match)
  const selectedOption = useMemo(() => {
    if (selectedValue.startsWith("Other:")) {
      return options.find(o => o.value === "Other");
    }
    return options.find(o => o.value === selectedValue);
  }, [selectedValue, options]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    return options.some(o => o.label.toLowerCase() === searchQuery.trim().toLowerCase());
  }, [options, searchQuery]);

  const visibleOptions = useMemo(() => {
    const base = [...filteredOptions];
    if (searchQuery.trim() && !hasExactMatch) {
      base.push({
        value: searchQuery.trim(),
        label: `+ Create "${searchQuery.trim()}"`,
        isCreatable: true
      } as any);
    }
    return base;
  }, [filteredOptions, searchQuery, hasExactMatch]);

  // Focus search box when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setFocusedIndex(-1);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (optionValue === "Other") {
      onChange("Other");
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const handleOtherSpecifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.trim() === "") {
      onChange("Other");
    } else {
      onChange(`Other: ${text}`);
    }
  };

  // Keyboard navigation inside options list
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        setIsOpen(false);
        triggerButtonRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev + 1 >= visibleOptions.length ? 0 : prev + 1;
          // Scroll into view
          const item = listRef.current?.children[next] as HTMLElement;
          if (item) item.scrollIntoView({ block: "nearest" });
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev - 1 < 0 ? visibleOptions.length - 1 : prev - 1;
          // Scroll into view
          const item = listRef.current?.children[next] as HTMLElement;
          if (item) item.scrollIntoView({ block: "nearest" });
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < visibleOptions.length) {
          handleSelect(visibleOptions[focusedIndex].value);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const selectedLabel = selectedOption ? selectedOption.label : selectedValue;

  return (
    <div ref={dropdownRef} className="w-full relative space-y-1 text-slate-800">
      {/* Dropdown Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-left text-xs shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <span className={selectedLabel ? "font-semibold text-slate-900" : "text-slate-400 font-normal"}>
            {selectedLabel || placeholder}
          </span>
        </span>
        <span className="flex items-center gap-1">
          {selectedValue && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
              title="Clear selection"
            >
              <X className="h-3 w-3 stroke-[2.5]" />
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-[250px] w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg flex flex-col animate-fadeIn">
          {/* Integrated Search Bar */}
          <div className="relative border-b border-slate-200 p-1.5 shrink-0 bg-slate-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div ref={listRef} className="overflow-y-auto py-1 flex-1 overscroll-contain max-h-[200px] scrollbar-thin">
            {visibleOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              visibleOptions.map((option, idx) => {
                const isItemOptionSelected = 
                  option.value === "Other" 
                    ? isOtherSelected 
                    : option.value === selectedValue;
                const OptionIcon = option.icon;
                const isKeyboardFocused = idx === focusedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isKeyboardFocused 
                        ? "bg-slate-100 text-slate-900" 
                        : isItemOptionSelected 
                          ? "bg-blue-50 text-blue-800 font-semibold" 
                          : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {OptionIcon && (
                        <OptionIcon className={`h-4 w-4 shrink-0 ${isItemOptionSelected ? "text-blue-600" : "text-slate-400"}`} />
                      )}
                      <span>{option.label}</span>
                    </span>
                    {isItemOptionSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* "Other" specification text box */}
      {isOtherSelected && (
        <div className="mt-1.5 pl-1 animate-fadeIn">
          <label htmlFor={`${id}-other-specify`} className="block text-[10px] font-semibold text-blue-800 uppercase tracking-wider mb-1">
            Please specify
          </label>
          <input
            id={`${id}-other-specify`}
            type="text"
            value={otherValueText}
            onChange={handleOtherSpecifyChange}
            placeholder="Please specify custom details..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
