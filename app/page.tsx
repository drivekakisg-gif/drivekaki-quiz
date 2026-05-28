"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useGame } from "@/context/GameContext"
import { loadLastMockScore } from "@/lib/saveMockTest"
import { getDueCount } from "@/lib/spacedRepetition"
import { getTopicMastery, type TopicMasteryRow } from "@/lib/topicMastery"
import { getTodaysAttempt, getOrCreateDailyChallenge, challengeDayNumber, todayISO } from "@/lib/dailyChallenge"

export default function HomePage() {
  const { streak, totalXP, tierInfo, hearts } = useGame()
  const [lastMock, setLastMock]     = useState<{ score: number; total: number } | null>(null)
  const [dueCount, setDueCount]     = useState(0)
  const [dailyDone, setDailyDone]   = useState<boolean | null>(null)
  const [dayNum, setDayNum]         = useState(1)
  const [weakTopics, setWeakTopics] = useState<TopicMasteryRow[]>([])

  useEffect(() => {
    setLastMock(loadLastMockScore())
    getDueCount().then(setDueCount)
    getTopicMastery().then((rows) => {
      const sorted = [...rows].sort((a, b) => a.mastery_pct - b.mastery_pct)
      setWeakTopics(sorted.slice(0, 3))
    })
    getOrCreateDailyChallenge().then(async (ch) => {
      setDayNum(challengeDayNumber(ch.challenge_date))
      const attempt = await getTodaysAttempt(ch.challenge_date)
      setDailyDone(!!attempt)
    }).catch(() => setDailyDone(false))
  }, [])

  const today = todayISO()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🚗</div>
        <h1 className="text-3xl font-black text-gray-900 mb-1">
          DriveKaki <span className="text-green-500">Theory</span>
        </h1>
        <p className="text-gray-400 text-sm">Singapore BTT/FTT Practice</p>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 grid grid-cols-4 divide-x divide-gray-100">
        <div className="text-center px-2">
          <div className="text-lg font-black text-amber-500">{totalXP}</div>
          <div className="text-[10px] text-gray-400 font-medium">XP</div>
        </div>
        <div className="text-center px-2">
          <div className="text-lg font-black text-orange-500">{streak}🔥</div>
          <div className="text-[10px] text-gray-400 font-medium">Streak</div>
        </div>
        <div className="text-center px-2">
          <div className="text-lg font-black" style={{ color: tierInfo.tier.color }}>
            {tierInfo.tier.name.split(" ")[0]}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">Level</div>
        </div>
        <div className="text-center px-2">
          <div className="text-lg font-black text-red-500">
            {"❤️".repeat(hearts)}{"🖤".repeat(Math.max(0, 5 - hearts))}
          </div>
          <div className="text-[10px] text-gray-400 font-medium">Hearts</div>
        </div>
      </div>

      {/* Daily Challenge card */}
      <Link
        href="/daily"
        className="flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:scale-[1.01] active:scale-[0.99] transition-transform mb-3"
      >
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📅</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900">Daily Challenge</span>
            {dailyDone === true && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ Done</span>
            )}
            {dailyDone === false && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">New!</span>
            )}
          </div>
          <p className="text-sm text-gray-500">#{dayNum} · {today} · 10 questions</p>
          <p className="text-xs text-gray-400 mt-0.5">⏱ ~5 min · Share on WhatsApp</p>
        </div>
        <span className="text-gray-300 text-xl">›</span>
      </Link>

      {/* Review Due badge */}
      {dueCount > 0 && (
        <Link
          href="/review"
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:scale-[1.01] active:scale-[0.99] transition-transform mb-3"
        >
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📚</div>
          <div className="flex-1 min-w-0">
            <span className="font-black text-gray-900">Review Due</span>
            <p className="text-sm text-gray-500">{dueCount} card{dueCount !== 1 ? "s" : ""} need reviewing today</p>
          </div>
          <span className="bg-purple-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{dueCount}</span>
        </Link>
      )}

      {/* Mode cards */}
      <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 mt-2">Study Modes</h2>
      <div className="grid grid-cols-1 gap-3 mb-5">
        {[
          { href: "/quiz",      icon: "🎮", name: "Quick Quiz",  desc: "Practice with instant feedback",    time: "~10 min", color: "border-green-200 bg-green-50",  badge: "bg-green-500",  extra: "❤️ Hearts · ⭐ XP" },
          { href: "/flashcard", icon: "🃏", name: "Flashcards",  desc: "Flip through key rules",            time: "~5 min",  color: "border-blue-200 bg-blue-50",    badge: "bg-blue-500",   extra: null },
          { href: "/match",     icon: "🔗", name: "Sign Match",  desc: "Match signs to meanings",           time: "~3 min",  color: "border-purple-200 bg-purple-50",badge: "bg-purple-500", extra: null },
          { href: "/mock-test", icon: "📋", name: "Mock BTT",    desc: "Full 50-question simulation",       time: "50 min",  color: "border-amber-200 bg-amber-50",  badge: "bg-amber-500",  extra: null, isMock: true },
        ].map(mode => (
          <Link key={mode.href} href={mode.href} className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${mode.color} hover:scale-[1.01] active:scale-[0.99] transition-transform`}>
            <div className={`w-12 h-12 ${mode.badge} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>{mode.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900">{mode.name}</span>
                {mode.isMock && lastMock && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Last: {lastMock.score}/50</span>
                )}
              </div>
              <p className="text-sm text-gray-500">{mode.desc}</p>
              <p className="text-xs text-gray-400 mt-0.5">⏱ {mode.time}{mode.extra ? ` · ${mode.extra}` : ""}</p>
            </div>
            <span className="text-gray-300 text-xl">›</span>
          </Link>
        ))}
      </div>

      {/* Weak topics preview */}
      {weakTopics.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-700">Weakest Topics</h2>
            <Link href="/topics" className="text-xs text-green-600 font-semibold">View all →</Link>
          </div>
          <div className="space-y-3">
            {weakTopics.map((t) => (
              <Link key={t.topic} href={`/quiz?topic=${encodeURIComponent(t.topic)}`} className="block">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{t.topic}</span>
                  <span className={t.mastery_pct < 40 ? "text-red-500 font-bold" : "text-yellow-600 font-bold"}>{t.mastery_pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${t.mastery_pct < 40 ? "bg-red-400" : "bg-yellow-400"}`} style={{ width: `${t.mastery_pct}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* BTT pass bar */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-green-800 font-bold text-sm">🎯 Pass mark: 45/50 (90%)</p>
        <p className="text-green-600 text-xs mt-0.5">Practice daily to keep your streak alive</p>
      </div>
    </div>
  )
}
