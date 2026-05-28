import { Suspense } from "react"
import QuizEngine from "./QuizEngine"

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl animate-bounce">🚗</div>
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    }>
      <QuizEngine />
    </Suspense>
  )
}
