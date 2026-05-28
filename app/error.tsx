"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-sm mb-2 font-mono bg-gray-50 rounded p-3 text-left break-all">
        {error?.message || "Unknown error"}
      </p>
      {error?.digest && (
        <p className="text-xs text-gray-400 mb-4">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="bg-green-500 text-white font-bold px-6 py-3 rounded-xl"
      >
        Try again
      </button>
    </div>
  )
}
