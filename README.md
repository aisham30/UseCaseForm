# formAI Intake Portal

Modern enterprise AI and automation intake portal built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, lucide-react, and Supabase.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a Supabase project.
2. Run the SQL in `app/lib/submissions.sql`.
3. Copy `.env.local.example` to `.env.local`.
4. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Without Supabase env vars, the intake form and admin dashboard run in demo mode.

## Structure

- `app/page.tsx`: animated one-question intake flow and review screen
- `app/admin/page.tsx`: admin dashboard with filters and opportunity badges
- `app/components`: reusable question, option, progress, and welcome components
- `app/data/questions.ts`: dynamic question model
- `app/lib/supabase.ts`: typed Supabase client
- `app/lib/submissions.sql`: database schema and basic RLS policies
