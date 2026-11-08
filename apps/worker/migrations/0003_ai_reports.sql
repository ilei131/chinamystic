-- Android 端不当内容举报上报。
CREATE TABLE IF NOT EXISTS ai_reports (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reason TEXT NOT NULL,
  app_version TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_app_id ON ai_reports(app_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at);
