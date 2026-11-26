import React, { useState } from 'react';
import { CalendarDays, Clock, Trash2, Plus } from 'lucide-react';
import {
  EVENT_PRESETS,
  DAY_OPTIONS,
  TIME_OPTIONS,
  RSVP_OPTIONS,
} from '../constants/familyPresets';

export default function EventsModule({
  roomState,
  session,
  onAddEvent,
  onSetRsvp,
  onRemoveEvent,
}) {
  const [selectedPreset, setSelectedPreset] = useState(EVENT_PRESETS[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState(DAY_OPTIONS[0].label);
  const [customDate, setCustomDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(TIME_OPTIONS[1].label);

  const events = roomState?.events || [];

  const handlePublish = () => {
    const title = customTitle.trim() || selectedPreset.label;
    const emoji = customTitle.trim() ? '📅' : selectedPreset.emoji;
    const dayLabel = customDate ? customDate : selectedDay;

    onAddEvent({
      title,
      emoji,
      dayLabel,
      timeLabel: selectedTime,
    });
    setCustomTitle('');
    setCustomDate('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* 1-Tap Event Creator */}
      <div className="lg:col-span-5">
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-orange-100 dark:border-slate-800 space-y-4">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-white mb-1">
            Crear Aviso o Evento (1 toque)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Elige el motivo, el día y la hora aproximada.
          </p>
        </div>

        {/* Event Presets */}
        <div className="grid grid-cols-2 gap-2">
          {EVENT_PRESETS.map((preset) => {
            const active = !customTitle && selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setCustomTitle('');
                }}
                className={`tap-btn flex items-center gap-2 p-3 rounded-2xl border text-left font-bold text-xs sm:text-sm transition-all ${
                  active
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-orange-50/70 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-orange-200/70 dark:border-slate-700'
                }`}
              >
                <span className="text-xl shrink-0">{preset.emoji}</span>
                <span className="line-clamp-2">{preset.label}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="O escribe otro evento (opcional)..."
          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* Day Selector */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
            <CalendarDays className="w-3.5 h-3.5" />
            ¿Cuándo?
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => {
              const active = !customDate && selectedDay === d.label;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.label);
                    setCustomDate('');
                  }}
                  className={`tap-btn px-3.5 py-2 rounded-full text-xs font-bold border ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Time Selector */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
            <Clock className="w-3.5 h-3.5" />
            ¿A qué hora aprox.?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_OPTIONS.map((t) => {
              const active = selectedTime === t.label;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTime(t.label)}
                  className={`tap-btn py-2.5 px-2 rounded-2xl text-xs font-bold border flex items-center justify-center gap-1 ${
                    active
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePublish}
          className="tap-btn w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Publicar Aviso Familiar
        </button>
      </section>

      {/* Events List */}
      </div>
      <div className="lg:col-span-7">
      <section className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white px-1">
          Próximos Eventos ({events.length})
        </h3>

        {events.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-3xl mb-1">📅</p>
            <p className="font-bold text-slate-700 dark:text-slate-300">
              No hay eventos programados todavía
            </p>
          </div>
        ) : (
          events.map((evt) => {
            const myRsvp = evt.rsvps?.[session.memberName];
            const rsvpEntries = Object.entries(evt.rsvps || {});

            return (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-orange-100 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{evt.emoji}</span>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {evt.title}
                      </h4>
                      <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {evt.dayLabel} • {evt.timeLabel}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Avisó {evt.createdBy}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveEvent(evt.id)}
                    aria-label="Eliminar evento"
                    className="tap-btn p-2 rounded-xl text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 1-Tap RSVP */}
                <div className="grid grid-cols-3 gap-1.5">
                  {RSVP_OPTIONS.map((opt) => {
                    const active = myRsvp === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSetRsvp(evt.id, opt.id)}
                        className={`tap-btn py-2 px-1.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 ${
                          active
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Family Responses */}
                {rsvpEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {rsvpEntries.map(([name, rsvpId]) => {
                      const opt = RSVP_OPTIONS.find((o) => o.id === rsvpId);
                      return (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <span>{opt?.emoji || '👍'}</span>
                          <span>{name}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
      </div>
    </div>
  );
}
