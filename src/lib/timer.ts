import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const secret = process.env.QUIZ_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("QUIZ_SECRET is not set");
  }
  return "dev-only-quiz-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createStartToken(startedAt: number) {
  return `${startedAt}.${sign(String(startedAt))}`;
}

export function readStartToken(token: unknown): number | null {
  if (typeof token !== "string") return null;
  const [value, signature] = token.split(".");
  if (!value || !signature) return null;
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  return Number(value);
}
