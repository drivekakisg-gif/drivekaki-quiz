-- Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text NOT NULL DEFAULT 'Anonymous',
  xp            integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  week          text NOT NULL,  -- ISO week: "2026-W22"
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, week)
);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard_public_read"
  ON public.leaderboard_entries FOR SELECT USING (true);

CREATE POLICY "leaderboard_own_upsert"
  ON public.leaderboard_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Question reports
CREATE TABLE IF NOT EXISTS public.question_reports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid NOT NULL REFERENCES public.btt_questions(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      text NOT NULL,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_own_insert"
  ON public.question_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reports_own_read"
  ON public.question_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Onboarding state
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed    boolean DEFAULT false,
  skipped      boolean DEFAULT false,
  placement    jsonb,   -- { topic: pct, ... }
  completed_at timestamptz
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_own"
  ON public.user_onboarding FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
