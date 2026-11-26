import { Component, OnDestroy, inject, signal } from '@angular/core';
import { StorageService } from './services/storage.service';
import { NotificationService } from './services/notification.service';
import { OnboardingComponent } from './components/onboarding.component';
import { HeaderComponent } from './components/header.component';
import { BottomNavComponent } from './components/bottom-nav.component';
import { HomeComponent } from './components/home.component';
import { ShoppingComponent } from './components/shopping.component';
import { SavingsComponent } from './components/savings.component';
import { ChoresComponent } from './components/chores.component';
import { EventsComponent } from './components/events.component';
import { LocationComponent } from './components/location.component';
import { SettingsModalComponent } from './components/settings-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    OnboardingComponent,
    HeaderComponent,
    BottomNavComponent,
    HomeComponent,
    ShoppingComponent,
    SavingsComponent,
    ChoresComponent,
    EventsComponent,
    LocationComponent,
    SettingsModalComponent,
  ],
  template: `
    <!-- Parker Announcement Banner -->
    @if (showBanner()) {
      <div class="w-full h-11 bg-[#5196fe] text-white px-6 flex items-center justify-center relative z-40">
        <p class="text-[13px] sm:text-[14px] font-medium text-center truncate pr-6">
          Hogar Conectado en vivo • Sincroniza compras, ahorros, tareas y ubicación familiar.
        </p>
        <button
          type="button"
          (click)="showBanner.set(false)"
          aria-label="Cerrar aviso"
          class="absolute right-4 text-white/90 hover:text-white text-base leading-none p-1"
        >
          ×
        </button>
      </div>
    }

    @if (!storage.session()) {
      <app-onboarding />
    } @else {
      <div class="min-h-screen bg-white text-[#1b1d20] pb-28 lg:pb-12 lg:pl-64">
        <!-- In-App Toast Notifications -->
        @if (notif.toasts().length > 0) {
          <div class="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2 pointer-events-none">
            @for (t of notif.toasts(); track t.id) {
              <div class="pointer-events-auto flex items-start gap-3 p-4 rounded-[24px] bg-[#1b1d20] text-white shadow-parker-md">
                <span class="text-xl shrink-0">{{ t.emoji }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-xs text-[#a3a3a3]">{{ t.title }}</p>
                  <p class="font-medium text-sm leading-snug mt-0.5">{{ t.body }}</p>
                </div>
                <button type="button" (click)="notif.dismissToast(t.id)" class="p-1 text-[#a3a3a3] hover:text-white">✕</button>
              </div>
            }
          </div>
        }

        <app-header
          [isSharingLocation]="isSharingLocation()"
          (requestNotif)="requestNotifications()"
          (toggleLocation)="toggleLocation()"
          (openSettings)="settingsOpen.set(true)"
          (logout)="handleLogout()"
        />

        <!-- Parker Editorial Section Header -->
        <section class="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-[12.8px] bg-[#1b1d20] text-white text-xs font-medium mb-3">
            <span>{{ heroMeta().emoji }}</span>
            <span>{{ heroMeta().tag }}</span>
          </div>
          <h1 class="text-[32px] sm:text-[48px] font-semibold tracking-[-0.04em] leading-[1.1] text-[#1b1d20]">
            {{ heroMeta().lead }}
            <span class="parker-flourish font-medium text-[#5196fe]">{{ heroMeta().flourish }}</span>
          </h1>
          <p class="text-[16px] text-[#6e6e6e] mt-2 max-w-xl leading-[1.5] tracking-[-0.02em]">
            {{ heroMeta().subtitle }}
          </p>
        </section>

        <main class="max-w-[1200px] mx-auto px-4 sm:px-6 pt-2">
          @if (activeTab() === 'home') {
            <app-home
              [isSharingLocation]="isSharingLocation()"
              (navigate)="activeTab.set($event)"
              (toggleLocation)="toggleLocation()"
            />
          } @else if (activeTab() === 'shopping') {
            <app-shopping />
          } @else if (activeTab() === 'savings') {
            <app-savings />
          } @else if (activeTab() === 'chores') {
            <app-chores />
          } @else if (activeTab() === 'events') {
            <app-events />
          } @else if (activeTab() === 'location') {
            <app-location
              [isSharingLocation]="isSharingLocation()"
              (toggleLocation)="toggleLocation()"
            />
          }
        </main>

        <app-bottom-nav
          [activeTab]="activeTab()"
          [badges]="badges()"
          (changeTab)="activeTab.set($event)"
        />

        <app-settings-modal
          [isOpen]="settingsOpen()"
          [isSharingLocation]="isSharingLocation()"
          (close)="settingsOpen.set(false)"
          (requestNotif)="requestNotifications()"
          (toggleLocation)="toggleLocation()"
        />
      </div>
    }
  `,
})
export class AppComponent implements OnDestroy {
  storage = inject(StorageService);
  notif = inject(NotificationService);

  showBanner = signal(true);
  activeTab = signal('home');
  settingsOpen = signal(false);
  isSharingLocation = signal(false);
  private geoWatchId: number | null = null;

  heroMeta = () => {
    const tab = this.activeTab();
    switch (tab) {
      case 'home':
        return {
          lead: 'Resumen del',
          flourish: 'Hogar',
          tag: 'Inicio • Lo más importante',
          emoji: '🏠',
          subtitle: 'Gastos de la semana, tareas urgentes, próximo evento y ubicación familiar en un vistazo.',
        };
      case 'savings':
        return {
          lead: 'Alcancía',
          flourish: 'familiar',
          tag: 'Metas compartidas',
          emoji: '🐷',
          subtitle: 'Junta aportes con 1 toque para vacaciones, emergencias o pagos del hogar.',
        };
      case 'chores':
        return {
          lead: 'Tareas',
          flourish: 'en equipo',
          tag: 'Orden del hogar',
          emoji: '🧹',
          subtitle: 'Marca lo urgente, asígnate una tarea y celebra cuando quede lista.',
        };
      case 'events':
        return {
          lead: 'Agenda del',
          flourish: 'Hogar',
          tag: 'Agenda compartida',
          emoji: '📅',
          subtitle: 'Sincronización serena de rutinas, avisos y momentos memorables de nuestra familia.',
        };
      case 'location':
        return {
          lead: 'Ubicación',
          flourish: 'en vivo',
          tag: 'Encontrar a tu familia',
          emoji: '📍',
          subtitle: 'Mira dónde está cada integrante y la hora exacta en que compartió su ubicación.',
        };
      default:
        return {
          lead: 'Compras',
          flourish: 'del hogar',
          tag: 'Lista inteligente',
          emoji: '🛒',
          subtitle: 'Agrega lo que falta con 1 toque y controla el presupuesto semanal.',
        };
    }
  };

  badges = () => {
    const state = this.storage.roomState();
    const members = Object.values(state?.members || {}) as any[];
    return {
      shopping: state?.shopping?.pending?.length || 0,
      chores: (state?.chores || []).filter(
        (c: any) => c.status === 'urgent' || c.status === 'assigned'
      ).length,
      events: state?.events?.length || 0,
      location: members.filter((m) => m.location?.lat != null && m.location?.lng != null).length,
    };
  };

  async requestNotifications(): Promise<void> {
    const perm = await this.notif.requestPermission();
    if (perm === 'granted') {
      this.notif.emitToast({
        title: 'Notificaciones',
        body: '¡Avisos en vivo activados para este dispositivo!',
        emoji: '🔔',
      });
    } else if (perm === 'denied') {
      this.notif.emitToast({
        title: 'Permiso bloqueado',
        body: 'Activa las notificaciones desde el candado del navegador.',
        emoji: '⚠️',
      });
    }
  }

  toggleLocation(): void {
    if (!navigator.geolocation) {
      this.notif.emitToast({
        title: 'Ubicación',
        body: 'Tu navegador no soporta geolocalización.',
        emoji: '⚠️',
      });
      return;
    }

    if (this.isSharingLocation()) {
      if (this.geoWatchId !== null) {
        navigator.geolocation.clearWatch(this.geoWatchId);
        this.geoWatchId = null;
      }
      this.isSharingLocation.set(false);
      this.storage.updateMemberLocation(null);
      return;
    }

    this.isSharingLocation.set(true);
    this.geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.storage.updateMemberLocation({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          updatedAt: Date.now(),
        });
      },
      () => {
        this.isSharingLocation.set(false);
        this.notif.emitToast({
          title: 'Ubicación',
          body: 'No se pudo obtener el permiso de ubicación.',
          emoji: '⚠️',
        });
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );
  }

  handleLogout(): void {
    if (this.geoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geoWatchId);
      this.geoWatchId = null;
    }
    this.isSharingLocation.set(false);
    this.storage.logout();
  }

  ngOnDestroy(): void {
    if (this.geoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.geoWatchId);
    }
  }
}
