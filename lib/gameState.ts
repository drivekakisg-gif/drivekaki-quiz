const K = {
  TOTAL_XP:       'dk_total_xp',
  STREAK:         'dk_streak',
  LONGEST_STREAK: 'dk_longest_streak',
  LAST_PRACTICE:  'dk_last_practice',
  HEARTS:         'dk_hearts',
  HEART_REFILL:   'dk_heart_refill_time',
  TOTAL_SESSIONS: 'dk_total_sessions',
  TOTAL_CORRECT:  'dk_total_correct',
  TOTAL_WRONG:    'dk_total_wrong',
} as const

export interface RawGameState {
  totalXP: number
  streak: number
  longestStreak: number
  lastPractice: string | null
  hearts: number
  heartRefillTime: string | null
  totalSessions: number
  totalCorrect: number
  totalWrong: number
}

function num(key: string, fallback = 0): number {
  const v = localStorage.getItem(key)
  const n = parseInt(v ?? '')
  return isNaN(n) ? fallback : n
}

export function loadGameState(): RawGameState {
  if (typeof window === 'undefined') return defaults()

  const today = todayStr()
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
  const lastPractice = localStorage.getItem(K.LAST_PRACTICE)

  // Expire streak if no practice yesterday or today
  let streak = num(K.STREAK)
  if (lastPractice && lastPractice !== today && lastPractice !== yesterday) {
    streak = 0
    localStorage.setItem(K.STREAK, '0')
  }

  // Refill hearts if 4 hours have elapsed
  const heartRefillTime = localStorage.getItem(K.HEART_REFILL)
  let hearts = Math.min(num(K.HEARTS, 5), 5)
  if (heartRefillTime && Date.now() >= new Date(heartRefillTime).getTime()) {
    hearts = 5
    localStorage.setItem(K.HEARTS, '5')
    localStorage.removeItem(K.HEART_REFILL)
  }

  return {
    totalXP:       num(K.TOTAL_XP),
    streak,
    longestStreak: num(K.LONGEST_STREAK),
    lastPractice,
    hearts,
    heartRefillTime: hearts < 5 ? localStorage.getItem(K.HEART_REFILL) : null,
    totalSessions:  num(K.TOTAL_SESSIONS),
    totalCorrect:   num(K.TOTAL_CORRECT),
    totalWrong:     num(K.TOTAL_WRONG),
  }
}

function defaults(): RawGameState {
  return { totalXP: 0, streak: 0, longestStreak: 0, lastPractice: null, hearts: 5, heartRefillTime: null, totalSessions: 0, totalCorrect: 0, totalWrong: 0 }
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function persistXP(totalXP: number) {
  localStorage.setItem(K.TOTAL_XP, String(totalXP))
}

export function persistStreak(streak: number, longest: number) {
  localStorage.setItem(K.STREAK, String(streak))
  localStorage.setItem(K.LONGEST_STREAK, String(longest))
  localStorage.setItem(K.LAST_PRACTICE, todayStr())
}

export function persistHearts(hearts: number, refillTime?: string | null) {
  localStorage.setItem(K.HEARTS, String(hearts))
  if (refillTime) {
    localStorage.setItem(K.HEART_REFILL, refillTime)
  } else {
    localStorage.removeItem(K.HEART_REFILL)
  }
}

export function persistSessionStats(sessions: number, correct: number, wrong: number) {
  localStorage.setItem(K.TOTAL_SESSIONS, String(sessions))
  localStorage.setItem(K.TOTAL_CORRECT, String(correct))
  localStorage.setItem(K.TOTAL_WRONG, String(wrong))
}
