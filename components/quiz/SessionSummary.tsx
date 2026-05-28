"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import Mascot from "@/components/Mascot"
import ScoreCard from "@/components/ScoreCard"
import CoachModal from "@/components/CoachModal"
import { useGame } from "@/context/GameContext"
import { predictBTTReadyDays } from "@/lib/xp"
import type { BttQuestion, QuizAttempt } from "@/types"

interface SessionSummaryProps {
  sessionXP: number
  sessionCorrect: number
  sessionWrong: number
  timeTakenSeconds: number
  questions: BttQuestion[]
  attempts: QuizAttempt[]
  onRestart: () => void
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const pct = Math.min((ts - start) / duration, 1)
      setVal(Math.round(pct * target))
      if (pct < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

export default function SessionSummary({
  sessionXP, sessionCorrect, sessionWrong,
  timeTakenSeconds, questions, attempts, onRestart,
}: SessionSummaryProps) {
  const { streak, totalXP, tierInfo, totalSessions, totalCorrect: allCorrect, totalWrong: allWrong } = useGame()
  const total = sessionCorrect + sessionWrong
  const accuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
  const isPerfect = sessionWrong === 0
  const passed = accuracy >= 90

  // Unique session ID for CoachModal dedup
  const sessionId = useRef(`session-${Date.now()}`).current
  const [showCoach, setShowCoach] = useState(true)

  const displayXP  = useCountUp(sessionXP)
  const displayAcc = useCountUp(accuracy)

  const mins = Math.floor(timeTakenSeconds / 60)
  const secs = timeTakenSeconds % 60

  const bttDays = predictBTTReadyDays(totalSessions, allCorrect, allWrong, streak)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    if (isPerfect) {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, colors: ["#22c55e","#f59e0b","#3b82f6","#ec4899"] })
    } else if (passed) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
    }
  }, [isPerfect, passed])

  const wrongAttempts = attempts.filter(a => !a.correct)
  const wrongQuestions = wrongAttempts
    .map(a => questions.find(q => q.id === a.questionId))
    .filter(Boolean) as BttQuestion[]

  // Topic stats for ScoreCard
  const topicMap: Record<string, { correct: number; total: number }> = {}
  for (const a of attempts) {
    const q = questions.find(q => q.id === a.questionId)
    if (!q) continue
    if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 }
    topicMap[q.topic].total++
    if (a.correct) topicMap[q.topic].correct++
  }
  const topicStats = Object.entries(topicMap).map(([topic, s]) => ({ topic, ...s }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className={`rounded-3xl p-8 text-center text-white ${
        isPerfect ? "bg-gradient-to-br from-amber-400 to-orange-500" :
        passed    ? "bg-gradient-to-br from-green-500 to-green-600" :
                    "bg-gradient-to-br from-slate-500 to-slate-700"
      }`}>
        <Mascot mood={isPerfect ? "celebrating" : passed ? "happy" : "neutral"} size={80} className="mx-auto mb-3" />
        {isPerfect && <p className="text-white/90 font-black text-sm uppercase tracking-widest mb-1">PERFECT SESSION ⭐</p>}
        <div className="text-5xl font-black tabular-nums mb-1">{displayAcc}%</div>
        <div className="text-xl font-bold mb-1">{passed ? "Great session!" : "Keep practising!"}</div>
        <div className="text-white/75 text-sm">
          {sessionCorrect} correct · {sessionWrong} wrong · {mins}m {secs}s
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-amber-500">+{displayXP}</div>
          <div className="text-xs text-gray-400 mt-0.5">XP earned</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-orange-500">{streak} 🔥</div>
          <div className="text-xs text-gray-400 mt-0.5">Streak</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-black" style={{ color: tierInfo.tier.color }}>
            {tierInfo.tier.name.split(" ")[0]}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Level</div>
        </div>
      </div>

      {/* BTT prediction */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <p className="text-green-800 font-bold text-sm">
          {bttDays <= 1
            ? "🎉 You're ready to book your BTT now!"
            : `🎯 At your current pace, you'll be ready to book BTT in ${bttDays} days.`}
        </p>
        <p className="text-green-600 text-xs mt-1">
          Every session moves you closer. Don't break the streak.
        </p>
      </div>

      {/* Missed questions */}
      {wrongQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Review these {wrongQuestions.length} question{wrongQuestions.length > 1 ? "s" : ""}</h3>
          <div className="space-y-3">
            {wrongQuestions.map(q => {
              const attempt = attempts.find(a => a.questionId === q.id)!
              const letters = ["A","B","C","D"]
              return (
                <div key={q.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 text-xs">
                  <p className="font-semibold text-gray-800 mb-1.5">{q.question}</p>
                  <p className="text-red-500">✗ Your answer: {attempt.selected} — {q.options[letters.indexOf(attempt.selected ?? "")]?.replace(/^[A-D]\.\s*/,"")}</p>
                  <p className="text-green-600 font-semibold mt-0.5">✓ Correct: {q.correct} — {q.options[letters.indexOf(q.correct)]?.replace(/^[A-D]\.\s*/,"")}</p>
                  <p className="text-gray-400 mt-1 leading-relaxed">{q.explanation}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Share score card */}
      <ScoreCard
        score={sessionCorrect}
        total={sessionCorrect + sessionWrong}
        sessionXP={sessionXP}
        topicStats={topicStats}
      />

      {/* Actions */}
      <div className="flex flex-col gap-3 pb-8">
        <button
          onClick={onRestart}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          Practice Again 🔥
        </button>
        <Link
          href="/"
          className="w-full bg-white border-2 border-gray-200 hover:border-green-400 text-gray-700 font-semibold py-3.5 rounded-2xl text-center transition-colors"
        >
          Home
        </Link>
      </div>

      {showCoach && (
        <CoachModal
          sessionId={sessionId}
          sessionAttempts={attempts.map(a => ({ questionId: a.questionId, correct: a.correct }))}
          onDismiss={() => setShowCoach(false)}
        />
      )}
    </div>
  )
}
