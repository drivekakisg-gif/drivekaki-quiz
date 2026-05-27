"use client"

export type MascotMood = "neutral" | "happy" | "sad" | "fire" | "celebrating"

interface MascotProps {
  mood?: MascotMood
  size?: number
  className?: string
}

export default function Mascot({ mood = "neutral", size = 80, className = "" }: MascotProps) {
  const body = "#22c55e"
  const dark  = "#16a34a"
  const win   = "#86efac"

  // Eye expressions
  const eyes: Record<MascotMood, { left: string; right: string; mouth: string }> = {
    neutral:     { left: "M20,18 A3,3 0 1,1 26,18",     right: "M38,18 A3,3 0 1,1 44,18",     mouth: "M22,28 Q32,34 42,28" },
    happy:       { left: "M20,16 Q23,12 26,16",          right: "M38,16 Q41,12 44,16",          mouth: "M20,26 Q32,38 44,26" },
    sad:         { left: "M20,18 Q23,22 26,18",          right: "M38,18 Q41,22 44,18",          mouth: "M22,32 Q32,24 42,32" },
    fire:        { left: "M20,14 Q23,10 26,14",          right: "M38,14 Q41,10 44,14",          mouth: "M20,24 Q32,40 44,24" },
    celebrating: { left: "M20,14 Q23,9 26,14",           right: "M38,14 Q41,9 44,14",           mouth: "M18,24 Q32,44 46,24" },
  }

  const e = eyes[mood]
  const isHappy = mood === "happy" || mood === "fire" || mood === "celebrating"
  const scale = mood === "celebrating" ? "animate-bounce" : mood === "fire" ? "animate-pulse" : ""

  return (
    <div className={`inline-block ${scale} ${className}`}>
      <svg width={size} height={size * 0.85} viewBox="0 0 64 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Car body */}
        <rect x="4" y="22" width="56" height="24" rx="6" fill={body} />
        {/* Cabin */}
        <path d="M14 22 L20 8 Q32 4 44 8 L50 22 Z" fill={dark} />
        {/* Windshield */}
        <path d="M21 22 L26 10 Q32 8 38 10 L43 22 Z" fill="#e0f2fe" opacity="0.9" />
        {/* Wheels */}
        <circle cx="16" cy="46" r="8" fill="#1f2937" />
        <circle cx="16" cy="46" r="4" fill="#6b7280" />
        <circle cx="48" cy="46" r="8" fill="#1f2937" />
        <circle cx="48" cy="46" r="4" fill="#6b7280" />
        {/* Headlight */}
        <rect x="54" y="28" width="5" height="6" rx="2" fill="#fef08a" />
        {/* Tail light */}
        <rect x="5" y="28" width="4" height="6" rx="2" fill="#fca5a5" />
        {/* Face on windshield */}
        <path d={e.left}   stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={e.right}  stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={e.mouth}  stroke="#1f2937" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Stars when celebrating */}
        {mood === "celebrating" && (
          <>
            <text x="0" y="12" fontSize="8">⭐</text>
            <text x="52" y="10" fontSize="7">✨</text>
          </>
        )}
        {/* Fire when on streak */}
        {mood === "fire" && <text x="52" y="22" fontSize="10">🔥</text>}
      </svg>
    </div>
  )
}
