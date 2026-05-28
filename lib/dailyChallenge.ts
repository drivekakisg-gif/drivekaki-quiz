import { createClient } from "@/lib/supabase"

export interface DailyChallenge {
  id: string
  challenge_date: string
  question_ids: string[]
}

export interface DailyAttempt {
  score: number
  answers: { questionId: string; selected: string; correct: boolean }[]
  completed_at: string
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

// Day-number since the app epoch (2025-01-01) for the share card
export function challengeDayNumber(dateStr: string): number {
  const epoch = new Date("2025-01-01").getTime()
  const d = new Date(dateStr).getTime()
  return Math.floor((d - epoch) / 86400_000) + 1
}

export async function getOrCreateDailyChallenge(): Promise<DailyChallenge> {
  const supabase = createClient()
  const today = todayISO()

  const { data: existing } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("challenge_date", today)
    .single()

  if (existing) return existing as DailyChallenge

  // Pick 10 question IDs deterministically seeded by date
  const { data: questions } = await supabase
    .from("btt_questions")
    .select("id")

  if (!questions?.length) throw new Error("No questions available")

  const seed = today.replace(/-/g, "")
  const shuffled = [...questions].sort((a, b) => hashStr(a.id + seed) - hashStr(b.id + seed))
  const question_ids = shuffled.slice(0, 10).map((q) => q.id)

  const { data: created, error } = await supabase
    .from("daily_challenges")
    .insert({ challenge_date: today, question_ids })
    .select()
    .single()

  if (error) {
    // Race condition: another client inserted first
    const { data: retry } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("challenge_date", today)
      .single()
    if (retry) return retry as DailyChallenge
    throw error
  }

  return created as DailyChallenge
}

export async function getTodaysAttempt(challengeDate: string): Promise<DailyAttempt | null> {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { data } = await supabase
    .from("daily_attempts")
    .select("score, answers, completed_at")
    .eq("user_id", user.user.id)
    .eq("challenge_date", challengeDate)
    .single()

  return data ? (data as DailyAttempt) : null
}

export async function saveDailyAttempt(
  challengeDate: string,
  score: number,
  answers: { questionId: string; selected: string; correct: boolean }[],
): Promise<void> {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return

  await supabase.from("daily_attempts").insert({
    user_id: user.user.id,
    challenge_date: challengeDate,
    score,
    answers,
  })
}

export function buildShareText(
  score: number,
  dayNumber: number,
  answers: { correct: boolean }[],
): string {
  const emoji = answers.map((a) => (a.correct ? "✅" : "❌")).join("")
  return `DriveKaki Daily #${dayNumber} — ${score}/10 🚗\n${emoji}\nPractice BTT/FTT: drivekaki-quiz.vercel.app`
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}
