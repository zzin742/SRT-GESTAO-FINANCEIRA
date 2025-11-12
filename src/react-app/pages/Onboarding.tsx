import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { Building2, CreditCard, Tag, ChevronRight } from 'lucide-react';
import SrtLogo from '@/react-app/components/SrtLogo';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: {
            name: formData.companyName,
            cnpj: formData.cnpj || undefined,
          },
        }),
      });

      if (response.ok) {
        navigate('/app');
      } else {
        throw new Error('Erro ao criar empresa');
      }
    } catch (error) {
      console.error('Erro no onboarding:', error);
      alert('Erro ao configurar sua conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Dados da Empresa',
      description: 'Vamos começar com as informações básicas da sua empresa',
      icon: Building2,
    },
    {
      number: 2,
      title: 'Contas Configuradas',
      description: 'Sua conta principal foi criada automaticamente',
      icon: CreditCard,
    },
    {
      number: 3,
      title: 'Categorias Criadas',
      description: 'Categorias padrão foram adicionadas ao seu sistema',
      icon: Tag,
    },
  ];

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conta Principal Criada!</h2>
          <p className="text-gray-600 mb-6">
            Criamos uma conta "Caixa Principal" para você começar a registrar suas transações.
          </p>
          <button
            onClick={() => setStep(3)}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tag className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Categorias Configuradas!</h2>
          <p className="text-gray-600 mb-4">
            Adicionamos as principais categorias para facilitar sua organização:
          </p>
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">✓ Vendas</span>
                <span className="text-green-600">✓ Serviços</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">✓ Aluguel</span>
                <span className="text-red-600">✓ Folha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">✓ Impostos</span>
                <span className="text-red-600">✓ Marketing</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Finalizando...' : 'Ir para o Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s.number 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {s.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > s.number ? 'bg-cyan-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <SrtLogo size="lg" className="justify-center" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo à SRT!</h2>
          <p className="text-gray-600">
            Vamos configurar sua empresa em poucos passos simples.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ex: Minha Empresa Ltda"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ (opcional)
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!formData.companyName.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Usuário logado: {user?.email}
        </p>
      </div>
    </div>
  );
}
