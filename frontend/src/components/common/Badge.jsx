import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    faculty: 'bg-blue-50 text-blue-700 border-blue-200',
    student: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm}`}
    >
      {children}
    </span>
  );
};

