"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import { HeartPulse, Loader2, Sparkles, ShieldCheck, Mail, Lock, KeyRound, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error, role: resolvedRole } = await signIn(email, password);
      if (error) {
        setErrorMessage(error);
        setIsSubmitting(false);
      } else {
        // Redirection based on actual database-resolved role mapping
        if (resolvedRole === "admin") {
          router.push("/admin");
        } else if (resolvedRole === "reviewer") {
          router.push("/review");
        } else {
          router.push("/portal");
        }
      }
    } catch (err: any) {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftSSO = () => {
    alert(
      "Microsoft Entra ID / Azure Active Directory Integration:\n\nSingle Sign-On (SSO) routing is configured in this build's OIDC metadata. To authenticate on this pre-production sandbox, please utilize the staging credentials at the bottom."
    );
  };

  const handleFillDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password");
    setErrorMessage("");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative font-sans">
      {/* Muted clinical top-down grid and gradient */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#EAF3FF_0%,transparent_50%)] opacity-80" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(241,245,249,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(241,245,249,0.5)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      <div className="relative z-10 w-full max-w-[460px] flex flex-col gap-6">
        
        {/* Enterprise Brand Logo */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-sm border border-blue-950/20 mb-3.5">
            <HeartPulse className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            FormAI
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
              Glenmark
            </span>
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1.5">
            GxP Compliant Intake & Triage Control
          </p>
        </div>

        {/* Login Form Container Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden"
        >
          {/* Subtle GxP Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Identity Authentication</h2>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">
                Internal Access Only
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="size-2.5 text-blue-800" />
              GxP Secure
            </span>
          </div>

          {/* Secure Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            
            {/* Username/Email */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">
                Enterprise Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@glenmark.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert("Corporate Identity Management:\n\nPassword resets must be initiated through the corporate IT Service Management (ITSM) ticketing tool. Please contact the global Helpdesk at it.support@glenmark.com.")}
                  className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Account creation warning subtitle */}
            <div className="text-[8px] font-bold text-slate-400 leading-normal bg-slate-50/50 p-2 rounded-lg border border-slate-100">
              * Access requires pre-provisioned AD credentials. Self-registration and public account creation are disabled for security compliance.
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[10px] font-semibold text-rose-800 shadow-sm animate-fadeIn">
                {errorMessage}
              </div>
            )}

            {/* Submit Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 py-3.5 text-xs font-bold text-white shadow-md shadow-blue-800/10 hover:bg-blue-900 transition disabled:opacity-60 cursor-pointer mt-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Securing Connection...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Microsoft Entra ID SSO integration divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-[8px] font-extrabold uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400">Enterprise Single Sign-On</span>
            </div>
          </div>

          {/* Entra ID SSO Button Placeholder */}
          <button
            onClick={handleMicrosoftSSO}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300 py-3 text-xs font-bold text-slate-700 shadow-sm transition duration-150 cursor-pointer"
          >
            {/* Simple Microsoft Icon design representation */}
            <svg className="size-4.5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
              <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
              <path d="M0 12H11V23H0V12Z" fill="#00A1F1"/>
              <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
            </svg>
            Microsoft Entra ID (Azure AD) SSO
          </button>

        </motion.div>

        {/* Compliance Auditing Warnings */}
        <div className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-4 text-[9px] font-medium leading-relaxed text-amber-800">
          <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 mb-1">
            <Building2 className="size-3.5 shrink-0 text-amber-600" />
            System Security Advisory
          </div>
          Authorized Glenmark personnel only. Access to this platform is strictly audited. Any unauthorized authentication attempts constitute a regulatory breach under GxP data governance protocols.
        </div>

        {/* Sandboxed Testing Staging Helper Panel */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
            <KeyRound className="size-3.5 text-blue-800" />
            <span>Pre-Production Validation Console</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-1">
            Click to auto-populate credentials for role-based routing checks:
          </p>

          <div className="mt-3.5 grid grid-cols-3 gap-2">
            {[
              { role: "Employee", email: "employee@glenmark.com" },
              { role: "Reviewer", email: "reviewer@glenmark.com" },
              { role: "Admin", email: "admin@glenmark.com" },
            ].map((demo) => (
              <button
                key={demo.role}
                onClick={() => handleFillDemoUser(demo.email)}
                className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl py-2 px-1 hover:bg-slate-50 hover:border-slate-300 transition text-[9px] font-extrabold text-slate-700 shadow-sm cursor-pointer"
              >
                <span>{demo.role}</span>
                <span className="text-[8px] font-medium text-slate-400 mt-0.5 truncate max-w-full">
                  {demo.role.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
