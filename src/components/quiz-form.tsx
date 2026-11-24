"use client";

import { submitAnswers } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Question } from "@/lib/questions";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function QuizForm({ questions }: { questions: Question[] }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<{ correct: number; total: number }>();
  const [isPending, startTransition] = useTransition();

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const answeredCount = Object.keys(answers).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered || !emailValid || !consent) return;
    startTransition(async () => {
      const result = await submitAnswers(
        email,
        consent,
        questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })),
      );
      if (result.ok) setScore({ correct: result.correct, total: result.total });
      else toast.error(result.error);
    });
  }

  if (score) {
    return (
      <section className="rounded-md bg-card p-6 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-primary">Thank you!</h2>
        <p className="mt-4 text-5xl font-black text-primary">
          {score.correct}/{score.total}
        </p>
        <p className="mt-2 text-muted-foreground">correct answers</p>
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
        <fieldset key={q.id} className="rounded-md bg-card p-4 shadow-sm">
          <legend className="float-left mb-3 w-full">
            <span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Question {i + 1} of {questions.length}
            </span>
            <span className="mt-1 block text-lg leading-snug font-bold">
              {q.text}
            </span>
          </legend>
          <RadioGroup
            className="clear-left"
            value={answers[q.id] !== undefined ? String(answers[q.id]) : ""}
            onValueChange={(value) =>
              setAnswers((prev) => ({ ...prev, [q.id]: Number(value) }))
            }
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
