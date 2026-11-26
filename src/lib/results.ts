import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type QuizResult = {
  email: string;
  correct: number;
  total: number;
  timeMs: number;
  answers: { questionId: number; optionId: number }[];
  submittedAt: string;
};

export type LeaderboardEntry = {
  name: string;
  correct: number;
  total: number;
  timeMs: number;
};

const RESULTS_FILE =
  process.env.RESULTS_FILE ??
  path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "results.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function readResults(): Promise<QuizResult[]> {
  try {
    return JSON.parse(await readFile(RESULTS_FILE, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export function saveResult(result: QuizResult): Promise<void> {
  // Serialize writes so concurrent submissions don't overwrite each other.
  const run = writeQueue.then(async () => {
    const results = await readResults();
    results.push(result);
    await mkdir(path.dirname(RESULTS_FILE), { recursive: true });
    const tmp = `${RESULTS_FILE}.tmp`;
    await writeFile(tmp, JSON.stringify(results, null, 2));
    await rename(tmp, RESULTS_FILE);
  });
  writeQueue = run.catch(() => {});
  return run;
}

function isBetter(a: QuizResult, b: QuizResult) {
  return a.correct !== b.correct ? a.correct > b.correct : a.timeMs < b.timeMs;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function getTopResults(limit = 5): Promise<LeaderboardEntry[]> {
  const bestPerEmail = new Map<string, QuizResult>();
  for (const r of await readResults()) {
    const current = bestPerEmail.get(r.email);
    if (!current || isBetter(r, current)) bestPerEmail.set(r.email, r);
  }
  return [...bestPerEmail.values()]
    .sort((a, b) => b.correct - a.correct || a.timeMs - b.timeMs)
    .slice(0, limit)
    .map((r) => ({
      name: maskEmail(r.email),
      correct: r.correct,
      total: r.total,
      timeMs: r.timeMs,
    }));
}
