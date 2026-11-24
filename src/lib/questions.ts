import data from "@/data/questions.json";

export type Question = {
  id: number;
  text: string;
  options: { id: number; text: string }[];
};

export const questions: Question[] = data;
