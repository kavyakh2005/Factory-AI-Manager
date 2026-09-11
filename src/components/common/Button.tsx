import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20 active:scale-[0.98] border border-primary-500/50',
    secondary:
      'bg-factory-800 hover:bg-factory-700 text-slate-200 border border-factory-700 active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-factory-800 text-slate-300 hover:text-white',
    outline:
      'bg-transparent hover:bg-factory-800/60 text-slate-300 border border-slate-700 hover:border-slate-500',
    accent:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs font-medium rounded',
    md: 'px-4 py-2 text-sm font-medium rounded-lg',
    lg: 'px-5 py-2.5 text-base font-semibold rounded-lg',
  };

  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary-500/40',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};
