"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchQuestions } from "@/lib/questions"
import { generateCoachReport, type CoachReport } from "@/lib/coach"
import type { BttQuestion } from "@/types"

export default function CoachPage() {
  const [report, setReport] = useState<CoachReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<BttQuestion[]>([])

  useEffect(() => {
    fetchQuestions().then(async (qs) => {
      setQuestions(qs)
      // No session attempts — analyse historical data only
      const r = await generateCoachReport(qs, [])
      setReport(r)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="text-4xl animate-bounce">🧠</div>
        <p className="text-gray-400 text-sm">Analysing your performance…</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">No data yet</h2>
        <p className="text-gray-400 text-sm mb-8">Complete a quiz session to get personalised coaching.</p>
        <Link href="/quiz" className="bg-green-500 text-white font-black px-8 py-4 rounded-2xl inline-block">Start Practising →</Link>
      </div>
    )
  }

  const { weakestTopic, weeklyWrongCount, consequence, mnemonics, drillQuestions, allTopics } = report

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">AI Coach</h1>
        <p className="text-gray-400 text-sm">Based on your last 7 days of practice</p>
      </div>

      {/* Weakest area callout */}
      <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 text-white">
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Focus area</p>
        <h2 className="text-2xl font-black mb-1">{weakestTopic.topic}</h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <div className="h-2 bg-white rounded-full" style={{ width: `${weakestTopic.pct}%` }} />
          </div>
          <span className="font-black tabular-nums">{weakestTopic.pct}%</span>
        </div>
        <p className="text-white/80 text-sm">
          {weakestTopic.correct}/{weakestTopic.total} correct
          {weeklyWrongCount > 0 ? ` · wrong ${weeklyWrongCount}× this week` : ""}
        </p>
      </div>

      {/* Why this rule exists */}
      {consequence && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Why this rule exists</p>
          <p className="text-sm text-amber-900 leading-relaxed">{consequence}</p>
        </div>
      )}

      {/* Memory tricks */}
      {mnemonics.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Memory tricks</p>
          <div className="space-y-3">
            {mnemonics.map((m, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-blue-400 text-lg leading-none">💡</span>
                <p className="text-sm text-blue-900 leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drill questions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-gray-700">Drill: {weakestTopic.topic}</p>
          <Link
            href={`/quiz?topic=${encodeURIComponent(weakestTopic.topic)}`}
            className="text-xs bg-green-500 text-white font-bold px-3 py-1.5 rounded-lg"
          >
            Start drill →
          </Link>
        </div>
        {drillQuestions.length > 0 ? (
          <div className="space-y-4">
            {drillQuestions.map((q, i) => (
              <div key={q.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 mb-1">Q{i + 1}</p>
                <p className="text-sm font-semibold text-gray-800 mb-2 leading-snug">{q.question}</p>
                <div className="space-y-1 mb-2">
                  {q.options.map((opt, oi) => {
                    const letter = ["A","B","C","D"][oi]
                    return (
                      <p key={letter} className={`text-xs px-3 py-1.5 rounded-lg ${letter === q.correct ? "bg-green-100 text-green-800 font-semibold" : "text-gray-500"}`}>
                        {opt.replace(/^[A-D]\.\s*/, `${letter}. `)}
                      </p>
                    )
                  })}
                </div>
                <p className="text-xs text-blue-700 leading-relaxed bg-blue-50 rounded-lg px-3 py-2">{q.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Complete more sessions to unlock drill questions.</p>
        )}
      </div>

      {/* Full topic breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-black text-gray-700 mb-4">All Topics (7-day accuracy)</p>
        <div className="space-y-3">
          {allTopics.map(t => {
            const color = t.pct >= 90 ? "bg-amber-400" : t.pct >= 70 ? "bg-green-500" : t.pct >= 40 ? "bg-yellow-400" : "bg-red-400"
            const textColor = t.pct >= 90 ? "text-amber-600" : t.pct >= 70 ? "text-green-600" : t.pct >= 40 ? "text-yellow-600" : "text-red-500"
            const icon = t.pct >= 90 ? "⭐" : t.pct >= 70 ? "🟢" : t.pct >= 40 ? "🟡" : "🔴"
            return (
              <Link key={t.topic} href={`/quiz?topic=${encodeURIComponent(t.topic)}`} className="block group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">{t.topic}</span>
                  </div>
                  <span className={`text-xs font-black tabular-nums ${textColor}`}>{t.correct}/{t.total} ({t.pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${t.pct}%` }} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Questions answered from weakest topics */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-green-800 font-bold text-sm">
          {allTopics.filter(t => t.pct >= 90).length === allTopics.length
            ? "🏆 All topics mastered! You're BTT ready."
            : `🎯 Focus on ${allTopics.filter(t => t.pct < 70).length} topic${allTopics.filter(t => t.pct < 70).length !== 1 ? "s" : ""} below 70% to reach pass standard.`}
        </p>
      </div>

      <div className="pb-8" />
    </div>
  )
}
