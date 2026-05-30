"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  fetchInstructors,
  logInstructorConnect,
  SINGAPORE_AREAS,
  DRIVING_CENTRES,
  type Instructor,
} from "@/lib/instructors"

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(full)}{half ? "½" : ""}
      <span className="text-gray-400 ml-1">{rating.toFixed(1)}</span>
    </span>
  )
}

function InstructorCard({ instructor, fromTopic }: { instructor: Instructor; fromTopic: string | null }) {
  const initials = instructor.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

  async function handleConnect() {
    await logInstructorConnect(instructor.id, fromTopic)
    const wa = instructor.contact_wa
    if (wa) {
      const num = wa.replace(/\D/g, "")
      const msg = fromTopic
        ? `Hi ${instructor.name}, I found you on DriveKaki. I'm a learner driver working on ${fromTopic} and would love to connect.`
        : `Hi ${instructor.name}, I found you on DriveKaki and would like to connect about driving lessons.`
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank")
    } else if (instructor.contact_tg) {
      window.open(`https://t.me/${instructor.contact_tg.replace("@", "")}`, "_blank")
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-black text-lg shrink-0">
          {initials}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-black text-gray-900">{instructor.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {instructor.driving_centre && (
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    {instructor.driving_centre}
                  </span>
                )}
                {instructor.experience_years && (
                  <span className="text-[11px] text-gray-400">{instructor.experience_years} yrs</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <StarRating rating={instructor.rating} />
              {instructor.review_count > 0 && (
                <p className="text-[10px] text-gray-400 mt-0.5">{instructor.review_count} reviews</p>
              )}
            </div>
          </div>

          {/* Areas */}
          <div className="flex flex-wrap gap-1 mt-2">
            {instructor.areas.slice(0, 3).map(area => (
              <span key={area} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                📍 {area}
              </span>
            ))}
            {instructor.areas.length > 3 && (
              <span className="text-[11px] text-gray-400">+{instructor.areas.length - 3}</span>
            )}
          </div>

          {/* Specialties */}
          {instructor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {instructor.specialties.slice(0, 3).map(s => (
                <span key={s} className="text-[11px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bio excerpt */}
      {instructor.bio && (
        <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">{instructor.bio}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleConnect}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          💬 Connect
        </button>
        <Link
          href={`/instructors/${instructor.id}${fromTopic ? `?topic=${encodeURIComponent(fromTopic)}` : ""}`}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View profile
        </Link>
      </div>
    </div>
  )
}

function InstructorList() {
  const searchParams = useSearchParams()
  const topicParam = searchParams.get("topic")

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [area, setArea] = useState("")
  const [centre, setCentre] = useState("")

  useEffect(() => {
    setLoading(true)
    fetchInstructors({ area: area || undefined, driving_centre: centre || undefined })
      .then(setInstructors)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [area, centre])

  return (
    <>
      {/* Contextual suggestion when coming from weak topic */}
      {topicParam && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
          <p className="text-green-800 font-semibold text-sm">
            💡 Showing instructors who specialise in <strong>{topicParam}</strong>
          </p>
          <p className="text-green-600 text-xs mt-0.5">
            Connect with one for personalised help beyond what the quiz can give you.
          </p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <select
          value={area}
          onChange={e => setArea(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 shrink-0"
        >
          <option value="">All areas</option>
          {SINGAPORE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={centre}
          onChange={e => setCentre(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 shrink-0"
        >
          <option value="">All centres</option>
          {DRIVING_CENTRES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(area || centre) && (
          <button
            onClick={() => { setArea(""); setCentre("") }}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : instructors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 font-semibold">No instructors found</p>
          <p className="text-gray-400 text-sm mt-1">Try clearing the filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {instructors.map(i => (
            <InstructorCard key={i.id} instructor={i} fromTopic={topicParam} />
          ))}
        </div>
      )}
    </>
  )
}

export default function InstructorsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 text-sm">← Back</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Instructor Connect</h1>
        <p className="text-gray-500 text-sm mt-1">
          Theory-ready students make better use of lesson time. Connect with an instructor who knows what you&apos;re working on.
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <InstructorList />
      </Suspense>

      {/* Partner CTA */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
        <p className="text-sm font-bold text-gray-700">Are you a driving instructor?</p>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Get referred to theory-ready students in your area — for free.
        </p>
        <Link
          href="/instructors/register"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
        >
          Partner with DriveKaki →
        </Link>
      </div>
    </div>
  )
}
