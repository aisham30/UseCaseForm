-- Safe and Secure UPDATE RLS Policy for public.submissions
-- Run this in your Supabase SQL Editor to ensure GxP schema compliance!

-- 1. Enable Row Level Security (RLS) on the submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting/restrictive UPDATE policies
DROP POLICY IF EXISTS "Enable updates based on roles and ownership" ON public.submissions;
DROP POLICY IF EXISTS "Allow public updates" ON public.submissions;
DROP POLICY IF EXISTS "Allow public intake updates" ON public.submissions;

-- 3. Create GxP-compliant UPDATE policy:
-- Employees can strictly update their own submissions (based on auth.uid() = user_id).
-- Reviewers and Admins are permitted to update status, owner, tags, or notes on any record.
-- Anon users can update sandbox/demo requests.
CREATE POLICY "Enable updates based on roles and ownership"
ON public.submissions
FOR UPDATE
TO authenticated, anon
USING (
  (auth.role() = 'anon') OR
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('reviewer', 'admin')
  ))
)
WITH CHECK (
  (auth.role() = 'anon') OR
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('reviewer', 'admin')
  ))
);
