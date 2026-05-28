import { createClient } from "@/lib/supabase"

export interface SRCard {
  question_id: string
  ease_factor: number
  interval_days: number
  next_review: string   // ISO date
  repetitions: number
}

// SM-2 algorithm
export function sm2(
  card: Pick<SRCard, "ease_factor" | "interval_days" | "repetitions">,
  correct: boolean,
): { ease_factor: number; interval_days: number; repetitions: number } {
  let { ease_factor, interval_days, repetitions } = card

  if (correct) {
    repetitions += 1
    if (repetitions === 1)      interval_days = 3
    else if (repetitions === 2) interval_days = 7
    else                        interval_days = Math.round(interval_days * ease_factor)
    ease_factor = Math.max(1.3, ease_factor + 0.1)
  } else {
    repetitions = 0
    interval_days = 1
    ease_factor = Math.max(1.3, ease_factor - 0.2)
  }

  return { ease_factor, interval_days, repetitions }
}

export async function upsertSRCards(
  attempts: { questionId: string; correct: boolean }[],
): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return

  const userId = data.user.id
  const today = new Date().toISOString().split("T")[0]

  // Fetch existing cards for these questions
  const qids = attempts.map((a) => a.questionId)
  const { data: existing } = await supabase
    .from("spaced_repetition_btt")
    .select("*")
    .eq("user_id", userId)
    .in("question_id", qids)

  const existingMap = new Map<string, SRCard>((existing ?? []).map((r) => [r.question_id, r as SRCard]))

  const upserts = attempts.map((a) => {
    const current = existingMap.get(a.questionId) ?? {
      question_id: a.questionId,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      next_review: today,
    }
    const next = sm2(current, a.correct)
    const nextReview = new Date(Date.now() + next.interval_days * 86400_000)
      .toISOString()
      .split("T")[0]

    return {
      user_id: userId,
      question_id: a.questionId,
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      next_review: nextReview,
      updated_at: new Date().toISOString(),
    }
  })

  await supabase
    .from("spaced_repetition_btt")
    .upsert(upserts, { onConflict: "user_id,question_id" })
}

export async function getDueCount(): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return 0

  const today = new Date().toISOString().split("T")[0]
  const { count } = await supabase
    .from("spaced_repetition_btt")
    .select("*", { count: "exact", head: true })
    .eq("user_id", data.user.id)
    .lte("next_review", today)

  return count ?? 0
}

export async function getDueQuestionIds(): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return []

  const today = new Date().toISOString().split("T")[0]
  const { data: rows } = await supabase
    .from("spaced_repetition_btt")
    .select("question_id")
    .eq("user_id", data.user.id)
    .lte("next_review", today)
    .order("next_review")
    .limit(50)

  return (rows ?? []).map((r) => r.question_id)
}
