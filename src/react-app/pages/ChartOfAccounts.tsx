import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TreePine, ChevronDown, ChevronRight } from 'lucide-react';
import type { ChartOfAccounts, CreateChartOfAccounts } from '@/shared/types';

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccounts | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<CreateChartOfAccounts>({
    code: '',
    name: '',
    type: 'ativo',
    parent_id: undefined,
    description: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/chart-accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar plano de contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount ? `/api/chart-accounts/${editingAccount.id}` : '/api/chart-accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar conta');
      }

      await fetchAccounts();
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        type: 'ativo',
        parent_id: undefined,
        description: '',
      });
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert(editingAccount ? 'Erro ao atualizar conta' : 'Erro ao criar conta');
    }
  };

  const handleEdit = (account: ChartOfAccounts) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      parent_id: account.parent_id,
      description: account.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        const response = await fetch(`/api/chart-accounts/${id}`, { method: 'DELETE' });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao excluir conta');
        }

        await fetchAccounts();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        alert('Erro ao excluir conta. Verifique se não há transações vinculadas.');
      }
    }
  };

  const toggleExpand = (accountId: number) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const getAccountsByType = (type: string) => {
    return accounts.filter(account => account.type === type && !account.parent_id);
  };

  const getSubAccounts = (parentId: number) => {
    return accounts.filter(account => account.parent_id === parentId);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      ativo: 'bg-green-100 text-green-800',
      passivo: 'bg-red-100 text-red-800',
      patrimonio: 'bg-blue-100 text-blue-800',
      receita: 'bg-emerald-100 text-emerald-800',
      despesa: 'bg-orange-100 text-orange-800',
      custos: 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderAccount = (account: ChartOfAccounts, level = 0) => {
    const subAccounts = getSubAccounts(account.id);
    const hasChildren = subAccounts.length > 0;
    const isExpanded = expandedAccounts.has(account.id);

    return (
      <div key={account.id}>
        <div className={`flex items-center justify-between p-3 border-b hover:bg-gray-50 ${
          level > 0 ? 'ml-' + (level * 6) : ''
        }`}>
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.id)}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm text-gray-600">{account.code}</span>
                <span className="font-medium">{account.name}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(account.type)}`}>
                  {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                </span>
              </div>
              {account.description && (
                <p className="text-sm text-gray-500 mt-1">{account.description}</p>
              )}
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
        {hasChildren && isExpanded && subAccounts.map(subAccount => renderAccount(subAccount, level + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
              <TreePine className="w-8 h-8 mr-3 text-green-600" />
              Plano de Contas
            </h1>
            <p className="text-gray-600 mt-2">Gerencie a estrutura contábil da sua empresa</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Conta
          </button>
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
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="passivo">Passivo</option>
                  <option value="patrimonio">Patrimônio</option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                  <option value="custos">Custos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta Pai
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Nenhuma (Conta Principal)</option>
                  {accounts
                    .filter(acc => acc.type === formData.type && !acc.parent_id)
                    .map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
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
                      code: '',
                      name: '',
                      type: 'ativo',
                      parent_id: undefined,
                      description: '',
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

      <div className="space-y-6">
        {['ativo', 'passivo', 'patrimonio', 'receita', 'despesa', 'custos'].map(type => {
          const typeAccounts = getAccountsByType(type);
          if (typeAccounts.length === 0) return null;

          return (
            <div key={type} className="bg-white rounded-lg shadow-sm border">
              <div className={`px-4 py-3 border-b ${getTypeColor(type)}`}>
                <h3 className="text-lg font-semibold capitalize">{type}</h3>
              </div>
              <div>
                {typeAccounts.map(account => renderAccount(account))}
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <TreePine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta cadastrada</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira conta no plano de contas</p>
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
