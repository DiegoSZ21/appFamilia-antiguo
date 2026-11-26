import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  template: `
    <!-- Desktop Left Sidebar (Join Parker Ledger) -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-30 bg-white border-r border-[#e1dfd8] p-5 pt-14">
      <div class="flex items-center gap-2.5 px-2 py-2 mb-7">
        <div class="w-9 h-9 rounded-[12.8px] bg-[#5196fe] flex items-center justify-center text-white font-semibold text-base shrink-0">
          H
        </div>
        <div>
          <h2 class="font-medium text-[20px] tracking-[-0.023em] text-[#1b1d20] leading-none">
            Hogar
          </h2>
          <p class="text-xs font-medium text-[#6e6e6e] mt-1">
            Gestión familiar
          </p>
        </div>
      </div>

      <nav class="space-y-1.5 flex-1">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            (click)="changeTab.emit(tab.id)"
            [class]="'tap-btn w-full flex items-center justify-between px-4 py-3 rounded-full text-sm transition-colors ' + (activeTab === tab.id ? 'bg-[#5196fe] text-white font-medium' : 'text-[#6e6e6e] hover:bg-[#f2f1ec] hover:text-[#1b1d20] font-medium')"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-base">{{ tab.emoji }}</span>
              <span>{{ tab.shortLabel }}</span>
            </div>
            @if ((badges[tab.id] || 0) > 0) {
              <span [class]="'min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ' + (activeTab === tab.id ? 'bg-white text-[#5196fe]' : 'bg-[#f2f1ec] text-[#1b1d20]')">
                {{ badges[tab.id] > 99 ? '99+' : badges[tab.id] }}
              </span>
            }
          </button>
        }
      </nav>
    </aside>

    <!-- Mobile Bottom Navigation (Parker Pill Bar) -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#e1dfd8] pb-safe">
      <div class="max-w-2xl mx-auto grid grid-cols-6 gap-1 px-1.5 pt-2">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            (click)="changeTab.emit(tab.id)"
            [class]="'tap-btn relative flex flex-col items-center justify-center py-2 rounded-full transition-colors ' + (activeTab === tab.id ? 'bg-[#5196fe] text-white' : 'text-[#6e6e6e]')"
          >
            <div class="relative text-lg leading-none">
              <span>{{ tab.emoji }}</span>
              @if ((badges[tab.id] || 0) > 0) {
                <span [class]="'absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ' + (activeTab === tab.id ? 'bg-white text-[#5196fe]' : 'bg-[#f9754e] text-white')">
                  {{ badges[tab.id] > 99 ? '99+' : badges[tab.id] }}
                </span>
              }
            </div>
            <span class="text-[11px] font-medium mt-1">
              {{ tab.shortLabel }}
            </span>
          </button>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent {
  @Input() activeTab = 'home';
  @Input() badges: Record<string, number> = {};
  @Output() changeTab = new EventEmitter<string>();

  tabs = [
    { id: 'home', label: 'Inicio', shortLabel: 'Inicio', emoji: '🏠' },
    { id: 'shopping', label: 'Compras y Gastos', shortLabel: 'Compras', emoji: '🛒' },
    { id: 'savings', label: 'Alcancía Familiar', shortLabel: 'Alcancía', emoji: '🐷' },
    { id: 'chores', label: 'Tareas del Hogar', shortLabel: 'Tareas', emoji: '🧹' },
    { id: 'events', label: 'Eventos y Avisos', shortLabel: 'Eventos', emoji: '📅' },
    { id: 'location', label: 'Ubicación en Vivo', shortLabel: 'Mapa', emoji: '📍' },
  ];
}
