import data from "@/data/questions.json";

export type Question = {
  id: number;
  text: string;
  code?: string;
  options: { id: number; text: string }[];
};

export type QuestionWithAnswer = Question & { correctOptionId: number };

// Server-side only: includes the correct answers.
export const questions: QuestionWithAnswer[] = data;

export const QUIZ_SIZE = Math.min(5, questions.length);

// Random subset without the correct answers, safe to send to the browser.
export function pickRandomQuestions(): Question[] {
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, QUIZ_SIZE)
    .map(({ id, text, code, options }) => ({ id, text, code, options }));
}
