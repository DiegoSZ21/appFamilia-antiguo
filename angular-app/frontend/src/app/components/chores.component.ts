import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getMemberColor } from '../constants/family-presets';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-chores',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Helper banner explaining the 3 simple states -->
      <div class="rounded-[20px] bg-[#f2f1ec] border border-[#e1dfd8] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-full bg-white border border-[#e1dfd8] flex items-center justify-center text-xl shrink-0">
            🧹
          </span>
          <div>
            <p class="text-xs font-semibold text-[#1b1d20]">¿Cómo organizar los quehaceres sin discusiones?</p>
            <p class="text-[13px] text-[#6e6e6e] leading-snug">
              Cada tarea tiene 3 botones de 1 toque: 
              <span class="font-semibold text-rose-600">🔴 Urgente</span> (si requiere atención inmediata),
              <span class="font-semibold text-amber-600">✋ Me encargo</span> (cuando vas a realizarla tú), y
              <span class="font-semibold text-emerald-600">✅ ¡Listo!</span> (al terminar, ganas 1 estrella ⭐).
            </p>
          </div>
        </div>
      </div>

      <!-- Top Row: Add chore & Family Achievements -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Chore Controls & Counts -->
        <section class="lg:col-span-7 rounded-[24px] bg-white border border-[#e1dfd8] p-5 sm:p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-base text-[#1b1d20]">
              Tareas de la Casa (1 toque)
            </h2>
            <div class="flex items-center gap-1.5">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-600">
                🔴 {{ countBy('urgent') }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
                ✋ {{ countBy('assigned') }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                ✅ {{ countBy('done') }}
              </span>
            </div>
          </div>

          <!-- Add chore input -->
          <form (ngSubmit)="addChore()" class="flex gap-2">
            <input
              type="text"
              [(ngModel)]="customChore"
              name="customChore"
              placeholder="Añadir otra tarea rápida (ej. Regar plantas, Sacar basura)..."
              class="flex-1 px-4 py-2.5 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-sm text-[#1b1d20] placeholder-[#a3a3a3] focus:outline-none focus:bg-white focus:border-[#5196fe]"
            />
            <button
              type="submit"
              class="tap-btn px-5 py-2.5 rounded-full bg-[#1b1d20] hover:bg-[#5196fe] text-white text-xs sm:text-sm font-bold transition-colors"
            >
              + Agregar
            </button>
          </form>
        </section>

        <!-- Achievements / Ranking -->
        <section class="lg:col-span-5 rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] p-5 sm:p-6 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-base text-[#1b1d20]">
              🏆 Ranking de Ayuda en Casa
            </h3>
            <span class="text-[11px] font-semibold text-[#6e6e6e]">⭐ Estrellas</span>
          </div>

          @if (ranked().length === 0) {
            <div class="p-4 rounded-[16px] bg-white border border-[#e1dfd8] text-center">
              <p class="text-xs text-[#6e6e6e]">
                Toca &ldquo;✅ ¡Listo!&rdquo; en una tarea para ganar tu primera estrella familiar ⭐.
              </p>
            </div>
          } @else {
            <div class="space-y-2">
              @for (r of ranked(); track r.name; let i = $index) {
                <div class="flex items-center justify-between p-3 rounded-[16px] bg-white border border-[#e1dfd8]">
                  <div class="flex items-center gap-2.5">
                    <span class="text-base">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐' }}</span>
                    <span [class]="'w-2.5 h-2.5 rounded-full ' + memberColor(r.name)"></span>
                    <span class="font-bold text-xs sm:text-sm text-[#1b1d20]">{{ r.name }}</span>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    ⭐ {{ r.count }} {{ r.count === 1 ? 'completada' : 'completadas' }}
                  </span>
                </div>
              }
            </div>
          }
        </section>
      </div>

      <!-- Chores Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (chore of sortedChores(); track chore.id) {
          <div [class]="'rounded-[24px] p-5 shadow-sm border transition-all ' + cardClass(chore.status)">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-[16px] bg-white border border-[#e1dfd8] flex items-center justify-center text-2xl shrink-0">
                  {{ chore.emoji }}
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-base text-[#1b1d20] truncate">{{ chore.label }}</h3>
                  <div class="mt-0.5">
                    @if (chore.status === 'urgent') {
                      <span class="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Urgente • Necesita atención
                      </span>
                    } @else if (chore.status === 'assigned') {
                      <span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        ✋ En curso: <strong>{{ chore.assignedTo }}</strong>
                      </span>
                    } @else if (chore.status === 'done') {
                      <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        ✅ ¡Listo! Completó <strong>{{ chore.completedBy }}</strong>
                      </span>
                    } @else {
                      <span class="text-xs text-[#6e6e6e]">
                        Disponible para ayudar
                      </span>
                    }
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  (click)="openEdit(chore)"
                  title="Editar tarea"
                  class="tap-btn w-8 h-8 rounded-full bg-white border border-[#e1dfd8] text-[#6e6e6e] hover:text-[#5196fe] flex items-center justify-center text-xs transition-colors"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  (click)="storage.deleteChore(chore.id)"
                  title="Eliminar tarea"
                  class="tap-btn w-8 h-8 rounded-full bg-white border border-[#e1dfd8] text-[#a3a3a3] hover:text-[#f9754e] flex items-center justify-center text-xs transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- 3 Action Pill Buttons -->
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                (click)="storage.setChoreState(chore.id, chore.status === 'urgent' ? 'idle' : 'urgent')"
                [class]="'tap-btn py-2.5 px-2 rounded-full text-xs font-bold border transition-all text-center ' + (chore.status === 'urgent' ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-white border-[#e1dfd8] text-[#1b1d20] hover:border-rose-400')"
              >
                🔴 Urgente
              </button>
              <button
                type="button"
                (click)="storage.setChoreState(chore.id, 'assigned')"
                [class]="'tap-btn py-2.5 px-2 rounded-full text-xs font-bold border transition-all text-center ' + (chore.status === 'assigned' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white border-[#e1dfd8] text-[#1b1d20] hover:border-amber-400')"
              >
                ✋ Me encargo
              </button>
              <button
                type="button"
                (click)="storage.setChoreState(chore.id, 'done')"
                [class]="'tap-btn py-2.5 px-2 rounded-full text-xs font-bold border transition-all text-center ' + (chore.status === 'done' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white border-[#e1dfd8] text-[#1b1d20] hover:border-emerald-400')"
              >
                ✅ ¡Listo!
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Activity Log -->
      @if (logs().length > 0) {
        <section class="rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] p-5 sm:p-6">
          <h3 class="font-bold text-sm text-[#1b1d20] mb-3">
            🕒 Registro reciente de tareas completadas
          </h3>
          <div class="space-y-2">
            @for (log of logs().slice(0, 8); track log.id) {
              <div class="flex items-center justify-between text-xs py-2 px-3 rounded-[12px] bg-white border border-[#e1dfd8]">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">{{ log.choreEmoji }}</span>
                  <span class="text-[#1b1d20]">
                    <strong>{{ log.memberName }}</strong> completó
                    <strong class="text-emerald-600">{{ log.choreLabel }}</strong>
                  </span>
                </div>
                <span class="text-[#6e6e6e]">{{ formatTime(log.createdAt) }}</span>
              </div>
            }
          </div>
        </section>
      }

      <!-- Edit Chore Modal -->
      @if (editingChore()) {
        <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div class="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-[#e1dfd8] space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg text-[#1b1d20]">Modificar Tarea</h3>
              <button
                type="button"
                (click)="editingChore.set(null)"
                class="tap-btn w-8 h-8 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-[#1b1d20] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-[#6e6e6e] mb-2">Ícono de la tarea</p>
              <div class="flex flex-wrap gap-2">
                @for (em of choreEmojis; track em) {
                  <button
                    type="button"
                    (click)="editEmoji = em"
                    [class]="'w-10 h-10 rounded-full text-xl flex items-center justify-center border transition-all ' + (editEmoji === em ? 'bg-[#5196fe] text-white border-[#5196fe]' : 'bg-[#f8f7f4] border-[#e1dfd8]')"
                  >
                    {{ em }}
                  </button>
                }
              </div>
            </div>

            <form (ngSubmit)="saveEdit()" class="space-y-3 pt-2">
              <div>
                <label class="block text-xs font-semibold text-[#6e6e6e] mb-1">Nombre de la tarea</label>
                <input
                  type="text"
                  [(ngModel)]="editLabel"
                  name="editLabel"
                  class="w-full px-4 py-2.5 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-sm text-[#1b1d20] focus:bg-white focus:border-[#5196fe] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                class="tap-btn w-full py-3.5 rounded-full bg-[#5196fe] hover:bg-[#3b82f6] text-white font-bold text-sm shadow-sm transition-colors mt-2"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ChoresComponent {
  storage = inject(StorageService);
  customChore = '';
  editingChore = signal<any | null>(null);
  editLabel = '';
  editEmoji = '🧹';
  choreEmojis = ['🍽️', '🗑️', '🧹', '🐶', '👕', '🪴', '🔒', '🛏️', '🧽', '📚'];

  rawChores = (): any[] => this.storage.roomState()?.chores || [];
  logs = (): any[] => this.storage.roomState()?.choreLogs || [];

  sortedChores = () => {
    const order: Record<string, number> = { urgent: 0, assigned: 1, idle: 2, done: 3 };
    return [...this.rawChores()].sort((a, b) => (order[a.status] ?? 2) - (order[b.status] ?? 2));
  };

  countBy(st: string): number {
    return this.rawChores().filter((c) => c.status === st).length;
  }

  ranked = () => {
    const scores: Record<string, number> = {};
    for (const l of this.logs()) {
      scores[l.memberName] = (scores[l.memberName] || 0) + 1;
    }
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  };

  memberColor(name: string): string {
    return getMemberColor(name);
  }

  cardClass(status: string): string {
    if (status === 'urgent') return 'bg-rose-50/50 border-rose-200';
    if (status === 'assigned') return 'bg-amber-50/50 border-amber-200';
    if (status === 'done') return 'bg-emerald-50/50 border-emerald-200';
    return 'bg-white border-[#e1dfd8]';
  }

  addChore(): void {
    const t = this.customChore.trim();
    if (!t) return;
    this.storage.addCustomChore(t, '✨');
    this.customChore = '';
  }

  openEdit(chore: any): void {
    this.editingChore.set(chore);
    this.editLabel = chore.label;
    this.editEmoji = chore.emoji || '🧹';
  }

  saveEdit(): void {
    const c = this.editingChore();
    if (!c || !this.editLabel.trim()) return;
    this.storage.editChore(c.id, { label: this.editLabel.trim(), emoji: this.editEmoji });
    this.editingChore.set(null);
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
