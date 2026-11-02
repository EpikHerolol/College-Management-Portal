import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{value}</p>
          {subtitle && <p className="text-xs font-medium text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3.5 rounded-2xl ${scheme.bg} ${scheme.text} ${scheme.border} border`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

