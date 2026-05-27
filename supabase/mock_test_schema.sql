-- Run this in Supabase SQL editor
CREATE TABLE IF NOT EXISTS public.mock_test_results (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  score            integer NOT NULL,
  total            integer NOT NULL,
  passed           boolean NOT NULL,
  time_taken_seconds integer,
  answers          jsonb,          -- [{questionId, selected, correct}]
  topic_breakdown  jsonb,          -- {topic: {correct, total}}
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.mock_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mock_own_read"   ON public.mock_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mock_own_insert" ON public.mock_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS mock_results_user_idx ON public.mock_test_results(user_id);
