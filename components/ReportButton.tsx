"use client"

import { useState } from "react"
import { reportQuestion, REPORT_REASONS, type ReportReason } from "@/lib/reportQuestion"

export default function ReportButton({ questionId }: { questionId: string }) {
  const [open, setOpen]       = useState(false)
  const [sent, setSent]       = useState(false)
  const [reason, setReason]   = useState<ReportReason | "">("")
  const [notes, setNotes]     = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!reason) return
    setLoading(true)
    await reportQuestion(questionId, reason as ReportReason, notes || undefined).catch(console.error)
    setLoading(false)
    setSent(true)
    setTimeout(() => { setOpen(false); setSent(false); setReason(""); setNotes("") }, 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-300 hover:text-gray-400 transition-colors"
      >
        🚩 Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            {sent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-gray-800">Report sent — thanks!</p>
              </div>
            ) : (
              <>
                <h3 className="font-black text-gray-900 mb-4">Report this question</h3>
                <div className="space-y-2 mb-4">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        reason === r
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {reason === "Other" && (
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none"
                    rows={2}
                    placeholder="Describe the issue…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={!reason || loading}
                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-40 transition-colors"
                  >
                    {loading ? "Sending…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
