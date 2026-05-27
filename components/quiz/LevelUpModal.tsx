"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { LevelTier } from "@/lib/xp"

interface LevelUpModalProps {
  visible: boolean
  tier: LevelTier | null
  onContinue: () => void
}

export default function LevelUpModal({ visible, tier, onContinue }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {visible && tier && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
            initial={{ scale: 0.7, y: 40 }}
            animate={{ scale: 1,   y: 0 }}
            exit={{ scale: 0.7, y: 40 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
          >
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest mb-1">Level Up!</p>
            <h2
              className="text-3xl font-black mb-2"
              style={{ color: tier.color }}
            >
              {tier.name}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              You've unlocked a new tier. Keep going!
            </p>
            <button
              onClick={onContinue}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg transition-colors"
            >
              KEEP GOING 🔥
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
