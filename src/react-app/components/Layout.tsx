import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useEffect, useState } from 'react';
import { 
  Home, 
  ArrowUpDown, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu,
  X,
  TreePine,
  RefreshCw,
  TrendingUp,
  Package,
  MessageCircle,
  Building2,
  Lightbulb
} from 'lucide-react';
import SrtLogo from './SrtLogo';
import NotificationSystem from '@/react-app/components/NotificationSystem';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/me');
        const data = await response.json();
        
        if (data.needsOnboarding) {
          navigate('/onboarding');
          return;
        }
        
        setUserData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        navigate('/');
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/app', icon: Home, label: 'Dashboard' },
    { path: '/app/transacoes', icon: ArrowUpDown, label: 'Transações' },
    { path: '/app/contas', icon: CreditCard, label: 'Contas' },
    { path: '/app/plano-contas', icon: TreePine, label: 'Plano de Contas' },
    { path: '/app/centros-custo', icon: Building2, label: 'Centros de Custo' },
    { path: '/app/produtos-servicos', icon: Package, label: 'Produtos/Serviços' },
    { path: '/app/fluxo-caixa', icon: TrendingUp, label: 'Fluxo de Caixa' },
    { path: '/app/conciliacao', icon: RefreshCw, label: 'Conciliação' },
    
    { path: '/app/relatorios', icon: BarChart3, label: 'Relatórios' },
    { path: '/app/insights', icon: Lightbulb, label: 'Insights com IA' },
    
    { path: '/app/falar-contador', icon: MessageCircle, label: 'Falar com Contador' },
    { path: '/app/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-cyan-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center px-4 py-6 border-b border-gray-200">
            <SrtLogo size="md" />
          </div>

          {/* Company Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{userData.company?.name}</p>
            <p className="text-xs text-gray-500">{userData.appUser?.name}</p>
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                userData.company?.plan === 'premium' 
                  ? 'bg-cyan-100 text-cyan-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {userData.company?.plan === 'premium' ? 'Premium' : 'Gratuito'}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Menu */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Notificações</span>
              <NotificationSystem />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200 flex-shrink-0">
              <SrtLogo size="md" />
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
              <p className="text-sm font-medium text-gray-900">{userData.company?.name}</p>
              <p className="text-xs text-gray-500">{userData.appUser?.name}</p>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  userData.company?.plan === 'premium' 
                    ? 'bg-cyan-100 text-cyan-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userData.company?.plan === 'premium' ? 'Premium' : 'Gratuito'}
                </span>
              </div>
            </div>

            <nav className="flex-1 px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              <div className="space-y-2 pb-4">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-cyan-50 text-cyan-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="px-4 py-4 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col w-0 flex-1">
        {/* Top Bar Mobile */}
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <SrtLogo size="sm" />
          <NotificationSystem />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
