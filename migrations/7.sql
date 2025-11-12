
-- Permitir tipo 'custos' no plano de contas
-- Esta migração atualiza apenas a aplicação, o banco aceita qualquer texto para type
-- O CHECK constraint será aplicado apenas para novos registros

-- Nada a fazer no banco - SQLite aceita qualquer valor TEXT
-- A validação será feita pela aplicação
SELECT 'Suporte para tipo custos adicionado' as status;
