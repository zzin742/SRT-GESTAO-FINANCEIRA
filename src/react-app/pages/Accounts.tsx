import { useState, useEffect } from 'react';
import { Plus, CreditCard, Wallet, Building2, Edit2, Trash2 } from 'lucide-react';
import type { Account, CreateAccount } from '@/shared/types';
import PremiumFeatureLock from '@/react-app/components/PremiumFeatureLock';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');

  const [formData, setFormData] = useState<CreateAccount>({
    name: '',
    type: 'carteira',
    initial_balance: 0,
  });

  useEffect(() => {
    fetchAccounts();
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

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar limite para contas gratuitas
    if (userPlan === 'free' && accounts.length >= 1 && !editingAccount) {
      alert('Limite de 1 conta atingido no plano gratuito. Faça upgrade para adicionar mais contas.');
      return;
    }
    
    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      await fetchAccounts();
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'carteira',
        initial_balance: 0,
      });
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        await fetchAccounts();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'carteira':
        return <Wallet className="w-6 h-6" />;
      case 'conta_bancaria':
        return <Building2 className="w-6 h-6" />;
      case 'cartao':
        return <CreditCard className="w-6 h-6" />;
      default:
        return <Wallet className="w-6 h-6" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      carteira: 'Carteira',
      conta_bancaria: 'Conta Bancária',
      cartao: 'Cartão'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      carteira: 'bg-green-100 text-green-800',
      conta_bancaria: 'bg-blue-100 text-blue-800',
      cartao: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.current_balance, 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
              Contas
            </h1>
            <p className="text-gray-600 mt-2">Gerencie suas contas bancárias, carteiras e cartões</p>
          </div>
          {userPlan === 'free' && accounts.length >= 1 ? (
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center cursor-not-allowed">
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta (Premium)
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Conta
            </button>
          )}
        </div>
      </div>

      {/* Resumo Total */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Saldo Total</h3>
          <p className="text-3xl font-bold">{formatCurrency(getTotalBalance())}</p>
          <p className="text-blue-100 text-sm mt-1">Soma de todas as contas</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Ex: Conta Corrente Banco do Brasil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Conta *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="carteira">Carteira</option>
                  <option value="conta_bancaria">Conta Bancária</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                    setFormData({
                      name: '',
                      type: 'carteira',
                      initial_balance: 0,
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aviso para Contas Gratuitas */}
      {userPlan === 'free' && accounts.length >= 1 && (
        <div className="mb-6">
          <PremiumFeatureLock
            feature="Contas Múltiplas"
            description="No plano gratuito você pode ter apenas 1 conta. Faça upgrade para adicionar contas ilimitadas."
            size="sm"
          />
        </div>
      )}

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${getAccountTypeColor(account.type)}`}>
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500">{getAccountTypeLabel(account.type)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className={`text-2xl font-bold ${
                  account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(account.current_balance)}
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Saldo Inicial:</span>
                  <span className="font-medium">{formatCurrency(account.initial_balance)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta cadastrada</h3>
          <p className="text-gray-500 mb-4">Comece adicionando sua primeira conta bancária ou carteira</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar primeira conta
          </button>
        </div>
      )}
    </div>
  );
}
