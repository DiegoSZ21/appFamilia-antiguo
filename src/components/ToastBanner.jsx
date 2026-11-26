import React from 'react';
import { X } from 'lucide-react';

export default function ToastBanner({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-xl border border-slate-700/50 dark:border-slate-200 backdrop-blur-md animate-fade-in"
        >
          <span className="text-2xl shrink-0">{t.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-xs uppercase tracking-wider opacity-75">
              {t.title}
            </p>
            <p className="font-bold text-sm leading-snug">{t.body}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="p-1 rounded-lg opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
