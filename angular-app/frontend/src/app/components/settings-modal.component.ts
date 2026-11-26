import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1b1d20]/40 backdrop-blur-sm p-0 sm:p-4">
        <div class="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[24px] p-6 border border-[#e1dfd8] shadow-parker-md max-h-[88vh] overflow-y-auto space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-[#1b1d20]">
                Ajustes del Hogar
              </h2>
              <p class="text-xs font-medium text-[#6e6e6e]">
                {{ storage.session()?.memberName }} • {{ isAdmin() ? 'Administrador' : 'Integrante' }}
              </p>
            </div>
            <button type="button" (click)="close.emit()" class="tap-btn w-9 h-9 rounded-full bg-[#f2f1ec] text-[#1b1d20] font-medium">
              ✕
            </button>
          </div>

          <div class="p-4 rounded-[24px] bg-[#1b1d20] text-white space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-medium text-[#a3a3a3]">
                  {{ storage.roomState()?.meta?.familyName || 'Código de Familia' }}
                </p>
                <p class="font-semibold text-xl text-white tracking-wider mt-0.5">
                  {{ storage.session()?.roomCode }}
                </p>
              </div>
              <button type="button" (click)="copyCode()" class="tap-btn px-4 py-2.5 rounded-full bg-[#5196fe] text-white font-medium text-xs">
                {{ copied() ? '¡Copiado!' : 'Copiar' }}
              </button>
            </div>

            @if (isAdmin()) {
              <div class="pt-3 border-t border-white/15 space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs text-[#a3a3a3]">Invitar con código generado</span>
                  <button
                    type="button"
                    (click)="createInvite()"
                    class="tap-btn px-3.5 py-1.5 rounded-full bg-[#f9754e] text-white text-xs font-medium"
                  >
                    + Generar invitación
                  </button>
                </div>

                @if (lastInviteCode()) {
                  <div class="space-y-2 bg-white/10 rounded-[12.8px] p-3">
                    <div class="flex items-center justify-between gap-2">
                      <div>
                        <p class="text-[11px] text-[#a3a3a3]">Código generado</p>
                        <p class="font-semibold text-sm text-white tracking-wider">{{ lastInviteCode() }}</p>
                      </div>
                      <button
                        type="button"
                        (click)="copyInvite(lastInviteCode())"
                        class="tap-btn px-3 py-1.5 rounded-full bg-white text-[#1b1d20] text-xs font-medium"
                      >
                        {{ inviteCopied() ? '¡Copiado!' : 'Copiar código' }}
                      </button>
                    </div>

                    <div class="pt-2 border-t border-white/15 space-y-2">
                      <p class="text-[11px] text-[#a3a3a3]">Link de invitación</p>
                      <p class="text-xs text-white/90 bg-black/25 rounded-[10px] px-2.5 py-2 truncate font-mono">
                        {{ inviteLink() }}
                      </p>
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="copyInviteLink()"
                          class="tap-btn flex-1 py-2 rounded-full bg-[#5196fe] text-white text-xs font-medium"
                        >
                          {{ linkCopied() ? '¡Link copiado!' : '🔗 Copiar link' }}
                        </button>
                        <button
                          type="button"
                          (click)="shareInviteLink()"
                          class="tap-btn px-4 py-2 rounded-full bg-white text-[#1b1d20] text-xs font-medium"
                        >
                          Compartir
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="space-y-2.5">
            <h3 class="text-xs font-medium text-[#6e6e6e]">Mis Preferencias</h3>

            <div class="flex items-center justify-between p-4 rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8]">
              <div>
                <p class="font-medium text-sm text-[#1b1d20]">Notificaciones en vivo</p>
                <p class="text-xs text-[#6e6e6e]">
                  {{ notif.permission() === 'granted' ? 'Activas en este dispositivo' : 'Recibe avisos de compras, metas y tareas' }}
                </p>
              </div>
              @if (notif.permission() === 'granted') {
                <button type="button" (click)="testNotif()" class="tap-btn px-4 py-2 rounded-full bg-[#5196fe] text-white text-xs font-medium">
                  Probar
                </button>
              } @else {
                <button type="button" (click)="requestNotif.emit()" class="tap-btn px-4 py-2 rounded-full bg-[#5196fe] text-white text-xs font-medium">
                  Activar
                </button>
              }
            </div>

            <div class="flex items-center justify-between p-4 rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8]">
              <div>
                <p class="font-medium text-sm text-[#1b1d20]">Ubicación en tiempo real</p>
                <p class="text-xs text-[#6e6e6e]">
                  {{ isSharingLocation ? 'Tu familia puede ver tu ubicación' : 'Comparte dónde estás con 1 toque' }}
                </p>
              </div>
              <button
                type="button"
                (click)="toggleLocation.emit()"
                [class]="'tap-btn px-4 py-2 rounded-full text-xs font-medium text-white ' + (isSharingLocation ? 'bg-[#f9754e]' : 'bg-[#5196fe]')"
              >
                {{ isSharingLocation ? 'Detener' : 'Compartir' }}
              </button>
            </div>
          </div>

          @if (isAdmin()) {
            <div class="pt-4 border-t border-[#e1dfd8] space-y-4">
              <h3 class="text-xs font-medium text-[#6e6e6e]">Controles de Administrador</h3>

              <div>
                <label class="block text-xs font-medium text-[#6e6e6e] mb-2">Moneda del hogar</label>
                <div class="flex flex-wrap gap-2">
                  @for (cur of currencies; track cur) {
                    <button
                      type="button"
                      (click)="storage.updateCurrency(cur)"
                      [class]="'tap-btn px-4 py-2 rounded-full text-xs font-medium border ' + (currency() === cur ? 'bg-[#5196fe] text-white border-[#5196fe]' : 'bg-white text-[#1b1d20] border-[#e1dfd8]')"
                    >
                      {{ cur }}
                    </button>
                  }
                </div>
              </div>

              <form (ngSubmit)="saveBudget()">
                <label class="block text-xs font-medium text-[#6e6e6e] mb-2">
                  Presupuesto Semanal ({{ currency() }})
                </label>
                <div class="flex gap-2">
                  <input
                    type="number"
                    [(ngModel)]="budget"
                    name="budget"
                    min="50"
                    step="10"
                    class="parker-input flex-1 px-4 py-2.5 text-sm font-medium"
                  />
                  <button type="submit" class="tap-btn px-5 py-2.5 rounded-full bg-[#5196fe] text-white font-medium text-xs">
                    Guardar
                  </button>
                </div>
              </form>

              <div class="p-4 rounded-[24px] bg-[#f2f1ec] border border-[#e1dfd8]">
                <h4 class="font-medium text-sm text-[#1b1d20] mb-2">Reiniciar Semana / Mes</h4>
                @if (!confirmReset()) {
                  <button type="button" (click)="confirmReset.set(true)" class="tap-btn w-full py-2.5 rounded-full border border-[#1b1d20] text-[#1b1d20] font-medium text-xs">
                    Reiniciar Semana
                  </button>
                } @else {
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="storage.resetWeeklyExpenses(); confirmReset.set(false); close.emit()"
                      class="tap-btn flex-1 py-2.5 rounded-full bg-[#f9754e] text-white font-medium text-xs"
                    >
                      Sí, reiniciar
                    </button>
                    <button type="button" (click)="confirmReset.set(false)" class="tap-btn px-4 py-2.5 rounded-full bg-white border border-[#e1dfd8] text-[#1b1d20] font-medium text-xs">
                      Cancelar
                    </button>
                  </div>
                }
              </div>

              <div>
                <h4 class="text-xs font-medium text-[#6e6e6e] mb-2">
                  Integrantes ({{ otherMembers().length + 1 }})
                </h4>
                @for (m of otherMembers(); track m.name) {
                  <div class="flex items-center justify-between p-3 rounded-[12.8px] bg-[#f2f1ec] mb-2">
                    <span class="font-medium text-sm text-[#1b1d20]">{{ m.statusEmoji }} {{ m.name }}</span>
                    <button type="button" (click)="storage.removeMember(m.name)" class="tap-btn px-3 py-1 rounded-full bg-white border border-[#e1dfd8] text-[#6e6e6e] text-xs font-medium">
                      Quitar
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class SettingsModalComponent {
  storage = inject(StorageService);
  notif = inject(NotificationService);

  @Input() isOpen = false;
  @Input() isSharingLocation = false;
  @Output() close = new EventEmitter<void>();
  @Output() requestNotif = new EventEmitter<void>();
  @Output() toggleLocation = new EventEmitter<void>();

  currencies = ['S/', '$', '€', 'MXN', 'COP'];
  budget = 500;
  copied = signal(false);
  inviteCopied = signal(false);
  linkCopied = signal(false);
  lastInviteCode = signal('');
  confirmReset = signal(false);

  inviteLink = (): string => {
    const code = this.lastInviteCode();
    if (!code || typeof window === 'undefined') return '';
    return `${window.location.origin}/?invite=${encodeURIComponent(code)}`;
  };

  createInvite(): void {
    const code = this.storage.generateInviteCode();
    if (code) {
      this.lastInviteCode.set(code);
      this.inviteCopied.set(false);
      this.linkCopied.set(false);
    }
  }

  copyInvite(code: string): void {
    navigator.clipboard?.writeText(code).catch(() => {});
    this.inviteCopied.set(true);
    setTimeout(() => this.inviteCopied.set(false), 1500);
  }

  copyInviteLink(): void {
    const url = this.inviteLink();
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 1500);
  }

  async shareInviteLink(): Promise<void> {
    const url = this.inviteLink();
    const family = this.storage.roomState()?.meta?.familyName || 'nuestro hogar';
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${family} en Hogar Conectado`,
          text: `Usa este enlace para unirte a ${family} (código: ${this.lastInviteCode()}):`,
          url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    this.copyInviteLink();
  }

  isAdmin = () => this.storage.session()?.role === 'admin';
  currency = () => this.storage.roomState()?.meta?.currency || 'S/';

  otherMembers = (): any[] => {
    const me = this.storage.session()?.memberName;
    return Object.values(this.storage.roomState()?.members || {}).filter((m: any) => m.name !== me);
  };

  copyCode(): void {
    navigator.clipboard?.writeText(this.storage.session()?.roomCode || '').catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  testNotif(): void {
    this.notif.sendBrowserNotification('Hogar Conectado', {
      body: '¡Prueba de notificación exitosa!',
      emoji: '🔔',
    });
  }

  saveBudget(): void {
    this.storage.updateBudget(this.budget);
  }
}
