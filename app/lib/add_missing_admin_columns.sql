-- Migration to add missing admin/reviewer columns to the public.submissions table
-- Run this in your Supabase SQL Editor to ensure schema compliance!

-- 1. Add tags column (array of text, default to empty array)
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- 2. Add assigned_owner column (text, default to 'Unassigned')
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS assigned_owner text NOT NULL DEFAULT 'Unassigned';

-- 3. Verify that RLS policies allow authenticated and anon inserts/updates
-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they are restrictive
DROP POLICY IF EXISTS "Allow public intake inserts" ON public.submissions;
DROP POLICY IF EXISTS "Allow anon dashboard reads" ON public.submissions;
DROP POLICY IF EXISTS "Allow public intake updates" ON public.submissions;

-- Create broad policies to ensure both anon (unauthenticated) and authenticated (employee/reviewer/admin) users can query and insert
CREATE POLICY "Allow public inserts"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public select"
ON public.submissions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public updates"
ON public.submissions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
