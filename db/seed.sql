-- Sample data; replace with your own questions.
WITH q AS (
  INSERT INTO questions (text, position) VALUES
    ('What year was JYSK founded?', 1),
    ('In which country was JYSK founded?', 2),
    ('Who founded JYSK?', 3),
    ('What does the word "jysk" mean?', 4),
    ('What is JYSK''s mascot/logo symbol?', 5)
  RETURNING id, position
)
INSERT INTO options (question_id, text, position)
SELECT q.id, o.text, o.position
FROM q
JOIN (VALUES
  (1, '1959', 1), (1, '1979', 2), (1, '1989', 3), (1, '1999', 4),
  (2, 'Sweden', 1), (2, 'Norway', 2), (2, 'Denmark', 3), (2, 'Finland', 4),
  (3, 'Lars Larsen', 1), (3, 'Ingvar Kamprad', 2), (3, 'Ole Kirk Christiansen', 3), (3, 'Arne Jacobsen', 4),
  (4, 'Cosy', 1), (4, 'Jutlandic', 2), (4, 'Sleep', 3), (4, 'Home', 4),
  (5, 'A goose', 1), (5, 'A bear', 2), (5, 'A star', 3), (5, 'A tree', 4)
) AS o(qpos, text, position) ON o.qpos = q.position;
