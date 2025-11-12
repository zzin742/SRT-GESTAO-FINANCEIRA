
-- Remover índice
DROP INDEX idx_transactions_cost_center;

-- Remover campo da tabela de transações
ALTER TABLE transactions DROP COLUMN cost_center_id;

-- Remover tabela de centros de custo
DROP TABLE cost_centers;
