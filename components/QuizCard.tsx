"use client";

import type { BttQuestion } from "@/types";

interface QuizCardProps {
  question: BttQuestion;
  questionNumber: number;
  total: number;
  selected: string | null;   // "A" | "B" | "C" | "D" | null
  revealed: boolean;
  onSelect: (letter: string) => void;
}

export default function QuizCard({
  question,
  questionNumber,
  total,
  selected,
  revealed,
  onSelect,
}: QuizCardProps) {
  const letters = ["A", "B", "C", "D"];

  function optionClass(letter: string): string {
    const base =
      "w-full text-left px-4 py-3 rounded-xl border-2 transition-colors duration-150 flex items-start gap-3 text-sm";

    if (!revealed) {
      if (selected === letter)
        return `${base} border-green-500 bg-green-50 font-medium`;
      return `${base} border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 active:bg-green-100 cursor-pointer`;
    }

    if (letter === question.correct)
      return `${base} border-[#22c55e] bg-[#22c55e] text-white font-semibold`;
    if (selected === letter && letter !== question.correct)
      return `${base} border-red-400 bg-red-50`;
    return `${base} border-gray-200 bg-white opacity-50`;
  }

  function labelBadgeClass(letter: string): string {
    const base =
      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold";

    if (!revealed) {
      if (selected === letter) return `${base} bg-green-500 text-white`;
      return `${base} bg-gray-100 text-gray-600`;
    }
    if (letter === question.correct) return `${base} bg-white text-green-600`;
    if (selected === letter) return `${base} bg-red-400 text-white`;
    return `${base} bg-gray-100 text-gray-400`;
  }

  // Strip "A. " prefix from option text for display
  function displayText(option: string): string {
    return option.replace(/^[A-D]\.\s*/, "");
  }

  const difficultyColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            {question.topic}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              difficultyColor[question.difficulty] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {question.difficulty}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {questionNumber}/{total}
        </span>
      </div>

      {/* Question */}
      <p className="text-gray-900 font-semibold text-base md:text-lg mb-5 leading-relaxed">
        {question.question}
      </p>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((option, index) => {
          const letter = letters[index];
          return (
            <button
              key={letter}
              onClick={() => !revealed && onSelect(letter)}
              disabled={revealed}
              className={optionClass(letter)}
            >
              <span className={labelBadgeClass(letter)}>{letter}</span>
              <span className="leading-snug pt-0.5">{displayText(option)}</span>
              {revealed && letter === question.correct && (
                <span className="ml-auto flex-shrink-0 text-white text-lg">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div
          className={`mt-5 p-4 rounded-xl border ${
            selected === question.correct
              ? "bg-green-50 border-green-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <p
            className={`text-xs font-semibold mb-1 ${
              selected === question.correct ? "text-green-700" : "text-blue-700"
            }`}
          >
            {selected === question.correct ? "✓ Correct!" : `✗ Correct answer: ${question.correct}`}
          </p>
          <p
            className={`text-sm leading-relaxed ${
              selected === question.correct ? "text-green-800" : "text-blue-800"
            }`}
          >
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
