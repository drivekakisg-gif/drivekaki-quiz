import { createClient } from "@/lib/supabase"

export interface TopicMasteryRow {
  topic: string
  total: number
  correct: number
  mastery_pct: number
}

// BTT topic unlock order — later topics require earlier ones at 70%
export const TOPIC_ORDER = [
  "Road Signs",
  "Traffic Signals",
  "Road Markings",
  "Rules of the Road",
  "Intersections",
  "Expressways",
  "Pedestrians & Cyclists",
  "Hazard Awareness",
  "Vehicle Safety",
  "Eco-Driving",
]

export function getPrerequisite(topic: string): string | null {
  const idx = TOPIC_ORDER.indexOf(topic)
  if (idx <= 0) return null
  return TOPIC_ORDER[idx - 1]
}

export async function getTopicMastery(): Promise<TopicMasteryRow[]> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return []

  const { data: rows } = await supabase
    .from("topic_mastery")
    .select("topic, total, correct, mastery_pct")
    .eq("user_id", data.user.id)

  return (rows ?? []) as TopicMasteryRow[]
}

export async function upsertTopicMastery(
  attempts: { topic: string; correct: boolean }[],
): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return

  const userId = data.user.id

  // Aggregate by topic
  const delta: Record<string, { total: number; correct: number }> = {}
  for (const a of attempts) {
    if (!delta[a.topic]) delta[a.topic] = { total: 0, correct: 0 }
    delta[a.topic].total++
    if (a.correct) delta[a.topic].correct++
  }

  // Fetch current mastery rows
  const topics = Object.keys(delta)
  const { data: existing } = await supabase
    .from("topic_mastery")
    .select("*")
    .eq("user_id", userId)
    .in("topic", topics)

  const existMap = new Map((existing ?? []).map((r) => [r.topic, r]))

  const upserts = topics.map((topic) => {
    const d = delta[topic]
    const cur = existMap.get(topic) ?? { total: 0, correct: 0 }
    const newTotal   = (cur.total ?? 0)   + d.total
    const newCorrect = (cur.correct ?? 0) + d.correct
    const mastery_pct = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0
    return {
      user_id: userId,
      topic,
      total: newTotal,
      correct: newCorrect,
      mastery_pct,
      updated_at: new Date().toISOString(),
    }
  })

  await supabase
    .from("topic_mastery")
    .upsert(upserts, { onConflict: "user_id,topic" })
}
