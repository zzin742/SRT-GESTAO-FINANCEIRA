import { Link } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Users, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import SrtLogo from '@/react-app/components/SrtLogo';

export default function HomePage() {
  const { user, redirectToLogin } = useAuth();

  const features = [
    {
      icon: TrendingUp,
      title: 'Controle de Receitas e Despesas',
      description: 'Gerencie todas as entradas e saídas financeiras da sua empresa.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Gerenciais',
      description: 'Relatórios completos para análise financeira e tomada de decisões.'
    },
    {
      icon: TrendingUp,
      title: 'Fluxo de Caixa',
      description: 'Acompanhe o movimento de dinheiro e projete cenários futuros.'
    },
    {
      icon: Shield,
      title: 'Conformidade Fiscal',
      description: 'Mantenha suas finanças organizadas para obrigações tributárias.'
    },
    {
      icon: Clock,
      title: 'Controle de Vencimentos',
      description: 'Nunca mais perca prazos de pagamentos importantes.'
    },
    {
      icon: Users,
      title: 'Suporte Especializado',
      description: 'Equipe pronta para ajudar com suas questões financeiras.'
    }
  ];

  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      description: 'Perfeito para começar',
      features: [
        'Até 200 transações/mês',
        'Relatórios básicos',
        'Suporte por email',
        '1 usuário'
      ],
      popular: false
    },
    {
      name: 'Premium',
      price: 'R$ 50',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        'Transações ilimitadas',
        'Todos os relatórios',
        'Suporte prioritário',
        'Usuários ilimitados',
        'Backup automático',
        'API de integração'
      ],
      popular: true
    }
  ];

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <SrtLogo size="xl" className="justify-center" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bem-vindo de volta!
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Continue gerenciando suas finanças empresariais de forma inteligente.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Acessar Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-gray-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <SrtLogo size="md" />
          
          <button
            onClick={() => redirectToLogin()}
            className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            Entrar com Google
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-600">
              Já ajudamos mais de 10.000+ empresas
            </span>
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Gestão financeira
            <br />
            <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
              inteligente
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Sistema completo para gestão financeira empresarial.
            <br />
            Controle total de receitas, despesas e fluxo de caixa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => redirectToLogin()}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Começar Gratuitamente
            </button>
          </div>

          {/* Demo Image Placeholder */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Dashboard Financeiro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tudo para sua gestão financeira
          </h2>
          <p className="text-xl text-gray-600">
            Ferramentas completas para controlar suas finanças empresariais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Por que escolher a SRT?
              </h2>
              
              <div className="space-y-4">
                {[
                  'Interface intuitiva e fácil de usar',
                  'Máxima segurança de dados financeiros',
                  'Relatórios gerenciais completos',
                  'Suporte técnico qualificado',
                  'Integração com escritórios contábeis',
                  'Controle total das finanças empresariais'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-gray-50 rounded-2xl p-8">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Otimize sua gestão
                </h3>
                <p className="text-gray-600">
                  Utilize nossa plataforma para ter controle completo das finanças da sua empresa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planos que cabem no seu bolso
          </h2>
          <p className="text-xl text-gray-600">
            Escolha o plano ideal para o tamanho da sua empresa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl border-2 p-8 ${
                plan.popular 
                  ? 'border-cyan-500 shadow-lg scale-105' 
                  : 'border-gray-200 shadow'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => redirectToLogin()}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Começar Agora
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cyan-500 to-cyan-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que já organizam suas finanças conosco.
          </p>
          
          <button
            onClick={() => redirectToLogin()}
            className="bg-white text-cyan-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Começar Gratuitamente
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <SrtLogo size="sm" />
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2024 SRT - Gestão Financeira. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
