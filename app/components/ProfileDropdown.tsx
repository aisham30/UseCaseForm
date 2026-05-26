"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth, getFullName, UserRole } from "../lib/auth";
import { LogOut, User, ChevronDown, ShieldAlert, Award, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ProfileDropdown: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const name = getFullName(user);
  const email = user.email;
  const initial = name.charAt(0).toUpperCase();

  const getRoleBadgeStyles = (r: UserRole | null) => {
    switch (r) {
      case "admin":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Award,
          label: "Admin",
        };
      case "reviewer":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Star,
          label: "Reviewer",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: User,
          label: "Employee",
        };
    }
  };

  const badge = getRoleBadgeStyles(role);
  const BadgeIcon = badge.icon;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error("Logout failed:", error);
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 text-left shadow-sm transition duration-150 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
      >
        <span className="flex size-7.5 items-center justify-center rounded-lg bg-blue-800 text-xs font-extrabold text-white shadow-sm">
          {initial}
        </span>
        <div className="hidden sm:block">
          <p className="text-[11px] font-bold text-slate-800 leading-tight">{name}</p>
          <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold mt-0.5 ${badge.bg}`}>
            <BadgeIcon className="size-2" />
            {badge.label}
          </span>
        </div>
        <ChevronDown className={`size-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 z-50 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            {/* Header info */}
            <div className="border-b border-slate-100 pb-3 mb-3">
              <p className="text-xs font-bold text-slate-900">{name}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">{email}</p>
              <div className="mt-2.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${badge.bg}`}>
                  <BadgeIcon className="size-2.5" />
                  {badge.label}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
