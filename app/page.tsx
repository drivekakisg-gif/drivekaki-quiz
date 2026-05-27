"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useGame } from "@/context/GameContext"
import { loadLastMockScore } from "@/lib/saveMockTest"

const MODES = [
  {
    href: "/quiz",
    icon: "🎮",
    name: "Quick Quiz",
    desc: "Practice with instant feedback",
    time: "~10 min",
    color: "border-green-200 bg-green-50",
    badge: "bg-green-500",
    hearts: true,
    xp: true,
  },
  {
    href: "/flashcard",
    icon: "🃏",
    name: "Flashcards",
    desc: "Flip through key rules",
    time: "~5 min",
    color: "border-blue-200 bg-blue-50",
    badge: "bg-blue-500",
    hearts: false,
    xp: false,
  },
  {
    href: "/match",
    icon: "🔗",
    name: "Sign Match",
    desc: "Match signs to meanings",
    time: "~3 min",
    color: "border-purple-200 bg-purple-50",
    badge: "bg-purple-500",
    hearts: false,
    xp: false,
  },
  {
    href: "/mock-test",
    icon: "📋",
    name: "Mock BTT",
    desc: "Full 50-question simulation",
    time: "50 min",
    color: "border-amber-200 bg-amber-50",
    badge: "bg-amber-500",
    hearts: false,
    xp: false,
    isMock: true,
  },
] as const

export default function HomePage() {
  const { streak, totalXP, tierInfo, hearts } = useGame()
  const [lastMock, setLastMock] = useState<{ score: number; total: number } | null>(null)

  useEffect(() => {
    setLastMock(loadLastMockScore())
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🚗</div>
        <h1 className="text-3xl font-black text-gray-900 mb-1">
          DriveKaki <span className="text-green-500">Theory</span>
        </h1>
        <p className="text-gray-400 text-sm">Singapore BTT/FTT Practice</p>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-4 divide-x divide-gray-100">
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

      {/* Mode cards */}
      <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Choose a mode</h2>
      <div className="grid grid-cols-1 gap-3 mb-8">
        {MODES.map(mode => (
          <Link
            key={mode.href}
            href={mode.href}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${mode.color} hover:scale-[1.01] active:scale-[0.99] transition-transform`}
          >
            <div className={`w-12 h-12 ${mode.badge} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
              {mode.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900">{mode.name}</span>
                {'isMock' in mode && mode.isMock && lastMock && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    Last: {lastMock.score}/{lastMock.total}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{mode.desc}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">⏱ {mode.time}</span>
                {mode.hearts && <span className="text-xs text-gray-400">❤️ Hearts</span>}
                {mode.xp    && <span className="text-xs text-gray-400">⭐ XP</span>}
              </div>
            </div>
            <span className="text-gray-300 text-xl">›</span>
          </Link>
        ))}
      </div>

      {/* BTT pass bar */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-green-800 font-bold text-sm">🎯 Pass mark: 45/50 (90%)</p>
        <p className="text-green-600 text-xs mt-0.5">Practice daily to keep your streak alive</p>
      </div>
    </div>
  )
}
