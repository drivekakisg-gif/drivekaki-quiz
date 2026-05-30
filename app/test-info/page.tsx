"use client"

import Link from "next/link"
import {
  FIRST_TIME_PASS_RATES,
  WAITING_TIMES_LATEST,
  waitColor,
  monthsToWeeks,
  DATA_PERIOD,
  WAITING_PERIOD,
} from "@/lib/benchmarks"

const CENTRES = ["SSDC", "BBDC", "CDC"] as const

// ── Subcomponents ─────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-black text-gray-900">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function WaitBadge({ months }: { months: number }) {
  const cls = waitColor(months)
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${cls}`}>
      {monthsToWeeks(months)}
    </span>
  )
}

function WaitingTable({
  title,
  testKey,
}: {
  title: string
  testKey: keyof typeof WAITING_TIMES_LATEST
}) {
  const rows = WAITING_TIMES_LATEST[testKey]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-black text-gray-800">{title}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(r => (
          <div key={r.centre} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">{r.centre}</span>
            <WaitBadge months={r.months} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PassRateTable({
  title,
  testKey,
  note,
}: {
  title: string
  testKey: keyof typeof FIRST_TIME_PASS_RATES
  note?: string
}) {
  const rows = FIRST_TIME_PASS_RATES[testKey]
  if (rows.length === 0) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-black text-gray-800">{title}</p>
        {note && <p className="text-[11px] text-gray-400 mt-0.5">{note}</p>}
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(r => (
          <div key={r.centre} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {r.centre === "Private" ? "Private Instructors" : r.centre}
              </p>
              <p className="text-[11px] text-gray-400">
                {r.passed.toLocaleString()}/{r.tested.toLocaleString()} students
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xl font-black ${
                  r.pct >= 80 ? "text-green-600" :
                  r.pct >= 50 ? "text-yellow-600" :
                  "text-red-500"
                }`}
              >
                {r.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Key insights ──────────────────────────────────────────────────────────────

const insights = [
  {
    icon: "📚",
    text: "BTT at BBDC has a 93% first-time pass rate. Thorough theory practice makes a real difference.",
    color: "bg-green-50 border-green-200",
  },
  {
    icon: "⚠️",
    text: "Private instructor students pass Class 3 at only 29% first-time — vs 47% at BBDC school. Theory prep before lessons helps close this gap.",
    color: "bg-amber-50 border-amber-200",
  },
  {
    icon: "⏳",
    text: "Class 3 at CDC has the longest practical test wait: ~5 weeks. Plan ahead — book when you're 80%+ ready on DriveKaki.",
    color: "bg-blue-50 border-blue-200",
  },
  {
    icon: "🏍️",
    text: "Class 2B at CDC has the longest motorcycle wait — up to 2.2 months (Sep 2025). SSDC or BBDC are faster.",
    color: "bg-purple-50 border-purple-200",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TestInfoPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <Link href="/" className="text-gray-400 text-sm mb-6 inline-block">← Home</Link>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Singapore Driving Test Info</h1>
        <p className="text-gray-500 text-sm mt-1">
          Official LTA pass rates and test waiting times to help you plan.
        </p>
      </div>

      {/* Key insights */}
      <div className="space-y-2 mb-8">
        {insights.map(i => (
          <div key={i.text} className={`flex gap-3 p-3.5 rounded-2xl border ${i.color}`}>
            <span className="text-lg shrink-0">{i.icon}</span>
            <p className="text-sm text-gray-700 leading-relaxed">{i.text}</p>
          </div>
        ))}
      </div>

      {/* Waiting times */}
      <section className="mb-8">
        <SectionHeader
          title="Test Waiting Times"
          sub={`As of ${WAITING_PERIOD} — school lane (≤1 month = green, ≤2 months = yellow, >2 = red)`}
        />
        <WaitingTable title="Basic Theory Test (BTT)"       testKey="BTT" />
        <WaitingTable title="Final Theory Test (FTT)"       testKey="FTT" />
        <WaitingTable title="Riding Theory Test (RTT)"      testKey="RTT" />
        <WaitingTable title="Class 3 Practical Test"        testKey="Class 3" />
        <WaitingTable title="Class 3A Practical Test"       testKey="Class 3A" />
        <WaitingTable title="Class 2B Practical Test"       testKey="Class 2B" />
        <WaitingTable title="Class 2A Practical Test"       testKey="Class 2A" />
        <WaitingTable title="Class 2 Practical Test"        testKey="Class 2" />
      </section>

      {/* National pass rates */}
      <section className="mb-8">
        <SectionHeader
          title="National First-Timer Pass Rates"
          sub={`Period: ${DATA_PERIOD} — source: LTA official publication`}
        />
        <PassRateTable
          title="Basic Theory Test (BTT)"
          testKey="BTT"
          note="Most students pass BTT — solid theory practice gets you here."
        />
        <PassRateTable
          title="Final Theory Test (FTT)"
          testKey="FTT"
          note="BBDC FTT has a 97% first-time pass rate."
        />
        <PassRateTable
          title="Class 3 Practical Test (first attempt)"
          testKey="Class 3"
          note="Private instructor students average 29% — thorough prep matters."
        />
        <PassRateTable
          title="Class 3A Practical Test (first attempt)"
          testKey="Class 3A"
        />
      </section>

      {/* CTA */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="font-black text-gray-900 mb-1">Improve your odds before the test</p>
        <p className="text-sm text-gray-500 mb-4">
          Students who score consistently above 85% on DriveKaki theory practice are in a strong position for BTT/FTT.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/quiz" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            Start practising now →
          </Link>
          <Link href="/instructors" className="border border-green-400 text-green-600 font-bold py-3 rounded-xl text-sm transition-colors hover:bg-green-50">
            Find an instructor
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-4">
        Data from LTA official publication. Pass rates are first-timer rates for {DATA_PERIOD}.
        Waiting times as of {WAITING_PERIOD}.
      </p>
    </div>
  )
}
