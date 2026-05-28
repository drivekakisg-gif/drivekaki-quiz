import { createClient } from "@/lib/supabase"

export const REPORT_REASONS = [
  "Wrong answer",
  "Outdated rule",
  "Unclear wording",
  "Other",
] as const

export type ReportReason = typeof REPORT_REASONS[number]

export async function reportQuestion(
  questionId: string,
  reason: ReportReason,
  notes?: string,
): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  await supabase.from("question_reports").insert({
    question_id: questionId,
    user_id: data.user?.id ?? null,
    reason,
    notes: notes ?? null,
  })
}
