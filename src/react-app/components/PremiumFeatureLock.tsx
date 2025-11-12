import { Lock, Sparkles } from 'lucide-react';
import UpgradeButton from './UpgradeButton';

interface PremiumFeatureLockProps {
  feature: string;
  description?: string;
  children?: React.ReactNode;
  showButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PremiumFeatureLock({ 
  feature, 
  description, 
  children, 
  showButton = true,
  size = 'md' 
}: PremiumFeatureLockProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8'
  };

  const iconSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const titleSize = {
    sm: 'text-lg',
    md: 'text-xl', 
    lg: 'text-2xl'
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-center ${sizeClasses[size]}`}>
      <div className="flex flex-col items-center">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-3 mb-4">
          <Lock className={`${iconSize[size]} text-white`} />
        </div>
        
        <h3 className={`font-bold text-gray-900 mb-2 ${titleSize[size]}`}>
          {feature} - Recurso Premium
        </h3>
        
        <p className={`text-gray-600 mb-4 max-w-md ${textSize[size]}`}>
          {description || `Faça upgrade para o plano Premium e desbloqueie ${feature.toLowerCase()} e muito mais!`}
        </p>
        
        {children && (
          <div className="mb-4 text-left w-full">
            {children}
          </div>
        )}
        
        {showButton && (
          <UpgradeButton 
            variant="primary"
            size={size === 'sm' ? 'sm' : 'md'}
          />
        )}
        
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <Sparkles className="w-3 h-3 mr-1" />
          <span>Acesso ilimitado + suporte prioritário</span>
        </div>
      </div>
    </div>
  );
}
