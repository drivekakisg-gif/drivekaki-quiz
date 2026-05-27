"use client"

import { useEffect, useRef, useState } from "react"
import { fetchQuestions } from "@/lib/questions"
import { createClient } from "@/lib/supabase"
import { saveMockTestResult, saveLastMockScore } from "@/lib/saveMockTest"
import type { BttQuestion } from "@/types"
import Link from "next/link"

type Phase = "intro" | "testing" | "review-flagged" | "results"

const TOTAL_TIME = 50 * 60  // 50 minutes in seconds
const PASS_MARK  = 45

interface Answer {
  questionId: string
  selected: string | null
}

export default function MockTestPage() {
  const [questions, setQuestions] = useState<BttQuestion[]>([])
  const [loading, setLoading]     = useState(true)
  const [phase, setPhase]         = useState<Phase>("intro")

  // Test state
  const [answers, setAnswers]   = useState<Answer[]>([])
  const [flagged, setFlagged]   = useState<Set<string>>(new Set())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTime = useRef<number>(0)

  useEffect(() => {
    fetchQuestions().then(qs => {
      const shuffled = [...qs].sort(() => Math.random() - 0.5)
      setQuestions(shuffled)
      setAnswers(shuffled.map(q => ({ questionId: q.id, selected: null })))
      setLoading(false)
    })
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== "testing") return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function startTest() {
    startTime.current = Date.now()
    setPhase("testing")
  }

  function handleSelect(letter: string) {
    setAnswers(prev => prev.map((a, i) =>
      i === currentIdx ? { ...a, selected: letter } : a
    ))
  }

  function toggleFlag(questionId: string) {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  function handleSubmit(timeUp = false) {
    clearInterval(timerRef.current!)
    const flaggedList = [...flagged]
    if (!timeUp && flaggedList.length > 0) {
      setPhase("review-flagged")
      return
    }
    finaliseResult()
  }

  function finaliseResult() {
    clearInterval(timerRef.current!)

    const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
    const score = answers.filter((a, i) => a.selected === questions[i]?.correct).length
    const total = questions.length
    const passed = score >= PASS_MARK

    saveLastMockScore(score, total)

    // Topic breakdown
    const breakdown: Record<string, { correct: number; total: number }> = {}
    answers.forEach((a, i) => {
      const q = questions[i]
      if (!q) return
      if (!breakdown[q.topic]) breakdown[q.topic] = { correct: 0, total: 0 }
      breakdown[q.topic].total++
      if (a.selected === q.correct) breakdown[q.topic].correct++
    })

    // Save to Supabase (fire-and-forget)
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        saveMockTestResult(data.user.id, {
          score, total, passed, timeTaken,
          answers: answers.map(a => ({
            questionId: a.questionId,
            selected: a.selected,
            correct: questions.find(q => q.id === a.questionId)?.correct === a.selected,
          })),
          topicBreakdown: breakdown,
        }).catch(console.error)
      }
    })

    setPhase("results")
  }

  // ── Keyboard shortcut (A-D) ──
  useEffect(() => {
    if (phase !== "testing") return
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, string> = { a:"A", b:"B", c:"C", d:"D" }
      if (map[e.key.toLowerCase()]) handleSelect(map[e.key.toLowerCase()])
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [phase, currentIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeStr = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`
  const isLow = timeLeft < 5 * 60

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── INTRO ──
  if (phase === "intro") return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">📋</div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Mock BTT</h1>
      <p className="text-gray-500 mb-6">Exactly simulates the real Basic Theory Test</p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left space-y-2 text-sm text-amber-800">
        <p><strong>📋 {questions.length} questions</strong> — same as the real BTT</p>
        <p><strong>⏱ 50 minutes</strong> — strictly timed</p>
        <p><strong>🎯 Pass mark: 45/{questions.length}</strong></p>
        <p><strong>🚩 Flag questions</strong> for review before submitting</p>
        <p><strong>🔇 No hints</strong> — just like the real test</p>
      </div>
      <button onClick={startTest}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl text-lg transition-colors">
        Begin Test →
      </button>
      <Link href="/" className="block mt-3 text-gray-400 text-sm">Cancel</Link>
    </div>
  )

  // ── TESTING ──
  if (phase === "testing") {
    const q = questions[currentIdx]
    const currentAnswer = answers[currentIdx]?.selected
    const LETTERS = ["A","B","C","D"]
    const answeredCount = answers.filter(a => a.selected !== null).length

    return (
      <div className="max-w-2xl mx-auto">
        {/* Sticky header */}
        <div className={`sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between ${isLow ? "border-red-200 bg-red-50" : ""}`}>
          <div className="flex items-center gap-3">
            <span className={`font-black text-xl tabular-nums ${isLow ? "text-red-600 animate-pulse" : "text-gray-900"}`}>
              {timeStr}
            </span>
            <span className="text-xs text-gray-400">{answeredCount}/{questions.length} answered</span>
          </div>
          <button
            onClick={() => toggleFlag(q.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors ${
              flagged.has(q.id) ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500 hover:bg-orange-50"
            }`}
          >
            🚩 {flagged.has(q.id) ? "Flagged" : "Flag"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-amber-500 transition-all duration-300"
               style={{ width: `${Math.round(((currentIdx + 1) / questions.length) * 100)}%` }} />
        </div>

        <div className="px-4 py-5">
          {/* Question number + topic */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              {q.topic}
            </span>
            <span className="text-xs text-gray-400 ml-auto">Q{currentIdx + 1} of {questions.length}</span>
          </div>

          <p className="text-xl font-bold text-gray-900 mb-6 leading-snug">{q.question}</p>

          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              const letter = LETTERS[i]
              const sel = currentAnswer === letter
              return (
                <button key={letter} onClick={() => handleSelect(letter)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-medium text-sm transition-colors min-h-[52px] ${
                    sel
                      ? "bg-amber-50 border-amber-500 text-amber-900"
                      : "bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-800"
                  }`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    sel ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>{letter}</span>
                  <span>{opt.replace(/^[A-D]\.\s*/,"")}</span>
                </button>
              )
            })}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-3">
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex-1 bg-gray-100 disabled:opacity-30 text-gray-700 font-bold py-3.5 rounded-xl">
              ← Prev
            </button>
            {currentIdx < questions.length - 1 ? (
              <button onClick={() => setCurrentIdx(i => i + 1)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 rounded-xl">
                Next →
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3.5 rounded-xl">
                Submit ✓
              </button>
            )}
          </div>

          {/* Question grid nav */}
          <div className="mt-5 grid grid-cols-10 gap-1">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`h-7 rounded-md text-[10px] font-bold transition-colors ${
                  i === currentIdx    ? "bg-amber-500 text-white" :
                  flagged.has(questions[i].id) ? "bg-orange-200 text-orange-700" :
                  answers[i]?.selected ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-400"
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── REVIEW FLAGGED ──
  if (phase === "review-flagged") {
    const flaggedQs = questions.filter(q => flagged.has(q.id))
    const LETTERS = ["A","B","C","D"]
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5">
          <h2 className="font-black text-orange-800 text-lg">Review Flagged ({flaggedQs.length})</h2>
          <p className="text-orange-600 text-sm mt-1">Check your flagged questions before submitting.</p>
        </div>
        <div className="space-y-5">
          {flaggedQs.map(q => {
            const idx = questions.findIndex(x => x.id === q.id)
            const sel = answers[idx]?.selected
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Q{idx + 1}</span>
                  <button onClick={() => toggleFlag(q.id)} className="text-orange-400 text-xs">Remove flag</button>
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const letter = LETTERS[i]
                    return (
                      <button key={letter}
                        onClick={() => setAnswers(prev => prev.map((a, j) => j === idx ? { ...a, selected: letter } : a))}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                          sel === letter ? "bg-amber-50 border-amber-400" : "bg-gray-50 border-gray-100 hover:border-amber-300"
                        }`}>
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          sel === letter ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}>{letter}</span>
                        {opt.replace(/^[A-D]\.\s*/,"")}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={finaliseResult}
          className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg">
          Submit Final Answers ✓
        </button>
      </div>
    )
  }

  // ── RESULTS ──
  const score   = answers.filter((a, i) => a.selected === questions[i]?.correct).length
  const total   = questions.length
  const passed  = score >= PASS_MARK
  const timeTaken = TOTAL_TIME - timeLeft
  const tMins = Math.floor(timeTaken / 60), tSecs = timeTaken % 60
  const accuracy = Math.round((score / total) * 100)

  const breakdown: Record<string, { correct: number; total: number }> = {}
  answers.forEach((a, i) => {
    const q = questions[i]; if (!q) return
    if (!breakdown[q.topic]) breakdown[q.topic] = { correct: 0, total: 0 }
    breakdown[q.topic].total++
    if (a.selected === q.correct) breakdown[q.topic].correct++
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className={`rounded-3xl p-8 text-center text-white ${
        passed ? "bg-gradient-to-br from-green-500 to-green-600" : "bg-gradient-to-br from-slate-500 to-slate-700"
      }`}>
        <div className="text-5xl font-black mb-2">{score}/{total}</div>
        <div className="text-2xl font-black mb-1">{passed ? "PASSED ✓" : "NOT YET"}</div>
        <p className="text-white/75 text-sm">
          {accuracy}% · {tMins}m {tSecs}s · Pass mark: {PASS_MARK}/{total}
        </p>
      </div>

      {/* Topic breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-black text-gray-900 mb-4">Topic Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(breakdown).sort((a,b) => (a[1].correct/a[1].total) - (b[1].correct/b[1].total)).map(([topic, s]) => {
            const pct = Math.round((s.correct / s.total) * 100)
            const weak = pct < 70
            return (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{topic}</span>
                  <span className={`font-black ${weak ? "text-red-500" : "text-green-600"}`}>{s.correct}/{s.total} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${weak ? "bg-red-400" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      {passed && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="font-black text-green-800 text-lg mb-1">🎉 You're ready to book!</p>
          <p className="text-green-600 text-sm mb-4">Book your BTT on OneMotoring (LTA's official portal)</p>
          <a href="https://onemotoring.lta.gov.sg" target="_blank" rel="noopener noreferrer"
            className="inline-block bg-green-500 text-white font-black px-6 py-3 rounded-xl">
            Book Your BTT →
          </a>
        </div>
      )}

      <div className="flex flex-col gap-3 pb-8">
        <button onClick={() => { setPhase("intro"); setCurrentIdx(0); setTimeLeft(TOTAL_TIME); setFlagged(new Set()) }}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl text-lg">
          Retake Test
        </button>
        <Link href="/" className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl text-center">
          Home
        </Link>
      </div>
    </div>
  )
}
