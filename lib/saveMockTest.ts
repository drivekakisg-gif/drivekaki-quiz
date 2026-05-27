import { createClient } from "@/lib/supabase"

export interface MockTestResult {
  score: number
  total: number
  passed: boolean
  timeTakenSeconds: number
  answers: { questionId: string; selected: string | null; correct: boolean }[]
  topicBreakdown: Record<string, { correct: number; total: number }>
}

export async function saveMockTestResult(userId: string, result: MockTestResult) {
  const supabase = createClient()
  const { error } = await supabase.from("mock_test_results").insert({
    user_id: userId,
    score: result.score,
    total: result.total,
    passed: result.passed,
    time_taken_seconds: result.timeTakenSeconds,
    answers: result.answers,
    topic_breakdown: result.topicBreakdown,
  })
  if (error) throw error
}

const LAST_MOCK_KEY = "dk_last_mock_score"

export function saveLastMockScore(score: number, total: number) {
  localStorage.setItem(LAST_MOCK_KEY, JSON.stringify({ score, total, date: new Date().toISOString() }))
}

export function loadLastMockScore(): { score: number; total: number; date: string } | null {
  try {
    const raw = localStorage.getItem(LAST_MOCK_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
