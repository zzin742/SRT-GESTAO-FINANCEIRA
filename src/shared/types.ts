import z from "zod";

// Esquemas Zod para validação
export const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
  cnpj: z.string().optional(),
  accountant_id: z.string().optional(),
  timezone: z.string().default('America/Sao_Paulo'),
  plan: z.enum(['free', 'premium']).default('free'),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AppUserSchema = z.object({
  id: z.number(),
  mocha_user_id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'contador', 'cliente', 'superadmin']),
  company_id: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AccountSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  name: z.string(),
  type: z.enum(['carteira', 'conta_bancaria', 'cartao']),
  initial_balance: z.number().default(0),
  current_balance: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CategorySchema = z.object({
  id: z.number(),
  company_id: z.number(),
  name: z.string(),
  type: z.enum(['receita', 'despesa']),
  is_default: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TransactionSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  account_id: z.number(),
  type: z.enum(['receita', 'despesa', 'transferencia']),
  date: z.string(),
  value: z.number(),
  category_id: z.number().optional(),
  chart_account_id: z.number().optional(),
  product_service_id: z.number().optional(),
  cost_center_id: z.number().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  recurrence: z.enum(['mensal', 'semanal']).optional(),
  installments: z.number().optional(),
  current_installment: z.number().default(1),
  status: z.enum(['previsto', 'confirmado']).default('previsto'),
  attachment_url: z.string().optional(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DueDateSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  title: z.string(),
  due_date: z.string(),
  value: z.number().optional(),
  type: z.enum(['boleto', 'imposto', 'outro']).default('outro'),
  status: z.enum(['pendente', 'pago']).default('pendente'),
  created_at: z.string(),
  updated_at: z.string(),
});

// Esquemas para criação (sem campos auto-gerados)
export const CreateTransactionSchema = z.object({
  account_id: z.number(),
  type: z.enum(['receita', 'despesa', 'transferencia']),
  date: z.string(),
  value: z.number().positive(),
  category_id: z.number().optional(),
  chart_account_id: z.number().optional(),
  product_service_id: z.number().optional(),
  cost_center_id: z.number().optional(),
  description: z.string().optional(),
  payment_method: z.string().optional(),
  recurrence: z.enum(['mensal', 'semanal']).optional(),
  installments: z.number().positive().optional(),
  status: z.enum(['previsto', 'confirmado']).default('previsto'),
});

export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['carteira', 'conta_bancaria', 'cartao']),
  initial_balance: z.number().default(0),
});

export const CreateDueDateSchema = z.object({
  title: z.string().min(1),
  due_date: z.string(),
  value: z.number().positive().optional(),
  type: z.enum(['boleto', 'imposto', 'outro']).default('outro'),
});

export const CreateCompanySchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().optional(),
});

// Tipos derivados
export type Company = z.infer<typeof CompanySchema>;
export type AppUser = z.infer<typeof AppUserSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type DueDate = z.infer<typeof DueDateSchema>;

// Tipos extendidos para dados com joins
export interface TransactionWithDetails extends Transaction {
  account_name?: string;
  category_name?: string;
  chart_account_name?: string;
  product_service_name?: string;
  cost_center_name?: string;
}
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type CreateAccount = z.infer<typeof CreateAccountSchema>;
export type CreateDueDate = z.infer<typeof CreateDueDateSchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;

// Tipos para dashboard
export interface DashboardData {
  currentBalance: number;
  todayIncome: number;
  todayExpenses: number;
  monthIncome: number;
  monthExpenses: number;
  recentTransactions: TransactionWithDetails[];
  cashFlowDays: number;
}

// Esquemas para Plano de Contas
export const ChartOfAccountsSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  code: z.string(),
  name: z.string(),
  type: z.enum(['ativo', 'passivo', 'patrimonio', 'receita', 'despesa', 'custos']),
  parent_id: z.number().optional(),
  level: z.number().default(1),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateChartOfAccountsSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['ativo', 'passivo', 'patrimonio', 'receita', 'despesa', 'custos']),
  parent_id: z.number().optional(),
  description: z.string().optional(),
});

// Esquemas para Centros de Custo
export const CostCenterSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCostCenterSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

// Esquemas para Produtos e Serviços
export const ProductServiceSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  name: z.string(),
  type: z.enum(['produto', 'servico']),
  code: z.string().optional(),
  description: z.string().optional(),
  price: z.number().default(0),
  cost: z.number().default(0),
  unity: z.string().default('unidade'),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProductServiceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['produto', 'servico']),
  code: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  unity: z.string().default('unidade'),
});

// Esquemas para Conciliação Bancária
export const BankReconciliationSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  account_id: z.number(),
  reconciliation_date: z.string(),
  statement_balance: z.number(),
  book_balance: z.number(),
  difference: z.number(),
  status: z.enum(['pendente', 'conciliado']).default('pendente'),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateBankReconciliationSchema = z.object({
  account_id: z.number(),
  reconciliation_date: z.string(),
  statement_balance: z.number(),
  notes: z.string().optional(),
});

// Esquemas para Projeção de Fluxo de Caixa
export const CashFlowProjectionSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  date: z.string(),
  description: z.string(),
  type: z.enum(['entrada', 'saida']),
  projected_value: z.number(),
  actual_value: z.number().optional(),
  category_id: z.number().optional(),
  account_id: z.number().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCashFlowProjectionSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  type: z.enum(['entrada', 'saida']),
  projected_value: z.number().positive(),
  category_id: z.number().optional(),
  account_id: z.number().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
});

// Tipos derivados dos novos esquemas
export type ChartOfAccounts = z.infer<typeof ChartOfAccountsSchema>;
export type CreateChartOfAccounts = z.infer<typeof CreateChartOfAccountsSchema>;
export type CostCenter = z.infer<typeof CostCenterSchema>;
export type CreateCostCenter = z.infer<typeof CreateCostCenterSchema>;
export type ProductService = z.infer<typeof ProductServiceSchema>;
export type CreateProductService = z.infer<typeof CreateProductServiceSchema>;
export type BankReconciliation = z.infer<typeof BankReconciliationSchema>;
export type CreateBankReconciliation = z.infer<typeof CreateBankReconciliationSchema>;
export type CashFlowProjection = z.infer<typeof CashFlowProjectionSchema>;
export type CreateCashFlowProjection = z.infer<typeof CreateCashFlowProjectionSchema>;

// Tipos para relatórios
export interface DREData {
  periodo: string;
  receitaOperacionalBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custosDirectos: number;
  despesasOperacionais: number;
  resultadoOperacional: number;
}

export interface CashFlowData {
  date: string;
  projected_income: number;
  projected_expenses: number;
  projected_balance: number;
}

// Esquemas para Upload de Documentos
export const UploadSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  filename: z.string(),
  file_key: z.string(),
  file_type: z.string().optional(),
  file_size: z.number().optional(),
  category: z.enum(['nota_fiscal', 'extrato', 'comprovante', 'outro']),
  sent_to_accountant: z.boolean().default(false),
  sent_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateUploadSchema = z.object({
  filename: z.string(),
  file_key: z.string(),
  file_type: z.string().optional(),
  file_size: z.number().optional(),
  category: z.enum(['nota_fiscal', 'extrato', 'comprovante', 'outro']),
});

export type Upload = z.infer<typeof UploadSchema>;
export type CreateUpload = z.infer<typeof CreateUploadSchema>;
