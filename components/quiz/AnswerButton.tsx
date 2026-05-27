"use client"

import { motion } from "framer-motion"

type ButtonState = "idle" | "selected" | "correct" | "wrong" | "dimmed"

interface AnswerButtonProps {
  letter: string
  text: string
  state: ButtonState
  onClick: () => void
}

const LETTERS = ["A", "B", "C", "D"]

export default function AnswerButton({ letter, text, state, onClick }: AnswerButtonProps) {
  const base = "relative w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-medium text-sm md:text-base cursor-pointer select-none min-h-[52px] transition-colors duration-100"

  const styles: Record<ButtonState, string> = {
    idle:     `${base} bg-white border-gray-200 hover:border-green-400 hover:bg-green-50 active:scale-[0.98] text-gray-800`,
    selected: `${base} bg-blue-50 border-blue-500 text-blue-900`,
    correct:  `${base} bg-green-50 border-green-500 text-green-900`,
    wrong:    `${base} bg-red-50 border-red-400 text-red-900`,
    dimmed:   `${base} bg-white border-gray-100 text-gray-300 cursor-default`,
  }

  const badgeStyles: Record<ButtonState, string> = {
    idle:     "w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0",
    selected: "w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
    correct:  "w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
    wrong:    "w-8 h-8 rounded-lg bg-red-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
    dimmed:   "w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-200 flex-shrink-0",
  }

  const shakeAnim = state === "wrong"
    ? { x: [-8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.4 } }
    : {}

  const bounceAnim = state === "correct"
    ? { scale: [1, 1.03, 0.98, 1.01, 1], transition: { duration: 0.35 } }
    : {}

  return (
    <motion.button
      className={styles[state]}
      onClick={state === "idle" || state === "selected" ? onClick : undefined}
      animate={{ ...shakeAnim, ...bounceAnim }}
      whileTap={state === "idle" ? { scale: 0.98 } : {}}
      disabled={state === "dimmed" || state === "correct" || state === "wrong"}
    >
      <span className={badgeStyles[state]}>{letter}</span>
      <span className="leading-snug flex-1">{text}</span>
      {state === "correct" && <span className="flex-shrink-0 text-green-500 text-lg">✓</span>}
      {state === "wrong"   && <span className="flex-shrink-0 text-red-400 text-lg">✗</span>}
    </motion.button>
  )
}

export function getButtonState(
  letter: string,
  selected: string | null,
  revealed: boolean,
  correctLetter: string,
): ButtonState {
  if (!revealed) {
    if (selected === letter) return "selected"
    return "idle"
  }
  if (letter === correctLetter) return "correct"
  if (letter === selected)      return "wrong"
  return "dimmed"
}
