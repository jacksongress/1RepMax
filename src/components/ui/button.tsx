import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default', 
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`${className} ${getVariantClasses(variant)} ${getSizeClasses(size)}`} 
      {...props}
    >
      {children}
    </button>
  );
}

function getVariantClasses(variant: string) {
  switch (variant) {
    case 'destructive':
      return 'bg-red-500 text-white hover:bg-red-600';
    case 'outline':
      return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
    default:
      return 'bg-blue-500 text-white hover:bg-blue-600';
  }
}

function getSizeClasses(size: string) {
  switch (size) {
    case 'sm':
      return 'px-2 py-1 text-sm';
    case 'lg':
      return 'px-4 py-2 text-lg';
    default:
      return 'px-3 py-1.5 text-base';
  }
}