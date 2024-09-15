import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-4 py-5 border-b border-gray-200 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-4 py-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`text-lg font-medium leading-6 text-gray-900 ${className}`}>{children}</h3>;
}