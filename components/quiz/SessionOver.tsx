"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Mascot from "@/components/Mascot"

interface SessionOverProps {
  heartRefillTime: string | null
  onRefreshed: () => void
}

export default function SessionOver({ heartRefillTime, onRefreshed }: SessionOverProps) {
  const [remaining, setRemaining] = useState("")

  useEffect(() => {
    if (!heartRefillTime) return

    const tick = () => {
      const ms = new Date(heartRefillTime).getTime() - Date.now()
      if (ms <= 0) {
        setRemaining("Now!")
        onRefreshed()
        return
      }
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1_000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [heartRefillTime, onRefreshed])

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <Mascot mood="sad" size={100} className="mx-auto mb-6" />

      <h1 className="text-3xl font-black text-gray-900 mb-2">Session Over</h1>
      <p className="text-gray-500 text-base mb-8 leading-relaxed">
        You've used all 5 hearts.<br />
        Take a break and come back — your brain needs time to consolidate what you learned.
      </p>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
        <p className="text-red-600 text-sm font-semibold mb-1">Hearts refill in</p>
        <p className="text-4xl font-black text-red-500 tabular-nums">{remaining || "…"}</p>
      </div>

      <div className="space-y-3">
        <Link
          href="/"
          className="block w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors"
        >
          Back to Home
        </Link>
        <button
          onClick={onRefreshed}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-colors text-sm"
        >
          Check again
        </button>
      </div>
    </div>
  )
}
