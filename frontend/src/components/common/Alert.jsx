import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
  const styles = {
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
    }
  };

  const current = styles[type] || styles.info;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${className}`}>
      {current.icon}
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {message && <div className="leading-relaxed">{message}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

