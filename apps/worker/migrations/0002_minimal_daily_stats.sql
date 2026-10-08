-- 第二阶段：D1 只保存匿名的每日系统汇总，不保存用户历史、问题、IP、Cookie、seed 或 AI 长文本。
DROP TABLE IF EXISTS divinations;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS daily_stats (
  day TEXT PRIMARY KEY,
  casts INTEGER NOT NULL DEFAULT 0,
  ai_success INTEGER NOT NULL DEFAULT 0,
  ai_failure INTEGER NOT NULL DEFAULT 0
);
