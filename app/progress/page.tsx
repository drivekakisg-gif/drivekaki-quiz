"use client"

import { useGame } from "@/context/GameContext"
import { getLevelInfo, LEVEL_TIERS, predictBTTReadyDays } from "@/lib/xp"
import Link from "next/link"

export default function ProgressPage() {
  const { totalXP, streak, longestStreak, tierInfo, totalSessions, totalCorrect, totalWrong, hearts } = useGame()

  const total = totalCorrect + totalWrong
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0
  const bttDays = predictBTTReadyDays(totalSessions, totalCorrect, totalWrong, streak)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-black text-gray-900">Your Progress</h1>

      {/* Level card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Current Level</p>
            <p className="text-2xl font-black" style={{ color: tierInfo.tier.color }}>{tierInfo.tier.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Total XP</p>
            <p className="text-2xl font-black text-amber-500">{totalXP.toLocaleString()}</p>
          </div>
        </div>
        {!tierInfo.isMax && (
          <>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{tierInfo.xpInTier} XP</span>
              <span>{tierInfo.xpForTier} XP to {LEVEL_TIERS[tierInfo.tierIndex + 1]?.name}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${tierInfo.progress}%`, backgroundColor: tierInfo.tier.color }}
              />
            </div>
          </>
        )}

        {/* All tiers */}
        <div className="flex items-center gap-1 mt-4">
          {LEVEL_TIERS.map((t, i) => (
            <div key={t.name} className="flex-1 text-center">
              <div className={`h-2 rounded-full ${i <= tierInfo.tierIndex ? "" : "bg-gray-100"}`}
                   style={{ backgroundColor: i <= tierInfo.tierIndex ? t.color : undefined }} />
              <p className="text-[9px] mt-1 font-medium truncate" style={{ color: i <= tierInfo.tierIndex ? t.color : "#9CA3AF" }}>
                {t.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Current Streak", value: `${streak} 🔥`, sub: `Best: ${longestStreak}` },
          { label: "Accuracy",       value: `${accuracy}%`, sub: `${totalCorrect}/${total} correct` },
          { label: "Sessions",       value: String(totalSessions), sub: "completed" },
          { label: "Hearts",         value: "❤️".repeat(hearts) + "🖤".repeat(5 - hearts), sub: "remaining today" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold mb-1">{s.label}</p>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* BTT prediction */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <p className="font-black text-green-800 text-base">
          {bttDays <= 1
            ? "🎉 You're ready to book your BTT!"
            : `🎯 Ready to book BTT in ~${bttDays} days`}
        </p>
        <p className="text-green-600 text-sm mt-1">
          At your current pace, you'll be ready to book BTT in {bttDays} day{bttDays !== 1 ? "s" : ""}.
          Every session moves you closer. Don't break the streak.
        </p>
        {bttDays <= 1 && (
          <a
            href="https://onemotoring.lta.gov.sg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 bg-green-500 text-white font-bold px-4 py-2 rounded-xl text-sm"
          >
            Book BTT on OneMotoring →
          </a>
        )}
      </div>

      <Link
        href="/quiz"
        className="block w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-center text-lg transition-colors"
      >
        Keep Practising 🔥
      </Link>
    </div>
  )
}
