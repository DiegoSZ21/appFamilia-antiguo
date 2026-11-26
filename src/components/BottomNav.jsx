import React from 'react';
import { ShoppingCart, PiggyBank, CheckSquare, CalendarDays, Home } from 'lucide-react';

const TABS = [
  { id: 'shopping', label: 'Compras y Gastos', shortLabel: 'Compras', icon: ShoppingCart },
  { id: 'savings', label: 'Alcancía Familiar', shortLabel: 'Alcancía', icon: PiggyBank },
  { id: 'chores', label: 'Tareas del Hogar', shortLabel: 'Tareas', icon: CheckSquare },
  { id: 'events', label: 'Eventos y Avisos', shortLabel: 'Eventos', icon: CalendarDays },
];

export default function BottomNav({ activeTab, onChangeTab, badges = {} }) {
  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-40 bg-white dark:bg-slate-900 border-r border-orange-100 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-900 dark:text-white leading-tight">
              Hogar Conectado
            </h2>
            <p className="text-[11px] font-semibold text-slate-400">
              Modo Escritorio &amp; Móvil
            </p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const badge = badges[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`tap-btn w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                  active
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-orange-50/70 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                  <span className={`text-sm ${active ? 'font-extrabold' : 'font-bold'}`}>
                    {tab.label}
                  </span>
                </div>
                {badge > 0 && (
                  <span
                    className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-extrabold flex items-center justify-center ${
                      active
                        ? 'bg-white text-orange-600'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-3.5 rounded-2xl bg-orange-50/80 dark:bg-slate-800/70 border border-orange-100 dark:border-slate-700/60">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            💡 1 toque, cero teclado
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Todo se sincroniza al instante con los celulares de tu familia.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-orange-100 dark:border-slate-800 pb-safe">
        <div className="max-w-2xl mx-auto grid grid-cols-4 gap-1 px-2 pt-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const badge = badges[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`tap-btn relative flex flex-col items-center justify-center py-2 rounded-2xl transition-colors ${
                  active
                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 2} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] mt-1 ${active ? 'font-extrabold' : 'font-semibold'}`}>
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
