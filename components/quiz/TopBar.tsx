"use client"

import { useGame } from "@/context/GameContext"

interface TopBarProps {
  progress: number       // 0–100
  sessionXP: number
}

export default function TopBar({ progress, sessionXP }: TopBarProps) {
  const { hearts, streak, totalXP, tierInfo } = useGame()
  const MAX_HEARTS = 5

  const flameSize = streak >= 10 ? "text-2xl" : streak >= 5 ? "text-xl" : "text-base"

  return (
    <div className="w-full bg-white border-b border-gray-100 sticky top-14 z-40">
      {/* XP progress bar for current tier */}
      <div className="h-1.5 bg-gray-100 w-full">
        <div
          className="h-full bg-green-500 transition-all duration-700 ease-out"
          style={{ width: `${tierInfo.progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1 min-w-[56px]">
          {streak > 0 ? (
            <>
              <span className={`${flameSize} leading-none`}>🔥</span>
              <span className="font-black text-orange-500 text-sm tabular-nums">{streak}</span>
            </>
          ) : (
            <span className="text-gray-300 text-sm font-medium">🔥 0</span>
          )}
        </div>

        {/* Quiz progress bar */}
        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-0.5 min-w-[68px] justify-end">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <span
              key={i}
              className={`text-base leading-none transition-all duration-200 ${
                i < hearts ? "opacity-100" : "opacity-20 grayscale"
              }`}
            >
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Level badge */}
      <div className="max-w-2xl mx-auto px-4 pb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold" style={{ color: tierInfo.tier.color }}>
          {tierInfo.tier.name}
        </span>
        <span className="text-amber-500 font-black tabular-nums">
          +{sessionXP} XP this session
        </span>
        <span className="text-gray-400 tabular-nums">
          {tierInfo.isMax ? "MAX" : `${tierInfo.xpInTier}/${tierInfo.xpForTier} XP`}
        </span>
      </div>
    </div>
  )
}
