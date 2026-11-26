import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Wallet,
  Bell,
  MapPin,
  Sun,
  Moon,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

const CURRENCIES = ['S/', '$', '€', 'MXN', 'COP'];

export default function AdminModal({
  isOpen,
  onClose,
  roomState,
  session,
  theme,
  notifPermission,
  isSharingLocation,
  onToggleTheme,
  onRequestNotifications,
  onTestNotification,
  onToggleLocation,
  onUpdateBudget,
  onUpdateCurrency,
  onResetWeek,
  onRemoveMember,
}) {
  const [budget, setBudget] = useState(roomState?.meta?.weeklyBudget || 500);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isAdmin = session.role === 'admin';
  const currentCurrency = roomState?.meta?.currency || 'S/';
  const members = Object.values(roomState?.members || {}).filter(
    (m) => m.name !== session.memberName
  );

  const handleSaveBudget = (e) => {
    e.preventDefault();
    onUpdateBudget(budget);
  };

  const handleCopyCode = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(session.roomCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Ajustes del Hogar
              </h2>
              <p className="text-xs text-slate-400">
                {session.memberName} • {isAdmin ? 'Administrador' : 'Integrante'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-btn p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite Family Code */}
        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-slate-800 border border-orange-200/70 dark:border-slate-700 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Código de Familia
            </p>
            <p className="font-black text-lg text-orange-600 dark:text-orange-400 tracking-wider">
              {session.roomCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="tap-btn px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Personal Preferences: Notifications, Location, Theme */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mis Preferencias
          </h3>

          {/* Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Notificaciones en vivo
                </p>
                <p className="text-xs text-slate-400">
                  {notifPermission === 'granted'
                    ? 'Activas en este dispositivo'
                    : notifPermission === 'denied'
                    ? 'Bloqueadas en el navegador'
                    : 'Recibe avisos de compras, metas y tareas'}
                </p>
              </div>
            </div>
            {notifPermission === 'granted' ? (
              <button
                type="button"
                onClick={onTestNotification}
                className="tap-btn px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
              >
                Probar
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestNotifications}
                className="tap-btn px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
              >
                Activar
              </button>
            )}
          </div>

          {/* Live Location */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-sky-500" />
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Ubicación en tiempo real
                </p>
                <p className="text-xs text-slate-400">
                  {isSharingLocation
                    ? 'Tu familia puede ver tu ubicación en el mapa'
                    : 'Comparte dónde estás con 1 toque'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleLocation}
              className={`tap-btn px-3.5 py-2 rounded-xl text-xs font-bold ${
                isSharingLocation
                  ? 'bg-rose-500 text-white'
                  : 'bg-sky-500 text-white'
              }`}
            >
              {isSharingLocation ? 'Detener' : 'Compartir'}
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-amber-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Apariencia
                </p>
                <p className="text-xs text-slate-400">
                  {theme === 'dark' ? 'Modo Oscuro activo' : 'Modo Claro activo'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="tap-btn px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold"
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Controles de Administrador
              </h3>
            </div>

            {/* Currency Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                Moneda del hogar
              </label>
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => onUpdateCurrency(cur)}
                    className={`tap-btn px-3.5 py-2 rounded-xl text-xs font-extrabold border ${
                      currentCurrency === cur
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <form onSubmit={handleSaveBudget}>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <Wallet className="w-4 h-4 text-orange-500" />
                Presupuesto Semanal ({currentCurrency})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-base"
                />
                <button
                  type="submit"
                  className="tap-btn px-5 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>

            {/* Reset Week */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 mb-1">
                Reiniciar Semana / Mes
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mb-3">
                Limpia el historial de gastos comprados y reinicia las tareas domésticas.
              </p>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="tap-btn w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar Semana
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetWeek();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="tap-btn flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm"
                  >
                    Sí, reiniciar ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="tap-btn px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Manage Members */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Integrantes en la sala ({members.length + 1})
              </h4>
              {members.length === 0 ? (
                <p className="text-sm text-slate-400">Aún no hay otros integrantes conectados.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800"
                    >
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {m.statusEmoji} {m.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveMember(m.name)}
                        className="tap-btn p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Quitar integrante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
