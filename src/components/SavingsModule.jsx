import React, { useState } from 'react';
import { PiggyBank, Target, Sparkles, Edit3, X, Trash2, Plus } from 'lucide-react';
import {
  SAVINGS_AMOUNTS,
  SAVINGS_GOAL_PRESETS,
  getMemberColor,
} from '../constants/familyPresets';

function timeAgo(ts) {
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Hace ${diffHr} h`;
  return `Hace ${Math.floor(diffHr / 24)} d`;
}

export default function SavingsModule({
  roomState,
  session,
  onAddContribution,
  onRemoveContribution,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) {
  const goals = roomState?.savings?.goals || [];
  const [selectedGoalId, setSelectedGoalId] = useState(goals[0]?.id || null);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [goalTitle, setGoalTitle] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('💡');
  const [targetAmount, setTargetAmount] = useState('400');
  const [justAdded, setJustAdded] = useState(null);

  const currency = roomState?.meta?.currency || 'S/';
  const activeGoal = goals.find((g) => g.id === selectedGoalId) || goals[0] || null;

  const totalSavedAll = goals.reduce(
    (sum, g) =>
      sum + (g.contributions || []).reduce((s, c) => s + (Number(c.amount) || 0), 0),
    0
  );

  const activeSaved = activeGoal
    ? (activeGoal.contributions || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
    : 0;
  const activePct = activeGoal
    ? Math.min(100, Math.round((activeSaved / (activeGoal.targetAmount || 1)) * 100))
    : 0;

  const handleQuickDeposit = (amt) => {
    if (!activeGoal) return;
    onAddContribution(activeGoal.id, amt);
    setJustAdded(amt);
    setTimeout(() => setJustAdded(null), 1200);
  };

  const openAddModal = () => {
    setGoalTitle('Pago de Luz');
    setGoalEmoji('💡');
    setTargetAmount('300');
    setModalMode('add');
  };

  const openEditModal = (goal) => {
    setGoalTitle(goal.title);
    setGoalEmoji(goal.emoji);
    setTargetAmount(String(goal.targetAmount));
    setModalMode('edit');
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      onAddGoal({
        title: goalTitle.trim() || 'Nueva Meta',
        emoji: goalEmoji,
        targetAmount: Number(targetAmount) || 500,
      });
    } else if (modalMode === 'edit' && activeGoal) {
      onUpdateGoal(activeGoal.id, {
        title: goalTitle.trim() || activeGoal.title,
        emoji: goalEmoji,
        targetAmount: Number(targetAmount) || activeGoal.targetAmount,
      });
    }
    setModalMode(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-5 space-y-5">
        {/* Multi-Goal Selector + Add Button */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-orange-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Metas de la Familia ({goals.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total ahorrado: <span className="font-extrabold text-orange-600 dark:text-orange-400">{currency} {totalSavedAll.toFixed(0)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="tap-btn px-3.5 py-2 rounded-2xl bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Meta
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {goals.map((g) => {
              const saved = (g.contributions || []).reduce(
                (s, c) => s + (Number(c.amount) || 0),
                0
              );
              const pct = Math.min(100, Math.round((saved / (g.targetAmount || 1)) * 100));
              const isSelected = activeGoal?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGoalId(g.id)}
                  className={`tap-btn p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-[11px] font-black text-orange-600 dark:text-orange-400">
                      {pct}%
                    </span>
                  </div>
                  <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {g.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currency} {saved.toFixed(0)} / {g.targetAmount}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Goal Card */}
        {activeGoal && (
          <section className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                  {activeGoal.emoji}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Meta Seleccionada
                  </span>
                  <h2 className="text-xl font-black">{activeGoal.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(activeGoal)}
                  className="tap-btn p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white"
                  title="Editar meta"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {(session.role === 'admin' || activeGoal.createdBy === session.memberName) &&
                  goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteGoal(activeGoal.id);
                        setSelectedGoalId(null);
                      }}
                      className="tap-btn p-2.5 rounded-xl bg-white/20 hover:bg-rose-600 text-white"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-3xl font-black">
                  {currency} {activeSaved.toFixed(0)}
                </span>
                <span className="text-sm font-bold text-white/80 ml-2">
                  de {currency} {activeGoal.targetAmount}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-black">
                {activePct}%
              </span>
            </div>

            <div className="w-full h-4 rounded-full bg-black/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${activePct}%` }}
              />
            </div>
            {activePct >= 100 && (
              <div className="mt-3 px-3 py-2 rounded-2xl bg-white/20 backdrop-blur-sm text-xs font-extrabold flex items-center justify-center gap-1.5">
                <span>🎉</span>
                <span>¡Meta alcanzada en familia!</span>
              </div>
            )}
          </section>
        )}

        {/* 1-Tap Quick Deposit */}
        {activeGoal && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-orange-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-orange-500" />
                Aportar a {activeGoal.title}
              </h3>
              {justAdded && (
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 animate-bounce flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />+{currency} {justAdded} ¡Listo!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Toca el monto que pusiste en la alcancía para esta meta.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SAVINGS_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickDeposit(amt)}
                  className="tap-btn py-3.5 px-2 rounded-2xl bg-gradient-to-b from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 border border-orange-200 dark:border-slate-700 text-orange-700 dark:text-orange-300 font-black text-base shadow-sm"
                >
                  +{currency} {amt}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Visual History */}
      <div className="lg:col-span-7 space-y-5">
        <section className="space-y-2.5">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white px-1">
            Aportes en {activeGoal?.title || 'Alcancía'} (
            {(activeGoal?.contributions || []).length})
          </h3>

          {!activeGoal || !activeGoal.contributions?.length ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-3xl mb-1">🐷</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Esta meta está esperando el primer aporte
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800">
              {activeGoal.contributions.slice(0, 20).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${getMemberColor(
                        c.memberName
                      )} text-white font-extrabold flex items-center justify-center text-sm`}
                    >
                      {(c.memberName || 'F').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {c.memberName} aportó
                      </p>
                      <p className="text-xs text-slate-400">{timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                      +{currency} {c.amount}
                    </span>
                    {(session.role === 'admin' || c.memberName === session.memberName) && (
                      <button
                        type="button"
                        onClick={() => onRemoveContribution(activeGoal.id, c.id)}
                        aria-label="Eliminar aporte"
                        className="tap-btn p-1.5 rounded-lg text-slate-300 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit Goal Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                {modalMode === 'add' ? 'Nueva Meta Familiar' : 'Editar Meta'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="tap-btn p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {SAVINGS_GOAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setGoalTitle(preset.title);
                    setGoalEmoji(preset.emoji);
                    setTargetAmount(String(preset.defaultTarget));
                  }}
                  className={`tap-btn p-3 rounded-2xl border text-left transition-all ${
                    goalTitle === preset.title
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-2xl block mb-1">{preset.emoji}</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {preset.title}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3">
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Nombre de la meta (ej. Pago de Luz)"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
              <input
                type="number"
                min="10"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Monto objetivo"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
              <button
                type="submit"
                className="tap-btn w-full py-3.5 rounded-2xl bg-orange-500 text-white font-extrabold"
              >
                {modalMode === 'add' ? 'Crear Meta' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
