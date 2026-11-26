import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MEMBER_STATUSES } from '../constants/family-presets';
import { StorageService } from '../services/storage.service';
import { AppNotification, NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#e1dfd8]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 pt-3 pb-3">
        <div class="flex items-center justify-between gap-2">
          <!-- Left: User greeting & Room Code -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="lg:hidden w-9 h-9 rounded-[12.8px] bg-[#5196fe] flex items-center justify-center text-white font-semibold text-base shrink-0">
              H
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-base sm:text-lg tracking-[-0.02em] text-[#1b1d20] truncate">
                  Hola, {{ storage.session()?.memberName }}
                </span>
                <button
                  type="button"
                  (click)="copyCode()"
                  class="tap-btn inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-[#f2f1ec] text-[#1b1d20] border border-[#e1dfd8] shrink-0"
                  title="Copiar código de la sala"
                >
                  {{ copied() ? '¡Copiado!' : 'Sala ' + storage.session()?.roomCode }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Actions (Bell, GPS, Settings, Logout) -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Notification Bell Icon with Count Badge & Pop-up -->
            <div class="relative">
              <button
                type="button"
                (click)="toggleNotificationsPopup()"
                class="tap-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#e1dfd8] bg-white hover:bg-[#f2f1ec] text-[#1b1d20] flex items-center justify-center relative text-base sm:text-lg transition-colors"
                title="Notificaciones"
              >
                <span>🔔</span>
                @if (unreadCount() > 0) {
                  <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f9754e] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {{ unreadCount() > 9 ? '9+' : unreadCount() }}
                  </span>
                }
              </button>

              <!-- Notifications Pop-up Dropdown -->
              @if (notificationsOpen()) {
                <div class="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-[24px] bg-white border border-[#e1dfd8] shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                  <div class="flex items-center justify-between pb-2 border-b border-[#e1dfd8]">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-[#1b1d20]">Notificaciones</span>
                      @if (unreadCount() > 0) {
                        <span class="px-2 py-0.5 rounded-full bg-[#f9754e] text-white text-[10px] font-bold">
                          {{ unreadCount() }} nuevas
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      @if (allNotifications().length > 0) {
                        <button
                          type="button"
                          (click)="markAllRead()"
                          class="text-[11px] font-medium text-[#5196fe] hover:underline"
                        >
                          Marcar leídas
                        </button>
                        <span class="text-[#e1dfd8]">•</span>
                        <button
                          type="button"
                          (click)="clearAllNotifs()"
                          class="text-[11px] font-medium text-[#797876] hover:text-[#f9754e]"
                        >
                          Limpiar
                        </button>
                      }
                      <button
                        type="button"
                        (click)="notificationsOpen.set(false)"
                        class="w-6 h-6 rounded-full bg-[#f2f1ec] text-[#1b1d20] text-xs font-bold flex items-center justify-center ml-1 hover:bg-[#e1dfd8]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- Notification list -->
                  @if (allNotifications().length === 0) {
                    <div class="py-6 text-center">
                      <span class="text-3xl block mb-1">🎉</span>
                      <p class="text-xs font-bold text-[#1b1d20]">¡Estás al día!</p>
                      <p class="text-[11px] text-[#6e6e6e] mt-0.5 max-w-[220px] mx-auto">
                        No hay notificaciones pendientes en tu hogar en este momento.
                      </p>
                    </div>
                  } @else {
                    <div class="max-h-72 overflow-y-auto space-y-2 pr-1">
                      @for (n of allNotifications(); track n.id) {
                        <div
                          [class]="'p-3 rounded-[16px] border flex items-start gap-2.5 transition-colors ' + (!n.read ? 'bg-[#f2f1ec] border-[#5196fe]/30' : 'bg-[#f8f7f4] border-[#e1dfd8] opacity-80')"
                        >
                          <span class="text-xl shrink-0 mt-0.5">{{ n.emoji }}</span>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-1">
                              <p class="font-bold text-xs text-[#1b1d20] truncate">{{ n.title }}</p>
                              <span class="text-[10px] text-[#797876] shrink-0">{{ formatTime(n.timestamp) }}</span>
                            </div>
                            <p class="text-xs text-[#414753] mt-0.5 leading-snug">{{ n.body }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Location sharing toggle -->
            <button
              type="button"
              (click)="toggleLocation.emit()"
              [class]="'tap-btn px-3.5 py-2 rounded-full border text-xs font-semibold ' + (isSharingLocation ? 'bg-[#f9754e] border-[#f9754e] text-white' : 'bg-white border-[#e1dfd8] text-[#1b1d20] hover:bg-[#f2f1ec]')"
              title="Ubicación en tiempo real"
            >
              {{ isSharingLocation ? '📍 En vivo' : '📍 Ubicación' }}
            </button>

            <!-- Settings button -->
            <button
              type="button"
              (click)="openSettings.emit()"
              class="tap-btn px-3.5 py-2 rounded-full border border-[#e1dfd8] bg-[#f2f1ec] text-[#1b1d20] text-xs font-semibold hover:bg-[#e1dfd8]"
              title="Ajustes del Hogar"
            >
              Ajustes
            </button>

            <!-- Logout button -->
            <button
              type="button"
              (click)="logout.emit()"
              class="tap-btn px-4 py-2 rounded-full border border-[#1b1d20] bg-transparent text-[#1b1d20] text-xs font-semibold hover:bg-[#1b1d20] hover:text-white transition-colors"
              title="Salir"
            >
              Salir
            </button>
          </div>
        </div>

        <!-- 1-Tap Statuses -->
        <div class="mt-3 pt-2.5 border-t border-[#e1dfd8]">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span class="text-xs font-semibold text-[#6e6e6e] shrink-0 mr-1">
              Mi estado:
            </span>
            @for (st of allStatuses(); track st.id) {
              <div class="inline-flex items-center shrink-0">
                <button
                  type="button"
                  (click)="storage.updateMemberStatus(st)"
                  [class]="'tap-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ' + (myStatusId() === st.id ? 'bg-[#1b1d20] text-white border-[#1b1d20]' : 'bg-white text-[#1b1d20] border-[#e1dfd8] hover:bg-[#f2f1ec]')"
                >
                  <span>{{ st.emoji }}</span>
                  <span>{{ st.label }}</span>
                </button>
                @if (st.id.startsWith('custom_')) {
                  <button
                    type="button"
                    (click)="storage.removeCustomStatus(st.id)"
                    class="ml-1 w-5 h-5 rounded-full text-[#797876] hover:text-[#1b1d20] text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                }
              </div>
            }
            <button
              type="button"
              (click)="addingStatus.set(!addingStatus())"
              class="tap-btn shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#e1dfd8] bg-[#f2f1ec] text-[#1b1d20]"
            >
              + Nuevo estado
            </button>
          </div>

          @if (addingStatus()) {
            <form (ngSubmit)="createStatus()" class="mt-2.5 flex flex-wrap items-center gap-2 p-3 rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8]">
              <div class="flex gap-1">
                @for (em of statusEmojis; track em) {
                  <button
                    type="button"
                    (click)="newStatusEmoji = em"
                    [class]="'w-8 h-8 rounded-full text-base flex items-center justify-center border ' + (newStatusEmoji === em ? 'bg-[#5196fe] border-[#5196fe] text-white' : 'bg-white border-[#e1dfd8]')"
                  >
                    {{ em }}
                  </button>
                }
              </div>
              <input
                type="text"
                [(ngModel)]="newStatusLabel"
                name="newStatusLabel"
                placeholder="Ej. En el gym, En clase..."
                maxlength="28"
                class="parker-input flex-1 min-w-[140px] px-3.5 py-2 text-xs font-medium"
              />
              <button type="submit" class="tap-btn px-4 py-2 rounded-full bg-[#5196fe] text-white text-xs font-semibold">
                Guardar
              </button>
            </form>
          }

          @if (membersList().length > 0) {
            <div class="flex items-center gap-2 overflow-x-auto pt-2">
              @for (m of membersList(); track m.name) {
                <div class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f1ec] border border-[#e1dfd8] text-xs font-medium text-[#1b1d20]">
                  <span>{{ m.statusEmoji || '🏠' }}</span>
                  <span>{{ m.name }}:</span>
                  <span class="text-[#6e6e6e]">{{ m.statusLabel || 'En casa' }}</span>
                  @if (m.location?.lat && m.location?.lng) {
                    <a
                      [href]="'https://www.google.com/maps?q=' + m.location.lat + ',' + m.location.lng"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="ml-1 text-[#5196fe] font-medium hover:underline"
                    >
                      Mapa
                    </a>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  storage = inject(StorageService);
  notif = inject(NotificationService);

  @Input() isSharingLocation = false;
  @Output() requestNotif = new EventEmitter<void>();
  @Output() toggleLocation = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  copied = signal(false);
  addingStatus = signal(false);
  notificationsOpen = signal(false);

  newStatusLabel = '';
  newStatusEmoji = '🏋️';
  statusEmojis = ['🏋️', '🏫', '🏥', '🚗', '🍽️', '🎮', '😴', '🛍️'];

  membersList = () => Object.values(this.storage.roomState()?.members || {}) as any[];
  allStatuses = () => [...MEMBER_STATUSES, ...(this.storage.roomState()?.customStatuses || [])];
  myStatusId = () => {
    const name = this.storage.session()?.memberName;
    return (name && this.storage.roomState()?.members?.[name]?.statusId) || 'home';
  };

  // Dynamic notifications combining stored notifications + current active household priorities
  allNotifications = computed(() => {
    const list = [...this.notif.notifications()];

    // Also include pending shopping and urgent chores if not already in notifications
    const state = this.storage.roomState();
    if (state) {
      const pendingShopping = state.shopping?.pending || [];
      for (const item of pendingShopping.slice(0, 3)) {
        const id = `shop_notif_${item.id}`;
        if (!list.some((n) => n.id === id)) {
          list.push({
            id,
            title: 'Falta comprar',
            body: `${item.requestedBy || 'Familia'} pidió: ${item.label}`,
            emoji: item.emoji || '🛒',
            module: 'shopping',
            timestamp: item.createdAt || Date.now(),
            read: false,
          });
        }
      }

      const chores = state.chores || [];
      const urgentChores = chores.filter((c: any) => c.status === 'urgent');
      for (const ch of urgentChores.slice(0, 3)) {
        const id = `chore_notif_${ch.id}`;
        if (!list.some((n) => n.id === id)) {
          list.push({
            id,
            title: 'Tarea Urgente',
            body: `Se necesita atención en: ${ch.label}`,
            emoji: ch.emoji || '🧹',
            module: 'chores',
            timestamp: ch.updatedAt || Date.now(),
            read: false,
          });
        }
      }
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  });

  unreadCount = computed(() => this.allNotifications().filter((n) => !n.read).length);

  toggleNotificationsPopup(): void {
    const next = !this.notificationsOpen();
    this.notificationsOpen.set(next);
    if (next && this.notif.permission() !== 'granted') {
      this.notif.requestPermission().catch(() => {});
    }
  }

  markAllRead(): void {
    this.notif.markAllAsRead();
  }

  clearAllNotifs(): void {
    this.notif.clearAll();
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs} h`;
    return `Hace ${Math.floor(hrs / 24)} d`;
  }

  copyCode(): void {
    const code = this.storage.session()?.roomCode || '';
    navigator.clipboard?.writeText(code).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  createStatus(): void {
    if (!this.newStatusLabel.trim()) return;
    this.storage.addCustomStatus(this.newStatusLabel.trim(), this.newStatusEmoji);
    this.newStatusLabel = '';
    this.addingStatus.set(false);
  }
}
