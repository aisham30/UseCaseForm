"use client";

import React, { useState, useMemo, useRef, useEffect, KeyboardEvent } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import type { QuestionOption } from "../data/questions";

type CustomMultiSelectProps = {
  options: QuestionOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  id: string;
};

export function CustomMultiSelect({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Select options...",
  id,
}: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Check if "Other" is currently checked
  const hasOtherChecked = useMemo(() => {
    return selectedValues.some(val => val === "Other" || val.startsWith("Other:"));
  }, [selectedValues]);

  // Extract the "Other" specify text
  const otherValueText = useMemo(() => {
    const otherVal = selectedValues.find(val => val.startsWith("Other:"));
    if (otherVal) return otherVal.substring(6).trim();
    return "";
  }, [selectedValues]);

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

  // Focus search input when dropdown opens
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

  // Toggle selection
  const handleToggle = (optionValue: string) => {
    if (optionValue === "Other") {
      if (hasOtherChecked) {
        // Remove other completely
        const next = selectedValues.filter(val => val !== "Other" && !val.startsWith("Other:"));
        onChange(next);
      } else {
        // Check other
        onChange([...selectedValues, "Other"]);
      }
    } else {
      const isSelected = selectedValues.includes(optionValue);
      if (isSelected) {
        onChange(selectedValues.filter(val => val !== optionValue));
      } else {
        onChange([...selectedValues, optionValue]);
      }
    }
  };

  const handleOtherSpecifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    
    // Filter out any older "Other" entries from list
    const baseList = selectedValues.filter(val => val !== "Other" && !val.startsWith("Other:"));
    
    if (text.trim() === "") {
      onChange([...baseList, "Other"]);
    } else {
      onChange([...baseList, `Other: ${text}`]);
    }
  };

  const handleRemoveItem = (valToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (valToRemove === "Other" || valToRemove.startsWith("Other:")) {
      const next = selectedValues.filter(val => val !== "Other" && !val.startsWith("Other:"));
      onChange(next);
    } else {
      onChange(selectedValues.filter(val => val !== valToRemove));
    }
  };

  // Keyboard navigation inside list
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
          const next = prev + 1 >= filteredOptions.length ? 0 : prev + 1;
          const item = listRef.current?.children[next] as HTMLElement;
          if (item) item.scrollIntoView({ block: "nearest" });
          return next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1;
          const item = listRef.current?.children[next] as HTMLElement;
          if (item) item.scrollIntoView({ block: "nearest" });
          return next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleToggle(filteredOptions[focusedIndex].value);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={dropdownRef} className="w-full relative space-y-1.5 text-slate-800">
      {/* Dropdown Trigger Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-left text-xs shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 cursor-pointer"
      >
        <span className="flex-1 truncate pr-2 text-slate-700">
          {selectedValues.length > 0 ? (
            <span className="font-semibold text-slate-900">
              {selectedValues.length === 1 
                ? `${selectedValues.length} item selected` 
                : `${selectedValues.length} items selected`}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Selected Chips Display as [Label ×] */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {selectedValues.map((val) => {
            const isOther = val === "Other" || val.startsWith("Other:");
            const otherText = val.startsWith("Other:") ? val.substring(6).trim() : "";
            const matched = options.find(o => o.value === val);
            const label = isOther 
              ? (otherText ? `Other: ${otherText}` : "Other") 
              : (matched ? matched.label : val);
            
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(val, e)}
                  className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                  title="Remove"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-[250px] w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg flex flex-col animate-fadeIn">
          {/* Search Bar inside MultiSelect Dropdown */}
          <div className="relative border-b border-slate-200 p-1.5 shrink-0 bg-slate-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
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

          {/* Checklist Options */}
          <div ref={listRef} className="overflow-y-auto py-1 flex-1 overscroll-contain max-h-[200px] scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isItemOptionSelected = 
                  option.value === "Other" 
                    ? hasOtherChecked 
                    : selectedValues.includes(option.value);
                const OptionIcon = option.icon;
                const isKeyboardFocused = idx === focusedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isKeyboardFocused 
                        ? "bg-slate-100 text-slate-900" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {/* Checkbox box indicator */}
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                        isItemOptionSelected 
                          ? "border-blue-600 bg-blue-600 text-white" 
                          : "border-slate-300 bg-white text-transparent"
                      }`}>
                        <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                      </span>
                      {OptionIcon && (
                        <OptionIcon className={`h-4 w-4 shrink-0 ${isItemOptionSelected ? "text-blue-600" : "text-slate-400"}`} />
                      )}
                      <span className={isItemOptionSelected ? "font-semibold text-slate-900" : "font-normal text-slate-700"}>
                        {option.label}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* "Other" specification textbox */}
      {hasOtherChecked && (
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
