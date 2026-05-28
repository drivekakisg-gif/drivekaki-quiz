"use client"

import { useEffect, useState, useCallback } from "react"
import {
  getWeeklyTop10,
  getAllTimeTop10,
  getMyWeeklyRank,
  currentWeek,
  type LeaderboardEntry,
} from "@/lib/leaderboard"

type Tab = "weekly" | "alltime"

const MEDALS = ["🥇", "🥈", "🥉"]

export default function LeaderboardPage() {
  const [tab, setTab]           = useState<Tab>("weekly")
  const [weekly, setWeekly]     = useState<LeaderboardEntry[]>([])
  const [allTime, setAllTime]   = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank]     = useState<{ rank: number; entry: LeaderboardEntry } | null>(null)
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    const [w, a, my] = await Promise.all([
      getWeeklyTop10(),
      getAllTimeTop10(),
      getMyWeeklyRank(),
    ])
    setWeekly(w)
    setAllTime(a)
    setMyRank(my)
    setLastRefresh(Date.now())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(id)
  }, [load])

  const list = tab === "weekly" ? weekly : allTime
  const myInList = tab === "weekly" && myRank && !weekly.find(e => e.user_id === myRank.entry.user_id)

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Leaderboard</h1>
          <p className="text-xs text-gray-400">
            {tab === "weekly" ? `Week ${currentWeek()}` : "All time"} ·{" "}
            {loading ? "refreshing…" : `updated ${new Date(lastRefresh).toLocaleTimeString()}`}
          </p>
        </div>
        <button onClick={load} className="text-green-500 text-sm font-semibold">↻ Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        {(["weekly", "alltime"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            {t === "weekly" ? "🔥 This Week" : "🏆 All Time"}
          </button>
        ))}
      </div>

      {loading && list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl animate-bounce">🏆</div>
          <p className="text-gray-400 text-sm">Loading rankings…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🏁</div>
          <p className="font-bold text-gray-700 mb-1">No entries yet</p>
          <p className="text-gray-400 text-sm">Be the first on the board — complete a quiz!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${
                entry.rank === 1 ? "border-amber-300 bg-amber-50"
                : entry.rank === 2 ? "border-gray-300 bg-gray-50"
                : entry.rank === 3 ? "border-orange-300 bg-orange-50"
                : "border-gray-100 bg-white"
              }`}
            >
              <div className="w-8 text-center text-lg font-black">
                {entry.rank! <= 3 ? MEDALS[entry.rank! - 1] : `#${entry.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{entry.username}</p>
                <p className="text-xs text-gray-400">
                  {tab === "weekly"
                    ? `${entry.xp.toLocaleString()} XP this week`
                    : `${entry.correct_count.toLocaleString()} correct answers`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900">
                  {tab === "weekly" ? entry.xp.toLocaleString() : entry.correct_count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">{tab === "weekly" ? "XP" : "correct"}</p>
              </div>
            </div>
          ))}

          {/* User's own rank if outside top 10 */}
          {myInList && myRank && (
            <>
              <div className="text-center text-gray-300 text-xs py-1">· · ·</div>
              <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-green-300 bg-green-50">
                <div className="w-8 text-center font-black text-green-600">#{myRank.rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{myRank.entry.username} <span className="text-green-500 text-xs">(you)</span></p>
                  <p className="text-xs text-gray-400">{myRank.entry.xp.toLocaleString()} XP this week</p>
                </div>
                <div className="font-black text-gray-900">{myRank.entry.xp.toLocaleString()}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
