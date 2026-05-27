// Matches the real Supabase btt_questions table schema
export interface BttQuestion {
  id: string;            // uuid
  topic: string;
  question: string;
  options: string[];     // ["A. option text", "B. option text", ...]
  correct: string;       // "A" | "B" | "C" | "D"
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

// Runtime state during a quiz
export interface QuizAttempt {
  questionId: string;
  selected: string | null;  // "A" | "B" | "C" | "D" | null
  correct: boolean;
  timeTakenSeconds: number;
}

export interface QuizResult {
  attempts: QuizAttempt[];
  score: number;
  total: number;
  passed: boolean;
  weakTopics: string[];
  completedAt: Date;
}

// Matches quiz_attempts table
export interface DbAttempt {
  id?: string;
  user_id: string;
  question_id: string;
  selected: string;
  correct: boolean;
  time_taken_seconds: number;
  created_at?: string;
}
