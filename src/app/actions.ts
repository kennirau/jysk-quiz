"use server";

import { QUESTION_COUNT, saveSubmission } from "@/lib/db";

export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitAnswers(
  answers: { questionId: number; optionId: number }[],
): Promise<SubmitResult> {
  const isValidShape =
    Array.isArray(answers) &&
    answers.length > 0 &&
    answers.length <= QUESTION_COUNT &&
    answers.every(
      (a) => Number.isInteger(a?.questionId) && Number.isInteger(a?.optionId),
    ) &&
    new Set(answers.map((a) => a.questionId)).size === answers.length;

  if (!isValidShape)
    return { ok: false, error: "Please answer all questions." };

  try {
    await saveSubmission(answers);
    return { ok: true };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: "Could not save your answers. Please try again.",
    };
  }
}
