interface SrtLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function SrtLogo({ className = '', size = 'md', showText = true }: SrtLogoProps) {
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
      {/* Logo Symbol */}
      <div className={`bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 relative ${sizeClasses[size]}`}>
        {/* Dollar symbol */}
        <span className={`font-bold text-black ${textSizeClasses[size]}`}>$</span>
        {/* Circular arrows - simplified version */}
        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400 opacity-60"></div>
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-cyan-400 rotate-45"></div>
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-cyan-400 rotate-45"></div>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className={`font-bold text-black ${textSizeClasses[size]}`}>SRT</span>
          </div>
          <span className="text-xs text-gray-600 font-medium tracking-wide">GESTÃO FINANCEIRA</span>
        </div>
      )}
    </div>
  );
}
