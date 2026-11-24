"use client";

import { submitAnswers } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Question } from "@/lib/db";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function QuizForm({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered) return;
    startTransition(async () => {
      const result = await submitAnswers(
        questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })),
      );
      if (result.ok) setSubmitted(true);
      else toast.error(result.error);
    });
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
        </CardHeader>
        <CardContent>Your answers have been submitted.</CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle>
              {i + 1}. {q.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[q.id] !== undefined ? String(answers[q.id]) : ""}
              onValueChange={(value) =>
                setAnswers((prev) => ({ ...prev, [q.id]: Number(value) }))
              }
            >
              {q.options.map((o) => (
                <Label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal"
                >
                  <RadioGroupItem value={String(o.id)} />
                  {o.text}
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
      <Button type="submit" size="lg" disabled={!allAnswered || isPending}>
        {isPending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
