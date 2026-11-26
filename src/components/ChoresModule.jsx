import React, { useState } from 'react';
import {
  Plus,
  AlertCircle,
  Hand,
  CheckCircle2,
  Edit3,
  Trash2,
  Trophy,
  History,
  X,
} from 'lucide-react';
import { getMemberColor } from '../constants/familyPresets';

const CHORE_EMOJIS = ['🍽️', '🗑️', '🧹', '🐶', '👕', '🪴', '🔒', '🛏️', '🧽', '📚'];

export default function ChoresModule({
  roomState,
  onSetChoreState,
  onAddCustomChore,
  onEditChore,
  onDeleteChore,
}) {
  const [customChore, setCustomChore] = useState('');
  const [editingChore, setEditingChore] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editEmoji, setEditEmoji] = useState('🧹');

  const rawChores = roomState?.chores || [];
  const choreLogs = roomState?.choreLogs || [];
  const statusOrder = { urgent: 0, assigned: 1, idle: 2, done: 3 };
  const chores = [...rawChores].sort(
    (a, b) => (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2)
  );
  const urgentCount = rawChores.filter((c) => c.status === 'urgent').length;
  const assignedCount = rawChores.filter((c) => c.status === 'assigned').length;
  const doneCount = rawChores.filter((c) => c.status === 'done').length;

  // Achievements / Stars per member from choreLogs
  const memberScores = choreLogs.reduce((acc, log) => {
    acc[log.memberName] = (acc[log.memberName] || 0) + 1;
    return acc;
  }, {});
  const rankedMembers = Object.entries(memberScores).sort((a, b) => b[1] - a[1]);

  const handleAdd = (e) => {
    e.preventDefault();
    const text = customChore.trim();
    if (!text) return;
    onAddCustomChore(text, '✨');
    setCustomChore('');
  };

  const openEdit = (chore) => {
    setEditingChore(chore);
    setEditLabel(chore.label);
    setEditEmoji(chore.emoji || '🧹');
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingChore || !editLabel.trim()) return;
    onEditChore(editingChore.id, { label: editLabel.trim(), emoji: editEmoji });
    setEditingChore(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Row: Add Chore + Family Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-orange-100 dark:border-slate-800">
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
            Tareas de la Casa (1 toque)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Edita, marca urgentes o asigna tareas. ¡Cada tarea lista suma una estrella!
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300">
              🔴 {urgentCount} urgentes
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300">
              ✋ {assignedCount} en curso
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300">
              ✅ {doneCount} listos
            </span>
          </div>

          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={customChore}
              onChange={(e) => setCustomChore(e.target.value)}
              placeholder="Añadir otra tarea rápida..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="tap-btn px-4 py-3 rounded-2xl bg-orange-500 text-white font-bold"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </section>

        {/* Achievements / Ranking Card */}
        <section className="lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm border border-orange-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Logros de Ayuda en Casa
            </h3>
          </div>
          {rankedMembers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aún no hay tareas completadas. ¡Toca &ldquo;¡Listo!&rdquo; en una tarea para ganar tu primera estrella ⭐!
            </p>
          ) : (
            <div className="space-y-2">
              {rankedMembers.map(([name, count], idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-orange-100 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐'}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${getMemberColor(name)}`} />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {name}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-black">
                    ⭐ {count} {count === 1 ? 'logro' : 'logros'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Chore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {chores.map((chore) => {
          const isUrgent = chore.status === 'urgent';
          const isAssigned = chore.status === 'assigned';
          const isDone = chore.status === 'done';

          return (
            <div
              key={chore.id}
              className={`rounded-3xl p-4 shadow-sm border transition-all ${
                isUrgent
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                  : isAssigned
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                  : isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-orange-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">{chore.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                      {chore.label}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {isUrgent && '🔴 Pendiente / Urgente'}
                      {isAssigned && `✋ Se encarga ${chore.assignedTo}`}
                      {isDone && `✅ ¡Listo! Ayudó ${chore.completedBy}`}
                      {chore.status === 'idle' && 'Sin pendientes ahora'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(chore)}
                    aria-label="Editar tarea"
                    className="tap-btn p-2 rounded-xl text-slate-400 hover:text-orange-500"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteChore(chore.id)}
                    aria-label="Eliminar tarea"
                    className="tap-btn p-2 rounded-xl text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3 1-Tap State Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSetChoreState(chore.id, isUrgent ? 'idle' : 'urgent')
                  }
                  className={`tap-btn py-2.5 px-2 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 border transition-all ${
                    isUrgent
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Urgente</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSetChoreState(chore.id, 'assigned')}
                  className={`tap-btn py-2.5 px-2 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 border transition-all ${
                    isAssigned
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Hand className="w-4 h-4 shrink-0" />
                  <span>Yo me encargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSetChoreState(chore.id, 'done')}
                  className={`tap-btn py-2.5 px-2 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1 border transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Listo!</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Chore History Log */}
      {choreLogs.length > 0 && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-orange-500" />
            Registro de quién ayudó recientemente
          </h3>
          <div className="space-y-2">
            {choreLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs py-1.5 border-b last:border-0 border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{log.choreEmoji}</span>
                  <span>
                    <strong className="text-slate-900 dark:text-white">{log.memberName}</strong>{' '}
                    completó <strong className="text-emerald-600 dark:text-emerald-400">{log.choreLabel}</strong>
                  </span>
                </div>
                <span className="text-slate-400">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edit Chore Modal */}
      {editingChore && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Modificar Tarea
              </h3>
              <button
                type="button"
                onClick={() => setEditingChore(null)}
                className="tap-btn p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {CHORE_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEditEmoji(em)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${
                      editEmoji === em
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
              <button
                type="submit"
                className="tap-btn w-full py-3.5 rounded-2xl bg-orange-500 text-white font-extrabold"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
