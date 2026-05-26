"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export type UserRole = "employee" | "reviewer" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: UserRole;
};

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: {
    role?: UserRole;
    full_name?: string;
  };
  app_metadata?: {
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
  profile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null }>;
  signOut: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Core Reusable Auth Utilities (matching requested signatures)
let globalUser: AuthUser | null = null;
let globalRole: UserRole | null = null;

export const getCurrentUser = (): AuthUser | null => {
  return globalUser;
};

export const getCurrentRole = (): UserRole | null => {
  return globalRole;
};

export const requireRole = (allowedRoles: UserRole[]): boolean => {
  const current = getCurrentRole();
  return current !== null && allowedRoles.includes(current);
};

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
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Safely determine mode
  const isLive = isSupabaseConfigured && Boolean(supabase);

  // Sync state with global variables
  useEffect(() => {
    globalUser = user;
    globalRole = role;
  }, [user, role]);

  // Effect to query public.users table reactively on user change
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRole(null);
      return;
    }

    if (isLive) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, email, full_name, department, role")
            .eq("id", user.id)
            .single();
          
          if (!error && data) {
            const fetchedProfile = data as UserProfile;
            setProfile(fetchedProfile);
            setRole(fetchedProfile.role);
          } else {
            console.error("Error querying public.users profile:", error);
            setProfile(null);
            setRole(getCurrentUserRole(user));
          }
        } catch (e) {
          console.error("Exception querying public.users profile:", e);
          setProfile(null);
          setRole(getCurrentUserRole(user));
        }
      };
      fetchProfile();
    } else {
      setRole(getCurrentUserRole(user));
    }
  }, [user, isLive]);

  // Listen to session & auth changes
  useEffect(() => {
    if (isLive) {
      // 1. Fetch initial session
      supabase.auth.getSession().then(({ data: { session: sbSession } }) => {
        if (sbSession?.user) {
          const castUser = sbSession.user as unknown as AuthUser;
          setUser(castUser);
          setSession({
            user: castUser,
            expires_at: sbSession.expires_at,
          });
          // Write cookie for middleware
          document.cookie = `supabase-auth-token=${sbSession.access_token}; path=/; max-age=${sbSession.expires_in || 3600}; SameSite=Lax; Secure`;
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
          // Write cookie for middleware
          document.cookie = `supabase-auth-token=${sbSession.access_token}; path=/; max-age=${sbSession.expires_in || 3600}; SameSite=Lax; Secure`;
        } else {
          setUser(null);
          setRole(null);
          setProfile(null);
          setSession(null);
          // Clear cookie
          document.cookie = "supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
          // Set cookie for middleware
          document.cookie = `formai_mock_session=active; path=/; max-age=86400; SameSite=Lax; Secure`;
        }
      } catch (e) {
        console.error("Error restoring mock session:", e);
      } finally {
        setLoading(false);
      }
    }
  }, [isLive]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null; role?: UserRole | null }> => {
    setLoading(true);
    
    if (isLive) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setLoading(false);
          return { error: error.message, role: null };
        }

        if (data.user) {
          const castUser = data.user as unknown as AuthUser;
          
          // Fetch role from public.users table immediately to avoid redirects race condition
          let finalRole: UserRole = "employee";
          try {
            const { data: dbProfile, error: pError } = await supabase
              .from("users")
              .select("role, full_name, department")
              .eq("id", data.user.id)
              .single();
            
            if (!pError && dbProfile?.role) {
              finalRole = dbProfile.role as UserRole;
            }
          } catch (e) {
            console.error("Exception fetching role during sign in:", e);
          }

          // Set cookie for middleware
          if (data.session) {
            document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in || 3600}; SameSite=Lax; Secure`;
          }

          setUser(castUser);
          setRole(finalRole);
          setSession({
            user: castUser,
            expires_at: data.session?.expires_at,
          });
          
          setLoading(false);
          return { error: null, role: finalRole };
        }
        
        setLoading(false);
        return { error: "Failed to retrieve user session details.", role: null };
      } catch (err: any) {
        setLoading(false);
        return { error: err.message || "An error occurred during authentication.", role: null };
      }
    } else {
      // Mock Sign In logic
      const emailLower = email.toLowerCase().trim();
      let mockRole: UserRole = "employee";
      let fullName = "Glenmark Colleague";

      if (emailLower.startsWith("admin")) {
        mockRole = "admin";
        fullName = "System Administrator";
      } else if (emailLower.startsWith("reviewer")) {
        mockRole = "reviewer";
        fullName = "Triage Lead Reviewer";
      } else if (emailLower.startsWith("employee") || emailLower.includes("aisha") || emailLower.includes("amit")) {
        mockRole = "employee";
        fullName = emailLower.includes("aisha") ? "Aisha Mendonsa" : "Amit Patel";
      }

      const mockUser: AuthUser = {
        id: "mock-uid-" + mockRole,
        email: emailLower,
        user_metadata: {
          role: mockRole,
          full_name: fullName,
        },
        app_metadata: {
          role: mockRole,
        },
      };

      const mockSession: AuthSession = {
        user: mockUser,
        expires_at: Math.floor(Date.now() / 1000) + 86400, // 24hr expiration
      };

      setUser(mockUser);
      setRole(mockRole);
      setSession(mockSession);
      localStorage.setItem("formai_mock_session", JSON.stringify(mockSession));
      // Set cookie for middleware
      document.cookie = `formai_mock_session=active; path=/; max-age=86400; SameSite=Lax; Secure`;
      setLoading(false);
      return { error: null, role: mockRole };
    }
  };

  const signOut = async (): Promise<{ error: string | null }> => {
    setLoading(true);

    if (isLive) {
      try {
        const { error } = await supabase.auth.signOut();
        // Clear cookie regardless
        document.cookie = "supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        if (error) {
          setLoading(false);
          return { error: error.message };
        }
        setUser(null);
        setRole(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
        return { error: null };
      } catch (err: any) {
        setLoading(false);
        return { error: err.message || "An error occurred during sign out." };
      }
    } else {
      // Mock Sign Out
      setUser(null);
      setRole(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem("formai_mock_session");
      document.cookie = "formai_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setLoading(false);
      return { error: null };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, session, loading, signIn, signOut }}>
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
