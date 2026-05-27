import { createClient } from "@/lib/supabase";
import type { BttQuestion } from "@/types";

export async function fetchQuestions(): Promise<BttQuestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("btt_questions")
    .select("id, topic, question, options, correct, explanation, difficulty")
    .order("topic");

  if (error) throw error;
  return (data ?? []) as BttQuestion[];
}

export function getOptionLetter(index: number): string {
  return ["A", "B", "C", "D"][index] ?? "";
}

export function getOptionText(option: string): string {
  // Strip leading "A. " / "B. " etc if present
  return option.replace(/^[A-D]\.\s*/, "");
}

export function getOptionIndex(letter: string): number {
  return ["A", "B", "C", "D"].indexOf(letter);
}

export function getTopics(questions: BttQuestion[]): string[] {
  return [...new Set(questions.map((q) => q.topic))];
}
