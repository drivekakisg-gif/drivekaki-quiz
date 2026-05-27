"use client"

import { useEffect, useState } from "react"

interface XPFloatItem {
  id: number
  amount: number
  label: string
}

interface XPFloatProps {
  floats: XPFloatItem[]
  onExpire: (id: number) => void
}

export default function XPFloat({ floats, onExpire }: XPFloatProps) {
  return (
    <>
      {floats.map(f => (
        <FloatItem key={f.id} item={f} onExpire={onExpire} />
      ))}
    </>
  )
}

function FloatItem({ item, onExpire }: { item: XPFloatItem; onExpire: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onExpire(item.id), 900)
    return () => clearTimeout(t)
  }, [item.id, onExpire])

  return (
    <div
      className="pointer-events-none fixed left-1/2 bottom-28 z-50 -translate-x-1/2 font-black text-amber-500 text-xl tabular-nums animate-xp-float"
      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
    >
      {item.label}
    </div>
  )
}

// Hook to manage float queue
let _nextId = 1
export function useXPFloats() {
  const [floats, setFloats] = useState<XPFloatItem[]>([])

  function spawnFloat(amount: number, label: string) {
    const id = _nextId++
    setFloats(prev => [...prev, { id, amount, label }])
  }

  function expireFloat(id: number) {
    setFloats(prev => prev.filter(f => f.id !== id))
  }

  return { floats, spawnFloat, expireFloat }
}
