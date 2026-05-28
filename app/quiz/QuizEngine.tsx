"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import confetti from "canvas-confetti"
import { useGame } from "@/context/GameContext"
import { fetchQuestions } from "@/lib/questions"
import { upsertSRCards } from "@/lib/spacedRepetition"
import { upsertTopicMastery } from "@/lib/topicMastery"
import { saveAttempts } from "@/lib/saveAttempts"
import { sounds } from "@/lib/sounds"
import { calcXPGain, xpLabel } from "@/lib/xp"
import { getRandomFact } from "@/lib/funFacts"
import { createClient } from "@/lib/supabase"
import type { BttQuestion, QuizAttempt } from "@/types"

import TopBar from "@/components/quiz/TopBar"
import AnswerButton, { getButtonState } from "@/components/quiz/AnswerButton"
import XPFloat, { useXPFloats } from "@/components/quiz/XPFloat"
import MilestoneToast from "@/components/quiz/MilestoneToast"
import LevelUpModal from "@/components/quiz/LevelUpModal"
import SessionOver from "@/components/quiz/SessionOver"
import SessionSummary from "@/components/quiz/SessionSummary"
import Mascot from "@/components/Mascot"
import type { MascotMood } from "@/components/Mascot"
import type { LevelTier } from "@/lib/xp"

type Phase = "loading" | "error" | "quiz" | "session_over" | "summary"

const LETTERS = ["A","B","C","D"]

export default function QuizEngine() {
  const game = useGame()
  const searchParams = useSearchParams()
  const topicFilter = searchParams.get("topic")

  // Questions
  const [questions, setQuestions]   = useState<BttQuestion[]>([])
  const [errorMsg, setErrorMsg]     = useState("")
  const [phase, setPhase]           = useState<Phase>("loading")

  // Per-question state
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected]     = useState<string | null>(null)
  const [revealed, setRevealed]     = useState(false)

  // Session tracking
  const [attempts, setAttempts]         = useState<QuizAttempt[]>([])
  const [sessionXP, setSessionXP]       = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong]     = useState(0)
  const [sessionStart]                  = useState(() => Date.now())
  const questionStart                   = useRef(Date.now())

  // UI overlays
  const [mascotMood, setMascotMood]       = useState<MascotMood>("neutral")
  const [showMilestone, setShowMilestone] = useState(false)
  const [showLevelUp, setShowLevelUp]     = useState(false)
  const [levelUpTier, setLevelUpTier]     = useState<LevelTier | null>(null)
  const [screenFlash, setScreenFlash]     = useState(false)
  const [funFact, setFunFact]             = useState("")

  const { floats, spawnFloat, expireFloat } = useXPFloats()

  // --- Load questions ---
  useEffect(() => {
    // Check hearts before loading
    if (game.hearts <= 0) {
      setPhase("session_over")
      return
    }
    fetchQuestions()
      .then(qs => {
        const filtered = topicFilter ? qs.filter(q => q.topic === topicFilter) : qs
        setQuestions([...filtered].sort(() => Math.random() - 0.5))
        setPhase("quiz")
        questionStart.current = Date.now()
      })
      .catch(e => { setErrorMsg(e?.message ?? "Failed to load questions"); setPhase("error") })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentQ = questions[currentIdx]
  const progress = questions.length > 0
    ? Math.round((sessionCorrect / questions.length) * 100)
    : 0

  // --- Answer selection ---
  function handleSelect(letter: string) {
    if (revealed || selected !== null) return
    setSelected(letter)
    setRevealed(true)

    const timeTaken = Math.round((Date.now() - questionStart.current) / 1000)
    const isCorrect = letter === currentQ.correct
    const newStreak = isCorrect ? game.streak + 1 : 0
    const xp = calcXPGain(timeTaken, newStreak)

    if (isCorrect) {
      sounds.play("correct")
      game.incrementStreak()
      const { leveledUp, newTier } = game.addXP(xp)
      setSessionXP(prev => prev + xp)
      setSessionCorrect(prev => prev + 1)
      spawnFloat(xp, xpLabel(xp))

      setMascotMood(newStreak >= 5 ? "fire" : "happy")
      setTimeout(() => setMascotMood("neutral"), 1500)

      // Milestone every 5 correct
      if ((sessionCorrect + 1) % 5 === 0) {
        sounds.play("confetti")
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } })
      }

      // Streak milestones
      if (newStreak === 10) {
        sounds.play("streak")
        setScreenFlash(true)
        setTimeout(() => setScreenFlash(false), 600)
        setShowMilestone(true)
        setTimeout(() => setShowMilestone(false), 2500)
      } else if (newStreak === 5) {
        sounds.play("streak")
        setShowMilestone(true)
        setTimeout(() => setShowMilestone(false), 2000)
      }

      // Level up
      if (leveledUp && newTier) {
        sounds.play("levelup")
        setLevelUpTier(newTier)
        setShowLevelUp(true)
      }
    } else {
      sounds.play("wrong")
      game.loseHeart()
      game.resetStreak()
      setSessionWrong(prev => prev + 1)
      setMascotMood("sad")
      setFunFact(getRandomFact())
      setTimeout(() => setMascotMood("neutral"), 1500)
    }

    setAttempts(prev => [...prev, {
      questionId: currentQ.id,
      selected: letter,
      correct: isCorrect,
      timeTakenSeconds: timeTaken,
    }])
  }

  // --- Continue / Next ---
  function handleContinue() {
    // Check if we're now out of hearts
    if (game.hearts <= 0) {
      finishSession(true)
      return
    }

    if (currentIdx + 1 >= questions.length) {
      finishSession(false)
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setRevealed(false)
      questionStart.current = Date.now()
    }
  }

  function finishSession(heartDepleted: boolean) {
    const correct  = attempts.filter(a => a.correct).length
    const wrong    = attempts.length - correct
    game.recordSession(correct, wrong)

    // Persist to Supabase fire-and-forget
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) saveAttempts(data.user.id, attempts).catch(console.error)
    })

    // Spaced repetition + topic mastery (fire-and-forget, no auth required to enqueue)
    const srInput = attempts.map(a => ({ questionId: a.questionId, correct: a.correct }))
    upsertSRCards(srInput).catch(console.error)

    const topicInput = attempts.map(a => {
      const q = questions.find(q => q.id === a.questionId)
      return q ? { topic: q.topic, correct: a.correct } : null
    }).filter(Boolean) as { topic: string; correct: boolean }[]
    upsertTopicMastery(topicInput).catch(console.error)

    setPhase(heartDepleted ? "session_over" : "summary")
  }

  function handleRestart() {
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5))
    setCurrentIdx(0)
    setSelected(null)
    setRevealed(false)
    setAttempts([])
    setSessionXP(0)
    setSessionCorrect(0)
    setSessionWrong(0)
    questionStart.current = Date.now()
    setPhase("quiz")
  }

  // --- Render phases ---
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Mascot mood="neutral" size={80} className="animate-bounce" />
        <p className="text-gray-400 text-sm font-medium">Loading questions…</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn't load questions</h2>
        <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-green-500 text-white font-bold px-6 py-3 rounded-xl">Retry</button>
      </div>
    )
  }

  if (phase === "session_over") {
    return (
      <SessionOver
        heartRefillTime={game.heartRefillTime}
        onRefreshed={() => { game.refreshFromStorage(); if (game.hearts > 0) handleRestart() }}
      />
    )
  }

  if (phase === "summary") {
    return (
      <SessionSummary
        sessionXP={sessionXP}
        sessionCorrect={sessionCorrect}
        sessionWrong={sessionWrong}
        timeTakenSeconds={Math.round((Date.now() - sessionStart) / 1000)}
        questions={questions}
        attempts={attempts}
        onRestart={handleRestart}
      />
    )
  }

  if (!currentQ) return null

  return (
    <>
      {/* Screen flash for streak 10 */}
      {screenFlash && (
        <div className="fixed inset-0 z-50 bg-orange-400 pointer-events-none animate-ping opacity-30" />
      )}

      <TopBar progress={progress} sessionXP={sessionXP} />

      <MilestoneToast streak={game.streak} visible={showMilestone} />

      <LevelUpModal
        visible={showLevelUp}
        tier={levelUpTier}
        onContinue={() => setShowLevelUp(false)}
      />

      <XPFloat floats={floats} onExpire={expireFloat} />

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Topic + difficulty */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            {currentQ.topic}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            currentQ.difficulty === "hard"   ? "bg-red-100 text-red-600" :
            currentQ.difficulty === "medium" ? "bg-yellow-100 text-yellow-600" :
                                               "bg-green-50 text-green-600"
          }`}>
            {currentQ.difficulty}
          </span>
          <span className="ml-auto">
            <Mascot mood={mascotMood} size={36} />
          </span>
        </div>

        {/* Question */}
        <p className="text-xl font-bold text-gray-900 mb-6 leading-snug">
          {currentQ.question}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-4">
          {currentQ.options.map((opt, i) => {
            const letter = LETTERS[i]
            return (
              <AnswerButton
                key={letter}
                letter={letter}
                text={opt.replace(/^[A-D]\.\s*/, "")}
                state={getButtonState(letter, selected, revealed, currentQ.correct)}
                onClick={() => handleSelect(letter)}
              />
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <>
            <div className={`rounded-2xl p-4 mb-3 border text-sm leading-relaxed ${
              selected === currentQ.correct
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}>
              <p className="font-semibold mb-1">
                {selected === currentQ.correct ? "✓ Correct!" : `✗ Correct answer: ${currentQ.correct}`}
              </p>
              <p>{currentQ.explanation}</p>
            </div>
            {selected !== currentQ.correct && funFact && (
              <div className="rounded-2xl p-4 mb-3 bg-amber-50 border border-amber-200 text-sm text-amber-800 leading-relaxed">
                <p className="font-semibold mb-1">💡 Did you know?</p>
                <p>{funFact}</p>
              </div>
            )}
          </>
        )}

        {/* Continue button */}
        {revealed && (
          <button
            onClick={handleContinue}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-black py-4 rounded-2xl text-lg transition-colors"
          >
            {currentIdx + 1 >= questions.length ? "See Results →" : "Continue →"}
          </button>
        )}

        {!revealed && (
          <p className="text-center text-xs text-gray-300 mt-2">Tap an answer to continue</p>
        )}
      </div>
    </>
  )
}
