"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export type UserRole = "employee" | "reviewer" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  user_metadata: {
    role?: UserRole;
    full_name?: string;
  };
  app_metadata: {
    role?: UserRole;
  };
};

export type AuthSession = {
  user: AuthUser;
  expires_at?: number;
};

type AuthContextType = {
  user: AuthUser | null;
  role: UserRole | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getCurrentUserRole = (user: AuthUser | null): UserRole => {
  if (!user) return "employee";
  
  // 1. Read role from metadata
  const metadataRole = user.app_metadata?.role || user.user_metadata?.role;
  if (metadataRole === "admin" || metadataRole === "reviewer" || metadataRole === "employee") {
    return metadataRole;
  }
  
  // 2. Email-based mapping for demo safety & convenience
  const email = (user.email || "").toLowerCase();
  if (email.startsWith("admin")) return "admin";
  if (email.startsWith("reviewer")) return "reviewer";
  return "employee";
};

export const getFullName = (user: AuthUser | null): string => {
  if (!user) return "User";
  if (user.user_metadata?.full_name) return user.user_metadata.full_name;
  
  // Capitalize name from email
  const prefix = user.email.split("@")[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Safely determine mode
  const isLive = isSupabaseConfigured && Boolean(supabase);

  useEffect(() => {
    if (isLive) {
      // 1. Fetch initial session from Supabase
      supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession?.user) {
          const castUser = sbSession.user as unknown as AuthUser;
          setUser(castUser);
          setSession({
            user: castUser,
            expires_at: sbSession.expires_at,
          });
        }
        setLoading(false);
      });

      // 2. Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        if (sbSession?.user) {
          const castUser = sbSession.user as unknown as AuthUser;
          setUser(castUser);
          setSession({
            user: castUser,
            expires_at: sbSession.expires_at,
          });
        } else {
          setUser(null);
          setSession(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local Mode: Restore mock session from localStorage
      try {
        const storedSession = localStorage.getItem("formai_mock_session");
        if (storedSession) {
          const parsed = JSON.parse(storedSession) as AuthSession;
          setUser(parsed.user);
          setSession(parsed);
        }
      } catch (e) {
        console.error("Error restoring mock session:", e);
      } finally {
        setLoading(false);
      }
    }
  }, [isLive]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);
    
    if (isLive) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        if (data.user) {
          const castUser = data.user as unknown as AuthUser;
          setUser(castUser);
          setSession({
            user: castUser,
            expires_at: data.session?.expires_at,
          });
        }
        return { error: null };
      } catch (err: any) {
        setLoading(false);
        return { error: err.message || "An error occurred during authentication." };
      }
    } else {
      // Mock Sign In logic
      // Accept any password, map email to roles
      const emailLower = email.toLowerCase().trim();
      let role: UserRole = "employee";
      let fullName = "Glenmark Colleague";

      if (emailLower.startsWith("admin")) {
        role = "admin";
        fullName = "System Administrator";
      } else if (emailLower.startsWith("reviewer")) {
        role = "reviewer";
        fullName = "Triage Lead Reviewer";
      } else if (emailLower.startsWith("employee") || emailLower.includes("aisha") || emailLower.includes("amit")) {
        role = "employee";
        fullName = emailLower.includes("aisha") ? "Aisha Mendonsa" : "Amit Patel";
      }

      const mockUser: AuthUser = {
        id: "mock-uid-" + role,
        email: emailLower,
        user_metadata: {
          role,
          full_name: fullName,
        },
        app_metadata: {
          role,
        },
      };

      const mockSession: AuthSession = {
        user: mockUser,
        expires_at: Math.floor(Date.now() / 1000) + 86400, // 24hr expiration
      };

      setUser(mockUser);
      setSession(mockSession);
      localStorage.setItem("formai_mock_session", JSON.stringify(mockSession));
      setLoading(false);
      return { error: null };
    }
  };

  const signOut = async (): Promise<{ error: string | null }> => {
    setLoading(true);

    if (isLive) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      setUser(null);
      setSession(null);
      setLoading(false);
      return { error: null };
    } else {
      // Mock Sign Out
      setUser(null);
      setSession(null);
      localStorage.removeItem("formai_mock_session");
      setLoading(false);
      return { error: null };
    }
  };

  const role = user ? getCurrentUserRole(user) : null;

  return (
    <AuthContext.Provider value={{ user, role, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
