"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { fetchInstructor, logInstructorConnect, type Instructor } from "@/lib/instructors"

const VALUE_POINTS = [
  {
    icon: "🎯",
    text: "Students arrive knowing their weak areas — less wasted lesson time",
  },
  {
    icon: "📈",
    text: "Theory-ready students progress faster in practical lessons",
  },
  {
    icon: "🛡️",
    text: "Simulator practice means fewer on-road mistakes with you",
  },
]

function StarRating({ rating, reviewCount }: { rating: number | null; reviewCount: number }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}>★</span>
        ))}
      </div>
      <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
      {reviewCount > 0 && <span className="text-gray-400 text-sm">({reviewCount} reviews)</span>}
    </div>
  )
}

export default function InstructorProfilePage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const fromTopic = searchParams.get("topic")

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInstructor(params.id)
      .then(setInstructor)
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleConnect(via: "wa" | "tg") {
    if (!instructor) return
    await logInstructorConnect(instructor.id, fromTopic)
    if (via === "wa" && instructor.contact_wa) {
      const num = instructor.contact_wa.replace(/\D/g, "")
      const msg = fromTopic
        ? `Hi ${instructor.name}, I found you on DriveKaki. I'm working on ${fromTopic} and would like to connect about lessons.`
        : `Hi ${instructor.name}, I found you on DriveKaki and would like to get in touch about driving lessons.`
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank")
    } else if (via === "tg" && instructor.contact_tg) {
      window.open(`https://t.me/${instructor.contact_tg.replace("@", "")}`, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!instructor) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Instructor not found.</p>
        <Link href="/instructors" className="text-green-600 font-semibold mt-4 inline-block">← Back to instructors</Link>
      </div>
    )
  }

  const initials = instructor.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <Link href="/instructors" className="text-gray-400 text-sm mb-6 inline-block">← All instructors</Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex gap-4 items-start">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-black text-2xl shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">{instructor.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              {instructor.driving_centre && (
                <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  {instructor.driving_centre}
                </span>
              )}
              {instructor.experience_years && (
                <span className="text-xs text-gray-400 flex items-center">{instructor.experience_years} years experience</span>
              )}
              {instructor.verified && (
                <span className="text-xs font-semibold bg-green-50 text-green-600 px-2.5 py-1 rounded-full">✓ Verified</span>
              )}
            </div>
            <div className="mt-2">
              <StarRating rating={instructor.rating} reviewCount={instructor.review_count} />
            </div>
          </div>
        </div>

        {instructor.bio && (
          <p className="text-gray-600 text-sm leading-relaxed mt-4">{instructor.bio}</p>
        )}

        {/* Areas & specialties */}
        <div className="mt-4 space-y-3">
          {instructor.areas.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Serves</p>
              <div className="flex flex-wrap gap-1.5">
                {instructor.areas.map(a => (
                  <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">📍 {a}</span>
                ))}
              </div>
            </div>
          )}
          {instructor.specialties.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Specialises in</p>
              <div className="flex flex-wrap gap-1.5">
                {instructor.specialties.map(s => (
                  <span key={s} className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why instructors partner with DriveKaki */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Why instructors partner with DriveKaki</p>
        <div className="space-y-3">
          {VALUE_POINTS.map(point => (
            <div key={point.text} className="flex gap-3">
              <span className="text-lg shrink-0">{point.icon}</span>
              <p className="text-sm text-gray-600 leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-gray-900 mb-1">Start a conversation with {instructor.name.split(" ")[0]}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Get in touch directly — pricing and scheduling are between you and the instructor.
        </p>
        <div className="flex flex-col gap-2">
          {instructor.contact_wa && (
            <button
              onClick={() => handleConnect("wa")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Message on WhatsApp
            </button>
          )}
          {instructor.contact_tg && (
            <button
              onClick={() => handleConnect("tg")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#229ED9" }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Message on Telegram
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          DriveKaki doesn&apos;t handle payments or bookings — that&apos;s between you and the instructor.
        </p>
      </div>
    </div>
  )
}
