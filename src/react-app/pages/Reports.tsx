import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PremiumFeatureLock from '@/react-app/components/PremiumFeatureLock';

interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  result: number;
  incomeByCategory: Array<{ category: string; amount: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
}

interface BalanceData {
  period: string;
  assets: Array<{ code: string; name: string; balance: number }>;
  liabilities: Array<{ code: string; name: string; balance: number }>;
  equity: Array<{ code: string; name: string; balance: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchReportData();
    fetchUserPlan();
  }, [selectedPeriod]);

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/users/me');
      const data = await response.json();
      setUserPlan(data.company?.plan || 'free');
    } catch (error) {
      console.error('Erro ao buscar plano do usuário:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedPeriod.split('-');
      const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthEnd = new Date(parseInt(year), parseInt(month), 0);
      
      // Buscar transações do período
      const transactionsResponse = await fetch('/api/transactions');
      const allTransactions = await transactionsResponse.json();
      
      // Filtrar transações do período selecionado e confirmadas
      const periodTransactions = allTransactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= monthStart && 
               transactionDate <= monthEnd && 
               transaction.status === 'confirmado';
      });
      
      // Calcular receitas
      const incomeTransactions = periodTransactions.filter((t: any) => t.type === 'receita');
      const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + t.value, 0);
      
      // Calcular despesas
      const expenseTransactions = periodTransactions.filter((t: any) => t.type === 'despesa');
      const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + t.value, 0);
      
      // Agrupar receitas por conta contábil
      const incomeByCategory: { [key: string]: number } = {};
      incomeTransactions.forEach((t: any) => {
        // Priorizar conta do plano de contas, depois categoria como fallback
        const category = t.chart_account_name || t.category_name || 'Outros - Receitas não categorizadas';
        incomeByCategory[category] = (incomeByCategory[category] || 0) + t.value;
      });
      
      // Agrupar despesas por conta contábil
      const expensesByCategory: { [key: string]: number } = {};
      expenseTransactions.forEach((t: any) => {
        // Priorizar conta do plano de contas, depois categoria como fallback
        const category = t.chart_account_name || t.category_name || 'Outros - Despesas não categorizadas';
        expensesByCategory[category] = (expensesByCategory[category] || 0) + t.value;
      });
      
      const reportData: ReportData = {
        period: monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        totalIncome,
        totalExpenses,
        result: totalIncome - totalExpenses,
        incomeByCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({ category, amount })),
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount })),
      };
      
      setReportData(reportData);

      // Buscar dados do balancete se for premium
      if (userPlan === 'premium') {
        await fetchBalanceData(monthStart, monthEnd);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceData = async (monthStart: Date, monthEnd: Date) => {
    try {
      // Buscar plano de contas
      const chartResponse = await fetch('/api/chart-accounts');
      const chartAccounts = await chartResponse.json();

      // Buscar transações até o fim do período para calcular saldos
      const transactionsResponse = await fetch('/api/transactions');
      const allTransactions = await transactionsResponse.json();

      const periodTransactions = allTransactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate <= monthEnd && transaction.status === 'confirmado';
      });

      // Calcular saldos por conta contábil
      const accountBalances: { [key: string]: { code: string; name: string; type: string; balance: number } } = {};

      // Inicializar todas as contas com saldo zero
      chartAccounts.forEach((account: any) => {
        accountBalances[account.id] = {
          code: account.code,
          name: account.name,
          type: account.type,
          balance: 0
        };
      });

      // Somar transações por conta contábil
      periodTransactions.forEach((transaction: any) => {
        if (transaction.chart_account_id && accountBalances[transaction.chart_account_id]) {
          const account = accountBalances[transaction.chart_account_id];
          
          // Ativos e Despesas: débito aumenta (positivo), crédito diminui (negativo)
          // Passivos, Patrimônio e Receitas: crédito aumenta (positivo), débito diminui (negativo)
          if (account.type === 'ativo' || account.type === 'despesa' || account.type === 'custos') {
            if (transaction.type === 'despesa') {
              account.balance += transaction.value; // Débito
            } else {
              account.balance -= transaction.value; // Crédito
            }
          } else { // passivo, patrimonio, receita
            if (transaction.type === 'receita') {
              account.balance += transaction.value; // Crédito
            } else {
              account.balance -= transaction.value; // Débito
            }
          }
        }
      });

      // Separar por tipo
      const assets = Object.values(accountBalances)
        .filter(acc => acc.type === 'ativo' && acc.balance !== 0);
      const liabilities = Object.values(accountBalances)
        .filter(acc => acc.type === 'passivo' && acc.balance !== 0);
      const equity = Object.values(accountBalances)
        .filter(acc => acc.type === 'patrimonio' && acc.balance !== 0);

      const totalAssets = assets.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
      const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
      const totalEquity = equity.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

      const balanceData: BalanceData = {
        period: monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity
      };

      setBalanceData(balanceData);
    } catch (error) {
      console.error('Erro ao buscar dados do balancete:', error);
      setBalanceData(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    
    return options;
  };

  const generateReport = async (type: string) => {
    if (userPlan === 'free' && type !== 'dre') {
      alert('Este relatório está disponível apenas no plano Premium. Faça upgrade para acessar.');
      return;
    }
    
    setLoading(true);
    
    try {
      if (type === 'dre') {
        exportDREToPDF();
      } else if (type === 'balance') {
        await exportBalanceToPDF();
      } else if (type === 'cash-flow') {
        await exportCashFlowToPDF();
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportDREToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório Financeiro - SRT Gestão Financeira', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.period}`, 20, 35);
    
    // DRE Simplificada
    const dreData = [
      ['Item', 'Valor (R$)'],
      ['Receita Operacional Bruta', formatCurrency(reportData.totalIncome)],
      ['(-) Despesas Operacionais', formatCurrency(reportData.totalExpenses)],
      ['= Resultado Operacional', formatCurrency(reportData.result)],
    ];

    autoTable(doc, {
      head: [dreData[0]],
      body: dreData.slice(1),
      startY: 50,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Receitas por Categoria
    let finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(14);
    doc.text('Receitas por Conta Contábil', 20, finalY);
    
    if (reportData.incomeByCategory.length > 0) {
      const receitasData = reportData.incomeByCategory.map(item => [
        item.category,
        formatCurrency(item.amount)
      ]);

      autoTable(doc, {
        head: [['Conta Contábil', 'Valor (R$)']],
        body: receitasData,
        startY: finalY + 10,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
      });

      finalY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Despesas por Conta Contábil
    doc.text('Despesas por Conta Contábil', 20, finalY);
    
    if (reportData.expensesByCategory.length > 0) {
      const despesasData = reportData.expensesByCategory.map(item => [
        item.category,
        formatCurrency(item.amount)
      ]);

      autoTable(doc, {
        head: [['Conta Contábil', 'Valor (R$)']],
        body: despesasData,
        startY: finalY + 10,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    // Salvar o PDF
    doc.save(`dre-${selectedPeriod}.pdf`);
  };

  const exportCashFlowToPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Fluxo de Caixa - SRT Gestão Financeira', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.period}`, 20, 35);
    
    // Buscar projeções de fluxo de caixa
    try {
      const response = await fetch('/api/cash-flow-projections');
      const projections = await response.json();
      
      // Filtrar por período se necessário
      const [year, month] = selectedPeriod.split('-');
      const periodProjections = projections.filter((proj: any) => {
        const projDate = new Date(proj.date);
        return projDate.getFullYear() === parseInt(year) && 
               projDate.getMonth() + 1 === parseInt(month);
      });
      
      // Dados do fluxo de caixa
      const cashFlowData = [
        ['Descrição', 'Tipo', 'Valor Projetado (R$)', 'Valor Real (R$)', 'Data'],
        ...periodProjections.map((proj: any) => [
          proj.description,
          proj.type === 'entrada' ? 'Entrada' : 'Saída',
          formatCurrency(proj.projected_value),
          proj.actual_value ? formatCurrency(proj.actual_value) : 'N/A',
          new Date(proj.date).toLocaleDateString('pt-BR')
        ])
      ];

      if (periodProjections.length === 0) {
        cashFlowData.push(['Nenhuma projeção encontrada para este período', '', '', '', '']);
      }

      autoTable(doc, {
        head: [cashFlowData[0]],
        body: cashFlowData.slice(1),
        startY: 50,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
      });
      
      // Adicionar resumo
      let finalY = (doc as any).lastAutoTable.finalY + 20;
      
      const totalEntradas = periodProjections
        .filter((proj: any) => proj.type === 'entrada')
        .reduce((sum: number, proj: any) => sum + proj.projected_value, 0);
        
      const totalSaidas = periodProjections
        .filter((proj: any) => proj.type === 'saida')
        .reduce((sum: number, proj: any) => sum + proj.projected_value, 0);
      
      doc.setFontSize(14);
      doc.text('Resumo do Período', 20, finalY);
      
      const resumoData = [
        ['Item', 'Valor (R$)'],
        ['Total de Entradas Projetadas', formatCurrency(totalEntradas)],
        ['Total de Saídas Projetadas', formatCurrency(totalSaidas)],
        ['Saldo Projetado', formatCurrency(totalEntradas - totalSaidas)],
      ];

      autoTable(doc, {
        head: [resumoData[0]],
        body: resumoData.slice(1),
        startY: finalY + 10,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
    } catch (error) {
      console.error('Erro ao buscar projeções:', error);
      
      // Criar relatório básico mesmo sem projeções
      doc.setFontSize(14);
      doc.text('Fluxo de Caixa Realizado', 20, 50);
      
      const basicData = [
        ['Item', 'Valor (R$)'],
        ['Receitas do Período', formatCurrency(reportData.totalIncome)],
        ['Despesas do Período', formatCurrency(reportData.totalExpenses)],
        ['Saldo do Período', formatCurrency(reportData.result)],
      ];

      autoTable(doc, {
        head: [basicData[0]],
        body: basicData.slice(1),
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Salvar o PDF
    doc.save(`fluxo-caixa-${selectedPeriod}.pdf`);
  };

  const exportBalanceToPDF = async () => {
    if (!balanceData) {
      // Tentar buscar os dados do balancete se não existirem
      const [year, month] = selectedPeriod.split('-');
      const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthEnd = new Date(parseInt(year), parseInt(month), 0);
      await fetchBalanceData(monthStart, monthEnd);
      
      if (!balanceData) {
        alert('Não foi possível gerar o balancete. Verifique se há transações cadastradas.');
        return;
      }
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Balancete de Verificação - SRT Gestão Financeira', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${balanceData.period}`, 20, 35);
    
    let currentY = 50;

    // ATIVO
    if (balanceData.assets.length > 0) {
      doc.setFontSize(14);
      doc.text('ATIVO', 20, currentY);
      
      const assetsData = balanceData.assets.map(item => [
        item.code,
        item.name,
        formatCurrency(Math.abs(item.balance))
      ]);

      autoTable(doc, {
        head: [['Código', 'Conta', 'Saldo (R$)']],
        body: assetsData,
        startY: currentY + 5,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // PASSIVO
    if (balanceData.liabilities.length > 0) {
      doc.setFontSize(14);
      doc.text('PASSIVO', 20, currentY);
      
      const liabilitiesData = balanceData.liabilities.map(item => [
        item.code,
        item.name,
        formatCurrency(Math.abs(item.balance))
      ]);

      autoTable(doc, {
        head: [['Código', 'Conta', 'Saldo (R$)']],
        body: liabilitiesData,
        startY: currentY + 5,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // PATRIMÔNIO LÍQUIDO
    if (balanceData.equity.length > 0) {
      doc.setFontSize(14);
      doc.text('PATRIMÔNIO LÍQUIDO', 20, currentY);
      
      const equityData = balanceData.equity.map(item => [
        item.code,
        item.name,
        formatCurrency(Math.abs(item.balance))
      ]);

      autoTable(doc, {
        head: [['Código', 'Conta', 'Saldo (R$)']],
        body: equityData,
        startY: currentY + 5,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Totals
    const totalsData = [
      ['TOTAL DO ATIVO', formatCurrency(balanceData.totalAssets)],
      ['TOTAL DO PASSIVO', formatCurrency(balanceData.totalLiabilities)],
      ['TOTAL DO PATRIMÔNIO LÍQUIDO', formatCurrency(balanceData.totalEquity)]
    ];

    autoTable(doc, {
      head: [['Descrição', 'Valor (R$)']],
      body: totalsData,
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [75, 85, 99] },
      bodyStyles: { fontStyle: 'bold' }
    });

    // Salvar o PDF
    doc.save(`balancete-${selectedPeriod}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise financeira da sua empresa</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {generateMonthOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button 
            onClick={() => generateReport('dre')}
            disabled={!reportData || loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Gerando...' : 'Exportar DRE'}
          </button>
        </div>
      </div>

      {/* Relatórios Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {userPlan === 'free' && (
          <div className="md:col-span-2 lg:col-span-3 mb-6">
            <PremiumFeatureLock
              feature="Relatórios Avançados"
              description="No plano gratuito você tem acesso apenas ao DRE básico. Faça upgrade para relatórios completos e personalizados."
              size="sm"
            />
          </div>
        )}

        {[
          {
            title: 'DRE - Demonstrativo de Resultado',
            description: 'Relatório completo de receitas e despesas',
            icon: FileText,
            color: 'blue',
            action: () => generateReport('dre'),
            free: true
          },
          {
            title: 'Balancete de Verificação',
            description: 'Resumo das contas contábeis com saldos',
            icon: BarChart3,
            color: 'purple',
            action: () => generateReport('balance'),
            free: false
          },
          {
            title: 'Fluxo de Caixa',
            description: 'Análise detalhada do fluxo de caixa',
            icon: TrendingUp,
            color: 'green',
            action: () => generateReport('cash-flow'),
            free: false
          },
        ].map((report, index) => {
          const Icon = report.icon;
          const isBlocked = userPlan === 'free' && !report.free;
          
          return (
            <div key={index} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isBlocked ? 'opacity-50' : ''}`}>
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  report.color === 'blue' ? 'bg-blue-100' : 
                  report.color === 'purple' ? 'bg-purple-100' : 
                  'bg-green-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    report.color === 'blue' ? 'text-blue-600' :
                    report.color === 'purple' ? 'text-purple-600' :
                    'text-green-600'
                  }`} />
                </div>
                {isBlocked && (
                  <div className="ml-auto">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Premium</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {report.title}
              </h3>
              
              <p className="text-gray-600 mb-4 text-sm">
                {report.description}
              </p>
              
              <button
                onClick={isBlocked ? undefined : report.action}
                disabled={loading || isBlocked}
                className={`w-full py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center ${
                  isBlocked 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : report.color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      report.color === 'purple' ? 'bg-purple-600 text-white hover:bg-purple-700' :
                      'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading && !isBlocked ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {isBlocked ? 'Apenas Premium' : 'Gerar Relatório'}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {!reportData ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sem dados para o período</h3>
          <p className="text-gray-500">Registre algumas transações para visualizar os relatórios.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* DRE Simplificada */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                DRE Simplificada - {reportData.period}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Receitas */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-semibold text-gray-900">Receita Operacional Bruta</span>
                  </div>
                  <span className="font-bold text-green-600 text-lg">
                    {formatCurrency(reportData.totalIncome)}
                  </span>
                </div>

                {/* Despesas */}
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <TrendingDown className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-semibold text-gray-900">(-) Despesas Operacionais</span>
                  </div>
                  <span className="font-bold text-red-600 text-lg">
                    {formatCurrency(reportData.totalExpenses)}
                  </span>
                </div>

                {/* Resultado */}
                <div className={`flex items-center justify-between py-4 px-4 rounded-lg ${
                  reportData.result >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <span className="font-bold text-gray-900 text-lg">
                    = Resultado Operacional do Período
                  </span>
                  <span className={`font-bold text-xl ${
                    reportData.result >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(reportData.result)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhamento por Categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas por Conta Contábil */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Receitas por Conta Contábil</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {reportData.incomeByCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700">{item.category}</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Despesas por Conta Contábil */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Despesas por Conta Contábil</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {reportData.expensesByCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700">{item.category}</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Margem Operacional</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (reportData.result / reportData.totalIncome * 100) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportData.totalIncome > 0 
                    ? `${((reportData.result / reportData.totalIncome) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Ticket Médio Receitas</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.incomeByCategory.length > 0
                    ? formatCurrency(reportData.totalIncome / reportData.incomeByCategory.length)
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Maior Despesa</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {reportData.expensesByCategory.length > 0
                    ? formatCurrency(Math.max(...reportData.expensesByCategory.map(e => e.amount)))
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
