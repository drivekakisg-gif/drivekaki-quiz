"use client"

import { useEffect, useRef, useState } from "react"
import confetti from "canvas-confetti"
import {
  getOrCreateDailyChallenge,
  getTodaysAttempt,
  saveDailyAttempt,
  buildShareText,
  challengeDayNumber,
  todayISO,
  type DailyChallenge,
  type DailyAttempt,
} from "@/lib/dailyChallenge"
import { fetchQuestions } from "@/lib/questions"
import type { BttQuestion } from "@/types"
import Link from "next/link"

const LETTERS = ["A", "B", "C", "D"]

type Phase = "loading" | "error" | "quiz" | "done" | "already_done"

interface Answer {
  questionId: string
  selected: string
  correct: boolean
}

function useCountdown(targetMidnight: Date) {
  const [timeLeft, setTimeLeft] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = targetMidnight.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("00:00:00"); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMidnight])
  return timeLeft
}

function nextMidnight() {
  const d = new Date()
  d.setHours(24, 0, 0, 0)
  return d
}

export default function DailyChallengePage() {
  const [phase, setPhase]           = useState<Phase>("loading")
  const [errorMsg, setErrorMsg]     = useState("")
  const [challenge, setChallenge]   = useState<DailyChallenge | null>(null)
  const [questions, setQuestions]   = useState<BttQuestion[]>([])
  const [idx, setIdx]               = useState(0)
  const [selected, setSelected]     = useState<string | null>(null)
  const [revealed, setRevealed]     = useState(false)
  const [answers, setAnswers]       = useState<Answer[]>([])
  const [priorAttempt, setPriorAttempt] = useState<DailyAttempt | null>(null)
  const confettiFired = useRef(false)
  const midnight = nextMidnight()
  const countdown = useCountdown(midnight)

  useEffect(() => {
    async function load() {
      try {
        const ch = await getOrCreateDailyChallenge()
        setChallenge(ch)

        const prior = await getTodaysAttempt(ch.challenge_date)
        if (prior) {
          setPriorAttempt(prior)
          setPhase("already_done")
          return
        }

        const allQs = await fetchQuestions()
        const dailyQs = ch.question_ids
          .map((id) => allQs.find((q) => q.id === id))
          .filter(Boolean) as BttQuestion[]

        if (dailyQs.length < 10) throw new Error("Could not load all daily questions")
        setQuestions(dailyQs)
        setPhase("quiz")
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to load")
        setPhase("error")
      }
    }
    load()
  }, [])

  function handleSelect(letter: string) {
    if (revealed) return
    setSelected(letter)
    setRevealed(true)
  }

  function handleNext() {
    const q = questions[idx]
    const ans: Answer = {
      questionId: q.id,
      selected: selected!,
      correct: selected === q.correct,
    }
    const newAnswers = [...answers, ans]
    setAnswers(newAnswers)

    if (idx + 1 >= questions.length) {
      // Finished
      const score = newAnswers.filter((a) => a.correct).length
      saveDailyAttempt(challenge!.challenge_date, score, newAnswers).catch(console.error)
      setPriorAttempt({ score, answers: newAnswers, completed_at: new Date().toISOString() })
      setPhase("done")
    } else {
      setIdx((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  // Fire confetti once when done
  useEffect(() => {
    if (phase === "done" && !confettiFired.current) {
      confettiFired.current = true
      const score = priorAttempt?.score ?? 0
      if (score >= 8) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
      }
    }
  }, [phase, priorAttempt])

  function handleWhatsApp(shareText: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(url, "_blank")
  }

  function handleCopyShare(shareText: string) {
    navigator.clipboard.writeText(shareText).catch(() => {})
  }

  // --- Phases ---
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-4xl animate-bounce">📅</div>
        <p className="text-gray-400 text-sm">Loading today's challenge…</p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="bg-green-500 text-white font-bold px-6 py-3 rounded-xl">Retry</button>
      </div>
    )
  }

  const dayNum = challenge ? challengeDayNumber(challenge.challenge_date) : 1

  if (phase === "already_done" || phase === "done") {
    const attempt = priorAttempt!
    const shareText = buildShareText(attempt.score, dayNum, attempt.answers)
    const pct = Math.round((attempt.score / 10) * 100)

    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        {/* Result hero */}
        <div className={`rounded-2xl p-8 text-center text-white ${attempt.score >= 9 ? "bg-gradient-to-br from-green-500 to-green-600" : attempt.score >= 7 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-orange-400 to-red-500"}`}>
          <div className="text-5xl mb-1">📅</div>
          <div className="text-sm font-bold text-white/70 mb-2">DriveKaki Daily #{dayNum}</div>
          <div className="text-6xl font-black mb-2">{attempt.score}/10</div>
          <div className="text-2xl mb-3">
            {attempt.answers.map((a, i) => (
              <span key={i}>{a.correct ? "✅" : "❌"}</span>
            ))}
          </div>
          <p className="text-white/80 text-sm">{pct}% correct{attempt.score === 10 ? " — Perfect! 🏆" : attempt.score >= 8 ? " — Great job!" : " — Keep practising!"}</p>
        </div>

        {/* Share buttons */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Share your result</h3>
          <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-700 mb-4 whitespace-pre-wrap">{shareText}</div>
          <div className="flex gap-3">
            <button
              onClick={() => handleWhatsApp(shareText)}
              className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span className="text-lg">💬</span> WhatsApp
            </button>
            <button
              onClick={() => handleCopyShare(shareText)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Come back tomorrow */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <div className="text-3xl mb-2">🌙</div>
          <h3 className="font-bold text-gray-900 mb-1">Come back tomorrow!</h3>
          <p className="text-gray-400 text-sm mb-3">Next challenge in</p>
          <div className="text-3xl font-black text-green-500 tabular-nums">{countdown}</div>
        </div>

        {/* Review wrong answers */}
        {attempt.answers.some((a) => !a.correct) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Missed ({attempt.answers.filter((a) => !a.correct).length})
            </h3>
            <div className="space-y-2">
              {attempt.answers.filter((a) => !a.correct).map((a, i) => {
                const q = questions.find((q) => q.id === a.questionId)
                if (!q) return null
                return (
                  <div key={i} className="bg-red-50 rounded-xl p-3 text-xs">
                    <p className="font-medium text-gray-800 mb-1">{q.question}</p>
                    <p className="text-red-500">Your answer: {a.selected}</p>
                    <p className="text-green-600 font-semibold">Correct: {q.correct}</p>
                    <p className="text-gray-500 mt-1">{q.explanation}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Link href="/" className="block text-center text-green-600 font-semibold py-3">← Back to Home</Link>
      </div>
    )
  }

  // Quiz phase
  const q = questions[idx]
  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-black text-gray-900 text-lg">Daily Challenge</h1>
          <p className="text-xs text-gray-400">#{dayNum} · {todayISO()}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-green-500">{idx + 1}/10</div>
          <div className="text-xs text-gray-400">{answers.filter((a) => a.correct).length} correct</div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-all ${
              i < answers.length
                ? answers[i].correct ? "bg-green-500" : "bg-red-400"
                : i === idx ? "bg-green-300" : "bg-gray-100"
            }`}
          />
        ))}
      </div>

      {/* Topic badge */}
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 mb-4 inline-block">
        {q.topic}
      </span>

      {/* Question */}
      <p className="text-xl font-bold text-gray-900 mb-6 leading-snug">{q.question}</p>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {q.options.map((opt, i) => {
          const letter = LETTERS[i]
          const isSelected = selected === letter
          const isCorrect = q.correct === letter
          let cls = "w-full text-left p-4 rounded-2xl border-2 font-semibold transition-all text-sm "
          if (!revealed) {
            cls += isSelected
              ? "border-blue-400 bg-blue-50 text-blue-800"
              : "border-gray-200 bg-white text-gray-800 hover:border-green-300"
          } else {
            if (isCorrect)        cls += "border-green-500 bg-green-50 text-green-800"
            else if (isSelected)  cls += "border-red-400 bg-red-50 text-red-700"
            else                  cls += "border-gray-100 bg-gray-50 text-gray-400"
          }
          return (
            <button key={letter} className={cls} onClick={() => handleSelect(letter)}>
              <span className="font-black mr-2">{letter}.</span>
              {opt.replace(/^[A-D]\.\s*/, "")}
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div className={`rounded-2xl p-4 mb-4 text-sm leading-relaxed border ${selected === q.correct ? "bg-green-50 border-green-200 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
          <p className="font-semibold mb-1">{selected === q.correct ? "✓ Correct!" : `✗ Answer: ${q.correct}`}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {revealed && (
        <button
          onClick={handleNext}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          {idx + 1 >= questions.length ? "See Results →" : "Next →"}
        </button>
      )}
      {!revealed && <p className="text-center text-xs text-gray-300 mt-2">Tap an answer to continue</p>}
    </div>
  )
}
