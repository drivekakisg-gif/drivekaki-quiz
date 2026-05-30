// Benchmark badge component — drop this into the InstructorCard in app/instructors/page.tsx
// Replace the existing <StarRating> call and add this below the name/centre block.

import { getBenchmarkLabel } from "@/lib/benchmarks"

export function BenchmarkBadge({ passRateData }: { passRateData: Array<{class: string; tested: number; passed: number; pct: number}> }) {
  if (!passRateData || passRateData.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {passRateData.map((d, i) => {
        const cls = d.class as "3" | "3A"
        const { label, color, delta } = getBenchmarkLabel(d.pct, cls, d.tested)
        const sign = delta >= 0 ? "+" : ""

        return (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-xs font-black text-gray-900">{d.pct}%</span>
            <span className={`text-[10px] font-bold ${color}`}>
              {label}
              {d.tested >= 15 && ` (${sign}${delta}pp vs avg)`}
            </span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">
              Class {cls} · {d.tested} tested
              {d.tested < 15 ? " ⚠️" : ""}
            </span>
          </div>
        )
      })}
    </div>
  )
}
