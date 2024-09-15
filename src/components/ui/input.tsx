import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`border border-gray-300 rounded-md px-3 py-2 ${className}`}
      {...props}
    />
  );
}