import data from "@/data/questions.json";

export type Question = {
  id: number;
  text: string;
  options: { id: number; text: string }[];
};

export type QuestionWithAnswer = Question & { correctOptionId: number };

// Server-side only: includes the correct answers.
export const questions: QuestionWithAnswer[] = data;

// Safe to send to the browser.
export const publicQuestions: Question[] = questions.map(
  ({ id, text, options }) => ({ id, text, options }),
);
