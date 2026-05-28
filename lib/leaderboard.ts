import { createClient } from "@/lib/supabase"

export interface LeaderboardEntry {
  user_id: string
  username: string
  xp: number
  correct_count: number
  rank?: number
}

export function currentWeek(): string {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`
}

export async function upsertLeaderboard(xpDelta: number, correctDelta: number): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return

  const week = currentWeek()
  const username = data.user.email?.split("@")[0] ?? "Anonymous"

  // Fetch existing entry for this week
  const { data: existing } = await supabase
    .from("leaderboard_entries")
    .select("xp, correct_count")
    .eq("user_id", data.user.id)
    .eq("week", week)
    .single()

  await supabase.from("leaderboard_entries").upsert({
    user_id: data.user.id,
    username,
    xp: (existing?.xp ?? 0) + xpDelta,
    correct_count: (existing?.correct_count ?? 0) + correctDelta,
    week,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,week" })
}

export async function getWeeklyTop10(): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("leaderboard_entries")
    .select("user_id, username, xp, correct_count")
    .eq("week", currentWeek())
    .order("xp", { ascending: false })
    .limit(10)
  return (data ?? []).map((r, i) => ({ ...r, rank: i + 1 }))
}

export async function getAllTimeTop10(): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("leaderboard_entries")
    .select("user_id, username, correct_count")
    .order("correct_count", { ascending: false })
    .limit(10)
  // Aggregate by user
  const map = new Map<string, LeaderboardEntry>()
  for (const r of data ?? []) {
    const cur = map.get(r.user_id)
    if (cur) cur.correct_count += r.correct_count
    else map.set(r.user_id, { ...r, xp: 0 })
  }
  return [...map.values()]
    .sort((a, b) => b.correct_count - a.correct_count)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export async function getMyWeeklyRank(): Promise<{ rank: number; entry: LeaderboardEntry } | null> {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { count } = await supabase
    .from("leaderboard_entries")
    .select("*", { count: "exact", head: true })
    .eq("week", currentWeek())
    .gt("xp", 0)

  const { data: mine } = await supabase
    .from("leaderboard_entries")
    .select("user_id, username, xp, correct_count")
    .eq("user_id", user.user.id)
    .eq("week", currentWeek())
    .single()

  if (!mine) return null

  const { count: above } = await supabase
    .from("leaderboard_entries")
    .select("*", { count: "exact", head: true })
    .eq("week", currentWeek())
    .gt("xp", mine.xp)

  return { rank: (above ?? 0) + 1, entry: { ...mine, rank: (above ?? 0) + 1 } }
}
