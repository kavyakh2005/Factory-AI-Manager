import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-xl bg-factory-900/90 border border-slate-800 shadow-xl transition-all duration-200',
          glow && 'border-primary-500/30 shadow-primary-500/5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
