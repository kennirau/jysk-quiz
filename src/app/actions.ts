"use server";

import { questions } from "@/lib/questions";

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
    answers.length === questions.length &&
    questions.every((q) =>
      answers.some(
        (a) =>
          a?.questionId === q.id && q.options.some((o) => o.id === a?.optionId),
      ),
    );

  if (!isValid) return { ok: false, error: "Please answer all questions." };

  // No storage yet; answers show up in the Vercel function logs.
  const correct = questions.filter((q) =>
    answers.some(
      (a) => a.questionId === q.id && a.optionId === q.correctOptionId,
    ),
  ).length;

  console.log(
    "Quiz submission",
    JSON.stringify({
      email: normalizedEmail,
      consentedAt: new Date().toISOString(),
      answers,
      correct,
      total: questions.length,
    }),
  );
  return { ok: true, correct, total: questions.length };
}
