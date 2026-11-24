CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id),
  option_id INT NOT NULL REFERENCES options(id),
  PRIMARY KEY (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS options_question_id_idx ON options(question_id);
