import React, { useState } from 'react';
import { Home, ShieldCheck, Users, Sparkles, ArrowRight } from 'lucide-react';
import { normalizeRoomCode } from '../services/storageService';

const QUICK_NAMES = ['Papá', 'Mamá', 'Abuela', 'Abuelo', 'Hijo', 'Hija'];

export default function Onboarding({ onJoin }) {
  const [role, setRole] = useState('member'); // 'member' | 'admin'
  const [memberName, setMemberName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = memberName.trim();
    const cleanCode = normalizeRoomCode(roomCode);

    if (!cleanName) {
      setError('Elige o escribe tu nombre para que tu familia te reconozca.');
      return;
    }
    if (cleanCode.length < 3) {
      setError('Ingresa un Código de Familia (ej. FAMILIA-PEREZ o 4281).');
      return;
    }
    if (role === 'admin' && adminPin.trim().length < 4) {
      setError('Como Administrador, define un PIN de al menos 4 dígitos.');
      return;
    }

    onJoin({
      memberName: cleanName,
      roomCode: cleanCode,
      role,
      adminPin: role === 'admin' ? adminPin.trim() : '',
    });
  };

  const generateRandomCode = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setRoomCode(`HOGAR-${num}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-orange-50 via-warm-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-orange-100 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 mb-3">
            <Home className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hogar Conectado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Todo el hogar organizado con 1 toque, sin caos en el chat.
          </p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('member');
              setError('');
            }}
            className={`tap-btn flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all ${
              role === 'member'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            Integrante
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setError('');
            }}
            className={`tap-btn flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all ${
              role === 'admin'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Hogar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Name Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              ¿Quién eres? (1 toque o escribe)
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {QUICK_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setMemberName(name)}
                  className={`tap-btn px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    memberName === name
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-orange-50/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-orange-200/70 dark:border-slate-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="O escribe tu nombre (ej. Carlos, Lucía)"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Room Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Código de Familia / Hogar
              </label>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generar código
                </button>
              )}
            </div>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Ej. FAMILIA-PEREZ o 4821"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Admin PIN */}
          {role === 'admin' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                PIN de Administrador (4 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Ej. 1234"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="tap-btn w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
          >
            Entrar al Hogar
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
