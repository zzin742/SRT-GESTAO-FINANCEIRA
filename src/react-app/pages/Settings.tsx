import { useState, useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { Link } from 'react-router';
import { 
  Building2, 
  User, 
  CreditCard, 
  Shield, 
  MessageSquare, 
  Phone,
  Edit3,
  Check,
  X,
  Smartphone
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [editingWhatsApp, setEditingWhatsApp] = useState(false);
  const [editingAccountantWhatsApp, setEditingAccountantWhatsApp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [accountantWhatsApp, setAccountantWhatsApp] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/me');
        const data = await response.json();
        setUserData(data);
        
        // Buscar configurações da empresa
        const settingsResponse = await fetch('/api/company-settings');
        const settingsData = await settingsResponse.json();
        setCompanySettings(settingsData);
        setWhatsappNumber(settingsData?.whatsapp_number || '');
        setAccountantWhatsApp(settingsData?.accountant_whatsapp || '');
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const saveWhatsAppNumber = async () => {
    try {
      await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp_number: whatsappNumber,
        }),
      });
      setEditingWhatsApp(false);
      setCompanySettings({ ...companySettings, whatsapp_number: whatsappNumber });
    } catch (error) {
      console.error('Erro ao salvar número do WhatsApp:', error);
    }
  };

  const saveAccountantWhatsApp = async () => {
    try {
      await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountant_whatsapp: accountantWhatsApp,
        }),
      });
      setEditingAccountantWhatsApp(false);
      setCompanySettings({ ...companySettings, accountant_whatsapp: accountantWhatsApp });
    } catch (error) {
      console.error('Erro ao salvar WhatsApp do contador:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/upgrade-to-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        alert('Upgrade realizado com sucesso! Atualize a página para ver as funcionalidades premium.');
        window.location.reload();
      } else {
        throw new Error('Erro ao fazer upgrade');
      }
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      alert('Erro ao fazer upgrade. Tente novamente.');
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (55) 11 9999-9999
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 9) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie sua conta, empresa e configurações</p>
      </div>

      <div className="space-y-6">
        {/* WhatsApp Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Configurações do WhatsApp</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* WhatsApp da Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    WhatsApp da sua Empresa
                  </div>
                </label>
                <div className="flex items-center space-x-2">
                  {editingWhatsApp ? (
                    <>
                      <input
                        type="text"
                        value={formatPhoneNumber(whatsappNumber)}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 5511999999999"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={saveWhatsAppNumber}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingWhatsApp(false);
                          setWhatsappNumber(companySettings?.whatsapp_number || '');
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formatPhoneNumber(whatsappNumber) || 'Não configurado'}
                        disabled
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                      />
                      <button
                        onClick={() => setEditingWhatsApp(true)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Este número será usado para clientes entrarem em contato com você
                </p>
              </div>

              {/* WhatsApp do Contador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    WhatsApp do seu Contador
                  </div>
                </label>
                <div className="flex items-center space-x-2">
                  {editingAccountantWhatsApp ? (
                    <>
                      <input
                        type="text"
                        value={formatPhoneNumber(accountantWhatsApp)}
                        onChange={(e) => setAccountantWhatsApp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 5511999999999"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={saveAccountantWhatsApp}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAccountantWhatsApp(false);
                          setAccountantWhatsApp(companySettings?.accountant_whatsapp || '');
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formatPhoneNumber(accountantWhatsApp)}
                        disabled
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                      />
                      <button
                        onClick={() => setEditingAccountantWhatsApp(true)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Usado na funcionalidade "Falar com Contador"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Dados da Empresa</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={userData?.company?.name || ''}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={userData?.company?.cnpj || 'Não informado'}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Plano Atual</p>
                  <p className="text-lg font-semibold">
                    {userData?.company?.plan === 'premium' ? (
                      <span className="text-blue-600">Premium</span>
                    ) : (
                      <span className="text-gray-600">Gratuito</span>
                    )}
                  </p>
                  {userData?.company?.plan === 'premium' && (
                    <p className="text-sm text-gray-500">
                      Plano ativo
                    </p>
                  )}
                </div>
                
                {userData?.company?.plan !== 'premium' && (
                  <button 
                    onClick={handleUpgrade}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Fazer Upgrade
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dados do Usuário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={userData?.appUser?.name || user?.google_user_data?.name || ''}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Função</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userData?.appUser?.role === 'admin' ? 'Administrador' : userData?.appUser?.role}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">Cadastrado em</p>
                  <p className="text-sm text-gray-900">
                    {userData?.appUser?.created_at 
                      ? new Date(userData.appUser.created_at).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Planos e Cobrança */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Planos e Cobrança</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Plano Gratuito */}
              <div className={`border rounded-xl p-6 ${
                userData?.company?.plan === 'free' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Gratuito</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    R$ 0<span className="text-lg text-gray-500">/mês</span>
                  </p>
                  
                  <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
                    <li>✓ 1 conta bancária</li>
                    <li>✓ 200 lançamentos/mês</li>
                    <li>✓ Relatórios básicos em PDF</li>
                    <li>✓ Alertas de vencimento</li>
                  </ul>
                  
                  {userData?.company?.plan === 'free' && (
                    <div className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                      Plano Atual
                    </div>
                  )}
                </div>
              </div>

              {/* Plano Premium */}
              <div className={`border rounded-xl p-6 ${
                userData?.company?.plan === 'premium' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Premium</h4>
                  <p className="text-3xl font-bold text-gray-900 mb-4">
                    R$ 50<span className="text-lg text-gray-500">/mês</span>
                  </p>
                  
                  <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
                    <li>✓ Contas ilimitadas</li>
                    <li>✓ Lançamentos ilimitados</li>
                    <li>✓ Projeções de fluxo de caixa</li>
                    <li>✓ Portal do contador</li>
                    <li>✓ Suporte prioritário</li>
                    <li>✓ Backup automático</li>
                    <li>✓ Relatórios avançados</li>
                  </ul>
                  
                  {userData?.company?.plan === 'premium' ? (
                    <div className="space-y-2">
                      <div className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                        Plano Atual
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          Plano Premium ativo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={handleUpgrade}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full"
                    >
                      Assinar Premium
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Autenticação Google</p>
                  <p className="text-sm text-gray-600">Login seguro com sua conta Google</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  Ativo
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Isolamento de Dados</p>
                  <p className="text-sm text-gray-600">Seus dados são protegidos e isolados por empresa</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  Protegido
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Conexão Segura</p>
                  <p className="text-sm text-gray-600">Todas as comunicações são criptografadas</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  SSL/TLS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suporte e Contato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Precisa de Ajuda?</h3>
            <p className="text-gray-600 mb-4">
              Entre em contato com seu contador ou nossa equipe de suporte para esclarecer dúvidas.
            </p>
            <div className="space-y-3">
              <Link
                to="/app/falar-contador"
                className="block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
              >
                Falar com Meu Contador
              </Link>
              <button className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Suporte Técnico
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
