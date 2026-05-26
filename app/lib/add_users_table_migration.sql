-- Create public.users table referencing auth.users(id)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('employee', 'reviewer', 'admin')) default 'employee',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create Select Policies
create policy "Allow public read for auth role checks"
on public.users
for select
to anon, authenticated
using (true);

create policy "Allow users to update their own profile"
on public.users
for update
to authenticated
using (auth.uid() = id);

-- Create automatic profile creation on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'employee');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
