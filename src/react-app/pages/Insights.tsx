import { useState } from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Calendar, Sparkles, Loader2 } from 'lucide-react';

interface InsightData {
  period: string;
  insights: string;
  generated_at: string;
}

export default function Insights() {
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  });

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    
    return options;
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setInsights({
          period: selectedPeriod,
          insights: data.insights,
          generated_at: new Date().toISOString(),
        });
      } else {
        alert(data.error || 'Erro ao gerar insights. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      alert('Erro ao gerar insights. Verifique sua conexão e tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const parseInsights = (text: string) => {
    const sections = text.split('\n\n');
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      
      return (
        <div key={index} className="mb-6">
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            // Detectar títulos (linhas que terminam com :)
            if (trimmedLine.endsWith(':') || (trimmedLine.match(/^\d+\./) && !trimmedLine.includes('R$'))) {
              return (
                <h3 key={lineIndex} className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  {trimmedLine.includes('Pontos Positivos') || trimmedLine.includes('Destaques') ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : trimmedLine.includes('Atenção') || trimmedLine.includes('Alertas') ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  ) : trimmedLine.includes('Recomendações') || trimmedLine.includes('Sugestões') ? (
                    <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-cyan-600 mr-2" />
                  )}
                  {trimmedLine}
                </h3>
              );
            }
            
            // Detectar linhas de lista (começam com - ou •)
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
              const content = trimmedLine.substring(1).trim();
              
              return (
                <div key={lineIndex} className="flex items-start mb-2 ml-4">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700 leading-relaxed">{content}</p>
                </div>
              );
            }
            
            // Texto normal
            return (
              <p key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
                {trimmedLine}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Sparkles className="w-8 h-8 text-cyan-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Insights Financeiros com IA</h1>
        </div>
        <p className="text-gray-600 ml-11">
          Análise inteligente da sua movimentação financeira mensal
        </p>
      </div>

      {/* Seleção de Período e Geração */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Selecione o Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              disabled={generating}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100"
            >
              {generateMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateInsights}
            disabled={generating}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando Insights...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar Insights com IA
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <p className="text-sm text-cyan-800 flex items-start">
            <Lightbulb className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              A IA analisará suas transações, receitas, despesas e contas do período selecionado para gerar 
              insights personalizados sobre a saúde financeira do seu negócio.
            </span>
          </p>
        </div>
      </div>

      {/* Insights Gerados */}
      {insights ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Análise de {new Date(insights.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date(insights.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).slice(1)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Gerado em {new Date(insights.generated_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="prose prose-cyan max-w-none">
            {parseInsights(insights.insights)}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={generateInsights}
              disabled={generating}
              className="text-cyan-600 hover:text-cyan-700 font-medium flex items-center disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Novos Insights
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum insight gerado ainda
            </h3>
            <p className="text-gray-500 mb-6">
              Selecione um período e clique em "Gerar Insights com IA" para obter uma análise 
              completa da sua movimentação financeira.
            </p>
            <div className="grid grid-cols-1 gap-3 text-left bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Análise de receitas e despesas</span>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Identificação de pontos de atenção</span>
              </div>
              <div className="flex items-start">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Recomendações personalizadas</span>
              </div>
              <div className="flex items-start">
                <Sparkles className="w-5 h-5 text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">Insights estratégicos com IA</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
