import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SHOPPING_AMOUNTS, SHOPPING_CHIPS, getMemberColor } from '../constants/family-presets';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-shopping',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Helper banner for zero-friction family onboarding -->
      <div class="rounded-[20px] bg-[#f2f1ec] border border-[#e1dfd8] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-full bg-white border border-[#e1dfd8] flex items-center justify-center text-xl shrink-0">
            💡
          </span>
          <div>
            <p class="text-xs font-semibold text-[#1b1d20]">¿Cómo funciona la lista compartida?</p>
            <p class="text-[13px] text-[#6e6e6e] leading-snug">
              Toca un producto abajo para pedirlo al instante. Cuando alguien lo compre en la tienda, toca <strong>&ldquo;Ya lo compré&rdquo;</strong> para registrar el gasto en el presupuesto familiar.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-[#e1dfd8] text-[#1b1d20]">
            {{ pending().length }} por comprar
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Quick Chips -->
        <div class="lg:col-span-5 space-y-6">
          <!-- 1-Tap Quick Chips -->
          <section class="rounded-[24px] bg-white border border-[#e1dfd8] p-5 sm:p-6 shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <h2 class="font-bold text-base text-[#1b1d20]">
                ¿Qué falta comprar? (1 toque)
              </h2>
              <span class="text-[11px] font-medium text-[#6e6e6e]">Sin escribir</span>
            </div>
            <p class="text-xs text-[#6e6e6e] mb-3">
              Toca un producto para pedirlo al instante a toda la familia.
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              @for (chip of chips; track chip.id) {
                <button
                  type="button"
                  [disabled]="isPending(chip.label)"
                  (click)="storage.addShoppingItem(chip)"
                  [class]="'tap-btn flex items-center gap-2 p-2.5 sm:p-3 rounded-[16px] border text-left font-medium text-xs sm:text-sm transition-all ' + (isPending(chip.label) ? 'bg-emerald-50 border-emerald-200 text-emerald-800 opacity-80' : 'bg-[#f8f7f4] border-[#e1dfd8] text-[#1b1d20] hover:border-[#5196fe] hover:bg-white')"
                >
                  <span class="text-lg shrink-0">{{ chip.emoji }}</span>
                  <span class="truncate font-semibold">{{ chip.label }}</span>
                </button>
              }
            </div>

            <!-- Custom item input -->
            <form (ngSubmit)="addCustom()" class="flex gap-2">
              <input
                type="text"
                [(ngModel)]="customText"
                name="customText"
                placeholder="Otro producto (ej. Pan, Café)..."
                class="flex-1 px-4 py-2.5 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-sm text-[#1b1d20] placeholder-[#a3a3a3] focus:outline-none focus:bg-white focus:border-[#5196fe]"
              />
              <button
                type="submit"
                class="tap-btn px-5 py-2.5 rounded-full bg-[#1b1d20] hover:bg-[#5196fe] text-white text-xs sm:text-sm font-bold transition-colors"
              >
                + Pedir
              </button>
            </form>
          </section>
        </div>

        <!-- Right Column: Pending list & Purchase history -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Pending List -->
          <section class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <h2 class="font-bold text-base text-[#1b1d20]">
                Por comprar ahora ({{ pending().length }})
              </h2>
              @if (pending().length > 0) {
                <span class="text-xs text-[#6e6e6e]">
                  Se sincroniza en tiempo real
                </span>
              }
            </div>

            @if (pending().length === 0) {
              <div class="rounded-[24px] bg-[#f8f7f4] border border-dashed border-[#e1dfd8] p-8 text-center">
                <span class="text-4xl block mb-2">🎉</span>
                <p class="font-bold text-base text-[#1b1d20]">¡No falta nada por comprar!</p>
                <p class="text-xs text-[#6e6e6e] mt-1 max-w-sm mx-auto">
                  La alacena está abastecida. Si notas que falta algo, toca un producto a la izquierda para agregarlo.
                </p>
              </div>
            } @else {
              <div class="space-y-2.5">
                @for (item of pending(); track item.id) {
                  <div class="rounded-[20px] bg-white border border-[#e1dfd8] p-4 flex items-center justify-between gap-3 shadow-sm hover:border-[#5196fe] transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-11 h-11 rounded-[14px] bg-[#f2f1ec] border border-[#e1dfd8] flex items-center justify-center text-2xl shrink-0">
                        {{ item.emoji }}
                      </div>
                      <div class="min-w-0">
                        <p class="font-bold text-sm sm:text-base text-[#1b1d20] truncate">
                          {{ item.label }}
                        </p>
                        <p class="text-xs text-[#6e6e6e]">
                          Pidió <span class="font-semibold text-[#1b1d20]">{{ item.requestedBy }}</span>
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        (click)="openBuyModal(item)"
                        class="tap-btn px-4 py-2 rounded-full bg-[#5196fe] hover:bg-[#3b82f6] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
                      >
                        ✅ Ya lo compré
                      </button>
                      <button
                        type="button"
                        (click)="storage.removeShoppingPending(item.id)"
                        title="Eliminar de la lista"
                        class="tap-btn p-2 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-[#a3a3a3] hover:text-[#f9754e] hover:bg-white transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Recent Purchases -->
          @if (bought().length > 0) {
            <section class="space-y-3">
              <h3 class="font-bold text-xs uppercase tracking-wider text-[#6e6e6e] px-1">
                Últimas compras registradas
              </h3>
              <div class="rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8] divide-y divide-[#e1dfd8] overflow-hidden">
                @for (item of bought().slice(0, 10); track item.id) {
                  <div class="flex items-center justify-between p-3.5 sm:p-4 bg-[#f2f1ec]">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-xl shrink-0">{{ item.emoji }}</span>
                      <div class="min-w-0">
                        <p class="font-semibold text-sm text-[#1b1d20] truncate">
                          {{ item.label }}
                        </p>
                        <p class="text-xs text-[#6e6e6e]">Compró <span class="font-medium text-[#1b1d20]">{{ item.boughtBy }}</span></p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="font-bold text-sm text-[#1b1d20] bg-white px-3 py-1 rounded-full border border-[#e1dfd8]">
                        {{ currency() }} {{ (+item.amount || 0).toFixed(2) }}
                      </span>
                      @if (canDeleteBought(item)) {
                        <button
                          type="button"
                          (click)="storage.removeShoppingBought(item.id)"
                          title="Eliminar registro"
                          class="tap-btn p-1.5 text-[#a3a3a3] hover:text-[#f9754e] text-xs"
                        >
                          🗑️
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </div>
      </div>

      <!-- Quick Amount Modal (Join Parker styling) -->
      @if (buyingItem()) {
        <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div class="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-[#e1dfd8] space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#f2f1ec] flex items-center justify-center text-2xl">
                  {{ buyingItem().emoji }}
                </div>
                <div>
                  <h3 class="font-bold text-base text-[#1b1d20]">
                    ¿Cuánto costó {{ buyingItem().label }}?
                  </h3>
                  <p class="text-xs text-[#6e6e6e]">Registrando a nombre de {{ storage.session()?.memberName }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="buyingItem.set(null)"
                class="tap-btn w-8 h-8 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] text-[#1b1d20] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div class="bg-[#f8f7f4] border border-[#e1dfd8] rounded-[20px] p-4 text-center">
              <span class="text-3xl font-bold tracking-tight text-[#1b1d20]">
                {{ currency() }} {{ amountStr() }}
              </span>
            </div>

            <!-- Quick amounts -->
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-[#6e6e6e] mb-2">Montos rápidos</p>
              <div class="grid grid-cols-3 gap-2">
                @for (amt of amounts; track amt) {
                  <button
                    type="button"
                    (click)="addQuickAmount(amt)"
                    class="tap-btn py-2.5 rounded-full bg-[#f2f1ec] border border-[#e1dfd8] hover:border-[#5196fe] text-[#1b1d20] font-bold text-xs sm:text-sm transition-colors"
                  >
                    +{{ currency() }} {{ amt }}
                  </button>
                }
              </div>
            </div>

            <!-- Numeric Keypad -->
            <div class="grid grid-cols-3 gap-2">
              @for (k of keys; track k) {
                <button
                  type="button"
                  (click)="handleKey(k)"
                  class="tap-btn py-3 rounded-[16px] bg-[#f8f7f4] border border-[#e1dfd8] font-bold text-lg text-[#1b1d20] hover:bg-white transition-colors"
                >
                  {{ k === 'DEL' ? '⌫' : k }}
                </button>
              }
            </div>

            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="amountStr.set('0')"
                class="tap-btn px-5 py-3 rounded-full bg-[#f8f7f4] border border-[#e1dfd8] font-bold text-xs sm:text-sm text-[#1b1d20]"
              >
                Limpiar
              </button>
              <button
                type="button"
                (click)="confirmBought()"
                class="tap-btn flex-1 py-3 rounded-full bg-[#5196fe] hover:bg-[#3b82f6] text-white font-bold text-sm shadow-sm transition-colors"
              >
                Guardar compra ({{ currency() }} {{ (+amountStr() || 0).toFixed(2) }})
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ShoppingComponent {
  storage = inject(StorageService);
  chips = SHOPPING_CHIPS;
  amounts = SHOPPING_AMOUNTS;
  keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];
  customText = '';
  buyingItem = signal<any | null>(null);
  amountStr = signal('0');

  pending = (): any[] => this.storage.roomState()?.shopping?.pending || [];
  bought = (): any[] => this.storage.roomState()?.shopping?.bought || [];
  weeklyBudget = (): number => this.storage.roomState()?.meta?.weeklyBudget || 500;
  currency = (): string => this.storage.roomState()?.meta?.currency || 'S/';

  totalSpent = (): number =>
    this.bought().reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  budgetPct = (): number =>
    Math.min(100, Math.round((this.totalSpent() / this.weeklyBudget()) * 100));

  memberBreakdown = () => {
    const totals: Record<string, number> = {};
    for (const item of this.bought()) {
      const who = item.boughtBy || 'Familia';
      totals[who] = (totals[who] || 0) + (Number(item.amount) || 0);
    }
    const membersCount = Math.max(
      Object.keys(this.storage.roomState()?.members || {}).length,
      Object.keys(totals).length,
      1
    );
    const fairShare = this.totalSpent() / membersCount;
    return Object.entries(totals).map(([name, sum]) => ({
      name,
      sum,
      diff: sum - fairShare,
    }));
  };

  abs(n: number): number {
    return Math.abs(n);
  }

  memberColor(name: string): string {
    return getMemberColor(name);
  }

  isPending(label: string): boolean {
    return this.pending().some((p) => p.label.toLowerCase() === label.toLowerCase());
  }

  canDeleteBought(item: any): boolean {
    const sess = this.storage.session();
    return sess?.role === 'admin' || item.boughtBy === sess?.memberName;
  }

  addCustom(): void {
    const label = this.customText.trim();
    if (!label) return;
    this.storage.addShoppingItem({ label, emoji: '🛍️' });
    this.customText = '';
  }

  openBuyModal(item: any): void {
    this.buyingItem.set(item);
    this.amountStr.set('0');
  }

  addQuickAmount(val: number): void {
    const next = (parseFloat(this.amountStr()) || 0) + val;
    this.amountStr.set(String(Math.round(next * 100) / 100));
  }

  handleKey(k: string): void {
    const cur = this.amountStr();
    if (k === 'DEL') {
      this.amountStr.set(cur.length <= 1 ? '0' : cur.slice(0, -1));
      return;
    }
    if (k === '.') {
      if (!cur.includes('.')) this.amountStr.set(`${cur}.`);
      return;
    }
    this.amountStr.set(cur === '0' ? k : `${cur}${k}`);
  }

  confirmBought(): void {
    const item = this.buyingItem();
    if (!item) return;
    this.storage.markItemBought(item.id, parseFloat(this.amountStr()) || 0);
    this.buyingItem.set(null);
  }
}
