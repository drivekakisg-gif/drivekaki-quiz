"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { generateCoachReport, markCoachingSeen, hasSeenCoaching, type CoachReport } from "@/lib/coach"
import { fetchQuestions } from "@/lib/questions"
import type { BttQuestion } from "@/types"

interface Props {
  sessionId: string   // unique per session so modal only shows once
  sessionAttempts: { questionId: string; correct: boolean }[]
  onDismiss: () => void
}

export default function CoachModal({ sessionId, sessionAttempts, onDismiss }: Props) {
  const [report, setReport] = useState<CoachReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"insight" | "drill">("insight")

  useEffect(() => {
    if (hasSeenCoaching(sessionId)) { onDismiss(); return }

    fetchQuestions().then(async (qs: BttQuestion[]) => {
      const r = await generateCoachReport(qs, sessionAttempts)
      setReport(r)
      setLoading(false)
    })
  }, [sessionId, sessionAttempts, onDismiss])

  function dismiss() {
    markCoachingSeen(sessionId)
    onDismiss()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center px-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
          <div className="text-3xl animate-bounce mb-3">🧠</div>
          <p className="text-gray-500 text-sm">Analysing your session…</p>
        </div>
      </div>
    )
  }

  if (!report) { dismiss(); return null }

  const { weakestTopic, weeklyWrongCount, consequence, mnemonics, drillQuestions } = report
  const topicParam = encodeURIComponent(weakestTopic.topic)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center px-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 pt-5 pb-3 rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <div>
                <h2 className="font-black text-gray-900">AI Coach</h2>
                <p className="text-xs text-gray-400">Personalised session analysis</p>
              </div>
            </div>
            <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mt-3">
            {(["insight", "drill"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                {t === "insight" ? "💡 Insights" : "🎯 Drill"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {tab === "insight" ? (
            <>
              {/* Weakest area */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Weakest area this session</p>
                <p className="font-black text-gray-900 text-base">{weakestTopic.topic}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-red-100 rounded-full h-2">
                    <div className="h-2 bg-red-400 rounded-full" style={{ width: `${weakestTopic.pct}%` }} />
                  </div>
                  <span className="text-red-500 font-black text-sm tabular-nums">
                    {weakestTopic.correct}/{weakestTopic.total} ({weakestTopic.pct}%)
                  </span>
                </div>
                {weeklyWrongCount > 0 && (
                  <p className="text-xs text-red-400 mt-2">
                    ⚠️ You've gotten {weakestTopic.topic} wrong <strong>{weeklyWrongCount} time{weeklyWrongCount !== 1 ? "s" : ""}</strong> this week.
                  </p>
                )}
              </div>

              {/* Why this rule exists */}
              {consequence && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Why this rule exists</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{consequence}</p>
                </div>
              )}

              {/* Memory tricks */}
              {mnemonics.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Memory tricks</p>
                  <div className="space-y-2">
                    {mnemonics.map((m, i) => (
                      <p key={i} className="text-sm text-blue-900 leading-relaxed">💡 {m}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* All topics this session */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">All topics (7-day accuracy)</p>
                <div className="space-y-2">
                  {report.allTopics.map(t => (
                    <div key={t.topic}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-700 font-medium truncate pr-2">{t.topic}</span>
                        <span className={`font-bold tabular-nums ${t.pct < 50 ? "text-red-500" : t.pct < 75 ? "text-yellow-600" : "text-green-600"}`}>
                          {t.pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${t.pct < 50 ? "bg-red-400" : t.pct < 75 ? "bg-yellow-400" : "bg-green-500"}`}
                          style={{ width: `${t.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                3 questions from <strong>{weakestTopic.topic}</strong> to drill right now:
              </p>
              {drillQuestions.length > 0 ? (
                <div className="space-y-3">
                  {drillQuestions.map((q, i) => (
                    <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-black text-gray-400 mt-0.5">Q{i + 1}</span>
                        <p className="text-sm font-medium text-gray-800 leading-snug">{q.question}</p>
                      </div>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => {
                          const letter = ["A","B","C","D"][oi]
                          const isCorrect = letter === q.correct
                          return (
                            <p key={letter} className={`text-xs px-3 py-1.5 rounded-lg ${isCorrect ? "bg-green-100 text-green-800 font-semibold" : "text-gray-500"}`}>
                              {opt.replace(/^[A-D]\.\s*/, `${letter}. `)}
                            </p>
                          )
                        })}
                      </div>
                      <p className="text-xs text-blue-600 mt-2 leading-relaxed">{q.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No drill questions available for this topic.</p>
              )}
              <Link
                href={`/quiz?topic=${topicParam}`}
                onClick={dismiss}
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-center transition-colors"
              >
                Drill {weakestTopic.topic} Now →
              </Link>
            </>
          )}

          {/* Footer actions */}
          <div className="flex gap-3 pb-2">
            <Link
              href="/coach"
              onClick={dismiss}
              className="flex-1 border-2 border-gray-200 hover:border-green-400 text-gray-600 font-semibold py-3 rounded-xl text-sm text-center transition-colors"
            >
              Full Analysis →
            </Link>
            <button
              onClick={dismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
