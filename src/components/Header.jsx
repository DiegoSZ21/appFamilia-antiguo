import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Settings,
  LogOut,
  Home,
  Copy,
  Check,
  Bell,
  BellRing,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import { MEMBER_STATUSES, getMemberColor } from '../constants/familyPresets';

const STATUS_EMOJIS = ['🏋️', '🏫', '🏥', '🚗', '🍽️', '🎮', '😴', '🛍️'];

export default function Header({
  session,
  roomState,
  connectionStatus,
  theme,
  notifPermission,
  isSharingLocation,
  onRequestNotifications,
  onToggleLocation,
  onToggleTheme,
  onRefresh,
  onOpenSettings,
  onLogout,
  onStatusChange,
  onAddCustomStatus,
  onRemoveCustomStatus,
}) {
  const [copied, setCopied] = useState(false);
  const [addingStatus, setAddingStatus] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusEmoji, setNewStatusEmoji] = useState('🏋️');

  const membersList = Object.values(roomState?.members || {});
  const myMember = roomState?.members?.[session.memberName];
  const myStatusId = myMember?.statusId || 'home';
  const customStatuses = roomState?.customStatuses || [];
  const allStatuses = [...MEMBER_STATUSES, ...customStatuses];

  const handleCopyCode = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(session.roomCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreateStatus = (e) => {
    e.preventDefault();
    if (!newStatusLabel.trim()) return;
    onAddCustomStatus(newStatusLabel.trim(), newStatusEmoji);
    setNewStatusLabel('');
    setAddingStatus(false);
  };

  const statusConfig = {
    connected: {
      label: 'Conectado en vivo',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
      icon: Wifi,
    },
    syncing: {
      label: 'Sincronizando...',
      dot: 'bg-amber-500 animate-pulse',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60',
      icon: RefreshCw,
    },
    offline: {
      label: 'Sin conexión',
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
      icon: WifiOff,
    },
  }[connectionStatus] || {
    label: 'Sin conexión',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
    icon: WifiOff,
  };

  const StatusIcon = statusConfig.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-orange-100 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-2.5">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="lg:hidden font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                  Hogar Conectado
                </h1>
                <span className="hidden lg:inline font-extrabold text-lg text-slate-900 dark:text-white">
                  Hola, {session.memberName} 👋
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copiar código de familia"
                  className="tap-btn inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 shrink-0"
                >
                  <span>{copied ? '¡Copiado!' : session.roomCode}</span>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.bg} ${statusConfig.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                  <StatusIcon
                    className={`w-3 h-3 ${connectionStatus === 'syncing' ? 'animate-spin' : ''}`}
                  />
                  {statusConfig.label}
                </span>
                {connectionStatus === 'offline' && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="tap-btn inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500 text-white"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refrescar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRequestNotifications}
              aria-label="Notificaciones"
              title={
                notifPermission === 'granted'
                  ? 'Notificaciones activas'
                  : 'Activar notificaciones'
              }
              className={`tap-btn p-2.5 rounded-xl transition-colors ${
                notifPermission === 'granted'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-400'
              }`}
            >
              {notifPermission === 'granted' ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleLocation}
              aria-label="Ubicación en tiempo real"
              title={
                isSharingLocation
                  ? 'Compartiendo ubicación en vivo (toca para detener)'
                  : 'Compartir mi ubicación en tiempo real'
              }
              className={`tap-btn p-2.5 rounded-xl transition-colors ${
                isSharingLocation
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <MapPin className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Cambiar tema"
              className="tap-btn p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Ajustes"
              title="Ajustes del Hogar"
              className="tap-btn p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Salir del hogar"
              className="tap-btn p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1-Tap Member Status Bar + Custom Status Creator */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Mi estado:
            </span>
            {allStatuses.map((st) => {
              const active = myStatusId === st.id;
              const isCustom = st.id.startsWith('custom_');
              return (
                <div key={st.id} className="inline-flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onStatusChange(st)}
                    className={`tap-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      active
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{st.emoji}</span>
                    <span>{st.label}</span>
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => onRemoveCustomStatus(st.id)}
                      className="ml-0.5 p-1 text-slate-400 hover:text-rose-500"
                      title="Borrar estado personalizado"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setAddingStatus((v) => !v)}
              className="tap-btn shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border border-dashed border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear estado
            </button>
          </div>

          {addingStatus && (
            <form onSubmit={handleCreateStatus} className="mt-2 flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-orange-50/70 dark:bg-slate-800 border border-orange-200 dark:border-slate-700">
              <div className="flex gap-1">
                {STATUS_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewStatusEmoji(em)}
                    className={`w-8 h-8 rounded-xl text-base flex items-center justify-center ${
                      newStatusEmoji === em
                        ? 'bg-orange-500 text-white'
                        : 'bg-white dark:bg-slate-700'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newStatusLabel}
                onChange={(e) => setNewStatusLabel(e.target.value)}
                placeholder="Ej. En el gym, En clase..."
                maxLength={28}
                className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none"
              />
              <button
                type="submit"
                className="tap-btn px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-extrabold"
              >
                Guardar
              </button>
            </form>
          )}

          {/* Family Members Live Pills + Live Map Link */}
          {membersList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 no-scrollbar">
              {membersList.map((m) => (
                <div
                  key={m.name}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <span className={`w-2 h-2 rounded-full ${getMemberColor(m.name)}`} />
                  <span className="font-bold">{m.name}:</span>
                  <span>
                    {m.statusEmoji || '🏠'} {m.statusLabel || 'En casa'}
                  </span>
                  {m.location?.lat && m.location?.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${m.location.lat},${m.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold hover:underline"
                      title="Ver ubicación en tiempo real en Google Maps"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      Mapa
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
