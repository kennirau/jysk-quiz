import { list, put } from "@vercel/blob";
import { createHash, randomUUID } from "node:crypto";
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

type ScoreEntry = LeaderboardEntry & { player: string };

// Vercel's filesystem is read-only, so production uses Vercel Blob when it is connected.
// Newer Blob stores authenticate via OIDC + BLOB_STORE_ID instead of a read/write token.
const isBlobStorageEnabled = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const BLOB_PREFIX = "results/";

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

function saveToFile(result: QuizResult): Promise<void> {
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

// One blob per result avoids lost writes; the score is in the pathname so the
// leaderboard can be built from a single list() call without downloading blobs.
function toBlobPath(r: QuizResult) {
  const player = createHash("sha256")
    .update(r.email)
    .digest("hex")
    .slice(0, 16);
  const name = Buffer.from(maskEmail(r.email)).toString("hex");
  return `${BLOB_PREFIX}${r.correct}_${r.total}_${r.timeMs}_${player}_${name}_${randomUUID()}.json`;
}

function fromBlobPath(pathname: string): ScoreEntry | null {
  const [correct, total, timeMs, player, name] = pathname
    .slice(BLOB_PREFIX.length)
    .split("_");
  if (!name) return null;
  return {
    player,
    name: Buffer.from(name, "hex").toString(),
    correct: Number(correct),
    total: Number(total),
    timeMs: Number(timeMs),
  };
}

async function readBlobEntries(): Promise<ScoreEntry[]> {
  const entries: ScoreEntry[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor });
    for (const blob of page.blobs) {
      const entry = fromBlobPath(blob.pathname);
      if (entry) entries.push(entry);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return entries;
}

export async function saveResult(result: QuizResult): Promise<void> {
  if (!isBlobStorageEnabled()) {
    if (process.env.VERCEL) {
      throw new Error(
        "No Vercel Blob store connected (BLOB_READ_WRITE_TOKEN/BLOB_STORE_ID missing)",
      );
    }
    return saveToFile(result);
  }
  await put(toBlobPath(result), JSON.stringify(result), {
    access: "private",
    contentType: "application/json",
  });
}

function isBetter(a: ScoreEntry, b: ScoreEntry) {
  return a.correct !== b.correct ? a.correct > b.correct : a.timeMs < b.timeMs;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function getTopResults(limit = 5): Promise<LeaderboardEntry[]> {
  const entries = isBlobStorageEnabled()
    ? await readBlobEntries()
    : (await readResults()).map((r) => ({
        player: r.email,
        name: maskEmail(r.email),
        correct: r.correct,
        total: r.total,
        timeMs: r.timeMs,
      }));

  const bestPerPlayer = new Map<string, ScoreEntry>();
  for (const e of entries) {
    const current = bestPerPlayer.get(e.player);
    if (!current || isBetter(e, current)) bestPerPlayer.set(e.player, e);
  }
  return [...bestPerPlayer.values()]
    .sort((a, b) => b.correct - a.correct || a.timeMs - b.timeMs)
    .slice(0, limit)
    .map(({ name, correct, total, timeMs }) => ({
      name,
      correct,
      total,
      timeMs,
    }));
}
