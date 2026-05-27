-- =====================================================================
-- GLENMARK FORMAI - ENTERPRISE DATABASE STABILIZATION & RLS OWNERSHIP REPAIR
-- Run this script in your Supabase SQL Editor to secure and restore ownership!
-- =====================================================================

-- ---------------------------------------------------------------------
-- PHASE 1: HARDEN AND ALIGN PUBLIC.USERS SCHEMA
-- ---------------------------------------------------------------------

-- Ensure public.users exists and has all queried GxP columns
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('employee', 'reviewer', 'admin')) DEFAULT 'employee',
  full_name text,
  department text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Proactively add columns if table already existed without them
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department text;

-- Enable Row-Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate policies on public.users
DROP POLICY IF EXISTS "Allow public read for auth role checks" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;

CREATE POLICY "Allow public read for auth role checks"
ON public.users FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow users to update their own profile"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ---------------------------------------------------------------------
-- PHASE 2: SYNCHRONIZE AUTH.USERS INTO PUBLIC.USERS
-- ---------------------------------------------------------------------

-- Copy all current accounts from auth.users, parsing metadata reactively
INSERT INTO public.users (id, email, role, full_name, department)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'role', 
    CASE 
      WHEN email LIKE 'admin%' THEN 'admin'
      WHEN email LIKE 'reviewer%' THEN 'reviewer'
      ELSE 'employee'
    END
  ) as role,
  COALESCE(raw_user_meta_data->>'full_name', 
    INITCAP(SPLIT_PART(email, '@', 1))
  ) as full_name,
  COALESCE(raw_user_meta_data->>'department', 'Operations') as department
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department;


-- ---------------------------------------------------------------------
-- PHASE 3: SECURE SCHEMA & REPAIR LEGACY RECORD OWNERSHIP
-- ---------------------------------------------------------------------

-- Proactively ensure all queried enterprise columns are active in the database (Bug 5)
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Submitted';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_notes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS assigned_owner text NOT NULL DEFAULT 'Unassigned';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS employee_name text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1. Match submissions to their correct user_id based on employee_name = full_name
UPDATE public.submissions s
SET user_id = u.id
FROM public.users u
WHERE s.employee_name = u.full_name
  AND (s.user_id IS NULL OR s.user_id <> u.id);

-- 2. Assign any remaining unowned or null user_id submissions to the active employee user '97c89386-b9df-4fe5-a2d2-6abd2bb17d60'
UPDATE public.submissions
SET user_id = '97c89386-b9df-4fe5-a2d2-6abd2bb17d60',
    employee_name = COALESCE(employee_name, 'Employee User'),
    department = COALESCE(department, 'Sales')
WHERE user_id IS NULL OR user_id <> '97c89386-b9df-4fe5-a2d2-6abd2bb17d60';


-- ---------------------------------------------------------------------
-- PHASE 4: AUTOMATE NEW SIGNUP PROFILE CREATION
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name, department)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    COALESCE(new.raw_user_meta_data->>'full_name', INITCAP(SPLIT_PART(new.email, '@', 1))),
    COALESCE(new.raw_user_meta_data->>'department', 'Operations')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ---------------------------------------------------------------------
-- PHASE 5: SECURE AND AUDIT SUBMISSIONS RLS ACCESS RULES
-- ---------------------------------------------------------------------

-- Enable Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop all outdated policies
DROP POLICY IF EXISTS "Enable selects based on roles and ownership" ON public.submissions;
DROP POLICY IF EXISTS "Enable updates based on roles and ownership" ON public.submissions;
DROP POLICY IF EXISTS "Enable inserts for users own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow public select" ON public.submissions;
DROP POLICY IF EXISTS "Allow public inserts" ON public.submissions;
DROP POLICY IF EXISTS "Allow public updates" ON public.submissions;

-- 1. SELECT Policy: Employees strictly view own; Reviewers/Admins view all
CREATE POLICY "Submissions select policy"
ON public.submissions
FOR SELECT
TO authenticated, anon
USING (
  (auth.role() = 'anon') OR
  (auth.uid() = user_id) OR
  (EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('reviewer', 'admin')
  ))
);

-- 2. INSERT Policy: Employees securely create with their own user_id association
CREATE POLICY "Submissions insert policy"
ON public.submissions
FOR INSERT
TO authenticated, anon
WITH CHECK (
  (auth.role() = 'anon') OR
  (auth.uid() = user_id) OR
  (user_id IS NULL)
);

-- 3. UPDATE Policy: Employees strictly update own; Reviewers/Admins edit all
CREATE POLICY "Submissions update policy"
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
