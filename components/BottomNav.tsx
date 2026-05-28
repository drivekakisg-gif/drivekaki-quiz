"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { href: "/",            icon: "🏠", label: "Home"   },
  { href: "/quiz",        icon: "🎮", label: "Quiz"   },
  { href: "/daily",       icon: "📅", label: "Daily"  },
  { href: "/coach",       icon: "🧠", label: "Coach"  },
  { href: "/leaderboard", icon: "🏆", label: "Ranks"  },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb md:hidden">
      <div className="flex items-stretch h-16">
        {NAV.map(({ href, icon, label }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-green-500" : "text-gray-400"
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${active ? "scale-110" : ""}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold ${active ? "text-green-600" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
