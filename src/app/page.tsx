import { QuizForm } from "@/components/quiz-form";
import { pickRandomQuestions, QUIZ_SIZE } from "@/lib/questions";
import Image from "next/image";
import { connection } from "next/server";
import { Suspense } from "react";

async function RandomQuiz() {
  // Opt out of prerendering so each visitor gets a new random set.
  await connection();
  return <QuizForm questions={pickRandomQuestions()} />;
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <Image
            src="/jysk-logo.svg"
            alt="JYSK"
            width={80}
            height={37}
            preload
          />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5">
        <h1 className="text-2xl font-bold text-primary">Java 25 Quiz</h1>
        <p className="mb-5 text-muted-foreground">
          Answer {QUIZ_SIZE} questions about modern Java.
        </p>
        <Suspense
          fallback={<p className="text-muted-foreground">Loading questions...</p>}
        >
          <RandomQuiz />
        </Suspense>
      </main>
    </>
  );
}
