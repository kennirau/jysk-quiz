import { QuizForm } from "@/components/quiz-form";
import { publicQuestions } from "@/lib/questions";
import Image from "next/image";

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
        <h1 className="text-2xl font-bold text-primary">Quiz</h1>
        <p className="mb-5 text-muted-foreground">
          Answer {publicQuestions.length} quick questions.
        </p>
        <QuizForm questions={publicQuestions} />
      </main>
    </>
  );
}
