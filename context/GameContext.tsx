"use client"

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react"
import {
  loadGameState, persistXP, persistStreak, persistHearts,
  persistSessionStats, type RawGameState,
} from "@/lib/gameState"
import { getLevelInfo, type LevelTier } from "@/lib/xp"

interface GameContextValue extends RawGameState {
  tierInfo: ReturnType<typeof getLevelInfo>
  // Actions
  addXP: (amount: number) => { leveledUp: boolean; newTier: LevelTier | null }
  loseHeart: () => void
  setHearts: (n: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  recordSession: (correct: number, wrong: number) => void
  refreshFromStorage: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RawGameState>(() => ({
    totalXP: 0, streak: 0, longestStreak: 0, lastPractice: null,
    hearts: 5, heartRefillTime: null, totalSessions: 0, totalCorrect: 0, totalWrong: 0,
  }))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setState(loadGameState())
    setMounted(true)
  }, [])

  const tierInfo = getLevelInfo(state.totalXP)

  const addXP = useCallback((amount: number) => {
    let leveledUp = false
    let newTier: LevelTier | null = null

    setState(prev => {
      const prevTier = getLevelInfo(prev.totalXP)
      const nextXP = prev.totalXP + amount
      const nextTier = getLevelInfo(nextXP)
      if (nextTier.tierIndex > prevTier.tierIndex) {
        leveledUp = true
        newTier = nextTier.tier as LevelTier
      }
      persistXP(nextXP)
      return { ...prev, totalXP: nextXP }
    })

    return { leveledUp, newTier }
  }, [])

  const loseHeart = useCallback(() => {
    setState(prev => {
      const next = Math.max(0, prev.hearts - 1)
      const refillTime = next === 0
        ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        : prev.heartRefillTime
      persistHearts(next, refillTime)
      return { ...prev, hearts: next, heartRefillTime: refillTime }
    })
  }, [])

  const setHearts = useCallback((n: number) => {
    setState(prev => {
      const clamped = Math.min(5, Math.max(0, n))
      persistHearts(clamped, clamped < 5 ? prev.heartRefillTime : null)
      return { ...prev, hearts: clamped, heartRefillTime: clamped < 5 ? prev.heartRefillTime : null }
    })
  }, [])

  const incrementStreak = useCallback(() => {
    setState(prev => {
      const next = prev.streak + 1
      const longest = Math.max(next, prev.longestStreak)
      persistStreak(next, longest)
      return { ...prev, streak: next, longestStreak: longest }
    })
  }, [])

  const resetStreak = useCallback(() => {
    setState(prev => {
      persistStreak(0, prev.longestStreak)
      return { ...prev, streak: 0 }
    })
  }, [])

  const recordSession = useCallback((correct: number, wrong: number) => {
    setState(prev => {
      const sessions = prev.totalSessions + 1
      const tc = prev.totalCorrect + correct
      const tw = prev.totalWrong + wrong
      persistSessionStats(sessions, tc, tw)
      return { ...prev, totalSessions: sessions, totalCorrect: tc, totalWrong: tw }
    })
  }, [])

  const refreshFromStorage = useCallback(() => {
    setState(loadGameState())
  }, [])

  if (!mounted) return null

  return (
    <GameContext.Provider value={{
      ...state, tierInfo,
      addXP, loseHeart, setHearts,
      incrementStreak, resetStreak,
      recordSession, refreshFromStorage,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be inside GameProvider")
  return ctx
}
