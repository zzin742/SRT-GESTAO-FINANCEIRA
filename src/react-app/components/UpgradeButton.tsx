import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface UpgradeButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UpgradeButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '' 
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (loading) return;
    
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = 'inline-flex items-center font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl',
    secondary: 'bg-white text-blue-600 border-2 border-blue-600 shadow-md hover:bg-blue-50',
    minimal: 'text-blue-600 hover:text-blue-700 underline'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin w-4 h-4 mr-2 border-2 border-transparent border-t-current rounded-full"></div>
          Processando...
        </>
      ) : (
        <>
          {variant !== 'minimal' && <Sparkles className="w-4 h-4 mr-2" />}
          Fazer Upgrade - R$ 50/mês
        </>
      )}
    </button>
  );
}
