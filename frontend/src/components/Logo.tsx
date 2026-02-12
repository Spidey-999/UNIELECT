import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Background circle with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-full">
        {/* Decorative rings */}
        <div className="absolute inset-2 bg-white/20 rounded-full"></div>
        <div className="absolute inset-4 bg-white/10 rounded-full"></div>
        
        {/* UNI text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold tracking-wider">
            UNI
          </span>
        </div>
        
        {/* Small accent dot */}
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"></div>
      </div>
    </div>
  );
};

export default Logo;
