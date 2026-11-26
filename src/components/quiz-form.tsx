"use client";

import { startQuiz, submitAnswers, type SubmitResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Question } from "@/lib/questions";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(1)} s`;
}

export function QuizForm({ questions }: { questions: Question[] }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Extract<SubmitResult, { ok: true }>>();
  const [isPending, startTransition] = useTransition();
  const timerStarted = useRef<Promise<string | null> | null>(null);
  const router = useRouter();

  const [shownQuestions, setShownQuestions] = useState(questions);
  if (questions !== shownQuestions) {
    setShownQuestions(questions);
    setEmail("");
    setConsent(false);
    setAnswers({});
    setResult(undefined);
  }

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [questions]);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const answeredCount = Object.keys(answers).length;

  function selectAnswer(questionId: number, optionId: number) {
    timerStarted.current ??= startQuiz().catch(() => null);
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered || !emailValid || !consent) return;
    startTransition(async () => {
      const startToken = await timerStarted.current;
      if (!startToken) {
        timerStarted.current = null;
        toast.error(
          "Could not start the quiz timer. Please reload and try again.",
        );
        return;
      }
      try {
        const res = await submitAnswers(
          email,
          consent,
          startToken,
          questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })),
        );
        if (res.ok) setResult(res);
        else toast.error(res.error);
      } catch {
        toast.error("Could not send your answers. Please try again.");
      }
    });
  }

  function restart() {
    timerStarted.current = null;
    // Re-renders the server page, which picks a new random set of questions.
    startTransition(() => router.refresh());
  }

  if (result) {
    return (
      <section className="flex flex-col gap-4">
        <div className="rounded-md bg-card p-6 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-primary">Thank you!</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-4xl font-black text-primary">
                {result.correct}/{result.total}
              </p>
              <p className="text-sm text-muted-foreground">correct</p>
            </div>
            <div>
              <p className="text-4xl font-black text-primary">
                {formatTime(result.timeMs)}
              </p>
              <p className="text-sm text-muted-foreground">time</p>
            </div>
          </div>
        </div>
        {result.leaderboard.length > 0 && (
          <div className="rounded-md bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-primary">Top 5</h3>
            <ol className="flex flex-col gap-2">
              {result.leaderboard.map((entry, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-md border-2 border-border px-3 py-2"
                >
                  <span className="w-5 text-center font-black text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  <span className="font-semibold">
                    {entry.correct}/{entry.total}
                  </span>
                  <span className="w-16 text-right text-sm text-muted-foreground tabular-nums">
                    {formatTime(entry.timeMs)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <Button
          type="button"
          onClick={restart}
          disabled={isPending}
          className="h-12 w-full rounded-md text-base font-bold"
        >
          {isPending ? "Loading..." : "Start new quiz"}
        </Button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
      <div className="rounded-md bg-card p-4 shadow-sm">
        <label htmlFor="email" className="mb-2 block text-lg font-bold">
          Your email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          maxLength={254}
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 w-full rounded-md border-2 border-border bg-background px-4 text-base outline-none focus:border-primary"
        />
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-primary"
          />
          <span>
            I agree that JYSK may store my email address and quiz answers to run
            this quiz and contact me about the result. My data will be deleted
            when the quiz ends, and I can withdraw my consent at any time.
          </span>
        </label>
      </div>
      {questions.map((q, i) => (
        <fieldset
          key={q.id}
          className="min-w-0 rounded-md bg-card p-4 shadow-sm"
        >
          <legend className="float-left mb-3 w-full">
            <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Question {i + 1} of {questions.length}
            </span>
            <span className="mt-1 block text-lg leading-snug font-bold">
              {q.text}
            </span>
          </legend>
          {q.code && (
            <pre className="clear-left mb-3 rounded-md bg-[#1e1e1e] p-3 font-mono text-[13px] leading-relaxed wrap-anywhere whitespace-pre-wrap text-[#d4d4d4]">
              <code>{q.code}</code>
            </pre>
          )}
          <RadioGroup
            className="clear-left"
            value={answers[q.id] !== undefined ? String(answers[q.id]) : ""}
            onValueChange={(value) => selectAnswer(q.id, Number(value))}
          >
            {q.options.map((o) => (
              <label
                key={o.id}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-md border-2 border-border px-4 py-3 text-base transition-colors active:bg-accent has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent has-[[data-checked]]:font-semibold"
              >
                <RadioGroupItem value={String(o.id)} className="size-5" />
                {o.text}
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      ))}
      <div className="sticky bottom-0 -mx-4 mt-auto border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center text-sm text-muted-foreground">
          {answeredCount} of {questions.length} answered
          {!emailValid && " · email missing"}
          {!consent && " · consent missing"}
        </p>
        <Button
          type="submit"
          className="h-12 w-full rounded-md text-base font-bold"
          disabled={!allAnswered || !emailValid || !consent || isPending}
        >
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
