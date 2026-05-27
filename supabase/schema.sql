-- DriveKaki Theory — Supabase Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Questions table (managed server-side; seeded via seed.sql)
create table if not exists public.questions (
  id          integer primary key,
  category    text not null,
  question    text not null,
  options     jsonb not null,           -- string[]
  correct     smallint not null,        -- 0-indexed
  explanation text not null,
  created_at  timestamptz default now()
);

-- Quiz attempts — one row per question answered per session
create table if not exists public.attempts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_id     integer not null references public.questions(id) on delete cascade,
  selected_option smallint not null,
  correct         boolean not null,
  time_spent      integer,              -- seconds
  created_at      timestamptz default now()
);

-- Quiz sessions — one row per completed quiz
create table if not exists public.quiz_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  score           smallint not null,
  total           smallint not null,
  passed          boolean not null,
  weak_categories text[],
  completed_at    timestamptz default now()
);

-- Indexes
create index if not exists attempts_user_id_idx      on public.attempts(user_id);
create index if not exists attempts_question_id_idx  on public.attempts(question_id);
create index if not exists sessions_user_id_idx      on public.quiz_sessions(user_id);

-- Row Level Security
alter table public.questions     enable row level security;
alter table public.attempts      enable row level security;
alter table public.quiz_sessions enable row level security;

-- Questions: readable by anyone (including unauthenticated for guest mode)
create policy "questions_public_read"
  on public.questions for select
  using (true);

-- Attempts: users see and write only their own rows
create policy "attempts_own_read"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "attempts_own_insert"
  on public.attempts for insert
  with check (auth.uid() = user_id);

-- Quiz sessions: users see and write only their own rows
create policy "sessions_own_read"
  on public.quiz_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_own_insert"
  on public.quiz_sessions for insert
  with check (auth.uid() = user_id);

-- Phase 2 scaffold: spaced repetition state per user+question
create table if not exists public.spaced_repetition (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_id     integer not null references public.questions(id) on delete cascade,
  ease_factor     numeric(4,2) default 2.5,
  interval_days   integer default 1,
  next_review     date default current_date,
  repetitions     integer default 0,
  updated_at      timestamptz default now(),
  unique(user_id, question_id)
);

alter table public.spaced_repetition enable row level security;

create policy "sr_own_read"
  on public.spaced_repetition for select
  using (auth.uid() = user_id);

create policy "sr_own_upsert"
  on public.spaced_repetition for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
