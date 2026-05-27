"use client";

import type { QuizResult, QuizAttempt, BttQuestion } from "@/types";
import WeakAreasSummary from "./WeakAreasSummary";
import Link from "next/link";

interface ResultsSummaryProps {
  result: QuizResult;
  questions: BttQuestion[];
  attempts: QuizAttempt[];
  onRestart: () => void;
}

export default function ResultsSummary({
  result,
  questions,
  attempts,
  onRestart,
}: ResultsSummaryProps) {
  const { score, total, passed } = result;
  const pct = Math.round((score / total) * 100);

  // Per-topic stats
  const topicMap: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((a) => {
    const q = questions.find((q) => q.id === a.questionId);
    if (!q) return;
    if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
    topicMap[q.topic].total++;
    if (a.correct) topicMap[q.topic].correct++;
  });
  const topicStats = Object.entries(topicMap).map(([topic, s]) => ({
    topic,
    ...s,
  }));

  const wrongQuestions = attempts
    .filter((a) => !a.correct)
    .map((a) => questions.find((q) => q.id === a.questionId))
    .filter(Boolean) as BttQuestion[];

  return (
    <div className="space-y-5">
      {/* Hero score */}
      <div
        className={`rounded-2xl p-8 text-center text-white ${
          passed
            ? "bg-gradient-to-br from-green-500 to-green-600"
            : "bg-gradient-to-br from-orange-400 to-red-500"
        }`}
      >
        <div className="text-6xl font-bold mb-2">
          {score}/{total}
        </div>
        <div className="text-2xl font-bold tracking-wide mb-1">
          {passed ? "PASSED ✓" : "NOT PASSED YET"}
        </div>
        <p className="text-white/80 text-sm">
          {passed
            ? `Excellent! You scored ${pct}% — above the 90% pass mark.`
            : `You scored ${pct}%. You need 45/49 (≈90%) to pass. Keep going!`}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{score}</div>
          <div className="text-xs text-gray-400 mt-1">Correct</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{total - score}</div>
          <div className="text-xs text-gray-400 mt-1">Wrong</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{pct}%</div>
          <div className="text-xs text-gray-400 mt-1">Score</div>
        </div>
      </div>

      {/* Weak areas chart */}
      <WeakAreasSummary stats={topicStats} />

      {/* Missed questions review */}
      {wrongQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Questions to review ({wrongQuestions.length})
          </h2>
          <div className="space-y-4">
            {wrongQuestions.map((q) => {
              const attempt = attempts.find((a) => a.questionId === q.id)!;
              return (
                <div
                  key={q.id}
                  className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                >
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    {q.question}
                  </p>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-red-500">
                      Your answer: {attempt.selected} —{" "}
                      {q.options[["A","B","C","D"].indexOf(attempt.selected ?? "")]?.replace(/^[A-D]\.\s*/,"")}
                    </span>
                    <span className="text-green-600 font-medium">
                      Correct: {q.correct} —{" "}
                      {q.options[["A","B","C","D"].indexOf(q.correct)]?.replace(/^[A-D]\.\s*/,"")}
                    </span>
                    <p className="text-gray-500 mt-1 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <button
          onClick={onRestart}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="flex-1 bg-white border-2 border-gray-200 hover:border-green-400 text-gray-700 font-semibold py-3.5 rounded-xl text-center transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
