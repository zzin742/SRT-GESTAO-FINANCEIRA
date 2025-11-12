import { useState, useEffect } from 'react';
import { Plus, Check, X, RefreshCw, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import type { BankReconciliation, CreateBankReconciliation, Account } from '@/shared/types';

interface ReconciliationItem {
  id: number;
  reconciliation_id: number;
  transaction_id?: number;
  description: string;
  value: number;
  type: 'extrato' | 'sistema' | 'ajuste';
  is_reconciled: boolean;
}

export default function BankReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reconciliationItems, setReconciliationItems] = useState<ReconciliationItem[]>([]);
  const [selectedReconciliation, setSelectedReconciliation] = useState<BankReconciliation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<CreateBankReconciliation>({
    account_id: 0,
    reconciliation_date: new Date().toISOString().split('T')[0],
    statement_balance: 0,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedReconciliation) {
      fetchReconciliationItems(selectedReconciliation.id);
    }
  }, [selectedReconciliation]);

  const fetchData = async () => {
    try {
      const [reconciliationsRes, accountsRes] = await Promise.all([
        fetch('/api/bank-reconciliations'),
        fetch('/api/accounts')
      ]);

      const [reconciliationsData, accountsData] = await Promise.all([
        reconciliationsRes.json(),
        accountsRes.json()
      ]);

      setReconciliations(reconciliationsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliationItems = async (reconciliationId: number) => {
    try {
      const response = await fetch(`/api/bank-reconciliations/${reconciliationId}/items`);
      const data = await response.json();
      setReconciliationItems(data);
    } catch (error) {
      console.error('Erro ao carregar itens da conciliação:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bank-reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newReconciliation = await response.json();
        await fetchData();
        setSelectedReconciliation(newReconciliation);
        setShowForm(false);
        setFormData({
          account_id: 0,
          reconciliation_date: new Date().toISOString().split('T')[0],
          statement_balance: 0,
          notes: '',
        });
      }
    } catch (error) {
      console.error('Erro ao criar conciliação:', error);
    }
  };

  const startReconciliation = async (reconciliationId: number) => {
    try {
      await fetch(`/api/bank-reconciliations/${reconciliationId}/start`, {
        method: 'POST',
      });
      await fetchData();
      await fetchReconciliationItems(reconciliationId);
    } catch (error) {
      console.error('Erro ao iniciar conciliação:', error);
    }
  };

  const reconcileItem = async (itemId: number, isReconciled: boolean) => {
    try {
      await fetch(`/api/reconciliation-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_reconciled: isReconciled }),
      });
      
      if (selectedReconciliation) {
        await fetchReconciliationItems(selectedReconciliation.id);
      }
    } catch (error) {
      console.error('Erro ao conciliar item:', error);
    }
  };

  const completeReconciliation = async (reconciliationId: number) => {
    if (confirm('Tem certeza que deseja finalizar esta conciliação?')) {
      try {
        await fetch(`/api/bank-reconciliations/${reconciliationId}/complete`, {
          method: 'POST',
        });
        await fetchData();
        setSelectedReconciliation(null);
      } catch (error) {
        console.error('Erro ao finalizar conciliação:', error);
      }
    }
  };

  const handleDeleteReconciliation = async (reconciliationId: number) => {
    if (confirm('Tem certeza que deseja excluir esta conciliação? Esta ação não pode ser desfeita.')) {
      try {
        await fetch(`/api/bank-reconciliations/${reconciliationId}`, {
          method: 'DELETE',
        });
        await fetchData();
        alert('Conciliação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir conciliação:', error);
        alert('Erro ao excluir conciliação. Tente novamente.');
      }
    }
  };

  const handleImportStatement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedReconciliation) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/bank-reconciliations/${selectedReconciliation.id}/import-statement`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.imported} transações importadas com sucesso!`);
        await fetchReconciliationItems(selectedReconciliation.id);
        setShowImportModal(false);
      } else {
        const error = await response.json();
        alert('Erro ao importar extrato: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao importar extrato:', error);
      alert('Erro ao importar extrato. Verifique o formato do arquivo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getAccountName = (accountId: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Conta não encontrada';
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

  if (selectedReconciliation) {
    const reconciledItems = reconciliationItems.filter(item => item.is_reconciled);
    const unreconciledItems = reconciliationItems.filter(item => !item.is_reconciled);
    const reconciledValue = reconciledItems.reduce((sum, item) => sum + item.value, 0);
    const remainingDifference = selectedReconciliation.difference - reconciledValue;

    return (
      <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setSelectedReconciliation(null)}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              >
                ← Voltar para conciliações
              </button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <RefreshCw className="w-8 h-8 mr-3 text-blue-600" />
                Conciliação - {getAccountName(selectedReconciliation.account_id)}
              </h1>
              <p className="text-gray-600 mt-2">
                {formatDate(selectedReconciliation.reconciliation_date)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedReconciliation.status === 'pendente' && (
                <>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Extrato
                  </button>
                  <button
                    onClick={() => completeReconciliation(selectedReconciliation.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    disabled={Math.abs(remainingDifference) > 0.01}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Finalizar Conciliação
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status da Conciliação */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Saldo do Extrato</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(selectedReconciliation.statement_balance)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Saldo do Sistema</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(selectedReconciliation.book_balance)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Diferença Total</h3>
            <p className={`text-2xl font-bold ${
              selectedReconciliation.difference === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(selectedReconciliation.difference)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Diferença Restante</h3>
            <p className={`text-2xl font-bold ${
              Math.abs(remainingDifference) < 0.01 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(remainingDifference)}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <div className={`flex items-center p-4 rounded-lg ${
            Math.abs(remainingDifference) < 0.01 
              ? 'bg-green-50 text-green-800' 
              : 'bg-yellow-50 text-yellow-800'
          }`}>
            {Math.abs(remainingDifference) < 0.01 ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Conciliação balanceada - pronta para finalizar
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 mr-2" />
                Ainda há diferenças para conciliar
              </>
            )}
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="space-y-6">
          {/* Itens não conciliados */}
          {unreconciledItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Itens Pendentes ({unreconciledItems.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {unreconciledItems.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.type === 'extrato' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'sistema' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'extrato' ? 'Extrato' : 
                           item.type === 'sistema' ? 'Sistema' : 'Ajuste'}
                        </span>
                        <span className="font-medium">{item.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`font-semibold ${
                        item.value > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(item.value)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => reconcileItem(item.id, true)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como conciliado"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => reconcileItem(item.id, false)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Marcar como não conciliado"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itens conciliados */}
          {reconciledItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Itens Conciliados ({reconciledItems.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {reconciledItems.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between bg-green-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.type === 'extrato' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'sistema' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'extrato' ? 'Extrato' : 
                           item.type === 'sistema' ? 'Sistema' : 'Ajuste'}
                        </span>
                        <span className="font-medium">{item.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`font-semibold ${
                        item.value > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(item.value)}
                      </span>
                      <button
                        onClick={() => reconcileItem(item.id, false)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Desmarcar conciliação"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {reconciliationItems.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Iniciando conciliação...</h3>
            <p className="text-gray-500 mb-4">Os itens para conciliação estão sendo carregados.</p>
            <button
              onClick={() => startReconciliation(selectedReconciliation.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar processo
            </button>
          </div>
        )}
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Importar Extrato Bancário</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Selecione um arquivo de extrato bancário nos formatos OFX ou CSV para importar as transações automaticamente.
                </p>
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {uploading ? 'Processando...' : 'Clique para selecionar arquivo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: OFX, CSV
                    </p>
                    <input
                      type="file"
                      accept=".ofx,.csv"
                      onChange={handleImportStatement}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">💡 Dica</h4>
                <p className="text-xs text-blue-800">
                  Arquivos OFX são o formato padrão dos bancos. Para CSV, use o formato: Data, Descrição, Valor
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={uploading}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <RefreshCw className="w-8 h-8 mr-3 text-blue-600" />
              Conciliação Bancária
            </h1>
            <p className="text-gray-600 mt-2">Reconcilie seus extratos bancários com o sistema</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Conciliação
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nova Conciliação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta *
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>Selecione uma conta</option>
                  {accounts.filter(acc => acc.type === 'conta_bancaria').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Conciliação *
                </label>
                <input
                  type="date"
                  value={formData.reconciliation_date}
                  onChange={(e) => setFormData({ ...formData, reconciliation_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo do Extrato *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.statement_balance}
                  onChange={(e) => setFormData({ ...formData, statement_balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      account_id: 0,
                      reconciliation_date: new Date().toISOString().split('T')[0],
                      statement_balance: 0,
                      notes: '',
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

      {/* Lista de Conciliações */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Extrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Sistema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diferença
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reconciliations.map((reconciliation) => (
                <tr key={reconciliation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(reconciliation.reconciliation_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getAccountName(reconciliation.account_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(reconciliation.statement_balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(reconciliation.book_balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      reconciliation.difference === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(reconciliation.difference)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      reconciliation.status === 'conciliado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reconciliation.status === 'conciliado' ? 'Conciliado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReconciliation(reconciliation)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {reconciliation.status === 'conciliado' ? 'Visualizar' : 'Conciliar'}
                      </button>
                      {reconciliation.status === 'conciliado' && (
                        <button
                          onClick={() => handleDeleteReconciliation(reconciliation.id)}
                          className="text-red-600 hover:text-red-900 ml-2"
                          title="Excluir conciliação"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reconciliations.length === 0 && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conciliação encontrada</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira conciliação bancária</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar primeira conciliação
          </button>
        </div>
      )}
    </div>
  );
}
