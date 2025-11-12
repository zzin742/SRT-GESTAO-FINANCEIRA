interface ApiceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function ApiceLogo({ className = '', size = 'md', showText = true }: ApiceLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
    xl: 'w-12 h-12 text-xl'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Square */}
      <div className={`bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0 ${sizeClasses[size]}`}>
        <span className={`font-bold text-white ${textSizeClasses[size]}`}>A</span>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className={`font-bold text-black ${textSizeClasses[size]}`}>PICE</span>
          </div>
          <span className="text-xs text-gray-600 font-medium tracking-wide">BUSINESS INTELLIGENCE</span>
        </div>
      )}
    </div>
  );
}
