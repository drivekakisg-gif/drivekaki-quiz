# DriveKaki Theory

Adaptive BTT/FTT quiz web app for Singapore driving theory tests.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase

---

## Quick start

```bash
git clone https://github.com/drivekakisg-gif/drivekaki-quiz
cd drivekaki-quiz
npm install
```

### 1. Environment variables

Copy `.env.local` and fill in your Supabase anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://wyhdnsoxikdmdooyugno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Get the anon key from **Supabase Dashboard → Project Settings → API**.

### 2. Supabase setup

The database already has `btt_questions` (49 questions) and `quiz_attempts` tables.

If you need to recreate the schema from scratch, run `supabase/schema.sql` in the Supabase SQL editor.

Enable magic-link auth in **Supabase Dashboard → Authentication → Providers → Email** (ensure "Enable Email provider" is on, and confirm "Passwordless" / magic-link is enabled).

Set the **Site URL** and **Redirect URL** in **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (development) or your production domain
- Redirect URL: `http://localhost:3000/**`

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Folder structure

```
app/
  page.tsx              Home / landing
  quiz/page.tsx         Full quiz flow (client component)
  auth/page.tsx         Magic-link sign-in
  auth/callback/        OAuth callback route
  api/questions/        Phase 2 scaffold: question bank API
  api/analytics/        Phase 2 scaffold: analytics API

components/
  Navigation.tsx        Sticky nav with auth state
  QuizCard.tsx          Question card with A/B/C/D options + explanation
  ProgressBar.tsx       Question progress bar
  ResultsSummary.tsx    Score, per-topic chart, missed questions review
  WeakAreasSummary.tsx  Topic-level bar chart
  AuthForm.tsx          Magic-link email form

lib/
  supabase.ts           Browser Supabase client
  supabase-server.ts    Server Supabase client (SSR cookies)
  questions.ts          fetchQuestions() from btt_questions table
  saveAttempts.ts       Save quiz_attempts rows after a session

types/index.ts          BttQuestion, QuizAttempt, QuizResult, DbAttempt

supabase/
  schema.sql            Full schema (tables, RLS policies)
  seed.sql              50 seed questions (local reference)
```

---

## How the quiz works

1. On `/quiz`, all questions are fetched from `btt_questions` and shuffled.
2. The user answers one question at a time; selecting an option immediately reveals the correct answer and explanation.
3. After the last question, a results screen shows:
   - Score and pass/fail verdict (pass = 45+)
   - Per-topic performance bar chart (red below 70%)
   - Full list of missed questions with correct answers and explanations
4. If the user is signed in, all attempts are persisted to `quiz_attempts`.

---

## Phase 2 roadmap (scaffolded, not yet implemented)

| Feature | Status |
|---|---|
| Spaced repetition (SM-2 algorithm) | `supabase/schema.sql` — `spaced_repetition` table ready |
| Question bank admin API | `app/api/questions/route.ts` — GET works; POST returns 501 |
| Analytics dashboard | `app/api/analytics/route.ts` — 501 placeholder |

---

## Deployment

```bash
# Vercel (recommended)
npx vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Update the Supabase redirect URL to your production domain after deploying.
