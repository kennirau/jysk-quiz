import data from "@/data/questions.json";

export type Question = {
  id: number;
  type: "multiple-choice";
  text: string;
  code?: string;
  options: { id: number; text: string }[];
};

export const questions = data as Question[];

export const QUIZ_SIZE = Math.min(5, questions.length);

export function pickRandomQuestions(): Question[] {
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, QUIZ_SIZE);
}
