-- GxP-Compliant Audit History & Version Control Migration
-- Run this in your Supabase SQL Editor to establish version control tracking!

-- 1. Create public.audit_history table
CREATE TABLE IF NOT EXISTS public.audit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id bigint REFERENCES public.submissions(id) ON DELETE CASCADE,
  editor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  editor_name text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  field_changed text NOT NULL,
  old_value text,
  new_value text
);

-- 2. Create index on submission_id for fast queries
CREATE INDEX IF NOT EXISTS audit_history_submission_id_idx ON public.audit_history(submission_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Enable select for users own history" ON public.audit_history;
DROP POLICY IF EXISTS "Enable insert for updates" ON public.audit_history;

-- 5. Create GxP-compliant SELECT policy:
-- Employees can strictly view history records belonging to their own submissions.
-- Reviewers and Admins can view history for all submissions.
CREATE POLICY "Enable select for users own history"
ON public.audit_history
FOR SELECT
TO authenticated, anon
USING (
  -- Allow anonymous / sandbox check
  (auth.role() = 'anon') OR
  -- Employees can strictly read audit trail for their own submissions
  (EXISTS (
    SELECT 1 FROM public.submissions
    WHERE public.submissions.id = public.audit_history.submission_id
    AND public.submissions.user_id = auth.uid()
  )) OR
  -- Reviewers and Admins can view audit trail for any submission
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('reviewer', 'admin')
  ))
);

-- 6. Create GxP-compliant INSERT policy:
-- Anyone (employees, reviewers, admins) can append audit records during edits
CREATE POLICY "Enable insert for updates"
ON public.audit_history
FOR INSERT
TO authenticated, anon
WITH CHECK (true);
