"use client";

import React, { useEffect } from "react";
import { useAuth, UserRole } from "../lib/auth";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, ArrowLeft, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm mx-auto animate-pulse">
            <HeartPulse className="h-6 w-6 stroke-[2.2]" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
            Verifying Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in (redirecting via useEffect)
  if (!user) {
    return null;
  }

  // Role Unauthorized: Show beautiful "Access Denied" screen
  if (role && !allowedRoles.includes(role)) {
    const handleSwitchAccount = async () => {
      await signOut();
      router.push("/login");
    };

    const getRedirectRoute = (r: UserRole): string => {
      if (r === "admin") return "/admin";
      if (r === "reviewer") return "/review";
      return "/portal";
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative font-sans">
        {/* Background Accent */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_30%,#FFF5F5_0%,transparent_50%)] opacity-70" />
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 max-w-md w-full rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-lg"
        >
          {/* Lock/Shield Icon */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-inner">
            <ShieldAlert className="h-7 w-7 stroke-[2.2]" />
          </div>

          <p className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 mb-1.5">
            Security Triage Exception
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Access Denied
          </h1>
          <p className="mt-3.5 text-xs text-slate-400 font-medium leading-relaxed">
            Your Glenmark enterprise profile (<span className="font-bold text-slate-700">{user.email}</span>) is signed in with the <span className="font-bold uppercase text-slate-700">{role}</span> role, which is not authorized to access this workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={getRedirectRoute(role)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-800/10 hover:bg-blue-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Your Dashboard
            </Link>
            
            <button
              onClick={handleSwitchAccount}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Switch Accounts / Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};
