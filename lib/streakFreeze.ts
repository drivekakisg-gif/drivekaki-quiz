const KEY_FREEZES    = "dk_streak_freezes"
const KEY_FREEZE_WEEK = "dk_freeze_week_used"

function currentWeekStr(): string {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`
}

export function getFreezesOwned(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(KEY_FREEZES) ?? "0")
}

export function hasUsedFreeWeeklyFreeze(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(KEY_FREEZE_WEEK) === currentWeekStr()
}

export function claimFreeWeeklyFreeze(): boolean {
  if (hasUsedFreeWeeklyFreeze()) return false
  const cur = getFreezesOwned()
  localStorage.setItem(KEY_FREEZES, String(cur + 1))
  localStorage.setItem(KEY_FREEZE_WEEK, currentWeekStr())
  return true
}

export function buyFreeze(currentXP: number): { success: boolean; newXP: number } {
  const COST = 200
  if (currentXP < COST) return { success: false, newXP: currentXP }
  const newXP = currentXP - COST
  localStorage.setItem(KEY_FREEZES, String(getFreezesOwned() + 1))
  localStorage.setItem("dk_total_xp", String(newXP))
  return { success: true, newXP }
}

export function useFreeze(): boolean {
  const cur = getFreezesOwned()
  if (cur <= 0) return false
  localStorage.setItem(KEY_FREEZES, String(cur - 1))
  return true
}
