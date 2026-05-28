"use client"

import { useEffect, useRef, useState } from "react"
import { getDueQuestionIds, upsertSRCards } from "@/lib/spacedRepetition"
import { fetchQuestions } from "@/lib/questions"
import type { BttQuestion } from "@/types"
import Link from "next/link"
import confetti from "canvas-confetti"

const LETTERS = ["A", "B", "C", "D"]

type Phase = "loading" | "empty" | "quiz" | "done"

interface Answer { questionId: string; correct: boolean }

export default function ReviewPage() {
  const [phase, setPhase]       = useState<Phase>("loading")
  const [questions, setQuestions] = useState<BttQuestion[]>([])
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers]   = useState<Answer[]>([])
  const confettiFired = useRef(false)

  useEffect(() => {
    async function load() {
      const dueIds = await getDueQuestionIds()
      if (!dueIds.length) { setPhase("empty"); return }

      const all = await fetchQuestions()
      const due = dueIds.map((id) => all.find((q) => q.id === id)).filter(Boolean) as BttQuestion[]
      if (!due.length) { setPhase("empty"); return }

      setQuestions(due)
      setPhase("quiz")
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
    const correct = selected === q.correct
    const newAnswers = [...answers, { questionId: q.id, correct }]
    setAnswers(newAnswers)

    if (idx + 1 >= questions.length) {
      upsertSRCards(newAnswers).catch(console.error)
      setPhase("done")
    } else {
      setIdx((i) => i + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  useEffect(() => {
    if (phase === "done" && !confettiFired.current) {
      confettiFired.current = true
      const correct = answers.filter((a) => a.correct).length
      if (correct === answers.length) confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
    }
  }, [phase, answers])

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-4xl animate-bounce">📚</div>
        <p className="text-gray-400 text-sm">Checking your review queue…</p>
      </div>
    )
  }

  if (phase === "empty") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Nothing due!</h2>
        <p className="text-gray-400 text-sm mb-8">All caught up. Come back tomorrow for new reviews.</p>
        <Link href="/" className="bg-green-500 text-white font-bold px-8 py-3.5 rounded-xl inline-block">Back to Home</Link>
      </div>
    )
  }

  if (phase === "done") {
    const correct = answers.filter((a) => a.correct).length
    const total = answers.length
    const pct = Math.round((correct / total) * 100)
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        <div className={`rounded-2xl p-8 text-center text-white ${pct >= 80 ? "bg-gradient-to-br from-green-500 to-green-600" : "bg-gradient-to-br from-orange-400 to-red-500"}`}>
          <div className="text-5xl mb-3">📚</div>
          <div className="text-5xl font-black mb-2">{correct}/{total}</div>
          <p className="text-white/80 text-sm">{pct}% correct · Review session complete</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-gray-600">
          <p>Cards updated with your results. Difficult cards will appear again sooner; mastered cards won't be due for longer.</p>
        </div>
        <Link href="/" className="block text-center bg-green-500 text-white font-black py-4 rounded-2xl">Back to Home</Link>
      </div>
    )
  }

  const q = questions[idx]
  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-black text-gray-900 text-lg">Review Session</h1>
          <p className="text-xs text-gray-400">{questions.length} cards due today</p>
        </div>
        <span className="text-sm font-black text-green-500">{idx + 1}/{questions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div
          className="h-2 bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${((idx) / questions.length) * 100}%` }}
        />
      </div>

      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 mb-4 inline-block">
        📚 Spaced Review · {q.topic}
      </span>

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
          {idx + 1 >= questions.length ? "Finish Review →" : "Next →"}
        </button>
      )}
      {!revealed && <p className="text-center text-xs text-gray-300 mt-2">Tap an answer to continue</p>}
    </div>
  )
}
