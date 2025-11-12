import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import type { CashFlowProjection, CreateCashFlowProjection, Category, Account } from '@/shared/types';

export default function CashFlowCreationPage() {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProjection, setEditingProjection] = useState<CashFlowProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAuto, setGeneratingAuto] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState<CreateCashFlowProjection>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'entrada',
    projected_value: 0,
    category_id: undefined,
    account_id: undefined,
    is_recurring: false,
    recurrence_pattern: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectionsRes, categoriesRes, accountsRes] = await Promise.all([
        fetch('/api/cash-flow-projections'),
        fetch('/api/categories'),
        fetch('/api/accounts')
      ]);

      const [projectionsData, categoriesData, accountsData] = await Promise.all([
        projectionsRes.json(),
        categoriesRes.json(),
        accountsRes.json()
      ]);

      setProjections(projectionsData);
      setCategories(categoriesData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAutomaticProjections = async () => {
    setGeneratingAuto(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/cash-flow-projections/generate-automatic', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.generated > 0) {
          setMessage({ 
            type: 'success', 
            text: `${result.generated} projeções automáticas geradas com base no histórico!` 
          });
          await fetchData(); // Recarregar dados para mostrar as novas projeções
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Nenhuma nova projeção foi gerada. Pode ser que não haja histórico suficiente ou já existam projeções para o próximo mês.' 
          });
        }
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'error', 
          text: errorData.error || 'Erro ao gerar projeções automáticas' 
        });
      }
    } catch (error) {
      console.error('Erro ao gerar projeções automáticas:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro de conexão ao gerar projeções automáticas' 
      });
    } finally {
      setGeneratingAuto(false);
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProjection ? `/api/cash-flow-projections/${editingProjection.id}` : '/api/cash-flow-projections';
      const method = editingProjection ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      await fetchData();
      setShowForm(false);
      setEditingProjection(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'entrada',
        projected_value: 0,
        category_id: undefined,
        account_id: undefined,
        is_recurring: false,
        recurrence_pattern: '',
      });
    } catch (error) {
      console.error('Erro ao salvar projeção:', error);
    }
  };

  const handleEdit = (projection: CashFlowProjection) => {
    setEditingProjection(projection);
    setFormData({
      date: projection.date,
      description: projection.description,
      type: projection.type,
      projected_value: projection.projected_value,
      category_id: projection.category_id,
      account_id: projection.account_id,
      is_recurring: projection.is_recurring,
      recurrence_pattern: projection.recurrence_pattern || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta projeção?')) {
      try {
        await fetch(`/api/cash-flow-projections/${id}`, { method: 'DELETE' });
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir projeção:', error);
      }
    }
  };

  const updateActualValue = async (id: number, actualValue: number) => {
    try {
      const projection = projections.find(p => p.id === id);
      if (!projection) return;

      await fetch(`/api/cash-flow-projections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projection,
          actual_value: actualValue,
        }),
      });

      await fetchData();
    } catch (error) {
      console.error('Erro ao atualizar valor real:', error);
    }
  };

  const filteredProjections = projections.filter(projection => {
    const projectionMonth = projection.date.slice(0, 7);
    const matchesMonth = projectionMonth === filterMonth;
    const matchesType = filterType === 'all' || projection.type === filterType;
    return matchesMonth && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const calculateTotals = () => {
    const entradas = filteredProjections.filter(p => p.type === 'entrada');
    const saidas = filteredProjections.filter(p => p.type === 'saida');

    return {
      projectedIncome: entradas.reduce((sum, p) => sum + p.projected_value, 0),
      actualIncome: entradas.reduce((sum, p) => sum + (p.actual_value || 0), 0),
      projectedExpenses: saidas.reduce((sum, p) => sum + p.projected_value, 0),
      actualExpenses: saidas.reduce((sum, p) => sum + (p.actual_value || 0), 0),
    };
  };

  const exportCashFlow = () => {
    const csvContent = [
      ['Data', 'Descrição', 'Tipo', 'Valor Projetado', 'Valor Realizado'],
      ...filteredProjections.map(p => [
        p.date,
        p.description,
        p.type === 'entrada' ? 'Entrada' : 'Saída',
        p.projected_value.toString(),
        (p.actual_value || 0).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo-caixa-${filterMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
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
              <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
              Fluxo de Caixa
            </h1>
            <p className="text-gray-600 mt-2">Projete e acompanhe seu fluxo de caixa</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={generateAutomaticProjections}
              disabled={generatingAuto}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <TrendingUp className={`w-5 h-5 mr-2 ${generatingAuto ? 'animate-spin' : ''}`} />
              {generatingAuto ? 'Gerando...' : 'Gerar Automático'}
            </button>
            <button
              onClick={exportCashFlow}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Exportar
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Projeção
            </button>
          </div>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}></div>
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Entradas Projetadas</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.projectedIncome)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Entradas Realizadas</h3>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.actualIncome)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Saídas Projetadas</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.projectedExpenses)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Saídas Realizadas</h3>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.actualExpenses)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingProjection ? 'Editar Projeção' : 'Nova Projeção'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Projetado *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.projected_value}
                  onChange={(e) => setFormData({ ...formData, projected_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.filter(cat => cat.type === formData.type.replace('entrada', 'receita').replace('saida', 'despesa')).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta
                </label>
                <select
                  value={formData.account_id || ''}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">
                  Recorrente
                </label>
              </div>
              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Padrão de Recorrência
                  </label>
                  <input
                    type="text"
                    value={formData.recurrence_pattern}
                    onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                    placeholder="Ex: Mensal, Semanal, Anual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProjection ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProjection(null);
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      type: 'entrada',
                      projected_value: 0,
                      category_id: undefined,
                      account_id: undefined,
                      is_recurring: false,
                      recurrence_pattern: '',
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

      {/* Lista de Projeções */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projetado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Realizado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjections.map((projection) => (
                <tr key={projection.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(projection.date)}
                    {projection.is_recurring && (
                      <div className="text-xs text-blue-600">Recorrente</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{projection.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      projection.type === 'entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {projection.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(projection.projected_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      value={projection.actual_value || ''}
                      onChange={(e) => updateActualValue(projection.id, Number(e.target.value))}
                      placeholder="0,00"
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(projection)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(projection.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProjections.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma projeção encontrada</h3>
          <p className="text-gray-500 mb-4">
            {filterType !== 'all' || filterMonth !== new Date().toISOString().slice(0, 7)
              ? 'Tente ajustar os filtros'
              : 'Comece criando sua primeira projeção de fluxo de caixa'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar projeção
          </button>
        </div>
      )}
    </div>
  );
}
