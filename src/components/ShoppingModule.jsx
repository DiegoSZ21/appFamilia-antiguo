import React, { useState } from 'react';
import { Check, Plus, Trash2, Wallet, Users, X, Delete } from 'lucide-react';
import {
  SHOPPING_CHIPS,
  SHOPPING_AMOUNTS,
  getMemberColor,
} from '../constants/familyPresets';

export default function ShoppingModule({
  roomState,
  session,
  onAddItem,
  onMarkBought,
  onRemovePending,
  onRemoveBought,
}) {
  const [customText, setCustomText] = useState('');
  const [buyingItem, setBuyingItem] = useState(null);
  const [amountStr, setAmountStr] = useState('0');

  const pending = roomState?.shopping?.pending || [];
  const bought = roomState?.shopping?.bought || [];
  const weeklyBudget = roomState?.meta?.weeklyBudget || 500;
  const currency = roomState?.meta?.currency || 'S/';

  const totalSpent = bought.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const budgetPct = Math.min(100, Math.round((totalSpent / weeklyBudget) * 100));

  // Breakdown per member (including all registered members so balance is clear)
  const memberTotals = bought.reduce((acc, item) => {
    const who = item.boughtBy || 'Familia';
    acc[who] = (acc[who] || 0) + (Number(item.amount) || 0);
    return acc;
  }, {});
  const activeMembersCount = Math.max(
    Object.keys(roomState?.members || {}).length,
    Object.keys(memberTotals).length,
    1
  );
  const fairShare = totalSpent / activeMembersCount;

  const handleCustomAdd = (e) => {
    e.preventDefault();
    const label = customText.trim();
    if (!label) return;
    onAddItem({ label, emoji: '🛍️' });
    setCustomText('');
  };

  const openBuyModal = (item) => {
    setBuyingItem(item);
    setAmountStr('0');
  };

  const addQuickAmount = (val) => {
    const current = parseFloat(amountStr) || 0;
    const next = current + val;
    setAmountStr(String(Math.round(next * 100) / 100));
  };

  const handleKeypad = (key) => {
    if (key === 'C') {
      setAmountStr('0');
      return;
    }
    if (key === 'DEL') {
      setAmountStr((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
      return;
    }
    if (key === '.') {
      if (!amountStr.includes('.')) setAmountStr((prev) => `${prev}.`);
      return;
    }
    setAmountStr((prev) => (prev === '0' ? key : `${prev}${key}`));
  };

  const confirmBought = () => {
    if (!buyingItem) return;
    onMarkBought(buyingItem.id, parseFloat(amountStr) || 0);
    setBuyingItem(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-5 space-y-5">
        {/* Weekly Summary Card */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-orange-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
              Gasto de la Semana
            </h2>
          </div>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Meta: {currency} {weeklyBudget}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {currency} {totalSpent.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            ({budgetPct}% del presupuesto)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              budgetPct > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>

        {Object.keys(memberTotals).length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Quién puso cuánto esta semana
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(memberTotals).map(([name, sum]) => {
                const diff = sum - fairShare;
                return (
                  <div
                    key={name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${getMemberColor(name)}`} />
                    <span>{name}:</span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {currency} {sum.toFixed(2)}
                    </span>
                    {activeMembersCount > 1 && totalSpent > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          diff >= 0
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {diff >= 0 ? `+${currency}${diff.toFixed(0)} a favor` : `-${currency}${Math.abs(diff).toFixed(0)}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 1-Tap Quick Chips */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-orange-100 dark:border-slate-800">
        <h2 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
          ¿Qué falta comprar? (1 toque)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Toca un producto para pedirlo al instante a toda la familia.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {SHOPPING_CHIPS.map((chip) => {
            const alreadyPending = pending.some(
              (p) => p.label.toLowerCase() === chip.label.toLowerCase()
            );
            return (
              <button
                key={chip.id}
                type="button"
                disabled={alreadyPending}
                onClick={() => onAddItem(chip)}
                className={`tap-btn flex items-center gap-2 p-3 rounded-2xl border text-left font-bold text-sm transition-all ${
                  alreadyPending
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 opacity-75'
                    : 'bg-orange-50/70 dark:bg-slate-800 border-orange-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-orange-400'
                }`}
              >
                <span className="text-xl shrink-0">{chip.emoji}</span>
                <span className="truncate">{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Optional Custom Input */}
        <form onSubmit={handleCustomAdd} className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Otro producto (opcional)..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="tap-btn px-4 py-3 rounded-2xl bg-orange-500 text-white font-bold flex items-center gap-1"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </section>

      {/* Active Pending List */}
      </div>
      <div className="lg:col-span-7 space-y-5">
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
            Por comprar ({pending.length})
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-3xl mb-1">🎉</p>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              ¡No falta nada por comprar!
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Toca cualquier botón de arriba si hace falta algo en casa.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-sm border border-orange-100 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pidió <span className="font-bold">{item.requestedBy}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openBuyModal(item)}
                    className="tap-btn px-3.5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Ya lo compré
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemovePending(item.id)}
                    aria-label="Eliminar"
                    className="tap-btn p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Purchases */}
      {bought.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-1">
            Últimas compras registradas
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800">
            {bought.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      Compró {item.boughtBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    {currency} {Number(item.amount || 0).toFixed(2)}
                  </span>
                  {(session.role === 'admin' || item.boughtBy === session.memberName) && (
                    <button
                      type="button"
                      onClick={() => onRemoveBought(item.id)}
                      aria-label="Eliminar gasto"
                      className="tap-btn p-1.5 rounded-lg text-slate-300 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </div>

      {/* Quick Amount Modal */}
      {buyingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{buyingItem.emoji}</span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    ¿Cuánto costó {buyingItem.label}?
                  </h3>
                  <p className="text-xs text-slate-400">Registrando como {session.memberName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBuyingItem(null)}
                className="tap-btn p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Display */}
            <div className="bg-orange-50 dark:bg-slate-800 rounded-2xl p-4 text-center mb-3">
              <span className="text-3xl font-black text-orange-600 dark:text-orange-400">
                {currency} {amountStr}
              </span>
            </div>

            {/* 1-Tap Quick Sums */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {SHOPPING_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addQuickAmount(amt)}
                  className="tap-btn py-2.5 rounded-xl bg-orange-100/80 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-extrabold text-sm"
                >
                  +{currency} {amt}
                </button>
              ))}
            </div>

            {/* Large Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypad(k)}
                  className="tap-btn py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center justify-center"
                >
                  {k === 'DEL' ? <Delete className="w-5 h-5" /> : k}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleKeypad('C')}
                className="tap-btn px-4 py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={confirmBought}
                className="tap-btn flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white font-extrabold text-base shadow-lg shadow-emerald-500/25"
              >
                Guardar ({currency} {parseFloat(amountStr || '0').toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
