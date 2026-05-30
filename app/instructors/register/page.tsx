"use client"

import { useState } from "react"
import Link from "next/link"
import { registerInstructor, SINGAPORE_AREAS, DRIVING_CENTRES } from "@/lib/instructors"

const REFERRAL_OPTIONS = [
  { id: "theory_revision", label: "Theory revision", desc: "BTT/FTT knowledge gaps before practical lessons" },
  { id: "simulator_practice", label: "Simulator practice", desc: "Circuit & road skills before or between lessons" },
  { id: "both", label: "Both", desc: "Comprehensive prep — theory and practical" },
]

export default function InstructorRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    driving_centre: "",
    bio: "",
  })
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [referralTopics, setReferralTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleArea(area: string) {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  function toggleTopic(id: string) {
    setReferralTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedAreas.length === 0) { setError("Please select at least one area."); return }
    if (referralTopics.length === 0) { setError("Please select what you'd refer students for."); return }
    setLoading(true)
    setError(null)
    try {
      await registerInstructor({
        ...form,
        areas: selectedAreas,
        referral_topics: referralTopics,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🤝</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome to the DriveKaki instructor network!</h1>
        <p className="text-gray-500 mb-6">
          We&apos;ll review your profile and start matching you with students in your area. Expect a message from us within 24 hours.
        </p>
        <Link href="/instructors" className="inline-flex bg-green-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-600 transition-colors">
          Browse instructor profiles
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <Link href="/instructors" className="text-gray-400 text-sm mb-6 inline-block">← Back</Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Partner with DriveKaki</h1>
        <p className="text-gray-500 mt-2 leading-relaxed">
          We send you theory-ready students. You send your students to practise with us. Everyone wins.
        </p>
      </div>

      {/* Flywheel explainer */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
        <p className="text-sm font-bold text-green-800 mb-2">How the flywheel works</p>
        <div className="space-y-1.5 text-sm text-green-700">
          <p>1. Students use DriveKaki to find their weak areas</p>
          <p>2. We match them with instructors who specialise in those areas</p>
          <p>3. You refer <em>your</em> students to DriveKaki for theory prep</p>
          <p>4. Those students find other instructors → cycle continues</p>
        </div>
        <p className="text-xs text-green-600 mt-3 font-medium">No money changes hands through the platform. Zero cost to join.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Full name *</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your name as students will see it"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="For us to reach you — not shown publicly"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp number</label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-600 shrink-0">
              🇸🇬 +65
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
              placeholder="9123 4567"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Students will contact you directly on WhatsApp</p>
        </div>

        {/* Driving centre */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Primary driving centre *</label>
          <select
            required
            value={form.driving_centre}
            onChange={e => setForm(f => ({ ...f, driving_centre: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm bg-white"
          >
            <option value="">Select centre</option>
            {DRIVING_CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Areas */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Areas you operate in * <span className="text-gray-400 font-normal">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {SINGAPORE_AREAS.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  selectedAreas.includes(area)
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Referral topics — replaces price_per_lesson */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">What would you refer students to DriveKaki for? *</label>
          <p className="text-xs text-gray-400 mb-3">This tells us how to present the partnership to your students</p>
          <div className="space-y-2">
            {REFERRAL_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  referralTopics.includes(opt.id)
                    ? "bg-green-50 border-green-400"
                    : "bg-white border-gray-200 hover:border-green-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={referralTopics.includes(opt.id)}
                  onChange={() => toggleTopic(opt.id)}
                  className="mt-0.5 accent-green-500"
                />
                <div>
                  <p className="text-sm font-bold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Short bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            placeholder="Tell students a bit about your experience and approach — shown on your profile"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          {loading ? "Submitting…" : "Join the DriveKaki network →"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          We review all applications before listing. No payment required — ever.
        </p>
      </form>
    </div>
  )
}
