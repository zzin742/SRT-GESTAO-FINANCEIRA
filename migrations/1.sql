
-- Tabela de empresas
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cnpj TEXT,
  accountant_id TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários do sistema (referencia aos users do Mocha Users Service)
CREATE TABLE app_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mocha_user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'contador', 'cliente', 'superadmin')),
  company_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Tabela de contas (carteira, conta bancária, cartão)
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('carteira', 'conta_bancaria', 'cartao')),
  initial_balance REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Tabela de categorias
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Tabela de transações (receitas, despesas, transferências)
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  date DATE NOT NULL,
  value REAL NOT NULL,
  category_id INTEGER,
  description TEXT,
  payment_method TEXT,
  recurrence TEXT CHECK (recurrence IN ('mensal', 'semanal')),
  installments INTEGER,
  current_installment INTEGER DEFAULT 1,
  status TEXT DEFAULT 'previsto' CHECK (status IN ('previsto', 'confirmado')),
  attachment_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabela de vencimentos
CREATE TABLE due_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  value REAL,
  type TEXT DEFAULT 'outro' CHECK (type IN ('boleto', 'imposto', 'outro')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Tabela de mensagens
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('contador', 'cliente')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT, -- JSON array
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Tabela de convites
CREATE TABLE invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'contador', 'cliente')),
  company_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Índices para performance
CREATE INDEX idx_app_users_mocha_user_id ON app_users(mocha_user_id);
CREATE INDEX idx_app_users_company_id ON app_users(company_id);
CREATE INDEX idx_accounts_company_id ON accounts(company_id);
CREATE INDEX idx_categories_company_id ON categories(company_id);
CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_due_dates_company_id ON due_dates(company_id);
CREATE INDEX idx_due_dates_due_date ON due_dates(due_date);
CREATE INDEX idx_messages_company_id ON messages(company_id);
