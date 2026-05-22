create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  affected_area text not null,
  work_type text not null,
  friction text not null,
  frequency text not null,
  people_impacted text not null,
  expected_support text not null,
  systems_involved text[] not null default '{}',
  desired_outcome text not null,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy "Allow public intake inserts"
on public.submissions
for insert
to anon
with check (true);

create policy "Allow anon dashboard reads"
on public.submissions
for select
to anon
using (true);
