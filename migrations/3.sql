
CREATE TABLE uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL CHECK (category IN ('nota_fiscal', 'extrato', 'comprovante', 'outro')),
  sent_to_accountant BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uploads_company_id ON uploads(company_id);
CREATE INDEX idx_uploads_category ON uploads(category);
