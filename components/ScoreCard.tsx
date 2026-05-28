"use client"

import { useRef, useState } from "react"

interface TopicStat { topic: string; correct: number; total: number }

interface ScoreCardProps {
  score: number
  total: number
  sessionXP: number
  topicStats: TopicStat[]
}

export default function ScoreCard({ score, total, sessionXP, topicStats }: ScoreCardProps) {
  const cardRef  = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  async function downloadPNG() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#f8fafb" })
      const link = document.createElement("a")
      link.download = `drivekaki-score-${Date.now()}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } finally {
      setSaving(false)
    }
  }

  async function shareImage() {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#f8fafb" })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], "drivekaki-score.png", { type: "image/png" })
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "DriveKaki Score" }).catch(() => {})
        } else {
          // Fallback: download
          const link = document.createElement("a")
          link.download = "drivekaki-score.png"
          link.href = URL.createObjectURL(blob)
          link.click()
        }
      })
    } finally {
      setSaving(false)
    }
  }

  const pct = Math.round((score / total) * 100)
  const passed = pct >= 90
  const top3 = [...topicStats]
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, 3)

  return (
    <div className="space-y-3">
      {/* The card to screenshot */}
      <div
        ref={cardRef}
        className="bg-white rounded-2xl p-6 border border-gray-100"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="font-black text-gray-900 text-sm">DriveKaki Theory</p>
            <p className="text-xs text-gray-400">Singapore BTT Practice</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">drivekaki-quiz.vercel.app</p>
          </div>
        </div>

        {/* Score */}
        <div className={`rounded-2xl p-5 text-center text-white mb-4 ${passed ? "bg-gradient-to-br from-green-500 to-green-600" : "bg-gradient-to-br from-orange-400 to-red-500"}`}>
          <div className="text-5xl font-black mb-1">{score}/{total}</div>
          <div className="text-lg font-bold">{passed ? "PASSED ✓" : "Keep practising!"}</div>
          <div className="text-white/80 text-sm mt-1">{pct}% · +{sessionXP} XP earned</div>
        </div>

        {/* Weak topics */}
        {top3.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topic breakdown</p>
            {top3.map(({ topic, correct, total: t }) => {
              const p = Math.round((correct / t) * 100)
              return (
                <div key={topic}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700 font-medium truncate">{topic}</span>
                    <span className={p < 70 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{p}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${p < 70 ? "bg-red-400" : "bg-green-500"}`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={shareImage}
          disabled={saving}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {saving ? "Generating…" : "📤 Share"}
        </button>
        <button
          onClick={downloadPNG}
          disabled={saving}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          ⬇️ Save PNG
        </button>
      </div>
    </div>
  )
}
