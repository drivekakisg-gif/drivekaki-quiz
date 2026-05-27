"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion"
import { fetchQuestions } from "@/lib/questions"
import type { BttQuestion } from "@/types"
import Link from "next/link"

type ExitDir = "left" | "right" | null

export default function FlashcardPage() {
  const [deck, setDeck]         = useState<BttQuestion[]>([])
  const [mastered, setMastered] = useState<BttQuestion[]>([])
  const [loading, setLoading]   = useState(true)
  const [flipped, setFlipped]   = useState(false)
  const [exitDir, setExitDir]   = useState<ExitDir>(null)

  // 3D flip motion value
  const rotateY = useMotionValue(0)
  const isDragging = useRef(false)
  const x = useMotionValue(0)

  // Colour hints while dragging
  const rightOpacity = useTransform(x, [0, 80], [0, 1])
  const leftOpacity  = useTransform(x, [-80, 0], [1, 0])
  const cardRotation = useTransform(x, [-200, 200], [-12, 12])

  useEffect(() => {
    fetchQuestions()
      .then(qs => { setDeck([...qs].sort(() => Math.random() - 0.5)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function doFlip() {
    const target = flipped ? 0 : 180
    animate(rotateY, target, { type: "spring", stiffness: 260, damping: 22 })
    setFlipped(f => !f)
  }

  function handleGotIt() {
    if (deck.length === 0) return
    setExitDir("right")
    setTimeout(() => {
      setMastered(prev => [...prev, deck[0]])
      setDeck(prev => prev.slice(1))
      resetCard()
    }, 280)
  }

  function handleStillLearning() {
    if (deck.length === 0) return
    setExitDir("left")
    setTimeout(() => {
      setDeck(prev => [...prev.slice(1), prev[0]])
      resetCard()
    }, 280)
  }

  function resetCard() {
    setExitDir(null)
    setFlipped(false)
    animate(rotateY, 0, { duration: 0 })
    x.set(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Deck complete
  if (deck.length === 0 && mastered.length > 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Deck Cleared!</h1>
        <p className="text-gray-500 mb-8">
          <span className="text-green-600 font-black text-xl">{mastered.length}</span> cards mastered
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setDeck([...mastered].sort(() => Math.random() - 0.5))
              setMastered([])
              resetCard()
            }}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg"
          >
            Study Again 🔄
          </button>
          <Link href="/" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl text-center">
            Home
          </Link>
        </div>
      </div>
    )
  }

  const card = deck[0]
  if (!card) return null

  const correctText = card.options[["A","B","C","D"].indexOf(card.correct)]?.replace(/^[A-D]\.\s*/,"") ?? card.correct

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="text-gray-400 text-sm">← Back</Link>
        <span className="text-sm font-bold text-gray-600">
          {deck.length} remaining · {mastered.length} mastered
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: mastered.length + deck.length > 0
            ? `${Math.round((mastered.length / (mastered.length + deck.length)) * 100)}%`
            : "0%" }}
        />
      </div>

      {/* Swipe hints */}
      <div className="relative flex items-center justify-between mb-3 pointer-events-none">
        <motion.div style={{ opacity: leftOpacity }} className="bg-red-100 text-red-500 font-black text-sm px-3 py-1 rounded-full">
          ← Study Again
        </motion.div>
        <motion.div style={{ opacity: rightOpacity }} className="bg-green-100 text-green-600 font-black text-sm px-3 py-1 rounded-full">
          Got It →
        </motion.div>
      </div>

      {/* Card stack */}
      <div style={{ perspective: 1200 }} className="relative">
        {/* Shadow card (next) */}
        {deck.length > 1 && (
          <div className="absolute inset-0 bg-white rounded-3xl border border-gray-100 shadow translate-y-3 scale-95 z-0" />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + "-outer"}
            style={{ x, rotate: cardRotation }}
            drag="x"
            dragConstraints={{ left: -240, right: 240 }}
            dragElastic={0.15}
            onDragStart={() => { isDragging.current = true }}
            onDragEnd={(_, info) => {
              setTimeout(() => { isDragging.current = false }, 60)
              if (info.offset.x > 80)       handleGotIt()
              else if (info.offset.x < -80) handleStillLearning()
              else { animate(x, 0, { type: "spring", stiffness: 400, damping: 30 }) }
            }}
            animate={exitDir ? { x: exitDir === "right" ? 320 : -320, opacity: 0, transition: { duration: 0.28 } } : {}}
            className="relative z-10 cursor-grab active:cursor-grabbing"
            onClick={() => { if (!isDragging.current) doFlip() }}
          >
            {/* 3D flip container */}
            <motion.div
              style={{ rotateY, transformStyle: "preserve-3d" }}
              className="relative w-full min-h-[380px]"
            >
              {/* FRONT — question */}
              <div
                className="absolute inset-0 bg-white rounded-3xl border-2 border-gray-100 shadow-lg p-6 flex flex-col justify-between"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">{card.topic}</span>
                  <p className="mt-6 text-xl font-bold text-gray-900 leading-snug">{card.question}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-300 font-medium">Tap to reveal answer</p>
                </div>
              </div>

              {/* BACK — answer */}
              <div
                className="absolute inset-0 bg-green-50 rounded-3xl border-2 border-green-200 shadow-lg p-6 flex flex-col justify-between"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Answer</span>
                  <p className="mt-4 text-2xl font-black text-green-800 leading-snug">{correctText}</p>
                  <p className="mt-4 text-sm text-green-700 leading-relaxed">{card.explanation}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-500 font-medium">Swipe right if you got it · left to review again</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className={`flex gap-3 mt-6 transition-opacity duration-200 ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <button
          onClick={handleStillLearning}
          className="flex-1 bg-red-50 border-2 border-red-200 text-red-500 font-black py-4 rounded-2xl text-base transition-colors hover:bg-red-100"
        >
          ↩ Study Again
        </button>
        <button
          onClick={handleGotIt}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-base transition-colors"
        >
          Got It ✓
        </button>
      </div>
    </div>
  )
}
