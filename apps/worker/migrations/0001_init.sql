-- ChinaMystic TMA initial schema.
-- Intentionally contains no user history or personal data.
CREATE TABLE IF NOT EXISTS daily_stats (
  day TEXT PRIMARY KEY,
  casts INTEGER NOT NULL DEFAULT 0,
  ai_success INTEGER NOT NULL DEFAULT 0,
  ai_failure INTEGER NOT NULL DEFAULT 0
);
