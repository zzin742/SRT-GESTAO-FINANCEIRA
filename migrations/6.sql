
-- Criar tabela para centros de custo
CREATE TABLE cost_centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Adicionar campo cost_center_id nas transações
ALTER TABLE transactions ADD COLUMN cost_center_id INTEGER;

-- Criar índice para o centro de custo nas transações
CREATE INDEX idx_transactions_cost_center ON transactions(cost_center_id);

-- Inserir centros de custo padrão para empresas existentes
INSERT INTO cost_centers (company_id, code, name, description)
SELECT id, 'ADM', 'Administrativo', 'Centro de custo administrativo' FROM companies;

INSERT INTO cost_centers (company_id, code, name, description)
SELECT id, 'VEN', 'Vendas', 'Centro de custo de vendas' FROM companies;

INSERT INTO cost_centers (company_id, code, name, description)
SELECT id, 'OPE', 'Operacional', 'Centro de custo operacional' FROM companies;
