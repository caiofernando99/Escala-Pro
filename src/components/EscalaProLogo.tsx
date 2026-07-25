import React from 'react';

interface EscalaProLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'auto';
}

export const EscalaProLogo: React.FC<EscalaProLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'auto',
}) => {
  const textSize = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  const baseTextColor =
    variant === 'dark'
      ? 'text-white'
      : variant === 'light'
      ? 'text-[var(--ink)]'
      : 'text-white dark:text-white';

  return (
    <div className={`flex items-center ${className}`}>
      <h1 className={`font-black ${textSize} tracking-tight ${baseTextColor} leading-none`}>
        Escala<span className="text-blue-400">Pro</span>
      </h1>
    </div>
  );
};

