-- Run this SQL in your Supabase SQL Editor to update the submissions table
-- for the premium AI & Automation Intake Portal admin dashboard!

-- 1. Add columns for tracking review workflows, tagging, and admin notes
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'New',
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS admin_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS assigned_owner text NOT NULL DEFAULT 'Unassigned';

-- 2. Verify that Row Level Security (RLS) allows anonymous updates (since it's an internal tool)
-- Note: In a production environment, you should secure this with Authenticated roles.
CREATE POLICY "Allow public intake updates"
ON public.submissions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
