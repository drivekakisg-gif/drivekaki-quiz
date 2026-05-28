-- Phase 3: Daily Challenge
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date date UNIQUE,
  question_ids   uuid[],
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_attempts (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date date,
  score          integer,
  answers        jsonb,
  completed_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attempts   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_challenges_public_read"
  ON public.daily_challenges FOR SELECT USING (true);

CREATE POLICY "daily_challenges_insert"
  ON public.daily_challenges FOR INSERT WITH CHECK (true);

CREATE POLICY "daily_attempts_own_read"
  ON public.daily_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_attempts_own_insert"
  ON public.daily_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Phase 4: Spaced repetition
CREATE TABLE IF NOT EXISTS public.spaced_repetition_btt (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES public.btt_questions(id) ON DELETE CASCADE,
  ease_factor   numeric(4,2) DEFAULT 2.5,
  interval_days integer DEFAULT 1,
  next_review   date DEFAULT CURRENT_DATE,
  repetitions   integer DEFAULT 0,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.spaced_repetition_btt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_btt_own"
  ON public.spaced_repetition_btt FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Phase 5: Topic mastery
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic       text NOT NULL,
  total       integer DEFAULT 0,
  correct     integer DEFAULT 0,
  mastery_pct integer DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, topic)
);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topic_mastery_own"
  ON public.topic_mastery FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
