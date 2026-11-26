export interface ChipItem {
  id: string;
  label: string;
  emoji: string;
}

export interface GoalPreset {
  id: string;
  title: string;
  emoji: string;
  defaultTarget: number;
}

export const SHOPPING_CHIPS: ChipItem[] = [
  { id: 'pan', label: 'Pan', emoji: '🍞' },
  { id: 'leche', label: 'Leche', emoji: '🥛' },
  { id: 'huevos', label: 'Huevos', emoji: '🥚' },
  { id: 'arroz', label: 'Arroz/Abarrotes', emoji: '🍚' },
  { id: 'pollo', label: 'Pollo/Carne', emoji: '🍗' },
  { id: 'verduras', label: 'Verduras', emoji: '🥬' },
  { id: 'gas', label: 'Gas', emoji: '🔥' },
  { id: 'aseo', label: 'Papel/Aseo', emoji: '🧻' },
  { id: 'agua', label: 'Agua', emoji: '💧' },
  { id: 'farmacia', label: 'Farmacia', emoji: '💊' },
];

export const SHOPPING_AMOUNTS = [1, 2, 5, 10, 20, 50];

export const SAVINGS_GOAL_PRESETS: GoalPreset[] = [
  { id: 'vacaciones', title: 'Vacaciones', emoji: '🏖️', defaultTarget: 2000 },
  { id: 'cena', title: 'Cena de Fin de Año', emoji: '🎄', defaultTarget: 600 },
  { id: 'emergencia', title: 'Fondo de Emergencia', emoji: '🛡️', defaultTarget: 1500 },
  { id: 'servicios', title: 'Pago de Servicios', emoji: '💡', defaultTarget: 400 },
];

export const SAVINGS_AMOUNTS = [5, 10, 20, 50, 100];

export const EVENT_PRESETS: ChipItem[] = [
  { id: 'almuerzo', label: 'Almuerzo familiar', emoji: '🍲' },
  { id: 'cumple', label: 'Cumpleaños', emoji: '🎂' },
  { id: 'medico', label: 'Cita médica', emoji: '🏥' },
  { id: 'recibo', label: 'Vence recibo Luz/Agua/Internet', emoji: '💡' },
  { id: 'salida', label: 'Partido / Salida', emoji: '⚽' },
  { id: 'tecnico', label: 'Visita de técnico', emoji: '🛠️' },
];

export const DAY_OPTIONS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'manana', label: 'Mañana' },
  { id: 'sabado', label: 'Este Sábado' },
  { id: 'domingo', label: 'Este Domingo' },
];

export const TIME_OPTIONS = [
  { id: 'manana', label: 'Mañana', emoji: '🌅' },
  { id: 'tarde', label: 'Tarde', emoji: '☀️' },
  { id: 'noche', label: 'Noche', emoji: '🌙' },
];

export const RSVP_OPTIONS = [
  { id: 'going', label: 'Ahí estaré', emoji: '👍' },
  { id: 'late', label: 'Llego un poco tarde', emoji: '🏃' },
  { id: 'no', label: 'No podré', emoji: '❌' },
];

export const MEMBER_STATUSES: ChipItem[] = [
  { id: 'home', label: 'En casa', emoji: '🏠' },
  { id: 'work', label: 'Trabajando/Estudiando', emoji: '🏢' },
  { id: 'super', label: 'En el súper', emoji: '🛒' },
  { id: 'omw', label: 'En camino a casa', emoji: '🚌' },
];

export const MEMBER_COLORS = [
  'bg-orange-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-indigo-500',
];

export function getMemberColor(name = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}
