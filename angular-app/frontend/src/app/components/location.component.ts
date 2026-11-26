import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-location',
  standalone: true,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `],
  template: `
    <div class="space-y-6">
      <!-- Active Members Pill Row -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#414753]">
          Red Segura Familiar
        </span>
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d6e3ff] text-[#001b3e] text-xs font-semibold">
          <span [class]="'w-2 h-2 rounded-full ' + (sharingMembers().length > 0 ? 'bg-[#005cb9] animate-pulse' : 'bg-[#727784]')"></span>
          <span>{{ sharingMembers().length }} {{ sharingMembers().length === 1 ? 'activo' : 'activos' }}</span>
        </div>
      </div>

      <!-- 2-Column Desktop Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left / Primary Column (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <!-- Electric Blue Status Card -->
          <div class="rounded-[24px] bg-[#5196fe] text-white p-6 flex flex-col gap-4 relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none"></div>

            <div class="flex flex-wrap items-start justify-between gap-3 relative z-10">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0">
                  📍
                </div>
                <div class="flex flex-col">
                  <h2 class="text-xl font-semibold tracking-[-0.01em] text-white">
                    {{
                      isSharingLocation
                        ? 'Compartiendo en tiempo real'
                        : 'Ubicación en pausa'
                    }}
                  </h2>
                  <span class="text-xs font-medium text-white/90">
                    {{
                      isSharingLocation
                        ? 'Alta precisión GPS • Sincronizado en vivo'
                        : 'Activa tu GPS para aparecer en el mapa familiar'
                    }}
                  </span>
                </div>
              </div>
              <span class="px-3 py-1 rounded-full bg-white/20 text-[11px] font-semibold uppercase tracking-[0.04em]">
                Encriptado
              </span>
            </div>

            <p class="text-sm text-white/90 relative z-10 max-w-xl">
              Tu familia ve tus desplazamientos instantáneos y la hora exacta de tu última actualización.
            </p>

            <div class="flex flex-wrap items-center gap-2.5 pt-1 relative z-10">
              <button
                type="button"
                (click)="toggleLocation.emit()"
                class="tap-btn px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors"
              >
                {{ isSharingLocation ? 'Dejar de compartir' : 'Compartir mi ubicación' }}
              </button>
              @if (sharingMembers().length > 0) {
                <button
                  type="button"
                  (click)="fitAllMembers()"
                  class="tap-btn px-5 py-2.5 rounded-full bg-[#005cb9] hover:bg-[#00458e] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <span>🎯</span>
                  <span>Centrar a todos</span>
                </button>
              }
            </div>
          </div>

          <!-- Embedded Live Map -->
          <div class="relative w-full h-[460px] sm:h-[520px] rounded-[24px] bg-[#f3f3f7] border border-[#e1dfd8] overflow-hidden">
            <div #mapContainer class="w-full h-full z-10" style="min-height: 460px; width: 100%; height: 100%;"></div>

            <!-- Empty GPS Overlay -->
            @if (sharingMembers().length === 0) {
              <div class="absolute inset-0 z-20 flex items-center justify-center bg-[#f3f3f7]/80 backdrop-blur-[2px] p-4 pointer-events-none">
                <div class="pointer-events-auto max-w-xs w-full bg-white rounded-[24px] p-6 text-center border border-[#e1dfd8] shadow-parker-md">
                  <div class="w-12 h-12 mx-auto rounded-full bg-[#d6e3ff] text-[#005cb9] flex items-center justify-center text-2xl mb-3">
                    {{ isSharingLocation ? '📡' : '🗺️' }}
                  </div>
                  <p class="font-semibold text-base text-[#1a1c1f]">
                    {{ isSharingLocation ? 'Buscando tu señal GPS...' : 'El mapa está listo' }}
                  </p>
                  <p class="text-sm text-[#414753] mt-1 mb-4">
                    {{
                      isSharingLocation
                        ? 'Asegúrate de aceptar el permiso de ubicación en tu navegador.'
                        : 'Toca el botón para compartir tu ubicación en vivo con tu familia.'
                    }}
                  </p>
                  @if (!isSharingLocation) {
                    <button
                      type="button"
                      (click)="toggleLocation.emit()"
                      class="tap-btn w-full py-2.5 rounded-full bg-[#5196fe] text-white text-sm font-semibold"
                    >
                      Activar mi ubicación
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Bottom-Left Synced Badge -->
            <div class="absolute bottom-4 left-4 z-20 pointer-events-none">
              <div class="px-4 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#e1dfd8] shadow-parker-md inline-flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#005cb9]"></span>
                <span class="text-xs font-medium text-[#1a1c1f]">Círculo familiar sincronizado</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right / Secondary Column (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          <!-- 1-Tap Arrival Notification Card -->
          <div class="rounded-[24px] bg-[#f3f3f7] border border-[#e1dfd8] p-5 flex items-center justify-between gap-4">
            <div class="flex items-start gap-3.5 min-w-0">
              <div class="w-11 h-11 rounded-full bg-white text-[#005cb9] flex items-center justify-center shrink-0 border border-[#e1dfd8] text-xl">
                🔔
              </div>
              <div class="flex flex-col gap-0.5 min-w-0">
                <h3 class="font-semibold text-sm sm:text-base text-[#1a1c1f]">
                  Avisar llegada en 1 toque
                </h3>
                <p class="text-xs sm:text-sm text-[#414753]">
                  Notifica automáticamente al compartir o actualizar tu ubicación
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="autoNotify.set(!autoNotify())"
              [class]="'tap-btn px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors ' + (autoNotify() ? 'bg-[#5196fe] text-white' : 'bg-[#e8e8ec] text-[#414753]')"
            >
              {{ autoNotify() ? 'Auto' : 'Manual' }}
            </button>
          </div>

          <!-- Personas en el Hogar Section -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <h2 class="font-semibold text-lg text-[#1a1c1f]">Personas en el Hogar</h2>
                <span class="px-3 py-1 rounded-full bg-[#ededf1] text-[#414753] text-xs font-semibold">
                  {{ membersList().length }} {{ membersList().length === 1 ? 'miembro' : 'miembros' }}
                </span>
              </div>
              @if (sharingMembers().length > 0) {
                <button
                  type="button"
                  (click)="fitAllMembers()"
                  class="text-xs font-semibold text-[#005cb9] hover:underline"
                >
                  Ver todos
                </button>
              }
            </div>

            @if (membersList().length === 0) {
              <div class="rounded-[24px] bg-white border border-[#e1dfd8] p-6 text-center">
                <p class="text-sm text-[#414753]">Aún no hay integrantes registrados en la sala.</p>
              </div>
            } @else {
              <div class="flex flex-col gap-3">
                @for (m of sortedMembers(); track m.name) {
                  <div class="rounded-[24px] bg-white border border-[#e1dfd8] p-4 flex flex-col gap-3 transition-transform duration-150 hover:scale-[0.995]">
                    <div class="flex items-start justify-between gap-2.5">
                      <div class="flex items-center gap-3 min-w-0">
                        <!-- Initials Avatar -->
                        <div
                          [class]="'w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ' + getAvatarClasses(m)"
                        >
                          {{ getInitials(m.name) }}
                        </div>

                        <div class="flex flex-col min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-semibold text-sm sm:text-base text-[#1a1c1f] truncate">
                              {{ isMe(m) ? m.name + ' (Tú)' : m.name }}
                            </span>

                            @if (m.location?.lat) {
                              @if (isMe(m)) {
                                <span class="px-2.5 py-0.5 rounded-full bg-[#ededf1] text-[#414753] text-[11px] font-semibold">
                                  Este equipo
                                </span>
                              } @else {
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#d6e3ff] text-[#001b3e] text-[11px] font-semibold">
                                  <span class="w-1.5 h-1.5 rounded-full bg-[#005cb9]"></span>
                                  En Vivo
                                </span>
                              }
                            } @else {
                              <span class="px-2.5 py-0.5 rounded-full bg-[#ededf1] text-[#727784] text-[11px] font-semibold">
                                Sin GPS
                              </span>
                            }
                          </div>

                          <span class="text-xs sm:text-sm text-[#414753] truncate mt-0.5">
                            {{ m.statusEmoji || '🏠' }} {{ m.statusLabel || 'En casa' }}
                            @if (m.location?.lat) {
                              • Subida {{ formatClockTime(m.location.updatedAt) }}
                            }
                          </span>
                        </div>
                      </div>

                      <span class="text-[11px] font-semibold shrink-0" [class]="m.location?.lat ? 'text-[#005cb9]' : 'text-[#727784]'">
                        {{ m.location?.updatedAt ? formatTimeAgo(m.location.updatedAt) : 'Inactivo' }}
                      </span>
                    </div>

                    @if (m.location?.lat && m.location?.lng) {
                      <div class="flex items-center justify-between gap-2 pt-1">
                        <span class="text-[11px] text-[#727784] truncate">
                          {{ m.location.lat }}, {{ m.location.lng }}
                        </span>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            (click)="focusMember(m)"
                            class="tap-btn px-4 py-1.5 rounded-full bg-[#f3f3f7] hover:bg-[#e8e8ec] text-[#1a1c1f] text-xs font-medium transition-colors"
                          >
                            Ver
                          </button>
                          <a
                            [href]="'https://www.google.com/maps?q=' + m.location.lat + ',' + m.location.lng"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="tap-btn px-4 py-1.5 rounded-full bg-[#5196fe]/15 hover:bg-[#5196fe]/25 text-[#005cb9] text-xs font-medium transition-colors"
                          >
                            Ruta
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LocationComponent implements AfterViewInit, OnDestroy {
  storage = inject(StorageService);

  @Input() isSharingLocation = false;
  @Output() toggleLocation = new EventEmitter<void>();

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  autoNotify = signal(true);

  private map: L.Map | null = null;
  private markers = new Map<string, L.Marker>();
  private resizeObserver: ResizeObserver | null = null;
  private hasAutoFitted = false;

  membersList = computed(() => {
    const membersObj = this.storage.roomState()?.members || {};
    return Object.values(membersObj) as any[];
  });

  sharingMembers = computed(() =>
    this.membersList().filter((m) => m.location?.lat != null && m.location?.lng != null)
  );

  sortedMembers = computed(() => {
    return [...this.membersList()].sort((a, b) => {
      const aLive = a.location?.lat != null ? 1 : 0;
      const bLive = b.location?.lat != null ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      return (b.location?.updatedAt || b.lastSeen || 0) - (a.location?.updatedAt || a.lastSeen || 0);
    });
  });

  constructor() {
    effect(() => {
      const sharing = this.sharingMembers();
      if (this.map) {
        this.syncMarkers(sharing);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.mapContainer) return;
    const el = this.mapContainer.nativeElement;

    this.map = L.map(el, {
      center: [-12.0464, -77.0428],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    this.syncMarkers(this.sharingMembers());

    // Invalidate size across multiple layout frames so tiles fill the full container
    requestAnimationFrame(() => this.map?.invalidateSize());
    setTimeout(() => this.map?.invalidateSize(), 100);
    setTimeout(() => this.map?.invalidateSize(), 300);
    setTimeout(() => this.map?.invalidateSize(), 600);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
      });
      this.resizeObserver.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.markers.clear();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  isMe(member: any): boolean {
    return member?.name === this.storage.session()?.memberName;
  }

  getInitials(name: string): string {
    const clean = (name || '?').trim();
    if (!clean) return '?';
    const parts = clean.split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  getAvatarClasses(member: any): string {
    if (this.isMe(member)) return 'bg-[#005cb9] text-white';
    if (member.location?.lat) return 'bg-[#d6e3ff] text-[#001b3e]';
    return 'bg-[#e3e3de] text-[#1b1c19]';
  }

  focusMember(member: any): void {
    if (!this.map || !member.location) return;
    const latLng: L.LatLngExpression = [member.location.lat, member.location.lng];
    this.map.flyTo(latLng, 16, { duration: 0.7 });
    this.markers.get(member.name)?.openPopup();
  }

  fitAllMembers(): void {
    if (!this.map) return;
    const sharing = this.sharingMembers();
    if (sharing.length === 0) return;
    if (sharing.length === 1) {
      this.focusMember(sharing[0]);
      return;
    }
    const bounds = L.latLngBounds(
      sharing.map((m) => [m.location.lat, m.location.lng] as [number, number])
    );
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }

  formatClockTime(timestamp?: number): string {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTimeAgo(timestamp?: number): string {
    if (!timestamp) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 30) return 'Ahora';
    if (diffSec < 60) return `hace ${diffSec} s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    return `hace ${diffHr} h`;
  }

  private createPinIcon(m: any): L.DivIcon {
    const me = this.isMe(m);
    const initials = me ? 'TÚ' : this.getInitials(m.name);
    const ringColor = me ? '#5196fe' : '#aac7ff';
    const circleBg = me ? '#005cb9' : '#ffffff';
    const circleText = me ? '#ffffff' : '#005cb9';
    const pillBg = me ? '#005cb9' : 'rgba(255,255,255,0.96)';
    const pillText = me ? '#ffffff' : '#1a1c1f';
    const subText = me ? 'rgba(255,255,255,0.85)' : '#414753';
    const clockTime = this.formatClockTime(m.location.updatedAt);
    const labelName = me ? 'Tú' : m.name;
    const statusText = m.statusLabel || 'En vivo';

    return L.divIcon({
      className: 'family-map-marker',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-82%);">
          <div style="padding:4px;border-radius:9999px;background:${ringColor};box-shadow:0 4px 12px rgba(0,0,0,0.16);">
            <div style="width:40px;height:40px;border-radius:9999px;background:${circleBg};color:${circleText};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:Inter,sans-serif;">
              ${this.escapeHtml(initials)}
            </div>
          </div>
          <div style="margin-top:6px;padding:4px 12px;border-radius:9999px;background:${pillBg};color:${pillText};font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-family:Inter,sans-serif;">
            <span>${this.escapeHtml(labelName)}</span>
            <span style="color:${subText};font-weight:500;"> • ${this.escapeHtml(statusText)} ${this.escapeHtml(clockTime)}</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  private syncMarkers(sharing: any[]): void {
    if (!this.map) return;

    const activeNames = new Set(sharing.map((m) => m.name));

    for (const [name, marker] of this.markers.entries()) {
      if (!activeNames.has(name)) {
        marker.remove();
        this.markers.delete(name);
      }
    }

    for (const m of sharing) {
      const latLng: L.LatLngExpression = [m.location.lat, m.location.lng];
      const emoji = m.statusEmoji || '🏠';
      const clockTime = this.formatClockTime(m.location.updatedAt);
      const ago = this.formatTimeAgo(m.location.updatedAt);
      const popupHtml = `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 170px;">
          <div style="font-weight: 700; font-size: 14px; color: #1a1c1f;">${this.escapeHtml(m.name)}</div>
          <div style="font-size: 12px; color: #414753; margin-top: 2px;">${this.escapeHtml(emoji)} ${this.escapeHtml(m.statusLabel || 'En casa')}</div>
          <div style="font-size: 11px; color: #005cb9; font-weight: 600; margin-top: 4px;">Subida: ${this.escapeHtml(clockTime)} (${this.escapeHtml(ago)})</div>
          <a href="https://www.google.com/maps?q=${m.location.lat},${m.location.lng}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;color:#005cb9;text-decoration:underline;">Abrir ruta en Google Maps →</a>
        </div>
      `;

      const existing = this.markers.get(m.name);
      if (existing) {
        existing.setLatLng(latLng);
        existing.setIcon(this.createPinIcon(m));
        existing.setPopupContent(popupHtml);
      } else {
        const marker = L.marker(latLng, { icon: this.createPinIcon(m) })
          .addTo(this.map)
          .bindPopup(popupHtml);
        this.markers.set(m.name, marker);
      }
    }

    if (!this.hasAutoFitted && sharing.length > 0) {
      this.hasAutoFitted = true;
      this.fitAllMembers();
    }
  }

  private escapeHtml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
