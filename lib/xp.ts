export const LEVEL_TIERS = [
  { name: "Learner",           min: 0,    max: 499,      color: "#6B7280", bg: "#F3F4F6" },
  { name: "Road User",         min: 500,  max: 1499,     color: "#3B82F6", bg: "#EFF6FF" },
  { name: "Confident Driver",  min: 1500, max: 2999,     color: "#8B5CF6", bg: "#F5F3FF" },
  { name: "Safe Driver",       min: 3000, max: 4999,     color: "#F59E0B", bg: "#FFFBEB" },
  { name: "Road Master",       min: 5000, max: Infinity,  color: "#22c55e", bg: "#F0FDF4" },
] as const

export type LevelTier = (typeof LEVEL_TIERS)[number]

export function getLevelInfo(totalXP: number) {
  let idx = 0
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_TIERS[i].min) { idx = i; break }
  }
  const tier = LEVEL_TIERS[idx]
  const next = idx < LEVEL_TIERS.length - 1 ? LEVEL_TIERS[idx + 1] : null

  if (!next) {
    return { tier, tierIndex: idx, progress: 100, xpInTier: totalXP - tier.min, xpForTier: 0, isMax: true }
  }

  const xpInTier  = totalXP - tier.min
  const xpForTier = next.min - tier.min
  const progress  = Math.min(100, Math.round((xpInTier / xpForTier) * 100))
  return { tier, tierIndex: idx, progress, xpInTier, xpForTier, isMax: false }
}

export function calcXPGain(timeTakenSeconds: number, streak: number): number {
  if (streak >= 5)           return 30
  if (streak >= 3)           return 20
  if (timeTakenSeconds < 10) return 15
  return 10
}

export function xpLabel(xp: number): string {
  if (xp >= 30) return "+30 STREAK MASTER!"
  if (xp >= 20) return "+20 ON FIRE!"
  if (xp >= 15) return "+15 QUICK!"
  return "+10"
}

export function predictBTTReadyDays(
  totalSessions: number,
  totalCorrect: number,
  totalWrong: number,
  streak: number,
): number {
  const total = totalCorrect + totalWrong
  if (total === 0 || totalSessions === 0) return 21

  const accuracy = totalCorrect / total
  const avgCorrectPerSession = totalCorrect / totalSessions
  const targetCorrect = Math.ceil(49 * 0.9)
  const remaining = Math.max(0, targetCorrect - totalCorrect)

  let days: number
  if (accuracy >= 0.9 && totalSessions >= 3) {
    days = 1
  } else if (accuracy >= 0.8) {
    days = Math.max(2, Math.ceil(remaining / Math.max(avgCorrectPerSession, 1)))
    days = Math.min(days, 7)
  } else if (accuracy >= 0.7) {
    days = Math.max(5, Math.ceil(remaining / Math.max(avgCorrectPerSession * 0.8, 1)))
    days = Math.min(days, 14)
  } else {
    days = 14
  }

  if (streak >= 7)      days = Math.max(1, days - 3)
  else if (streak >= 3) days = Math.max(1, days - 1)

  return days
}
