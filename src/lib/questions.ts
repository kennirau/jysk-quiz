import data from "@/data/questions.json";

export type Question = {
  id: number;
  type: "multiple-choice";
  text: string;
  code?: string;
  options: { id: number; text: string }[];
};

type QuestionData = Omit<Question, "type"> & {
  type?: Question["type"];
  correctOptionId: number;
};

// Server-side only: includes the correct answers.
export const questions = data as QuestionData[];

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
    .map(({ id, type = "multiple-choice", text, code, options }) => ({
      id,
      type,
      text,
      code,
      options,
    }));
}
