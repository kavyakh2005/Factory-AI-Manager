import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-slate-900 border ${
          error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-primary-500'
        } rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      {helperText && !error && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
};
