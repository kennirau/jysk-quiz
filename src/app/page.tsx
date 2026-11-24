import { Suspense } from "react";
import { connection } from "next/server";
import { getQuestions } from "@/lib/db";
import { QuizForm } from "@/components/quiz-form";

async function Quiz() {
  await connection();
  const questions = await getQuestions();
  if (questions.length === 0) {
    return <p className="text-muted-foreground">No questions available right now.</p>;
  }
  return <QuizForm questions={questions} />;
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">JYSK Quiz</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading questions...</p>}>
        <Quiz />
      </Suspense>
    </main>
  );
}
