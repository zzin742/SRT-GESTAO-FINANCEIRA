
-- Tabela para o Plano de Contas
CREATE TABLE chart_of_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ativo', 'passivo', 'patrimonio', 'receita', 'despesa')),
  parent_id INTEGER,
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Produtos e Serviços
CREATE TABLE products_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('produto', 'servico')),
  code TEXT,
  description TEXT,
  price REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  unity TEXT DEFAULT 'unidade',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Conciliação Bancária
CREATE TABLE bank_reconciliations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  reconciliation_date DATE NOT NULL,
  statement_balance REAL NOT NULL,
  book_balance REAL NOT NULL,
  difference REAL NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'conciliado')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para itens de conciliação
CREATE TABLE reconciliation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_id INTEGER NOT NULL,
  transaction_id INTEGER,
  description TEXT NOT NULL,
  value REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('extrato', 'sistema', 'ajuste')),
  is_reconciled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Projeção de Fluxo de Caixa
CREATE TABLE cash_flow_projections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  projected_value REAL NOT NULL,
  actual_value REAL,
  category_id INTEGER,
  account_id INTEGER,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_chart_of_accounts_company ON chart_of_accounts(company_id);
CREATE INDEX idx_chart_of_accounts_parent ON chart_of_accounts(parent_id);
CREATE INDEX idx_products_services_company ON products_services(company_id);
CREATE INDEX idx_bank_reconciliations_company ON bank_reconciliations(company_id);
CREATE INDEX idx_bank_reconciliations_account ON bank_reconciliations(account_id);
CREATE INDEX idx_cash_flow_projections_company ON cash_flow_projections(company_id);
CREATE INDEX idx_cash_flow_projections_date ON cash_flow_projections(date);
