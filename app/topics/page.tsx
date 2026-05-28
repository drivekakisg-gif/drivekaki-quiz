"use client"

import { useEffect, useState } from "react"
import { fetchQuestions } from "@/lib/questions"
import { getTopicMastery, type TopicMasteryRow } from "@/lib/topicMastery"
import type { BttQuestion } from "@/types"
import { useRouter } from "next/navigation"

interface TopicCard {
  topic: string
  questionCount: number
  mastery_pct: number
  total_attempted: number
}

function masteryLabel(pct: number): { icon: string; label: string; color: string; ring: string } {
  if (pct >= 90) return { icon: "⭐", label: "Mastered",      color: "text-amber-600",  ring: "bg-amber-400" }
  if (pct >= 70) return { icon: "🟢", label: "Good",          color: "text-green-600",  ring: "bg-green-500" }
  if (pct >= 40) return { icon: "🟡", label: "Getting there", color: "text-yellow-600", ring: "bg-yellow-400" }
  return              { icon: "🔴", label: "Needs work",    color: "text-red-500",    ring: "bg-red-400" }
}

export default function TopicsPage() {
  const [cards, setCards]     = useState<TopicCard[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const [questions, masteryRows] = await Promise.all([
        fetchQuestions(),
        getTopicMastery(),
      ])

      const masteryMap = new Map<string, TopicMasteryRow>(
        masteryRows.map((r) => [r.topic, r])
      )

      // Count questions per topic
      const topicCounts: Record<string, number> = {}
      for (const q of questions) {
        topicCounts[q.topic] = (topicCounts[q.topic] ?? 0) + 1
      }

      const topicCards: TopicCard[] = Object.entries(topicCounts).map(([topic, questionCount]) => {
        const m = masteryMap.get(topic)
        return {
          topic,
          questionCount,
          mastery_pct: m?.mastery_pct ?? 0,
          total_attempted: m?.total ?? 0,
        }
      })

      // Sort: needs-work first, then by topic name
      topicCards.sort((a, b) => a.mastery_pct - b.mastery_pct || a.topic.localeCompare(b.topic))
      setCards(topicCards)
      setLoading(false)
    }
    load()
  }, [])

  function startTopicQuiz(topic: string) {
    router.push(`/quiz?topic=${encodeURIComponent(topic)}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-4xl animate-bounce">🗺️</div>
        <p className="text-gray-400 text-sm">Loading topic map…</p>
      </div>
    )
  }

  const masteredCount = cards.filter((c) => c.mastery_pct >= 90).length
  const overallPct = cards.length > 0
    ? Math.round(cards.reduce((s, c) => s + c.mastery_pct, 0) / cards.length)
    : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Topic Map</h1>
        <p className="text-gray-400 text-sm">Tap a topic to practice it</p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Overall Mastery</span>
          <span className="text-sm font-black text-green-500">{overallPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
          <div className="h-3 bg-green-500 rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="text-xs text-gray-400">{masteredCount}/{cards.length} topics mastered ⭐</p>
      </div>

      {/* Topic grid */}
      <div className="grid grid-cols-1 gap-3">
        {cards.map((card) => {
          const m = masteryLabel(card.mastery_pct)
          const attempted = card.total_attempted > 0
          const ringPct = card.mastery_pct

          return (
            <button
              key={card.topic}
              onClick={() => startTopicQuiz(card.topic)}
              className="bg-white rounded-2xl border-2 border-gray-100 hover:border-green-300 active:scale-[0.99] p-4 text-left transition-all flex items-center gap-4"
            >
              {/* Mastery ring */}
              <div className="relative flex-shrink-0 w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke={ringPct >= 90 ? "#f59e0b" : ringPct >= 70 ? "#22c55e" : ringPct >= 40 ? "#eab308" : "#f87171"}
                    strokeWidth="5"
                    strokeDasharray={`${(ringPct / 100) * 138.2} 138.2`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700">
                  {ringPct}%
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900 text-sm truncate">{card.topic}</div>
                <div className={`text-xs font-semibold mt-0.5 ${m.color}`}>{m.icon} {m.label}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {card.questionCount} questions
                  {attempted ? ` · ${card.total_attempted} attempted` : " · Not started"}
                </div>
              </div>

              <span className="text-gray-300 text-xl flex-shrink-0">›</span>
            </button>
          )
        })}
      </div>

      <div className="h-8" />
    </div>
  )
}
