-- Add user_id, updated_at, and status columns tosubmissions table if they don't exist
alter table public.submissions
add column if not exists user_id uuid references auth.users(id) on delete set null,
add column if not exists updated_at timestamptz default now(),
add column if not exists status text default 'Submitted';

-- Enable index on user_id for fast queries
create index if not exists submissions_user_id_idx on public.submissions(user_id);
