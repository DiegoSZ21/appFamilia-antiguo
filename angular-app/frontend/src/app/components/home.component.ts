import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="space-y-6">
      <!-- Top 4 KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Compras & Presupuesto -->
        <button
          type="button"
          (click)="navigate.emit('shopping')"
          class="tap-btn text-left rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] hover:border-[#5196fe] p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors"
        >
          <div class="flex items-center justify-between w-full">
            <span class="w-10 h-10 rounded-[14px] bg-white border border-[#e1dfd8] flex items-center justify-center text-xl">
              🛒
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-semibold text-[#1b1d20]">
              {{ pendingShopping().length }} pend.
            </span>
          </div>
          <div>
            <p class="text-xs font-medium text-[#6e6e6e]">Gasto semanal</p>
            <p class="text-xl sm:text-2xl font-bold tracking-[-0.03em] text-[#1b1d20] mt-0.5">
              {{ currency() }} {{ weeklySpent() }}
            </p>
            <p class="text-[11px] text-[#6e6e6e] mt-0.5">
              de {{ currency() }} {{ weeklyBudget() }}
            </p>
          </div>
        </button>

        <!-- Alcancía -->
        <button
          type="button"
          (click)="navigate.emit('savings')"
          class="tap-btn text-left rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] hover:border-[#5196fe] p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors"
        >
          <div class="flex items-center justify-between w-full">
            <span class="w-10 h-10 rounded-[14px] bg-white border border-[#e1dfd8] flex items-center justify-center text-xl">
              🐷
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-semibold text-[#1b1d20]">
              {{ savingsGoals().length }} metas
            </span>
          </div>
          <div>
            <p class="text-xs font-medium text-[#6e6e6e]">Alcancía total</p>
            <p class="text-xl sm:text-2xl font-bold tracking-[-0.03em] text-[#1b1d20] mt-0.5">
              {{ currency() }} {{ totalSaved() }}
            </p>
            <p class="text-[11px] text-[#6e6e6e] mt-0.5 truncate">
              {{ topGoalLabel() }}
            </p>
          </div>
        </button>

        <!-- Tareas -->
        <button
          type="button"
          (click)="navigate.emit('chores')"
          class="tap-btn text-left rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] hover:border-[#5196fe] p-4 sm:p-5 flex flex-col justify-between gap-3 transition-colors"
        >
          <div class="flex items-center justify-between w-full">
            <span class="w-10 h-10 rounded-[14px] bg-white border border-[#e1dfd8] flex items-center justify-center text-xl">
              🧹
            </span>
            @if (urgentChores().length > 0) {
              <span class="px-2.5 py-0.5 rounded-full bg-[#f9754e] text-white text-[11px] font-semibold">
                {{ urgentChores().length }} urgentes
              </span>
            } @else {
              <span class="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-semibold text-[#6e6e6e]">
                Al día
              </span>
            }
          </div>
          <div>
            <p class="text-xs font-medium text-[#6e6e6e]">Tareas activas</p>
            <p class="text-xl sm:text-2xl font-bold tracking-[-0.03em] text-[#1b1d20] mt-0.5">
              {{ activeChores().length }}
            </p>
            <p class="text-[11px] text-[#6e6e6e] mt-0.5">
              {{ doneChoresCount() }} completadas
            </p>
          </div>
        </button>

        <!-- Ubicación en vivo -->
        <button
          type="button"
          (click)="navigate.emit('location')"
          class="tap-btn text-left rounded-[24px] bg-[#5196fe] text-white p-4 sm:p-5 flex flex-col justify-between gap-3"
        >
          <div class="flex items-center justify-between w-full">
            <span class="w-10 h-10 rounded-[14px] bg-white/20 flex items-center justify-center text-xl">
              📍
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">
              En vivo
            </span>
          </div>
          <div>
            <p class="text-xs font-medium text-white/85">Mapa familiar</p>
            <p class="text-xl sm:text-2xl font-bold tracking-[-0.03em] text-white mt-0.5">
              {{ sharingMembers().length }} activos
            </p>
            <p class="text-[11px] text-white/85 mt-0.5">
              Ver ubicación ahora →
            </p>
          </div>
        </button>
      </div>

      <!-- 2-Column Main Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column (7 cols): Lo urgente + Próximo evento -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <!-- Lo más urgente hoy -->
          <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-base text-[#1b1d20]">Prioridades de hoy</h2>
              <span class="text-xs font-medium text-[#6e6e6e]">
                {{ urgentChores().length + pendingShopping().length }} pendientes
              </span>
            </div>

            @if (urgentChores().length === 0 && pendingShopping().length === 0) {
              <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-5 text-center">
                <p class="text-sm font-medium text-[#1b1d20]">¡Todo en orden en casa!</p>
                <p class="text-xs text-[#6e6e6e] mt-1">
                  No hay tareas urgentes ni compras pendientes en este momento.
                </p>
              </div>
            } @else {
              <div class="space-y-2.5">
                @for (chore of urgentChores().slice(0, 3); track chore.id) {
                  <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-3.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-9 h-9 rounded-full bg-[#f9754e]/15 text-[#f9754e] flex items-center justify-center text-lg shrink-0">
                        {{ chore.emoji }}
                      </span>
                      <div class="min-w-0">
                        <p class="font-semibold text-sm text-[#1b1d20] truncate">{{ chore.label }}</p>
                        <p class="text-xs text-[#f9754e] font-medium">Tarea urgente</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      (click)="navigate.emit('chores')"
                      class="tap-btn px-3.5 py-1.5 rounded-full bg-[#f2f1ec] text-[#1b1d20] text-xs font-medium shrink-0"
                    >
                      Atender
                    </button>
                  </div>
                }

                @for (item of pendingShopping().slice(0, 4); track item.id) {
                  <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-3.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-9 h-9 rounded-full bg-[#5196fe]/15 text-[#5196fe] flex items-center justify-center text-lg shrink-0">
                        {{ item.emoji || '🛒' }}
                      </span>
                      <div class="min-w-0">
                        <p class="font-semibold text-sm text-[#1b1d20] truncate">{{ item.label }}</p>
                        <p class="text-xs text-[#6e6e6e]">Falta comprar • Pidió {{ item.requestedBy || item.addedBy || 'Familia' }}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      (click)="navigate.emit('shopping')"
                      class="tap-btn px-3.5 py-1.5 rounded-full bg-[#5196fe] text-white text-xs font-medium shrink-0"
                    >
                      Ir a lista
                    </button>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Próximo Evento -->
          <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-base text-[#1b1d20]">Próximo evento familiar</h2>
              <button
                type="button"
                (click)="navigate.emit('events')"
                class="text-xs font-medium text-[#5196fe] hover:underline"
              >
                Ver agenda →
              </button>
            </div>

            @if (nextEvent(); as evt) {
              <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-11 h-11 rounded-[14px] bg-[#f2f1ec] flex items-center justify-center text-2xl shrink-0">
                    {{ evt.emoji }}
                  </span>
                  <div class="min-w-0">
                    <p class="font-semibold text-sm sm:text-base text-[#1b1d20] truncate">{{ evt.title }}</p>
                    <p class="text-xs text-[#6e6e6e]">
                      {{ evt.dayLabel }} • {{ evt.timeLabel }} • Avisó {{ evt.createdBy }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="navigate.emit('events')"
                  class="tap-btn px-4 py-2 rounded-full bg-[#1b1d20] text-white text-xs font-medium shrink-0"
                >
                  Responder
                </button>
              </div>
            } @else {
              <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-4 flex items-center justify-between gap-3">
                <p class="text-sm text-[#6e6e6e]">No hay eventos próximos registrados.</p>
                <button
                  type="button"
                  (click)="navigate.emit('events')"
                  class="tap-btn px-4 py-2 rounded-full bg-[#5196fe] text-white text-xs font-medium shrink-0"
                >
                  + Crear
                </button>
              </div>
            }
          </section>
        </div>

        <!-- Right Column (5 cols): Familia ahora + Última actividad -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          <!-- Familia ahora -->
          <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-base text-[#1b1d20]">Familia ahora</h2>
              <button
                type="button"
                (click)="toggleLocation.emit()"
                [class]="'tap-btn px-3 py-1 rounded-full text-xs font-medium ' + (isSharingLocation ? 'bg-[#f9754e] text-white' : 'bg-[#5196fe] text-white')"
              >
                {{ isSharingLocation ? '📍 Compartiendo' : '📡 Compartir GPS' }}
              </button>
            </div>

            <div class="space-y-2">
              @for (m of membersList(); track m.name) {
                <div class="bg-white border border-[#e1dfd8] rounded-[18px] p-3 flex items-center justify-between gap-2.5">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-9 h-9 rounded-full bg-[#d6e3ff] text-[#001b3e] text-xs font-semibold flex items-center justify-center shrink-0">
                      {{ m.name.slice(0, 2).toUpperCase() }}
                    </span>
                    <div class="min-w-0">
                      <p class="font-semibold text-sm text-[#1b1d20] truncate">{{ m.name }}</p>
                      <p class="text-xs text-[#6e6e6e] truncate">
                        {{ m.statusEmoji || '🏠' }} {{ m.statusLabel || 'En casa' }}
                      </p>
                    </div>
                  </div>
                  @if (m.location?.lat) {
                    <button
                      type="button"
                      (click)="navigate.emit('location')"
                      class="tap-btn px-3 py-1 rounded-full bg-[#5196fe]/15 text-[#005cb9] text-xs font-medium shrink-0"
                    >
                      En mapa
                    </button>
                  } @else {
                    <span class="text-[11px] text-[#797876] shrink-0">Sin GPS</span>
                  }
                </div>
              }
            </div>
          </section>

          <!-- Última actividad -->
          @if (lastActivity(); as act) {
            <section class="bg-[#1b1d20] text-white rounded-[24px] p-5 space-y-2">
              <span class="text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3]">
                Última actividad
              </span>
              <div class="flex items-start gap-3">
                <span class="text-2xl">{{ act.emoji || '✨' }}</span>
                <div>
                  <p class="font-semibold text-sm text-white">{{ act.title }}</p>
                  <p class="text-xs text-[#a3a3a3] mt-0.5">{{ act.message }}</p>
                </div>
              </div>
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class HomeComponent {
  storage = inject(StorageService);

  @Input() isSharingLocation = false;
  @Output() navigate = new EventEmitter<string>();
  @Output() toggleLocation = new EventEmitter<void>();

  currency = () => this.storage.roomState()?.meta?.currency || 'S/';
  weeklyBudget = () => Number(this.storage.roomState()?.meta?.weeklyBudget) || 500;

  pendingShopping = computed(() => this.storage.roomState()?.shopping?.pending || []);
  boughtShopping = computed(() => this.storage.roomState()?.shopping?.bought || []);
  weeklySpent = computed(() =>
    this.boughtShopping().reduce((sum: number, i: any) => sum + (Number(i.amount ?? i.price) || 0), 0)
  );

  savingsGoals = computed(() => this.storage.roomState()?.savings?.goals || []);
  totalSaved = computed(() =>
    this.savingsGoals().reduce(
      (acc: number, g: any) =>
        acc + (g.contributions || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0),
      0
    )
  );
  topGoalLabel = computed(() => {
    const first = this.savingsGoals()[0];
    return first ? `${first.emoji || '🎯'} ${first.title}` : 'Sin metas aún';
  });

  chores = computed(() => this.storage.roomState()?.chores || []);
  urgentChores = computed(() => this.chores().filter((c: any) => c.status === 'urgent'));
  activeChores = computed(() =>
    this.chores().filter((c: any) => c.status === 'urgent' || c.status === 'assigned')
  );
  doneChoresCount = computed(() => this.chores().filter((c: any) => c.status === 'done').length);

  events = computed(() => this.storage.roomState()?.events || []);
  nextEvent = computed(() => this.events()[0] || null);

  membersList = computed(() => Object.values(this.storage.roomState()?.members || {}) as any[]);
  sharingMembers = computed(() =>
    this.membersList().filter((m) => m.location?.lat != null && m.location?.lng != null)
  );
  lastActivity = computed(() => this.storage.roomState()?.lastActivity || null);
}
