"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { fetchQuestions } from "@/lib/questions"
import type { BttQuestion } from "@/types"
import Link from "next/link"

interface Card {
  id: string
  pairId: string         // same for Q + A pair
  type: "question" | "answer"
  text: string
  state: "hidden" | "flipped" | "matched"
}

const PAIR_COUNT = 3

function buildCards(qs: BttQuestion[]): Card[] {
  const sample = [...qs].sort(() => Math.random() - 0.5).slice(0, PAIR_COUNT)
  const cards: Card[] = []
  sample.forEach(q => {
    const answerText = q.options[["A","B","C","D"].indexOf(q.correct)]?.replace(/^[A-D]\.\s*/, "") ?? q.correct
    const truncQ = q.question.length > 55 ? q.question.slice(0, 55) + "…" : q.question
    const truncA = answerText.length > 55 ? answerText.slice(0, 55) + "…" : answerText
    cards.push({ id: `q-${q.id}`, pairId: q.id, type: "question", text: truncQ, state: "hidden" })
    cards.push({ id: `a-${q.id}`, pairId: q.id, type: "answer",   text: truncA, state: "hidden" })
  })
  return cards.sort(() => Math.random() - 0.5)
}

export default function MatchPage() {
  const [cards, setCards]     = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [seconds, setSeconds]   = useState(0)
  const [done, setDone]         = useState(false)
  const [allQuestions, setAllQuestions] = useState<BttQuestion[]>([])

  const flipped = cards.filter(c => c.state === "flipped")
  const lockRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchQuestions().then(qs => {
      setAllQuestions(qs)
      setCards(buildCards(qs))
      setLoading(false)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    })
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function handleTap(id: string) {
    if (lockRef.current) return
    const card = cards.find(c => c.id === id)
    if (!card || card.state !== "hidden") return
    if (flipped.length === 2) return

    setCards(prev => prev.map(c => c.id === id ? { ...c, state: "flipped" } : c))
  }

  // Check for matches after each flip
  useEffect(() => {
    if (flipped.length !== 2) return
    lockRef.current = true
    setAttempts(a => a + 1)

    const [a, b] = flipped
    if (a.pairId === b.pairId) {
      // Match!
      setCards(prev => prev.map(c =>
        c.id === a.id || c.id === b.id ? { ...c, state: "matched" } : c
      ))
      lockRef.current = false

      // Check if all matched
      setCards(prev => {
        const allMatched = prev.every(c => c.state === "matched")
        if (allMatched) {
          clearInterval(timerRef.current!)
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
          setTimeout(() => setDone(true), 400)
        }
        return prev
      })
    } else {
      // No match — flip back after 1s
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.state === "flipped" ? { ...c, state: "hidden" } : c
        ))
        lockRef.current = false
      }, 1000)
    }
  }, [flipped.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    setCards(buildCards(allQuestions))
    setAttempts(0)
    setSeconds(0)
    setDone(false)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timeStr = `${mins}:${String(secs).padStart(2, "0")}`
  const matched = cards.filter(c => c.state === "matched").length / 2

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="text-gray-400 text-sm">← Back</Link>
        <h1 className="font-black text-gray-900">Sign Match</h1>
        <span className="font-black text-purple-600 tabular-nums">{timeStr}</span>
      </div>

      {/* Score */}
      <div className="flex items-center justify-between mb-5 text-sm">
        <span className="text-gray-400">{matched}/{PAIR_COUNT} matched</span>
        <span className="text-gray-400">{attempts} attempts</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <MatchCard key={card.id} card={card} onTap={() => handleTap(card.id)} />
        ))}
      </div>

      {/* Done overlay */}
      <AnimatePresence>
        {done && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
              initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring" }}
            >
              <div className="text-5xl mb-3">⚡</div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Perfect Match!</h2>
              <p className="text-gray-500 mb-2">
                {PAIR_COUNT} pairs in <strong>{attempts} attempts</strong>
              </p>
              <p className="text-gray-400 text-sm mb-6">Time: {timeStr}</p>
              <div className="flex flex-col gap-3">
                <button onClick={restart} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black py-4 rounded-2xl text-lg">
                  Play Again 🔄
                </button>
                <Link href="/" className="w-full bg-gray-100 text-gray-700 font-semibold py-3.5 rounded-2xl text-center">
                  Home
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MatchCard({ card, onTap }: { card: Card; onTap: () => void }) {
  const bgClass =
    card.state === "matched" ? "bg-green-50 border-green-400" :
    card.state === "flipped" ? (card.type === "question" ? "bg-blue-50 border-blue-400" : "bg-purple-50 border-purple-400") :
    "bg-gray-50 border-gray-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50"

  return (
    <motion.button
      onClick={card.state === "hidden" ? onTap : undefined}
      className={`relative min-h-[100px] rounded-2xl border-2 p-3 text-left transition-colors ${bgClass}`}
      whileTap={card.state === "hidden" ? { scale: 0.96 } : {}}
      animate={card.state === "matched" ? { scale: [1, 1.04, 1] } : {}}
    >
      {card.state === "hidden" ? (
        <div className="flex items-center justify-center h-full min-h-[72px]">
          <span className="text-2xl">
            {card.type === "question" ? "❓" : "💡"}
          </span>
        </div>
      ) : (
        <div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-2 inline-block ${
            card.type === "question"
              ? "bg-blue-100 text-blue-600"
              : "bg-purple-100 text-purple-600"
          }`}>
            {card.type === "question" ? "Q" : "A"}
          </span>
          <p className="text-xs font-semibold text-gray-800 leading-snug">{card.text}</p>
          {card.state === "matched" && (
            <span className="absolute top-2 right-2 text-green-500 text-sm">✓</span>
          )}
        </div>
      )}
    </motion.button>
  )
}
