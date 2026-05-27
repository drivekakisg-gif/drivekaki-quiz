"use client"

import { AnimatePresence, motion } from "framer-motion"

interface MilestoneToastProps {
  streak: number
  visible: boolean
}

export default function MilestoneToast({ streak, visible }: MilestoneToastProps) {
  const config =
    streak >= 10 ? { emoji: "🔥🔥🔥", label: "UNSTOPPABLE 🔥", bg: "bg-orange-500", text: "text-white" } :
    streak >= 5  ? { emoji: "🔥🔥",   label: "You're on fire!", bg: "bg-orange-400", text: "text-white" } :
                   { emoji: "🔥",     label: "Keep going!",     bg: "bg-green-500",  text: "text-white" }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed top-32 left-1/2 -translate-x-1/2 z-50 ${config.bg} ${config.text} px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 font-black text-lg`}
          initial={{ opacity: 0, y: -20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={  { opacity: 0, y: -20, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <span className="text-2xl">{config.emoji}</span>
          <span>{config.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
