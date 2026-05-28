import { createClient } from "@/lib/supabase"
import type { BttQuestion } from "@/types"

export interface TopicStats {
  topic: string
  correct: number
  total: number
  pct: number
  wrongQuestionIds: string[]
}

export interface CoachReport {
  weakestTopic: TopicStats
  weeklyWrongCount: number          // times this topic answered wrong in last 7d
  consequence: string               // explanation from a wrong question
  mnemonics: string[]               // memory tricks derived from explanations
  drillQuestions: BttQuestion[]     // 3 questions from weakest topic
  allTopics: TopicStats[]
}

const SESSION_KEY = "dk_coaching_seen"

export function markCoachingSeen(sessionId: string) {
  if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, sessionId)
}

export function hasSeenCoaching(sessionId: string): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(SESSION_KEY) === sessionId
}

// Pull last 7 days of attempts for the current user
async function fetchRecentAttempts(): Promise<{ question_id: string; correct: boolean; created_at: string }[]> {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return []

  const since = new Date(Date.now() - 7 * 86400_000).toISOString()
  const { data } = await supabase
    .from("quiz_attempts")
    .select("question_id, correct, created_at")
    .eq("user_id", user.user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function generateCoachReport(
  allQuestions: BttQuestion[],
  sessionAttempts: { questionId: string; correct: boolean }[],
): Promise<CoachReport | null> {
  const recentDb = await fetchRecentAttempts()

  // Merge session attempts (may not be saved to DB yet) with recent DB history
  const allAttempts: { questionId: string; correct: boolean }[] = [
    ...sessionAttempts,
    ...recentDb.map(r => ({ questionId: r.question_id, correct: r.correct })),
  ]

  // Aggregate per topic
  const topicMap = new Map<string, { correct: number; total: number; wrongIds: Set<string> }>()
  for (const a of allAttempts) {
    const q = allQuestions.find(q => q.id === a.questionId)
    if (!q) continue
    if (!topicMap.has(q.topic)) topicMap.set(q.topic, { correct: 0, total: 0, wrongIds: new Set() })
    const t = topicMap.get(q.topic)!
    t.total++
    if (a.correct) t.correct++
    else t.wrongIds.add(q.id)
  }

  if (topicMap.size === 0) return null

  const topicStats: TopicStats[] = [...topicMap.entries()]
    .map(([topic, s]) => ({
      topic,
      correct: s.correct,
      total: s.total,
      pct: Math.round((s.correct / s.total) * 100),
      wrongQuestionIds: [...s.wrongIds],
    }))
    .sort((a, b) => a.pct - b.pct)

  const weakest = topicStats[0]

  // Weekly wrong count for weakest topic (DB only, last 7 days)
  const weeklyWrongCount = recentDb.filter(r => {
    const q = allQuestions.find(q => q.id === r.question_id)
    return q?.topic === weakest.topic && !r.correct
  }).length

  // Pick a wrong question from weakest topic for consequence + mnemonic
  const wrongQs = weakest.wrongQuestionIds
    .map(id => allQuestions.find(q => q.id === id))
    .filter(Boolean) as BttQuestion[]

  const consequence = wrongQs[0]?.explanation ?? allQuestions.find(q => q.topic === weakest.topic)?.explanation ?? ""

  // Generate mnemonics from explanations of wrong questions (first sentence of each explanation)
  const mnemonics = wrongQs
    .slice(0, 3)
    .map(q => buildMnemonic(q))
    .filter(Boolean)

  // Pick 3 drill questions from the weakest topic (not ones they got right this session)
  const sessionCorrectIds = new Set(sessionAttempts.filter(a => a.correct).map(a => a.questionId))
  const drillPool = allQuestions
    .filter(q => q.topic === weakest.topic && !sessionCorrectIds.has(q.id))
    .sort(() => Math.random() - 0.5)
  const drillQuestions = drillPool.slice(0, 3)

  return { weakestTopic: weakest, weeklyWrongCount, consequence, mnemonics, drillQuestions, allTopics: topicStats }
}

function buildMnemonic(q: BttQuestion): string {
  // Extract the first sentence of the explanation as the memory hook
  const first = q.explanation.split(/[.!]/)[0]?.trim()
  if (!first) return ""
  // Prefix with a mnemonic cue based on the answer
  return `For "${q.question.slice(0, 60)}…": ${first}.`
}
