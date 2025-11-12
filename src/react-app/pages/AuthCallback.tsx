import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        
        // Verificar se precisa de onboarding
        const response = await fetch('/api/users/me');
        const userData = await response.json();
        
        if (userData.needsOnboarding) {
          navigate('/onboarding');
        } else {
          navigate('/app');
        }
      } catch (error) {
        console.error('Erro no callback de autenticação:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-red-600 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Finalizando login...</h2>
        <p className="text-gray-600">Aguarde enquanto configuramos sua conta.</p>
      </div>
    </div>
  );
}
