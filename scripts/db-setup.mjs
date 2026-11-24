import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const files = process.argv.slice(2);

for (const file of files) {
  const statements = readFileSync(file, "utf8")
    .replace(/^\s*--.*$/gm, "")
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`Applied ${file}`);
}
