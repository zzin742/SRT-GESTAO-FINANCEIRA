import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, ArrowUpDown, AlertTriangle, Check, Clock } from 'lucide-react';
import type { Transaction, Account, Category, ChartOfAccounts, CostCenter } from '@/shared/types';

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartOfAccounts[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  
  const [formData, setFormData] = useState({
    type: 'receita' as 'receita' | 'despesa',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    value: '',
    category_id: '',
    chart_account_id: '',
    product_service_id: '',
    cost_center_id: '',
    description: '',
    payment_method: '',
    status: 'confirmado' as 'previsto' | 'confirmado',
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'receita' || action === 'despesa') {
      setFormData(prev => ({ ...prev, type: action }));
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/users/me');
      const data = await response.json();
      setUserPlan(data.company?.plan || 'free');
      
    } catch (error) {
      console.error('Erro ao buscar plano do usuário:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [transactionsRes, accountsRes, categoriesRes, chartAccountsRes, costCentersRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/accounts'),
        fetch('/api/categories'),
        fetch('/api/chart-accounts'),
        fetch('/api/cost-centers'),
      ]);

      if (transactionsRes.ok && accountsRes.ok && categoriesRes.ok && chartAccountsRes.ok && costCentersRes.ok) {
        setTransactions(await transactionsRes.json());
        setAccounts(await accountsRes.json());
        setCategories(await categoriesRes.json());
        setChartAccounts(await chartAccountsRes.json());
        setCostCenters(await costCentersRes.json());
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar limite para contas gratuitas
    if (userPlan === 'free' && transactions.length >= 200) {
      alert('Limite de 200 transações atingido no plano gratuito. Faça upgrade para continuar.');
      return;
    }
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          account_id: parseInt(formData.account_id),
          category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
          chart_account_id: formData.chart_account_id ? parseInt(formData.chart_account_id) : undefined,
          product_service_id: undefined,
          cost_center_id: formData.cost_center_id ? parseInt(formData.cost_center_id) : undefined,
          value: parseFloat(formData.value),
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({
          type: 'receita',
          account_id: '',
          date: new Date().toISOString().split('T')[0],
          value: '',
          category_id: '',
          chart_account_id: '',
          product_service_id: '',
          cost_center_id: '',
          description: '',
          payment_method: '',
          status: 'confirmado',
        });
        fetchData();
        setSearchParams({});
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

  const handleStatusChange = async (transactionId: number, newStatus: 'previsto' | 'confirmado') => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status da transação');
    }
  };

  const handleDelete = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
        setShowDeleteModal(false);
        setSelectedTransaction(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir transação');
      }
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação');
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600 mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, type: 'receita' }));
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </button>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, type: 'despesa' }));
              setShowModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Aviso de Limite para Contas Gratuitas */}
      {userPlan === 'free' && transactions.length > 150 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-yellow-800 font-medium">
                Você está próximo do limite de transações ({transactions.length}/200)
              </p>
              <p className="text-yellow-700 text-sm">
                Faça upgrade para o plano Premium e tenha transações ilimitadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Transações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <ArrowUpDown className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação</h3>
            <p className="text-gray-500 mb-4">Comece registrando sua primeira receita ou despesa.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Adicionar Transação
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano de Contas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleTransactionClick(transaction)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description || 'Sem descrição'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {(transaction as any).chart_account_name ? (
                          <span className="font-medium text-blue-600">
                            {(transaction as any).chart_account_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            {categories.find(c => c.id === transaction.category_id)?.name || 'Sem conta contábil'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {accounts.find(a => a.id === transaction.account_id)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'receita' ? '+' : '-'}
                        {formatCurrency(transaction.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusChange(
                          transaction.id, 
                          transaction.status === 'confirmado' ? 'previsto' : 'confirmado'
                        )}
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full transition-colors hover:scale-105 ${
                          transaction.status === 'confirmado'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                        title={`Clique para alterar para ${transaction.status === 'confirmado' ? 'Previsto' : 'Confirmado'}`}
                      >
                        {transaction.status === 'confirmado' ? (
                          <><Check className="w-3 h-3 mr-1" /> Confirmado</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Previsto</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-xs text-gray-400">Clique para excluir</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Exclusão */}
      {showDeleteModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                Excluir Transação
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Você está prestes a excluir:</p>
                <div className="space-y-1">
                  <p><span className="font-medium">Data:</span> {formatDate(selectedTransaction.date)}</p>
                  <p><span className="font-medium">Valor:</span> 
                    <span className={selectedTransaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}>
                      {selectedTransaction.type === 'receita' ? '+' : '-'}
                      {formatCurrency(selectedTransaction.value)}
                    </span>
                  </p>
                  <p><span className="font-medium">Descrição:</span> {selectedTransaction.description || 'Sem descrição'}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Atenção!</p>
                    <p>Esta ação não pode ser desfeita. A transação será removida permanentemente.</p>
                    {selectedTransaction.status === 'confirmado' && (
                      <p className="mt-1">O saldo da conta será automaticamente ajustado.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedTransaction.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir Transação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Nova {formData.type === 'receita' ? 'Receita' : 'Despesa'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'receita' }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      formData.type === 'receita'
                        ? 'bg-green-100 text-green-700 border-2 border-green-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'despesa' }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      formData.type === 'despesa'
                        ? 'bg-red-100 text-red-700 border-2 border-red-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Despesa
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta *
                  </label>
                  <select
                    required
                    value={formData.account_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plano de Contas *
                  </label>
                  <select
                    required
                    value={formData.chart_account_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, chart_account_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma conta contábil</option>
                    {chartAccounts
                      .filter(ca => {
                        if (formData.type === 'receita') return ca.type === 'receita';
                        if (formData.type === 'despesa') return ca.type === 'despesa' || ca.type === 'custos';
                        return false;
                      })
                      .map((chartAccount) => (
                      <option key={chartAccount.id} value={chartAccount.id}>
                        {chartAccount.code} - {chartAccount.name} {chartAccount.type === 'custos' ? '(Custo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Centro de Custo - Apenas para Despesas */}
                {formData.type === 'despesa' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Centro de Custo
                    </label>
                    <select
                      value={formData.cost_center_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_center_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um centro de custo (opcional)</option>
                      {costCenters
                        .filter(cc => cc.is_active)
                        .map((costCenter) => (
                        <option key={costCenter.id} value={costCenter.id}>
                          {costCenter.code} - {costCenter.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observações sobre a transação"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'previsto' | 'confirmado' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="confirmado">Confirmado</option>
                    <option value="previsto">Previsto</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSearchParams({});
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors ${
                      formData.type === 'receita'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
