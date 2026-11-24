"use server";

import { questions } from "@/lib/questions";

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitAnswers(
  answers: { questionId: number; optionId: number }[],
): Promise<SubmitResult> {
  const isValid =
    Array.isArray(answers) &&
    answers.length === questions.length &&
    questions.every((q) =>
      answers.some(
        (a) =>
          a?.questionId === q.id &&
          q.options.some((o) => o.id === a?.optionId),
      ),
    );

  if (!isValid) return { ok: false, error: "Please answer all questions." };

  // No storage yet; answers show up in the Vercel function logs.
  console.log("Quiz submission", JSON.stringify(answers));
  return { ok: true };
}
