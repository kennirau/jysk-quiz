"use server";

import { questions, QUIZ_SIZE } from "@/lib/questions";
import {
  getTopResults,
  saveResult,
  type LeaderboardEntry,
} from "@/lib/results";
import { createStartToken, readStartToken } from "@/lib/timer";

export type SubmitResult =
  | {
      ok: true;
      correct: number;
      total: number;
      timeMs: number;
      leaderboard: LeaderboardEntry[];
    }
  | { ok: false; error: string };

// Called on the first answer click; the signed token stops clients faking the start time.
export async function startQuiz() {
  return createStartToken(Date.now());
}

export async function submitAnswers(
  email: string,
  consent: boolean,
  startToken: string,
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

  const startedAt = readStartToken(startToken);
  if (startedAt === null) {
    return {
      ok: false,
      error: "Your quiz timer was lost. Please reload and try again.",
    };
  }
  const timeMs = Date.now() - startedAt;

  const correct = answers.filter((a) =>
    questions.some(
      (q) => q.id === a.questionId && q.correctOptionId === a.optionId,
    ),
  ).length;

  try {
    await saveResult({
      email: normalizedEmail,
      correct,
      total: answers.length,
      timeMs,
      answers,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Could not save quiz result", err);
  }

  return {
    ok: true,
    correct,
    total: answers.length,
    timeMs,
    leaderboard: await getTopResults(5).catch((err) => {
      console.error("Could not load leaderboard", err);
      return [];
    }),
  };
}
