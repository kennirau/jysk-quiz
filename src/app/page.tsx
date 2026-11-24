import { QuizForm } from "@/components/quiz-form";
import { questions } from "@/lib/questions";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">JYSK Quiz</h1>
      <QuizForm questions={questions} />
    </main>
  );
}
