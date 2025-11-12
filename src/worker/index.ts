import { Hono } from "hono";
import { cors } from "hono/cors";
import { 
  authMiddleware, 
  getOAuthRedirectUrl, 
  exchangeCodeForSessionToken, 
  deleteSession, 
  MOCHA_SESSION_TOKEN_COOKIE_NAME 
} from "@getmocha/users-service/backend";
import { setCookie, getCookie } from "hono/cookie";
import OpenAI from "openai";
import { 
  CreateTransactionSchema, 
  CreateAccountSchema, 
  CreateDueDateSchema,
  CreateCompanySchema,
  CreateChartOfAccountsSchema,
  CreateProductServiceSchema,
  CreateBankReconciliationSchema,
  CreateCashFlowProjectionSchema,
  CreateCostCenterSchema,
  CreateUploadSchema,
  type DashboardData
} from "../shared/types";
import { errorHandler } from "./error-handler";

interface WorkerEnv {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  OPENAI_API_KEY: string;
}

const app = new Hono<{ Bindings: WorkerEnv }>();

// Error handler deve vir primeiro
app.use("*", errorHandler);

app.use("*", cors({
  origin: ["http://localhost:5173", "https://apicefinancas.mocha.app"],
  credentials: true,
}));

// Middleware para extrair usuário e empresa
const userCompanyMiddleware = async (c: any, next: any) => {
  try {
    const user = c.get("user");
    
    if (!user) {
      return c.json({ error: "Usuário não encontrado" }, 401);
    }
    
    // Buscar o app_user baseado no mocha_user_id
    const { results: appUsers } = await c.env.DB.prepare(
      "SELECT * FROM app_users WHERE mocha_user_id = ?"
    ).bind(user.id).all();
    
    if (!appUsers.length) {
      return c.json({ error: "Usuário não cadastrado no sistema" }, 404);
    }
    
    const appUser = appUsers[0] as any;
    (c as any).set("appUser", appUser);
    
    if (appUser.company_id) {
      const { results: companies } = await c.env.DB.prepare(
        "SELECT * FROM companies WHERE id = ?"
      ).bind(appUser.company_id).all();
      
      if (companies.length) {
        (c as any).set("company", companies[0]);
      }
    }
    
    await next();
  } catch (error) {
    console.error('Erro no userCompanyMiddleware:', error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
};

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  try {
    const redirectUrl = await getOAuthRedirectUrl('google', {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    return c.json({ redirectUrl }, 200);
  } catch (error) {
    console.error('Erro ao obter redirect URL:', error);
    return c.json({ error: "Erro ao configurar autenticação" }, 500);
  }
});

app.post("/api/sessions", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.code) {
      return c.json({ error: "Código de autorização não fornecido" }, 400);
    }

    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error('Erro na criação de sessão:', error);
    return c.json({ error: "Erro ao criar sessão" }, 500);
  }
});

app.get("/api/users/me", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    
    if (!user) {
      return c.json({ error: "Usuário não encontrado" }, 401);
    }
    
    // Verificar se existe app_user
    const { results: appUsers } = await c.env.DB.prepare(
      "SELECT * FROM app_users WHERE mocha_user_id = ?"
    ).bind(user.id).all();
    
    let appUser = null;
    let company = null;
    
    if (appUsers.length) {
      appUser = appUsers[0];
      
      if (appUser.company_id) {
        const { results: companies } = await c.env.DB.prepare(
          "SELECT * FROM companies WHERE id = ?"
        ).bind(appUser.company_id).all();
        
        if (companies.length) {
          company = companies[0];
        }
      }
    }
    
    return c.json({ 
      mochaUser: user, 
      appUser, 
      company,
      needsOnboarding: !appUser 
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Onboarding - Criar empresa e usuário
app.post("/api/onboarding", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const companyData = CreateCompanySchema.parse(body.company);
  
  // Criar empresa
  const companyResult = await c.env.DB.prepare(
    "INSERT INTO companies (name, cnpj) VALUES (?, ?) RETURNING id"
  ).bind(companyData.name, companyData.cnpj || null).first();
  
  if (!companyResult) {
    return c.json({ error: "Erro ao criar empresa" }, 500);
  }
  
  const companyId = companyResult.id;
  
  // Criar app_user
  if (!user) {
    return c.json({ error: "Usuário não encontrado" }, 401);
  }
  
  await c.env.DB.prepare(
    "INSERT INTO app_users (mocha_user_id, name, email, role, company_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(
    user.id,
    user.google_user_data?.name || user.email,
    user.email,
    'admin',
    companyId
  ).run();
  
  // Criar categorias padrão
  const defaultCategories = [
    { name: 'Vendas', type: 'receita' },
    { name: 'Serviços', type: 'receita' },
    { name: 'Aluguel', type: 'despesa' },
    { name: 'Folha de Pagamento', type: 'despesa' },
    { name: 'Impostos', type: 'despesa' },
    { name: 'Marketing', type: 'despesa' },
    { name: 'Taxas Bancárias', type: 'despesa' },
    { name: 'Fornecedores', type: 'despesa' },
  ];
  
  for (const cat of defaultCategories) {
    await c.env.DB.prepare(
      "INSERT INTO categories (company_id, name, type, is_default) VALUES (?, ?, ?, ?)"
    ).bind(companyId, cat.name, cat.type, true).run();
  }
  
  // Criar conta padrão
  await c.env.DB.prepare(
    "INSERT INTO accounts (company_id, name, type, initial_balance, current_balance) VALUES (?, ?, ?, ?, ?)"
  ).bind(companyId, 'Caixa Principal', 'carteira', 0, 0).run();
  
  return c.json({ success: true, companyId });
});

// Dashboard
app.get("/api/dashboard", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
  
  if (!company) {
    return c.json({ error: "Empresa não encontrada" }, 404);
  }
  
  // Saldo atual total
  const { results: accounts } = await c.env.DB.prepare(
    "SELECT SUM(current_balance) as total FROM accounts WHERE company_id = ?"
  ).bind(company.id).all();
  
  const currentBalance = (accounts[0] as any)?.total || 0;
  
  // Entradas e saídas do dia
  const { results: todayTransactions } = await c.env.DB.prepare(`
    SELECT type, SUM(value) as total 
    FROM transactions 
    WHERE company_id = ? AND date = ? AND status = 'confirmado'
    GROUP BY type
  `).bind(company.id, today).all();
  
  let todayIncome = 0;
  let todayExpenses = 0;
  
  todayTransactions.forEach((t: any) => {
    if (t.type === 'receita') todayIncome = t.total;
    if (t.type === 'despesa') todayExpenses = t.total;
  });
  
  // Entradas e saídas do mês
  const { results: monthTransactions } = await c.env.DB.prepare(`
    SELECT type, SUM(value) as total 
    FROM transactions 
    WHERE company_id = ? AND date BETWEEN ? AND ? AND status = 'confirmado'
    GROUP BY type
  `).bind(company.id, monthStart, monthEnd).all();
  
  let monthIncome = 0;
  let monthExpenses = 0;
  
  monthTransactions.forEach((t: any) => {
    if (t.type === 'receita') monthIncome = t.total;
    if (t.type === 'despesa') monthExpenses = t.total;
  });
  
  // Remover vencimentos do dashboard
  
  // Transações recentes
  const { results: recentTransactions } = await c.env.DB.prepare(`
    SELECT t.*, 
           c.name as category_name, 
           a.name as account_name,
           ca.name as chart_account_name,
           CASE WHEN ca.type = 'despesa' AND (LOWER(ca.name) LIKE '%custo%' OR LOWER(ca.code) LIKE '%custo%' OR ca.description LIKE '%[CUSTO]%') THEN 'custos' ELSE ca.type END as chart_account_type,
           ps.name as product_service_name,
           cc.name as cost_center_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN chart_of_accounts ca ON t.chart_account_id = ca.id
    LEFT JOIN products_services ps ON t.product_service_id = ps.id
    LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
    WHERE t.company_id = ?
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 10
  `).bind(company.id).all();
  
  const mappedRecentTransactions = recentTransactions;
  
  // Dias de caixa (baseado na média de gastos dos últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { results: avgExpenses } = await c.env.DB.prepare(`
    SELECT AVG(value) as avg_daily_expense
    FROM transactions 
    WHERE company_id = ? AND type = 'despesa' AND date >= ? AND status = 'confirmado'
  `).bind(company.id, thirtyDaysAgo.toISOString().split('T')[0]).all();
  
  const avgDailyExpense = (avgExpenses[0] as any)?.avg_daily_expense || 0;
  const cashFlowDays = avgDailyExpense > 0 ? Math.floor(currentBalance / avgDailyExpense) : 999;
  
  const dashboardData: DashboardData = {
    currentBalance,
    todayIncome,
    todayExpenses,
    monthIncome,
    monthExpenses,
    recentTransactions: mappedRecentTransactions as any[],
    cashFlowDays
  };
  
  return c.json(dashboardData);
});

// Transações
app.get("/api/transactions", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(`
    SELECT t.*, 
           c.name as category_name, 
           a.name as account_name,
           ca.name as chart_account_name,
           CASE WHEN ca.type = 'despesa' AND (LOWER(ca.name) LIKE '%custo%' OR LOWER(ca.code) LIKE '%custo%' OR ca.description LIKE '%[CUSTO]%') THEN 'custos' ELSE ca.type END as chart_account_type,
           ps.name as product_service_name,
           cc.name as cost_center_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN chart_of_accounts ca ON t.chart_account_id = ca.id
    LEFT JOIN products_services ps ON t.product_service_id = ps.id
    LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
    WHERE t.company_id = ?
    ORDER BY t.date DESC, t.created_at DESC
  `).bind(company.id).all();
  
  const mappedTransactions = results;
  
  return c.json(mappedTransactions);
});

// Atualizar status da transação
app.put("/api/transactions/:id/status", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const transactionId = c.req.param("id");
  const body = await c.req.json();
  
  // Buscar a transação atual
  const { results: transactions } = await c.env.DB.prepare(
    "SELECT * FROM transactions WHERE id = ? AND company_id = ?"
  ).bind(transactionId, company.id).all();
  
  if (!transactions.length) {
    return c.json({ error: "Transação não encontrada" }, 404);
  }
  
  const transaction = transactions[0] as any;
  const oldStatus = transaction.status;
  const newStatus = body.status;
  
  // Atualizar o status da transação
  await c.env.DB.prepare(`
    UPDATE transactions 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(newStatus, transactionId, company.id).run();
  
  // Atualizar saldo da conta baseado na mudança de status
  if (oldStatus !== newStatus) {
    let balanceChange = 0;
    
    if (oldStatus === 'previsto' && newStatus === 'confirmado') {
      // De previsto para confirmado: adicionar ao saldo
      balanceChange = transaction.type === 'receita' ? transaction.value : -transaction.value;
    } else if (oldStatus === 'confirmado' && newStatus === 'previsto') {
      // De confirmado para previsto: remover do saldo
      balanceChange = transaction.type === 'receita' ? -transaction.value : transaction.value;
    }
    
    if (balanceChange !== 0) {
      await c.env.DB.prepare(`
        UPDATE accounts 
        SET current_balance = current_balance + ?
        WHERE id = ?
      `).bind(balanceChange, transaction.account_id).run();
    }
  }
  
  return c.json({ success: true });
});

app.delete("/api/transactions/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const transactionId = c.req.param("id");
  
  // Permitir que qualquer usuário autenticado da empresa exclua transações
  
  // Buscar a transação antes de excluir para reverter o saldo
  const { results: transactions } = await c.env.DB.prepare(
    "SELECT * FROM transactions WHERE id = ? AND company_id = ?"
  ).bind(transactionId, company.id).all();
  
  if (!transactions.length) {
    return c.json({ error: "Transação não encontrada" }, 404);
  }
  
  const transaction = transactions[0] as any;
  
  // Reverter o saldo da conta se a transação estava confirmada
  if (transaction.status === 'confirmado') {
    const multiplier = transaction.type === 'receita' ? -1 : 1; // Inverter o efeito
    await c.env.DB.prepare(`
      UPDATE accounts 
      SET current_balance = current_balance + ? 
      WHERE id = ?
    `).bind(transaction.value * multiplier, transaction.account_id).run();
  }
  
  // Excluir a transação
  await c.env.DB.prepare(
    "DELETE FROM transactions WHERE id = ? AND company_id = ?"
  ).bind(transactionId, company.id).run();
  
  return c.json({ success: true });
});

app.post("/api/transactions", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const appUser = (c as any).get("appUser");
  const body = await c.req.json();
  
  const transactionData = CreateTransactionSchema.parse(body);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO transactions (
      company_id, account_id, type, date, value, category_id, 
      chart_account_id, product_service_id, cost_center_id,
      description, payment_method, recurrence, installments, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    transactionData.account_id,
    transactionData.type,
    transactionData.date,
    transactionData.value,
    transactionData.category_id || null,
    transactionData.chart_account_id || null,
    transactionData.product_service_id || null,
    transactionData.cost_center_id || null,
    transactionData.description || null,
    transactionData.payment_method || null,
    transactionData.recurrence || null,
    transactionData.installments || null,
    transactionData.status,
    appUser.mocha_user_id
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar transação" }, 500);
  }
  
  // Atualizar saldo da conta se confirmado
  if (transactionData.status === 'confirmado') {
    const multiplier = transactionData.type === 'receita' ? 1 : -1;
    await c.env.DB.prepare(`
      UPDATE accounts 
      SET current_balance = current_balance + ? 
      WHERE id = ?
    `).bind(transactionData.value * multiplier, transactionData.account_id).run();
  }
  
  return c.json({ success: true, id: result.id });
});

// Contas
app.get("/api/accounts", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM accounts WHERE company_id = ? ORDER BY created_at ASC"
  ).bind(company.id).all();
  
  return c.json(results);
});

app.post("/api/accounts", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const accountData = CreateAccountSchema.parse(body);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO accounts (company_id, name, type, initial_balance, current_balance)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    accountData.name,
    accountData.type,
    accountData.initial_balance,
    accountData.initial_balance
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar conta" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

app.put("/api/accounts/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const accountData = CreateAccountSchema.parse(body);
  
  await c.env.DB.prepare(`
    UPDATE accounts 
    SET name = ?, type = ?, initial_balance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(
    accountData.name,
    accountData.type,
    accountData.initial_balance,
    id,
    company.id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/accounts/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM accounts WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).run();
  
  return c.json({ success: true });
});

// Categorias
app.get("/api/categories", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM categories WHERE company_id = ? ORDER BY type, name"
  ).bind(company.id).all();
  
  return c.json(results);
});

// Vencimentos
app.get("/api/due-dates", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM due_dates WHERE company_id = ? ORDER BY due_date ASC"
  ).bind(company.id).all();
  
  return c.json(results);
});

app.post("/api/due-dates", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const dueDateData = CreateDueDateSchema.parse(body);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO due_dates (company_id, title, due_date, value, type)
    VALUES (?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    dueDateData.title,
    dueDateData.due_date,
    dueDateData.value || null,
    dueDateData.type
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar vencimento" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

// Atualizar vencimento (marcar como pago)
app.put("/api/due-dates/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE due_dates 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(body.status, id, company.id).run();
  
  return c.json({ success: true });
});

// Plano de Contas
app.get("/api/chart-accounts", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT *, CASE WHEN type = 'despesa' AND (LOWER(name) LIKE '%custo%' OR LOWER(code) LIKE '%custo%' OR description LIKE '%[CUSTO]%') THEN 'custos' ELSE type END as display_type FROM chart_of_accounts WHERE company_id = ? ORDER BY code"
  ).bind(company.id).all();
  
  // Mapear os tipos para exibição correta
  const mappedResults = results.map((account: any) => ({
    ...account,
    type: account.display_type
  }));
  
  return c.json(mappedResults);
});

app.post("/api/chart-accounts", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const chartData = CreateChartOfAccountsSchema.parse(body);
  
  // Se o tipo for 'custos', salvar como 'despesa' no banco mas marcar na descrição
  let dbType = chartData.type === 'custos' ? 'despesa' : chartData.type;
  let description = chartData.description || '';
  
  // Adicionar marcador especial para contas de custo
  if (chartData.type === 'custos') {
    description = description + (description ? ' ' : '') + '[CUSTO]';
  }
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO chart_of_accounts (company_id, code, name, type, parent_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      company.id,
      chartData.code,
      chartData.name,
      dbType,
      chartData.parent_id || null,
      description
    ).first();
    
    if (!result) {
      return c.json({ error: "Erro ao criar conta" }, 500);
    }
    
    return c.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return c.json({ error: "Erro ao criar conta" }, 500);
  }
});

app.put("/api/chart-accounts/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const chartData = CreateChartOfAccountsSchema.parse(body);
  
  // Se o tipo for 'custos', salvar como 'despesa' no banco mas marcar na descrição
  let dbType = chartData.type === 'custos' ? 'despesa' : chartData.type;
  let description = chartData.description || '';
  
  // Adicionar/manter marcador especial para contas de custo
  if (chartData.type === 'custos') {
    if (!description.includes('[CUSTO]')) {
      description = description + (description ? ' ' : '') + '[CUSTO]';
    }
  } else {
    // Remover marcador se não for mais custo
    description = description.replace(/\s*\[CUSTO\]\s*/, ' ').trim();
  }
  
  try {
    await c.env.DB.prepare(`
      UPDATE chart_of_accounts 
      SET code = ?, name = ?, type = ?, parent_id = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `).bind(
      chartData.code,
      chartData.name,
      dbType,
      chartData.parent_id || null,
      description,
      id,
      company.id
    ).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    return c.json({ error: "Erro ao atualizar conta" }, 500);
  }
});

app.delete("/api/chart-accounts/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM chart_of_accounts WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).run();
  
  return c.json({ success: true });
});

// Produtos e Serviços
app.get("/api/products-services", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products_services WHERE company_id = ? ORDER BY name"
  ).bind(company.id).all();
  
  return c.json(results);
});

app.post("/api/products-services", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const productData = CreateProductServiceSchema.parse(body);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO products_services (company_id, name, type, code, description, price, cost, unity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    productData.name,
    productData.type,
    productData.code || null,
    productData.description || null,
    productData.price,
    productData.cost,
    productData.unity
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar produto/serviço" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

app.put("/api/products-services/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const productData = CreateProductServiceSchema.parse(body);
  
  await c.env.DB.prepare(`
    UPDATE products_services 
    SET name = ?, type = ?, code = ?, description = ?, price = ?, cost = ?, unity = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(
    productData.name,
    productData.type,
    productData.code || null,
    productData.description || null,
    productData.price,
    productData.cost,
    productData.unity,
    id,
    company.id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/products-services/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM products_services WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).run();
  
  return c.json({ success: true });
});

// Importar extrato bancário
app.post("/api/bank-reconciliations/:id/import-statement", authMiddleware, userCompanyMiddleware, async (c) => {
  const reconciliationId = c.req.param("id");
  const formData = await c.req.formData();
  
  const file = formData.get('file') as File;
  
  if (!file) {
    return c.json({ error: "Arquivo não fornecido" }, 400);
  }
  
  const fileContent = await file.text();
  const fileName = file.name.toLowerCase();
  
  let transactions: any[] = [];
  
  try {
    // Processar OFX
    if (fileName.endsWith('.ofx')) {
      // Parse simples de OFX - extrai transações
      const transactionMatches = fileContent.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g);
      
      for (const match of transactionMatches) {
        const txn = match[1];
        
        const typeMatch = txn.match(/<TRNTYPE>(.*?)</);
        const dateMatch = txn.match(/<DTPOSTED>(.*?)</);
        const amountMatch = txn.match(/<TRNAMT>(.*?)</);
        const memoMatch = txn.match(/<MEMO>(.*?)</);
        
        if (dateMatch && amountMatch) {
          const dateStr = dateMatch[1];
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          
          transactions.push({
            date: `${year}-${month}-${day}`,
            amount: parseFloat(amountMatch[1]),
            description: memoMatch ? memoMatch[1] : 'Transação importada',
            type: typeMatch ? typeMatch[1] : 'OTHER'
          });
        }
      }
    }
    // Processar CSV (formato simples)
    else if (fileName.endsWith('.csv')) {
      const lines = fileContent.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(/[,;]/);
        if (parts.length >= 3) {
          transactions.push({
            date: parts[0],
            description: parts[1],
            amount: parseFloat(parts[2].replace(/[^\d.,-]/g, '').replace(',', '.'))
          });
        }
      }
    }
    
    // Adicionar itens de conciliação
    for (const txn of transactions) {
      await c.env.DB.prepare(`
        INSERT INTO reconciliation_items (reconciliation_id, description, value, type)
        VALUES (?, ?, ?, ?)
      `).bind(
        reconciliationId,
        txn.description,
        txn.amount,
        'extrato'
      ).run();
    }
    
    return c.json({ success: true, imported: transactions.length });
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    return c.json({ error: "Erro ao processar arquivo. Verifique o formato." }, 400);
  }
});

// Iniciar processo de conciliação
app.post("/api/bank-reconciliations/:id/start", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const reconciliationId = c.req.param("id");
  
  // Buscar reconciliação
  const { results: reconciliations } = await c.env.DB.prepare(
    "SELECT * FROM bank_reconciliations WHERE id = ? AND company_id = ?"
  ).bind(reconciliationId, company.id).all();
  
  if (!reconciliations.length) {
    return c.json({ error: "Conciliação não encontrada" }, 404);
  }
  
  const reconciliation = reconciliations[0] as any;
  
  // Buscar transações da conta no período
  const { results: transactions } = await c.env.DB.prepare(`
    SELECT * FROM transactions 
    WHERE account_id = ? AND date <= ? AND status = 'confirmado'
    ORDER BY date DESC
    LIMIT 50
  `).bind(reconciliation.account_id, reconciliation.reconciliation_date).all();
  
  // Adicionar transações como itens de conciliação
  for (const txn of transactions as any[]) {
    const value = txn.type === 'receita' ? txn.value : -txn.value;
    
    await c.env.DB.prepare(`
      INSERT INTO reconciliation_items (reconciliation_id, transaction_id, description, value, type)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      reconciliationId,
      txn.id,
      txn.description || 'Transação',
      value,
      'sistema'
    ).run();
  }
  
  return c.json({ success: true });
});

// Buscar itens de conciliação
app.get("/api/bank-reconciliations/:id/items", authMiddleware, userCompanyMiddleware, async (c) => {
  const reconciliationId = c.req.param("id");
  
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM reconciliation_items 
    WHERE reconciliation_id = ?
    ORDER BY type, value DESC
  `).bind(reconciliationId).all();
  
  return c.json(results);
});

// Atualizar item de conciliação
app.put("/api/reconciliation-items/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE reconciliation_items 
    SET is_reconciled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(body.is_reconciled, id).run();
  
  return c.json({ success: true });
});

// Finalizar conciliação
app.post("/api/bank-reconciliations/:id/complete", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const reconciliationId = c.req.param("id");
  
  await c.env.DB.prepare(`
    UPDATE bank_reconciliations 
    SET status = 'conciliado', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(reconciliationId, company.id).run();
  
  return c.json({ success: true });
});

// Conciliação Bancária
app.get("/api/bank-reconciliations", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(`
    SELECT br.*, a.name as account_name
    FROM bank_reconciliations br
    LEFT JOIN accounts a ON br.account_id = a.id
    WHERE br.company_id = ?
    ORDER BY br.reconciliation_date DESC
  `).bind(company.id).all();
  
  return c.json(results);
});

app.post("/api/bank-reconciliations", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const reconciliationData = CreateBankReconciliationSchema.parse(body);
  
  // Buscar saldo contábil da conta
  const { results: accounts } = await c.env.DB.prepare(
    "SELECT current_balance FROM accounts WHERE id = ? AND company_id = ?"
  ).bind(reconciliationData.account_id, company.id).all();
  
  const bookBalance = accounts.length > 0 ? (accounts[0] as any).current_balance : 0;
  const difference = reconciliationData.statement_balance - bookBalance;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO bank_reconciliations (
      company_id, account_id, reconciliation_date, statement_balance, 
      book_balance, difference, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    reconciliationData.account_id,
    reconciliationData.reconciliation_date,
    reconciliationData.statement_balance,
    bookBalance,
    difference,
    reconciliationData.notes || null
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar conciliação" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

// Centros de Custo
app.get("/api/cost-centers", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM cost_centers WHERE company_id = ? ORDER BY code"
  ).bind(company.id).all();
  
  return c.json(results);
});

app.post("/api/cost-centers", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const costCenterData = CreateCostCenterSchema.parse(body);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO cost_centers (company_id, code, name, description)
    VALUES (?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    costCenterData.code,
    costCenterData.name,
    costCenterData.description || null
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar centro de custo" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

app.put("/api/cost-centers/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const costCenterData = CreateCostCenterSchema.parse(body);
  
  await c.env.DB.prepare(`
    UPDATE cost_centers 
    SET code = ?, name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(
    costCenterData.code,
    costCenterData.name,
    costCenterData.description || null,
    id,
    company.id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/cost-centers/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM cost_centers WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).run();
  
  return c.json({ success: true });
});

// Uso dos centros de custo (estatísticas)
app.get("/api/cost-centers/usage", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  
  const { results } = await c.env.DB.prepare(`
    SELECT 
      cc.id,
      COUNT(t.id) as transaction_count,
      COALESCE(SUM(CASE WHEN t.type = 'despesa' THEN t.value ELSE 0 END), 0) as total_expenses
    FROM cost_centers cc
    LEFT JOIN transactions t ON cc.id = t.cost_center_id AND t.company_id = ?
    WHERE cc.company_id = ?
    GROUP BY cc.id
  `).bind(company.id, company.id).all();
  
  const usage: {[key: number]: { count: number, total: number }} = {};
  results.forEach((row: any) => {
    usage[row.id] = {
      count: row.transaction_count || 0,
      total: row.total_expenses || 0
    };
  });
  
  return c.json(usage);
});

// Deletar conciliação bancária
app.delete("/api/bank-reconciliations/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const reconciliationId = c.req.param("id");
  
  try {
    // Primeiro deletar todos os itens da conciliação
    await c.env.DB.prepare(
      "DELETE FROM reconciliation_items WHERE reconciliation_id = ?"
    ).bind(reconciliationId).run();
    
    // Depois deletar a conciliação
    await c.env.DB.prepare(
      "DELETE FROM bank_reconciliations WHERE id = ? AND company_id = ?"
    ).bind(reconciliationId, company.id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conciliação:', error);
    return c.json({ error: "Erro ao deletar conciliação" }, 500);
  }
});

// Projeções de Fluxo de Caixa
app.get("/api/cash-flow-projections", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM cash_flow_projections WHERE company_id = ? ORDER BY date DESC"
  ).bind(company.id).all();
  
  return c.json(results);
});

app.post("/api/cash-flow-projections", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  const projectionData = CreateCashFlowProjectionSchema.parse(body);
  
  const result = await c.env.DB.prepare(`
    INSERT INTO cash_flow_projections (
      company_id, date, description, type, projected_value,
      category_id, account_id, is_recurring, recurrence_pattern
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    projectionData.date,
    projectionData.description,
    projectionData.type,
    projectionData.projected_value,
    projectionData.category_id || null,
    projectionData.account_id || null,
    projectionData.is_recurring,
    projectionData.recurrence_pattern || null
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao criar projeção" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

app.put("/api/cash-flow-projections/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  const body = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE cash_flow_projections 
    SET date = ?, description = ?, type = ?, projected_value = ?, 
        actual_value = ?, category_id = ?, account_id = ?, 
        is_recurring = ?, recurrence_pattern = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(
    body.date,
    body.description,
    body.type,
    body.projected_value,
    body.actual_value || null,
    body.category_id || null,
    body.account_id || null,
    body.is_recurring,
    body.recurrence_pattern || null,
    id,
    company.id
  ).run();
  
  return c.json({ success: true });
});

app.delete("/api/cash-flow-projections/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM cash_flow_projections WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).run();
  
  return c.json({ success: true });
});

// Gerar projeções automáticas baseadas no histórico
app.post("/api/cash-flow-projections/generate-automatic", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  
  try {
    // Buscar transações recorrentes dos últimos 90 dias
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { results: transactions } = await c.env.DB.prepare(`
      SELECT 
        t.type, t.value, t.description, t.chart_account_id, t.account_id,
        ca.name as chart_account_name,
        COUNT(*) as frequency,
        AVG(t.value) as avg_value,
        GROUP_CONCAT(DISTINCT strftime('%d', t.date)) as days
      FROM transactions t
      LEFT JOIN chart_of_accounts ca ON t.chart_account_id = ca.id
      WHERE t.company_id = ? AND t.date >= ? AND t.status = 'confirmado'
      GROUP BY t.type, t.chart_account_id, t.account_id
      HAVING frequency >= 2
      ORDER BY frequency DESC
    `).bind(company.id, ninetyDaysAgo.toISOString().split('T')[0]).all();
    
    let generated = 0;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const yearMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    
    for (const transaction of transactions as any[]) {
      // Verificar se já existe projeção similar para o próximo mês
      const { results: existing } = await c.env.DB.prepare(`
        SELECT id FROM cash_flow_projections 
        WHERE company_id = ? AND strftime('%Y-%m', date) = ? 
        AND type = ? AND chart_account_id = ?
      `).bind(
        company.id, 
        yearMonth,
        transaction.type === 'receita' ? 'entrada' : 'saida',
        transaction.chart_account_id
      ).all();
      
      if (existing.length === 0) {
        // Calcular data mais provável baseada no histórico
        const daysList = transaction.days?.split(',').map((d: string) => parseInt(d)) || [];
        let mostCommonDay = 15; // padrão
        
        if (daysList.length > 0) {
          const dayCount: { [key: number]: number } = {};
          daysList.forEach((day: number) => {
            dayCount[day] = (dayCount[day] || 0) + 1;
          });
          
          let maxCount = 0;
          for (const [day, count] of Object.entries(dayCount)) {
            if (count > maxCount) {
              maxCount = count;
              mostCommonDay = parseInt(day);
            }
          }
        }
        
        const projectionDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), mostCommonDay);
        
        // Criar projeção automática
        await c.env.DB.prepare(`
          INSERT INTO cash_flow_projections (
            company_id, date, description, type, projected_value, 
            category_id, account_id, is_recurring, recurrence_pattern
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          company.id,
          projectionDate.toISOString().split('T')[0],
          `${transaction.chart_account_name || 'Transação'} (Projeção Automática)`,
          transaction.type === 'receita' ? 'entrada' : 'saida',
          Math.round(transaction.avg_value),
          null,
          transaction.account_id,
          true,
          'Mensal - Baseado no histórico'
        ).run();
        
        generated++;
      }
    }
    
    return c.json({ success: true, generated });
  } catch (error) {
    console.error('Erro ao gerar projeções automáticas:', error);
    return c.json({ error: "Erro ao gerar projeções automáticas" }, 500);
  }
});

// Configurações da Empresa
app.get("/api/company-settings", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM company_settings WHERE company_id = ?"
  ).bind(company.id).all();
  
  if (results.length === 0) {
    // Criar configurações padrão se não existir
    await c.env.DB.prepare(`
      INSERT INTO company_settings (company_id, accountant_whatsapp)
      VALUES (?, ?)
    `).bind(company.id, null).run();
    
    return c.json({
      company_id: company.id,
      whatsapp_number: null,
      accountant_whatsapp: null,
    });
  }
  
  return c.json(results[0]);
});

app.put("/api/company-settings", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  
  // Verificar se já existe registro
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM company_settings WHERE company_id = ?"
  ).bind(company.id).all();
  
  if (results.length === 0) {
    // Criar novo registro
    await c.env.DB.prepare(`
      INSERT INTO company_settings (
        company_id, whatsapp_number, accountant_whatsapp
      )
      VALUES (?, ?, ?)
    `).bind(
      company.id,
      body.whatsapp_number || null,
      body.accountant_whatsapp || null
    ).run();
  } else {
    // Atualizar registro existente
    await c.env.DB.prepare(`
      UPDATE company_settings 
      SET whatsapp_number = ?, accountant_whatsapp = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ?
    `).bind(
      body.whatsapp_number || null,
      body.accountant_whatsapp || null,
      company.id
    ).run();
  }
  
  return c.json({ success: true });
});

// Upgrade manual para Premium
app.post("/api/upgrade-to-premium", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  
  // Atualizar plano para premium
  await c.env.DB.prepare(
    "UPDATE companies SET plan = 'premium', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(company.id).run();
  
  return c.json({ success: true, message: "Plano atualizado para Premium" });
});

// Upload de Documentos
app.post("/api/uploads", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const formData = await c.req.formData();
  
  const file = formData.get('file') as File;
  const category = formData.get('category') as string;
  
  if (!file) {
    return c.json({ error: "Arquivo não fornecido" }, 400);
  }
  
  const fileKey = `uploads/${company.id}/${Date.now()}_${file.name}`;
  
  await c.env.R2_BUCKET.put(fileKey, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });
  
  const uploadData = CreateUploadSchema.parse({
    filename: file.name,
    file_key: fileKey,
    file_type: file.type,
    file_size: file.size,
    category: category || 'outro',
  });
  
  const result = await c.env.DB.prepare(`
    INSERT INTO uploads (company_id, filename, file_key, file_type, file_size, category)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    company.id,
    uploadData.filename,
    uploadData.file_key,
    uploadData.file_type || null,
    uploadData.file_size || null,
    uploadData.category
  ).first();
  
  if (!result) {
    return c.json({ error: "Erro ao salvar upload" }, 500);
  }
  
  return c.json({ success: true, id: result.id });
});

app.get("/api/uploads", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM uploads WHERE company_id = ? ORDER BY created_at DESC"
  ).bind(company.id).all();
  
  return c.json(results);
});

app.get("/api/uploads/:id/download", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM uploads WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).all();
  
  if (!results.length) {
    return c.json({ error: "Arquivo não encontrado" }, 404);
  }
  
  const upload = results[0] as any;
  const object = await c.env.R2_BUCKET.get(upload.file_key);
  
  if (!object) {
    return c.json({ error: "Arquivo não encontrado no storage" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-disposition", `attachment; filename="${upload.filename}"`);
  
  return c.body(object.body, { headers });
});

app.post("/api/uploads/:id/send-to-accountant", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  // Buscar informações do upload
  const { results: uploads } = await c.env.DB.prepare(
    "SELECT * FROM uploads WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).all();
  
  if (!uploads.length) {
    return c.json({ error: "Documento não encontrado" }, 404);
  }
  
  const upload = uploads[0] as any;
  
  // Buscar configurações da empresa para obter o WhatsApp do contador
  const { results: settings } = await c.env.DB.prepare(
    "SELECT * FROM company_settings WHERE company_id = ?"
  ).bind(company.id).all();
  
  let accountantWhatsApp = null;
  if (settings.length > 0) {
    const companySettings = settings[0] as any;
    accountantWhatsApp = companySettings.accountant_whatsapp;
  }
  
  // Atualizar o documento como enviado
  await c.env.DB.prepare(`
    UPDATE uploads 
    SET sent_to_accountant = TRUE, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).bind(id, company.id).run();
  
  // Retornar informações para abrir o WhatsApp
  return c.json({ 
    success: true, 
    accountant_whatsapp: accountantWhatsApp,
    document_info: {
      filename: upload.filename,
      category: upload.category,
      sent_at: new Date().toISOString()
    }
  });
});

app.delete("/api/uploads/:id", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const id = c.req.param("id");
  
  const { results } = await c.env.DB.prepare(
    "SELECT file_key FROM uploads WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).all();
  
  if (results.length) {
    const upload = results[0] as any;
    await c.env.R2_BUCKET.delete(upload.file_key);
  }
  
  await c.env.DB.prepare(
    "DELETE FROM uploads WHERE id = ? AND company_id = ?"
  ).bind(id, company.id).run();
  
  return c.json({ success: true });
});

// Gerar Insights com IA
app.post("/api/insights/generate", authMiddleware, userCompanyMiddleware, async (c) => {
  const company = (c as any).get("company");
  const body = await c.req.json();
  const period = body.period; // Format: YYYY-MM
  
  if (!c.env.OPENAI_API_KEY) {
    return c.json({ error: "OpenAI API key não configurada" }, 500);
  }
  
  try {
    const [year, month] = period.split('-');
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    
    // Buscar dados financeiros do período
    const { results: transactions } = await c.env.DB.prepare(`
      SELECT t.*, 
             c.name as category_name, 
             a.name as account_name,
             ca.name as chart_account_name,
             ca.type as chart_account_type,
             cc.name as cost_center_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN chart_of_accounts ca ON t.chart_account_id = ca.id
      LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
      WHERE t.company_id = ? AND t.date BETWEEN ? AND ? AND t.status = 'confirmado'
      ORDER BY t.date DESC
    `).bind(company.id, monthStart, monthEnd).all();
    
    if (transactions.length === 0) {
      return c.json({ error: "Não há transações suficientes para gerar insights neste período." }, 400);
    }
    
    // Calcular estatísticas
    const incomeTransactions = transactions.filter((t: any) => t.type === 'receita');
    const expenseTransactions = transactions.filter((t: any) => t.type === 'despesa');
    
    const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + t.value, 0);
    const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + t.value, 0);
    const result = totalIncome - totalExpenses;
    
    // Agrupar por categorias
    const expensesByCategory: { [key: string]: number } = {};
    expenseTransactions.forEach((t: any) => {
      const category = t.chart_account_name || t.category_name || 'Outros';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + t.value;
    });
    
    const incomeByCategory: { [key: string]: number } = {};
    incomeTransactions.forEach((t: any) => {
      const category = t.chart_account_name || t.category_name || 'Outros';
      incomeByCategory[category] = (incomeByCategory[category] || 0) + t.value;
    });
    
    // Buscar saldo das contas
    const { results: accounts } = await c.env.DB.prepare(
      "SELECT name, current_balance FROM accounts WHERE company_id = ?"
    ).bind(company.id).all();
    
    // Preparar contexto para a IA
    const monthName = new Date(monthStart).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    const context = `
Você é um analista financeiro especializado em análise de dados empresariais. Analise os dados financeiros abaixo e gere insights detalhados e acionáveis.

PERÍODO: ${monthName}
EMPRESA: ${company.name}

RESUMO FINANCEIRO:
- Receitas Totais: R$ ${totalIncome.toFixed(2)}
- Despesas Totais: R$ ${totalExpenses.toFixed(2)}
- Resultado do Período: R$ ${result.toFixed(2)} (${result >= 0 ? 'Lucro' : 'Prejuízo'})
- Margem Operacional: ${totalIncome > 0 ? ((result / totalIncome) * 100).toFixed(1) : '0'}%
- Total de Transações: ${transactions.length} (${incomeTransactions.length} receitas, ${expenseTransactions.length} despesas)

RECEITAS POR CATEGORIA:
${Object.entries(incomeByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}

DESPESAS POR CATEGORIA:
${Object.entries(expensesByCategory).map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)} (${totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) : '0'}% do total)`).join('\n')}

CONTAS BANCÁRIAS:
${accounts.map((acc: any) => `- ${acc.name}: R$ ${acc.current_balance.toFixed(2)}`).join('\n')}

INSTRUÇÕES:
Gere uma análise completa e estruturada seguindo este formato:

1. Resumo Executivo:
[Parágrafo resumindo a situação financeira geral do mês]

2. Pontos Positivos:
- [Liste aspectos positivos identificados]

3. Pontos de Atenção:
- [Liste problemas ou áreas que precisam de cuidado]

4. Análise de Receitas:
[Análise detalhada das fontes de receita]

5. Análise de Despesas:
[Análise detalhada dos gastos e onde estão concentrados]

6. Recomendações:
- [Liste ações específicas e práticas que a empresa pode tomar]

Seja específico, use números do contexto, e forneça insights acionáveis em português do Brasil.
`;

    const client = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um analista financeiro especializado em análise de dados empresariais. Forneça insights detalhados, específicos e acionáveis em português do Brasil."
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const insights = completion.choices[0].message.content;

    return c.json({ 
      success: true, 
      insights,
      period,
      stats: {
        totalIncome,
        totalExpenses,
        result,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    return c.json({ error: "Erro ao gerar insights. Verifique se a API key da OpenAI está configurada corretamente." }, 500);
  }
});

export default app;
