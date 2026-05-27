import { createClient } from "@/lib/supabase";
import type { QuizAttempt } from "@/types";

export async function saveAttempts(
  userId: string,
  attempts: QuizAttempt[]
): Promise<void> {
  const supabase = createClient();

  const rows = attempts.map((a) => ({
    user_id: userId,
    question_id: a.questionId,
    selected: a.selected ?? "",
    correct: a.correct,
    time_taken_seconds: a.timeTakenSeconds,
  }));

  const { error } = await supabase.from("quiz_attempts").insert(rows);
  if (error) throw error;
}
