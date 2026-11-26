import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SAVINGS_AMOUNTS, SAVINGS_GOAL_PRESETS, getMemberColor } from '../constants/family-presets';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Helper banner for zero-friction family savings -->
      <div class="rounded-[20px] bg-[#f2f1ec] border border-[#e1dfd8] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-full bg-white border border-[#e1dfd8] flex items-center justify-center text-xl shrink-0">
            🐷
          </span>
          <div>
            <p class="text-xs font-semibold text-[#1b1d20]">¿Cómo funciona la alcancía familiar?</p>
            <p class="text-[13px] text-[#6e6e6e] leading-snug">
              Ahorren juntos para metas comunes (recibos, paseos, emergencias). Cada vez que pongas dinero, toca un botón de aporte (<strong>+{{ currency() }} 10, +{{ currency() }} 20...</strong>) para sumarlo a la meta en tiempo real.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            (click)="openAdd()"
            class="tap-btn px-4 py-2 rounded-full bg-[#1b1d20] hover:bg-[#5196fe] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
          >
            + Nueva Meta
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Goals selector & Active Goal Hero -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Multi-Goal Selector -->
          <section class="rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="font-bold text-base text-[#1b1d20]">
                  Metas de la Familia ({{ goals().length }})
                </h2>
                <p class="text-xs text-[#6e6e6e]">
                  Total ahorrado entre todos: <strong class="text-[#5196fe]">{{ currency() }} {{ totalAll().toFixed(0) }}</strong>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              @for (g of goals(); track g.id) {
                <button
                  type="button"
                  (click)="selectedGoalId.set(g.id)"
                  [class]="'tap-btn p-3.5 rounded-[18px] border text-left transition-all ' + (activeGoal()?.id === g.id ? 'bg-white border-[#5196fe] shadow-sm ring-1 ring-[#5196fe]' : 'bg-[#f8f7f4] border-[#e1dfd8] hover:border-[#5196fe]')"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-2xl">{{ g.emoji }}</span>
                    <span class="text-xs font-bold text-[#5196fe]">
                      {{ goalPct(g) }}%
                    </span>
                  </div>
                  <p class="font-bold text-xs sm:text-sm text-[#1b1d20] truncate">{{ g.title }}</p>
                  <p class="text-[11px] text-[#6e6e6e] mt-0.5">{{ currency() }} {{ goalSaved(g).toFixed(0) }} / {{ g.targetAmount }}</p>
                </button>
              }
            </div>
          </section>

          <!-- Active Goal Hero Card -->
          @if (activeGoal(); as goal) {
            <section class="rounded-[24px] bg-[#1b1d20] text-white p-6 shadow-parker-md relative overflow-hidden">
              <div class="flex items-start justify-between gap-3 mb-5">
                <div class="flex items-center gap-3">
                  <div class="w-14 h-14 rounded-[18px] bg-white/10 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                    {{ goal.emoji }}
                  </div>
                  <div>
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-white/60">🎯 Meta Seleccionada</span>
                    <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white">{{ goal.title }}</h2>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    (click)="openEdit(goal)"
                    title="Editar meta"
                    class="tap-btn w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-colors"
                  >
                    ✏️
                  </button>
                  @if (canDeleteGoal(goal) && goals().length > 1) {
                    <button
                      type="button"
                      (click)="deleteGoal(goal.id)"
                      title="Eliminar meta"
                      class="tap-btn w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/80 flex items-center justify-center text-sm transition-colors"
                    >
                      🗑️
                    </button>
                  }
                </div>
              </div>

              <div class="flex items-baseline justify-between mb-2">
                <div>
                  <span class="text-3xl font-bold tracking-tight text-white">{{ currency() }} {{ goalSaved(goal).toFixed(0) }}</span>
                  <span class="text-xs font-medium text-white/70 ml-2">de {{ currency() }} {{ goal.targetAmount }}</span>
                </div>
                <span class="px-3 py-1 rounded-full bg-[#5196fe] text-white text-xs font-bold">{{ goalPct(goal) }}%</span>
              </div>

              <!-- Progress bar -->
              <div class="w-full h-3.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  class="h-full rounded-full bg-[#5196fe] transition-all duration-500"
                  [style.width.%]="goalPct(goal)"
                ></div>
              </div>

              @if (goalPct(goal) >= 100) {
                <div class="mt-4 px-4 py-2.5 rounded-full bg-emerald-500 text-white text-xs font-bold text-center">
                  🎉 ¡Meta alcanzada con éxito por la familia!
                </div>
              }
            </section>

            <!-- 1-Tap Deposit Buttons -->
            <section class="rounded-[24px] bg-white border border-[#e1dfd8] p-5 sm:p-6 shadow-sm">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-bold text-base text-[#1b1d20]">
                  🐷 Aportar a {{ goal.title }}
                </h3>
                @if (justAdded()) {
                  <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full animate-bounce">
                    ✨ +{{ currency() }} {{ justAdded() }} ¡Listo!
                  </span>
                }
              </div>
              <p class="text-xs text-[#6e6e6e] mb-3">Toca el monto que pusiste en la alcancía física o transferiste.</p>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
                @for (amt of amounts; track amt) {
                  <button
                    type="button"
                    (click)="deposit(goal.id, amt)"
                    class="tap-btn py-3 px-2 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] hover:border-[#5196fe] hover:bg-white text-[#1b1d20] font-bold text-sm shadow-sm transition-all"
                  >
                    +{{ currency() }} {{ amt }}
                  </button>
                }
              </div>
            </section>
          }
        </div>

        <!-- Right Column: Contribution History -->
        <div class="lg:col-span-7 space-y-6">
          <section class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <h3 class="font-bold text-base text-[#1b1d20]">
                Aportes en {{ activeGoal()?.title || 'Alcancía' }} ({{ activeGoal()?.contributions?.length || 0 }})
              </h3>
              @if (activeGoal()?.contributions?.length) {
                <span class="text-xs text-[#6e6e6e]">Últimos movimientos</span>
              }
            </div>

            @if (!activeGoal() || !activeGoal().contributions?.length) {
              <div class="rounded-[24px] bg-[#f8f7f4] border border-dashed border-[#e1dfd8] p-8 text-center">
                <span class="text-4xl block mb-2">🐷</span>
                <p class="font-bold text-base text-[#1b1d20]">Esta meta espera el primer aporte</p>
                <p class="text-xs text-[#6e6e6e] mt-1 max-w-sm mx-auto">
                  Toca uno de los montos a la izquierda (+{{ currency() }} 10, +{{ currency() }} 20...) para registrar el primer aporte familiar.
                </p>
              </div>
            } @else {
              <div class="rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] divide-y divide-[#e1dfd8] overflow-hidden">
                @for (c of activeGoal().contributions.slice(0, 20); track c.id) {
                  <div class="flex items-center justify-between p-3.5 sm:p-4 bg-[#f2f1ec]">
                    <div class="flex items-center gap-3">
                      <div [class]="'w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs ' + memberColor(c.memberName)">
                        {{ (c.memberName || 'F').slice(0, 2).toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-semibold text-sm text-[#1b1d20]">{{ c.memberName }} aportó</p>
                        <p class="text-xs text-[#6e6e6e]">{{ timeAgo(c.createdAt) }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="px-3 py-1 rounded-full bg-white border border-[#e1dfd8] text-[#5196fe] font-bold text-sm">
                        +{{ currency() }} {{ c.amount }}
                      </span>
                      @if (canDeleteContrib(c)) {
                        <button
                          type="button"
                          (click)="storage.removeSavingsContribution(activeGoal().id, c.id)"
                          title="Eliminar aporte"
                          class="tap-btn p-1.5 text-[#a3a3a3] hover:text-[#f9754e] text-xs"
                        >
                          🗑️
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </section>
        </div>
      </div>

      <!-- Add / Edit Goal Modal -->
      @if (modalMode()) {
        <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div class="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-[#e1dfd8] space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg text-[#1b1d20]">
                {{ modalMode() === 'add' ? 'Nueva Meta Familiar' : 'Editar Meta' }}
              </h3>
              <button
                type="button"
                (click)="modalMode.set(null)"
                class="tap-btn w-8 h-8 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-[#1b1d20] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-[#6e6e6e] mb-2">Ideas predeterminadas (1 toque)</p>
              <div class="grid grid-cols-2 gap-2">
                @for (p of presets; track p.id) {
                  <button
                    type="button"
                    (click)="goalTitle = p.title; goalEmoji = p.emoji; targetAmount = p.defaultTarget"
                    [class]="'tap-btn p-3 rounded-[16px] border text-left transition-all ' + (goalTitle === p.title ? 'bg-[#f2f1ec] border-[#5196fe] ring-1 ring-[#5196fe]' : 'bg-[#f8f7f4] border-[#e1dfd8] hover:border-[#5196fe]')"
                  >
                    <span class="text-2xl block mb-1">{{ p.emoji }}</span>
                    <span class="font-bold text-xs block text-[#1b1d20]">{{ p.title }}</span>
                  </button>
                }
              </div>
            </div>

            <form (ngSubmit)="saveModal()" class="space-y-3 pt-2">
              <div>
                <label class="block text-xs font-semibold text-[#6e6e6e] mb-1">Nombre de la meta</label>
                <input
                  type="text"
                  [(ngModel)]="goalTitle"
                  name="goalTitle"
                  placeholder="Ej. Recibo de Luz, Paseo de fin de semana..."
                  class="w-full px-4 py-2.5 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-sm text-[#1b1d20] focus:bg-white focus:border-[#5196fe] focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#6e6e6e] mb-1">Monto objetivo ({{ currency() }})</label>
                <input
                  type="number"
                  [(ngModel)]="targetAmount"
                  name="targetAmount"
                  min="10"
                  placeholder="Monto objetivo (ej. 300)"
                  class="w-full px-4 py-2.5 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-sm text-[#1b1d20] focus:bg-white focus:border-[#5196fe] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                class="tap-btn w-full py-3.5 rounded-full bg-[#5196fe] hover:bg-[#3b82f6] text-white font-bold text-sm shadow-sm transition-colors mt-2"
              >
                {{ modalMode() === 'add' ? 'Crear Meta Familiar' : 'Guardar Cambios' }}
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class SavingsComponent {
  storage = inject(StorageService);
  amounts = SAVINGS_AMOUNTS;
  presets = SAVINGS_GOAL_PRESETS;
  selectedGoalId = signal<string | null>(null);
  modalMode = signal<'add' | 'edit' | null>(null);
  justAdded = signal<number | null>(null);

  goalTitle = '';
  goalEmoji = '💡';
  targetAmount = 400;

  currency = () => this.storage.roomState()?.meta?.currency || 'S/';
  goals = (): any[] => this.storage.roomState()?.savings?.goals || [];
  activeGoal = () => this.goals().find((g) => g.id === this.selectedGoalId()) || this.goals()[0] || null;

  goalSaved(g: any): number {
    return (g?.contributions || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
  }

  goalPct(g: any): number {
    return Math.min(100, Math.round((this.goalSaved(g) / (g?.targetAmount || 1)) * 100));
  }

  totalAll = () => this.goals().reduce((sum, g) => sum + this.goalSaved(g), 0);

  memberColor(name: string): string {
    return getMemberColor(name);
  }

  canDeleteGoal(goal: any): boolean {
    const s = this.storage.session();
    return s?.role === 'admin' || goal.createdBy === s?.memberName;
  }

  canDeleteContrib(c: any): boolean {
    const s = this.storage.session();
    return s?.role === 'admin' || c.memberName === s?.memberName;
  }

  deposit(goalId: string, amt: number): void {
    this.storage.addSavingsContribution(goalId, amt);
    this.justAdded.set(amt);
    setTimeout(() => this.justAdded.set(null), 1200);
  }

  openAdd(): void {
    this.goalTitle = 'Pago de Luz';
    this.goalEmoji = '💡';
    this.targetAmount = 300;
    this.modalMode.set('add');
  }

  openEdit(goal: any): void {
    this.goalTitle = goal.title;
    this.goalEmoji = goal.emoji;
    this.targetAmount = goal.targetAmount;
    this.modalMode.set('edit');
  }

  deleteGoal(goalId: string): void {
    this.storage.deleteSavingsGoal(goalId);
    this.selectedGoalId.set(null);
  }

  saveModal(): void {
    const mode = this.modalMode();
    if (mode === 'add') {
      this.storage.addSavingsGoal({
        title: this.goalTitle.trim() || 'Nueva Meta',
        emoji: this.goalEmoji,
        targetAmount: Number(this.targetAmount) || 500,
      });
    } else if (mode === 'edit' && this.activeGoal()) {
      this.storage.updateSavingsGoal(this.activeGoal().id, {
        title: this.goalTitle.trim() || this.activeGoal().title,
        emoji: this.goalEmoji,
        targetAmount: Number(this.targetAmount) || this.activeGoal().targetAmount,
      });
    }
    this.modalMode.set(null);
  }

  timeAgo(ts: number): string {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'Hace un momento';
    if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h} h`;
    return `Hace ${Math.floor(h / 24)} d`;
  }
}
