import { useState, useEffect } from 'react';
import { MessageCircle, FileText, DollarSign, Users, HelpCircle } from 'lucide-react';

export default function TalkToAccountant() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/company-settings');
        const data = await response.json();
        if (data.accountant_whatsapp) {
          setWhatsappNumber(data.accountant_whatsapp);
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      }
    };
    
    fetchSettings();
  }, []);
  
  const quickMessages = [
    {
      icon: FileText,
      title: 'Preciso da minha guia do DAS',
      message: 'Olá, preciso da minha guia do DAS deste mês',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: FileText,
      title: 'Enviei as notas fiscais',
      message: 'Olá, acabei de enviar as notas fiscais pelo app',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Users,
      title: 'Dúvida sobre folha de pagamento',
      message: 'Olá, tenho uma dúvida sobre a folha de pagamento',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: DollarSign,
      title: 'Erro no meu fluxo de caixa',
      message: 'Olá, identifiquei um erro no meu fluxo de caixa e preciso de ajuda',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: HelpCircle,
      title: 'Preciso de ajuda',
      message: 'Olá, preciso de ajuda com meu app FinançaFácil',
      color: 'bg-gray-100 text-gray-600',
    },
  ];

  const openWhatsApp = (message: string) => {
    if (!whatsappNumber) {
      alert('Número do contador não configurado. Por favor, configure nas Configurações.');
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="w-8 h-8 mr-3 text-green-600" />
          Falar com o Contador
        </h1>
        <p className="text-gray-600 mt-2">
          Entre em contato direto com seu escritório de contabilidade pelo WhatsApp
        </p>
      </div>

      {/* Main WhatsApp Button */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Abrir WhatsApp do Escritório
        </h2>
        <p className="text-green-100 mb-6">
          Tire suas dúvidas diretamente com seu contador
        </p>
        <button
          onClick={() => openWhatsApp('Olá, preciso de ajuda com meu app FinançaFácil')}
          disabled={!whatsappNumber}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center ${
            whatsappNumber 
              ? 'bg-white text-green-600 hover:bg-green-50' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          {whatsappNumber ? 'Iniciar Conversa' : 'Configurar Número'}
        </button>
      </div>

      {/* Quick Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mensagens Rápidas
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Clique em uma das opções abaixo para enviar uma mensagem pré-definida
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickMessages.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => openWhatsApp(item.message)}
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900 group-hover:text-green-600">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.message}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📞 Horário de Atendimento</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Segunda a Sexta: 8h às 18h</p>
            <p>Sábado: 9h às 12h</p>
            <p>Domingo: Fechado</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">⚡ Tempo de Resposta</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Mensagens urgentes: até 2h</p>
            <p>Consultas gerais: até 24h</p>
            <p>Relatórios: 2-3 dias úteis</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-3">💡 Dicas para um melhor atendimento</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Seja claro e específico sobre sua dúvida ou necessidade</li>
          <li>• Envie documentos e comprovantes diretamente pela aba "Enviar Documentos"</li>
          <li>• Para questões urgentes, mencione isso logo no início da mensagem</li>
          <li>• Mantenha seus dados financeiros atualizados no app para consultas mais precisas</li>
        </ul>
      </div>

      {/* Alternative Contact */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Você também pode entrar em contato por:</p>
        <p className="mt-2">
          📧 Email: contato@seuescritorio.com.br
          <br />
          📞 Telefone: (11) 9999-9999
        </p>
      </div>
    </div>
  );
}
