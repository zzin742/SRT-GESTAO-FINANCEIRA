import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  ArrowUpDown,
  FileText,
  Send,
  Clock,
  Briefcase,
  Calculator as CalculatorIcon,
  Sparkles
} from 'lucide-react';
import type { DashboardData, TransactionWithDetails } from '@/shared/types';
import UpgradeButton from '@/react-app/components/UpgradeButton';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proLaboreAmount, setProLaboreAmount] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardResponse, userResponse] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/users/me')
        ]);
        
        const data = await dashboardResponse.json();
        const userData = await userResponse.json();
        
        setDashboardData(data);
        setUserPlan(userData.company?.plan || 'free');
        
        // Calcular pró-labore sugerido (30% do lucro ou 10% da receita, o que for maior)
        const profit = data.monthIncome - data.monthExpenses;
        const suggestedProLabore = Math.max(profit * 0.3, data.monthIncome * 0.1);
        setProLaboreAmount(suggestedProLabore > 0 ? suggestedProLabore : 0);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    );
  }

  const monthResult = dashboardData.monthIncome - dashboardData.monthExpenses;
  const todayResult = dashboardData.todayIncome - dashboardData.todayExpenses;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral das suas finanças</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Link
            to="/app/transacoes?action=receita"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Receita
          </Link>
          <Link
            to="/app/transacoes?action=despesa"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Despesa
          </Link>
        </div>
      </div>

      {/* Banner de Upgrade para Contas Gratuitas */}
      {userPlan === 'free' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Sparkles className="w-6 h-6 mr-2" />
                <h3 className="text-xl font-bold">Desbloqueie Todo o Potencial</h3>
              </div>
              <p className="text-blue-100 mb-4">
                Você está no plano gratuito. Faça upgrade e tenha acesso a recursos ilimitados!
              </p>
              <ul className="text-sm text-blue-100 space-y-1 mb-4">
                <li>✓ Transações ilimitadas</li>
                <li>✓ Contas bancárias ilimitadas</li>
                <li>✓ Relatórios avançados</li>
                <li>✓ Suporte prioritário</li>
              </ul>
            </div>
            <div className="ml-4">
              <UpgradeButton variant="secondary" size="md" />
            </div>
          </div>
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Saldo Atual</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(dashboardData.currentBalance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Clock className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-gray-600">
              {dashboardData.cashFlowDays === 999 
                ? 'Sem gastos recentes' 
                : `${dashboardData.cashFlowDays} dias de caixa`
              }
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hoje</p>
              <p className={`text-2xl font-bold mt-1 ${
                todayResult >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(todayResult)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              todayResult >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {todayResult >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <div>Entradas: {formatCurrency(dashboardData.todayIncome)}</div>
            <div>Saídas: {formatCurrency(dashboardData.todayExpenses)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Este Mês</p>
              <p className={`text-2xl font-bold mt-1 ${
                monthResult >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(monthResult)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              monthResult >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <ArrowUpDown className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <div>Entradas: {formatCurrency(dashboardData.monthIncome)}</div>
            <div>Saídas: {formatCurrency(dashboardData.monthExpenses)}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transações</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardData.recentTransactions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ArrowUpDown className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/app/transacoes"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
        </div>
      </div>

      {/* Simulação de Pró-Labore */}
      {monthResult > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Briefcase className="w-6 h-6 mr-2" />
                <h3 className="text-xl font-bold">Simulação de Pró-Labore</h3>
              </div>
              <p className="text-purple-100 mb-4">
                Com base no seu lucro deste mês, sugerimos um pró-labore de:
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-100 mb-1">Pró-Labore Sugerido</p>
                <p className="text-3xl font-bold">{formatCurrency(proLaboreAmount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-200">Lucro do Mês</p>
                  <p className="font-semibold">{formatCurrency(monthResult)}</p>
                </div>
                <div>
                  <p className="text-purple-200">% Recomendado</p>
                  <p className="font-semibold">30% do lucro</p>
                </div>
              </div>
            </div>
            <div className="ml-4">
              <CalculatorIcon className="w-16 h-16 text-white opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/app/transacoes"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Transações</span>
          </Link>
          <Link
            to="/app/relatorios"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Relatórios</span>
          </Link>
          <Link
            to="/app/contas"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Contas</span>
          </Link>
          <Link
            to="/app/documentos"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Documentos</span>
          </Link>
          <Link
            to="/app/falar-contador"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Send className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-sm font-medium text-green-900">Falar com Contador</span>
          </Link>
        </div>
      </div>

      

      {/* Transações Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
          <Link 
            to="/app/transacoes"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver todas →
          </Link>
        </div>
        <div className="space-y-3">
          {dashboardData.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ArrowUpDown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma transação ainda.</p>
              <p className="text-sm">Comece registrando uma receita ou despesa.</p>
            </div>
          ) : (
            dashboardData.recentTransactions.slice(0, 10).map((transaction: TransactionWithDetails) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    transaction.type === 'receita' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description || 'Sem descrição'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(transaction.date)} • {(transaction as any).account_name}
                      {(transaction as any).chart_account_name && ` • ${(transaction as any).chart_account_name}`}
                      {(transaction as any).category_name && !((transaction as any).chart_account_name) && ` • ${(transaction as any).category_name}`}
                      {(transaction as any).product_service_name && ` • ${(transaction as any).product_service_name}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${
                    transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'receita' ? '+' : '-'}
                    {formatCurrency(transaction.value)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.status === 'previsto' ? 'Previsto' : 'Confirmado'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
