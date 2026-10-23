import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  variant?: 'urgent' | 'moderate' | 'routine' | 'success' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  dot = false,
}) => {
  const variantStyles = {
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    moderate: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    routine: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    success: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20',
    warning: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
  };

  const dotStyles = {
    urgent: 'bg-rose-500',
    moderate: 'bg-amber-500',
    routine: 'bg-emerald-500',
    success: 'bg-teal-500',
    warning: 'bg-orange-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 font-medium rounded-full border shadow-sm ring-1 ring-inset',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={twMerge('w-1.5 h-1.5 rounded-full inline-block', dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
