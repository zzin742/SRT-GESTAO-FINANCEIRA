import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SimpleUpgradeButtonProps {
  className?: string;
}

export default function SimpleUpgradeButton({ className = '' }: SimpleUpgradeButtonProps) {
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

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={`inline-flex items-center font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl px-4 py-2 text-base rounded-lg ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin w-4 h-4 mr-2 border-2 border-transparent border-t-current rounded-full"></div>
          Processando...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade para Premium
        </>
      )}
    </button>
  );
}
