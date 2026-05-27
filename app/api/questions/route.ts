// Phase 2: Question bank management API
// TODO: Add admin auth middleware before enabling writes

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const difficulty = searchParams.get("difficulty");

  let query = supabase
    .from("btt_questions")
    .select("id, topic, question, options, correct, explanation, difficulty");

  if (topic) query = query.eq("topic", topic);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data, error } = await query.order("topic");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data, total: data?.length ?? 0 });
}

// POST: Add a new question (Phase 2 — requires admin auth)
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented — Phase 2 feature" },
    { status: 501 }
  );
}
