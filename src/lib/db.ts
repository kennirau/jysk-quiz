import { neon } from "@neondatabase/serverless";
import "server-only";

export type Question = {
  id: number;
  text: string;
  options: { id: number; text: string }[];
};

export const QUESTION_COUNT = 5;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function getQuestions(): Promise<Question[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT q.id, q.text,
      json_agg(json_build_object('id', o.id, 'text', o.text) ORDER BY o.position, o.id) AS options
    FROM (
      SELECT id, text, position FROM questions
      WHERE active
      ORDER BY position, id
      LIMIT ${QUESTION_COUNT}
    ) q
    JOIN options o ON o.question_id = q.id
    GROUP BY q.id, q.text, q.position
    ORDER BY q.position, q.id
  `;
  return rows as Question[];
}

export async function saveSubmission(
  answers: { questionId: number; optionId: number }[],
) {
  const sql = getSql();
  const questionIds = answers.map((a) => a.questionId);
  const optionIds = answers.map((a) => a.optionId);

  // Only accept options that belong to their question and an active question.
  const valid = await sql`
    SELECT COUNT(*)::int AS count
    FROM unnest(${questionIds}::int[], ${optionIds}::int[]) AS a(question_id, option_id)
    JOIN options o ON o.id = a.option_id AND o.question_id = a.question_id
    JOIN questions q ON q.id = a.question_id AND q.active
  `;
  if (valid[0].count !== answers.length) {
    throw new Error("Invalid answers");
  }

  await sql`
    WITH s AS (INSERT INTO submissions DEFAULT VALUES RETURNING id)
    INSERT INTO answers (submission_id, question_id, option_id)
    SELECT s.id, a.question_id, a.option_id
    FROM s, unnest(${questionIds}::int[], ${optionIds}::int[]) AS a(question_id, option_id)
  `;
}
