"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchQuestions } from "@/lib/questions"
import { upsertTopicMastery } from "@/lib/topicMastery"
import type { BttQuestion } from "@/types"

const LETTERS = ["A", "B", "C", "D"]
const PLACEMENT_COUNT = 5
const ONBOARDING_KEY = "dk_onboarding_done"

type Phase = "welcome" | "quiz" | "done"

export default function OnboardingPage() {
  const router = useRouter()
  const [phase, setPhase]         = useState<Phase>("welcome")
  const [questions, setQuestions] = useState<BttQuestion[]>([])
  const [idx, setIdx]             = useState(0)
  const [selected, setSelected]   = useState<string | null>(null)
  const [revealed, setRevealed]   = useState(false)
  const [results, setResults]     = useState<{ topic: string; correct: boolean }[]>([])

  useEffect(() => {
    // Skip if already done
    if (typeof window !== "undefined" && localStorage.getItem(ONBOARDING_KEY)) {
      router.replace("/")
    }
  }, [router])

  async function startPlacement() {
    const all = await fetchQuestions()
    // Pick 1 question from each of up to 5 different topics
    const byTopic: Record<string, BttQuestion[]> = {}
    for (const q of all) {
      if (!byTopic[q.topic]) byTopic[q.topic] = []
      byTopic[q.topic].push(q)
    }
    const topics = Object.keys(byTopic).sort(() => Math.random() - 0.5).slice(0, PLACEMENT_COUNT)
    const picked = topics.map((t) => {
      const qs = byTopic[t]
      return qs[Math.floor(Math.random() * qs.length)]
    })
    setQuestions(picked)
    setPhase("quiz")
  }

  function handleSelect(letter: string) {
    if (revealed) return
    setSelected(letter)
    setRevealed(true)
  }

  async function handleNext() {
    const q = questions[idx]
    const correct = selected === q.correct
    const newResults = [...results, { topic: q.topic, correct }]
    setResults(newResults)

    if (idx + 1 >= questions.length) {
      // Save placement mastery
      await upsertTopicMastery(newResults).catch(console.error)
      localStorage.setItem(ONBOARDING_KEY, "1")
      setPhase("done")
    } else {
      setIdx((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function skip() {
    localStorage.setItem(ONBOARDING_KEY, "1")
    router.replace("/")
  }

  if (phase === "welcome") {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to DriveKaki!</h1>
        <p className="text-gray-500 mb-2">Singapore&apos;s smartest BTT/FTT practice app.</p>
        <p className="text-gray-400 text-sm mb-8">
          Take a quick 5-question placement test so we can personalise your experience.
          It only takes 2 minutes.
        </p>

        <div className="space-y-3">
          <button
            onClick={startPlacement}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors"
          >
            Start Placement Test →
          </button>
          <button
            onClick={skip}
            className="w-full text-gray-400 hover:text-gray-600 font-medium py-3 text-sm transition-colors"
          >
            Skip for now
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[["49", "BTT Questions"], ["5", "Study Modes"], ["∞", "Practice"]].map(([n, l]) => (
            <div key={l} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="text-xl font-black text-green-500">{n}</div>
              <div className="text-xs text-gray-400">{l}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (phase === "done") {
    const correct = results.filter((r) => r.correct).length
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Placement complete!</h2>
        <p className="text-gray-500 mb-2">You got {correct}/{PLACEMENT_COUNT} correct.</p>
        <p className="text-gray-400 text-sm mb-8">
          {correct >= 4
            ? "Great foundation! We'll focus your practice on your weaker areas."
            : correct >= 2
            ? "Good start! Plenty of room to improve — we've got you covered."
            : "No worries — everyone starts somewhere. We'll build you up from the basics."}
        </p>
        <button
          onClick={() => router.replace("/")}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          Start Practising →
        </button>
      </div>
    )
  }

  const q = questions[idx]
  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-black text-gray-900">Placement Test</h1>
          <p className="text-xs text-gray-400">Helps us personalise your learning</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-green-500">{idx + 1}/{PLACEMENT_COUNT}</span>
          <button onClick={skip} className="text-xs text-gray-400 hover:text-gray-600">Skip</button>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${(idx / PLACEMENT_COUNT) * 100}%` }} />
      </div>

      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 mb-4 inline-block">{q.topic}</span>

      <p className="text-xl font-bold text-gray-900 mb-6 leading-snug">{q.question}</p>

      <div className="space-y-3 mb-4">
        {q.options.map((opt, i) => {
          const letter = LETTERS[i]
          const isSelected = selected === letter
          const isCorrect = q.correct === letter
          let cls = "w-full text-left p-4 rounded-2xl border-2 font-semibold transition-all text-sm "
          if (!revealed) {
            cls += isSelected ? "border-blue-400 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-800 hover:border-green-300"
          } else {
            if (isCorrect)       cls += "border-green-500 bg-green-50 text-green-800"
            else if (isSelected) cls += "border-red-400 bg-red-50 text-red-700"
            else                 cls += "border-gray-100 bg-gray-50 text-gray-400"
          }
          return (
            <button key={letter} className={cls} onClick={() => handleSelect(letter)}>
              <span className="font-black mr-2">{letter}.</span>
              {opt.replace(/^[A-D]\.\s*/, "")}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className={`rounded-2xl p-4 mb-4 text-sm border ${selected === q.correct ? "bg-green-50 border-green-200 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
          <p className="font-semibold mb-1">{selected === q.correct ? "✓ Correct!" : `✗ Answer: ${q.correct}`}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {revealed && (
        <button onClick={handleNext} className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors">
          {idx + 1 >= PLACEMENT_COUNT ? "See Results →" : "Next →"}
        </button>
      )}
      {!revealed && <p className="text-center text-xs text-gray-300 mt-2">Tap an answer to continue</p>}
    </div>
  )
}
