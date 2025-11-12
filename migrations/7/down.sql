
-- Remover suporte ao tipo 'custos' 
-- Remove registros do tipo custos se existirem

DELETE FROM chart_of_accounts WHERE type = 'custos';

SELECT 'Registros do tipo custos removidos' as status;
