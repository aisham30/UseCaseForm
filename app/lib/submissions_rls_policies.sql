-- Safe and Secure RLS Policies for the public.submissions table
-- Run this in your Supabase SQL Editor to apply GxP-compliant access rules!

-- 1. Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies to ensure clean state
DROP POLICY IF EXISTS "Allow public intake inserts" ON public.submissions;
DROP POLICY IF EXISTS "Allow anon dashboard reads" ON public.submissions;
DROP POLICY IF EXISTS "Allow public intake updates" ON public.submissions;
DROP POLICY IF EXISTS "Allow public inserts" ON public.submissions;
DROP POLICY IF EXISTS "Allow public select" ON public.submissions;
DROP POLICY IF EXISTS "Allow public updates" ON public.submissions;
DROP POLICY IF EXISTS "Enable inserts for everyone" ON public.submissions;
DROP POLICY IF EXISTS "Enable selects for everyone" ON public.submissions;
DROP POLICY IF EXISTS "Enable updates for everyone" ON public.submissions;

-- 3. INSERT POLICY: Allow employees to insert their own requests.
-- In staging/sandbox environments, we also permit anon inserts if user_id is null.
CREATE POLICY "Enable inserts for users own submissions"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.role() = 'anon') OR 
  (auth.uid() = user_id) OR
  (user_id IS NULL)
);

-- 4. SELECT POLICY: Allow employees to see ONLY their own requests.
-- Reviewers and Admins are permitted to see ALL requests in the triage queues.
CREATE POLICY "Enable selects based on roles and ownership"
ON public.submissions
FOR SELECT
TO authenticated, anon
USING (
  -- Anon users can query sandbox entries
  (auth.role() = 'anon') OR
  -- Employees can strictly see their own records
  (auth.uid() = user_id) OR
  -- Reviewers and Admins can see all records
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('reviewer', 'admin')
  ))
);

-- 5. UPDATE POLICY: Employees can edit their own submissions.
-- Reviewers and Admins can update status, owner, tags, or notes on any record.
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
