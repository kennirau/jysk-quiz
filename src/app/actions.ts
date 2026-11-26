"use server";

import { questions, QUIZ_SIZE } from "@/lib/questions";

export type SubmitResult =
  | { ok: true; correct: number; total: number }
  | { ok: false; error: string };

export async function submitAnswers(
  email: string,
  consent: boolean,
  answers: { questionId: number; optionId: number }[],
): Promise<SubmitResult> {
  if (consent !== true) {
    return { ok: false, error: "Please accept the consent to take part." };
  }

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const isValid =
    Array.isArray(answers) &&
    answers.length === QUIZ_SIZE &&
    new Set(answers.map((a) => a?.questionId)).size === answers.length &&
    answers.every((a) =>
      questions.some(
        (q) =>
          q.id === a?.questionId && q.options.some((o) => o.id === a?.optionId),
      ),
    );

  if (!isValid) return { ok: false, error: "Please answer all questions." };

  // No storage yet; answers show up in the Vercel function logs.
  const correct = answers.filter((a) =>
    questions.some(
      (q) => q.id === a.questionId && q.correctOptionId === a.optionId,
    ),
  ).length;

  console.log(
    "Quiz submission",
    JSON.stringify({
      email: normalizedEmail,
      consentedAt: new Date().toISOString(),
      answers,
      correct,
      total: answers.length,
    }),
  );
  return { ok: true, correct, total: answers.length };
}
