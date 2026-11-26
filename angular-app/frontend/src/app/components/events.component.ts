import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DAY_OPTIONS, EVENT_PRESETS, RSVP_OPTIONS, TIME_OPTIONS } from '../constants/family-presets';
import { StorageService } from '../services/storage.service';

interface QuickNote {
  id: string;
  author: string;
  text: string;
  timeLabel: string;
  emoji: string;
  likes: number;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Top Action Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f2f1ec] border border-[#e1dfd8] text-xs font-medium text-[#6e6e6e]">
          <span class="w-2 h-2 rounded-full bg-[#f9754e]"></span>
          <span>{{ currentMonthLabel() }}</span>
        </div>

        <button
          type="button"
          (click)="creatorOpen.set(!creatorOpen())"
          class="tap-btn inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#5196fe] text-white text-sm font-medium"
        >
          <span>{{ creatorOpen() ? '✕ Cerrar' : '+ Crear Evento o Aviso Familiar' }}</span>
        </button>
      </div>

      <!-- Collapsible 1-Tap Event Creator -->
      @if (creatorOpen()) {
        <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-base text-[#1b1d20]">
                Crear Evento o Aviso (1 toque)
              </h2>
              <p class="text-xs text-[#6e6e6e]">Elige el motivo, el día y la hora aproximada.</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            @for (preset of presets; track preset.id) {
              <button
                type="button"
                (click)="selectedPreset.set(preset); customTitle = ''"
                [class]="'tap-btn flex items-center gap-2 p-3 rounded-[16px] border text-left text-xs sm:text-sm font-medium transition-colors ' + (!customTitle && selectedPreset().id === preset.id ? 'bg-[#5196fe] text-white border-[#5196fe]' : 'bg-white text-[#1b1d20] border-[#e1dfd8]')"
              >
                <span class="text-lg shrink-0">{{ preset.emoji }}</span>
                <span>{{ preset.label }}</span>
              </button>
            }
          </div>

          <input
            type="text"
            [(ngModel)]="customTitle"
            name="customTitle"
            placeholder="O escribe otro evento (opcional)..."
            class="parker-input w-full px-4 py-3 text-sm"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-[#6e6e6e] block mb-2">¿Cuándo?</label>
              <div class="flex flex-wrap gap-1.5">
                @for (d of days; track d.id) {
                  <button
                    type="button"
                    (click)="selectedDay.set(d.label); customDate = ''"
                    [class]="'tap-btn px-3.5 py-2 rounded-full text-xs font-medium border ' + (!customDate && selectedDay() === d.label ? 'bg-[#1b1d20] text-white border-[#1b1d20]' : 'bg-white text-[#1b1d20] border-[#e1dfd8]')"
                  >
                    {{ d.label }}
                  </button>
                }
                <input
                  type="date"
                  [(ngModel)]="customDate"
                  name="customDate"
                  class="parker-input px-3 py-1.5 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label class="text-xs font-medium text-[#6e6e6e] block mb-2">¿A qué hora aprox.?</label>
              <div class="grid grid-cols-3 gap-2">
                @for (t of times; track t.id) {
                  <button
                    type="button"
                    (click)="selectedTime.set(t.label)"
                    [class]="'tap-btn py-2 px-2 rounded-full text-xs font-medium border ' + (selectedTime() === t.label ? 'bg-[#1b1d20] text-white border-[#1b1d20]' : 'bg-white text-[#1b1d20] border-[#e1dfd8]')"
                  >
                    {{ t.emoji }} {{ t.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              (click)="creatorOpen.set(false)"
              class="tap-btn px-5 py-2.5 rounded-full bg-white border border-[#e1dfd8] text-[#1b1d20] text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="publish()"
              class="tap-btn px-6 py-2.5 rounded-full bg-[#f9754e] text-white text-sm font-medium"
            >
              Publicar Evento
            </button>
          </div>
        </section>
      }

      <!-- 2-Column Editorial Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- LEFT COLUMN (7 Cols) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <!-- Weekly Calendar Strip -->
          <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-4 sm:p-5">
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="font-semibold text-sm text-[#1b1d20]">{{ currentMonthLabel() }}</span>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="shiftWeek(-1)"
                  aria-label="Semana anterior"
                  class="tap-btn w-8 h-8 rounded-full bg-white border border-[#e1dfd8] text-[#6e6e6e] hover:text-[#1b1d20] flex items-center justify-center text-sm"
                >
                  ‹
                </button>
                <button
                  type="button"
                  (click)="shiftWeek(1)"
                  aria-label="Semana siguiente"
                  class="tap-btn w-8 h-8 rounded-full bg-white border border-[#e1dfd8] text-[#6e6e6e] hover:text-[#1b1d20] flex items-center justify-center text-sm"
                >
                  ›
                </button>
              </div>
            </div>

            <div class="grid grid-cols-7 gap-1.5 text-center">
              @for (day of weekDays(); track day.iso) {
                <button
                  type="button"
                  (click)="selectedCalDay.set(day.iso)"
                  [class]="'tap-btn flex flex-col items-center py-2.5 px-1 rounded-[16px] transition-colors ' + (selectedCalDay() === day.iso ? 'bg-[#5196fe] text-white' : 'bg-white text-[#1b1d20] border border-[#e1dfd8] hover:bg-[#f2f1ec]')"
                >
                  <span [class]="'text-[11px] font-medium uppercase ' + (selectedCalDay() === day.iso ? 'text-white/85' : 'text-[#6e6e6e]')">
                    {{ day.shortName }}
                  </span>
                  <span class="text-sm font-semibold mt-1">{{ day.dayNum }}</span>
                  <span [class]="'w-1.5 h-1.5 rounded-full mt-1 ' + (selectedCalDay() === day.iso ? 'bg-white' : day.hasEvent ? 'bg-[#f9754e]' : 'bg-transparent')"></span>
                </button>
              }
            </div>
          </section>

          <!-- Featured Event Card -->
          @if (featuredEvent(); as feat) {
            <article class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 sm:p-6 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9754e]/15 text-[#f9754e] text-xs font-semibold uppercase tracking-wider">
                  ★ Evento Destacado
                </span>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-[#6e6e6e]">
                    {{ feat.dayLabel }} • {{ feat.timeLabel }}
                  </span>
                  <button
                    type="button"
                    (click)="storage.removeEvent(feat.id)"
                    class="tap-btn text-xs text-[#6e6e6e] hover:text-[#1b1d20] px-2 py-1 rounded-full bg-white border border-[#e1dfd8]"
                    title="Eliminar evento"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-16 h-16 rounded-[18px] bg-white border border-[#e1dfd8] flex items-center justify-center text-3xl shrink-0">
                  {{ feat.emoji }}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-2xl sm:text-[28px] font-semibold tracking-[-0.02em] text-[#1b1d20] leading-tight">
                    {{ feat.title }}
                  </h3>
                  <p class="text-sm text-[#6e6e6e] mt-1">
                    Organiza {{ feat.createdBy }} • Sala {{ storage.session()?.roomCode }}
                  </p>

                  <!-- Confirmed Avatars -->
                  @if (rsvpList(feat).length > 0) {
                    <div class="flex items-center gap-2.5 mt-3">
                      <div class="flex -space-x-2">
                        @for (r of rsvpList(feat); track r.name) {
                          <div
                            class="w-8 h-8 rounded-full bg-[#5196fe] text-white text-xs font-semibold flex items-center justify-center ring-2 ring-[#f2f1ec]"
                            [title]="r.name + ' (' + r.label + ')'"
                          >
                            {{ r.name.charAt(0).toUpperCase() }}
                          </div>
                        }
                      </div>
                      <span class="text-xs font-medium text-[#6e6e6e]">
                        {{ rsvpList(feat).length }} {{ rsvpList(feat).length === 1 ? 'familiar respondió' : 'familiares respondieron' }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- 1-Tap RSVP Bar -->
              <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-3 flex flex-wrap items-center justify-between gap-2">
                <span class="text-xs font-medium text-[#6e6e6e] px-2">Tu asistencia:</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  @for (opt of rsvps; track opt.id) {
                    <button
                      type="button"
                      (click)="storage.setEventRsvp(feat.id, opt.id)"
                      [class]="'tap-btn px-3.5 py-2 rounded-full text-xs font-medium transition-colors ' + (myRsvp(feat) === opt.id ? 'bg-[#5196fe] text-white' : 'bg-[#f2f1ec] text-[#6e6e6e] hover:text-[#1b1d20]')"
                    >
                      {{ opt.emoji }} {{ opt.label }}
                    </button>
                  }
                </div>
              </div>
            </article>
          } @else {
            <div class="bg-[#f2f1ec] border border-dashed border-[#a3a3a3] rounded-[24px] p-8 text-center">
              <p class="text-3xl mb-2">📅</p>
              <p class="font-semibold text-base text-[#1b1d20]">No hay eventos programados todavía</p>
              <p class="text-sm text-[#6e6e6e] mt-1 mb-4">
                Crea uno con el botón superior o usa una acción rápida de la derecha.
              </p>
              <button
                type="button"
                (click)="creatorOpen.set(true)"
                class="tap-btn px-5 py-2.5 rounded-full bg-[#5196fe] text-white text-sm font-medium"
              >
                + Crear primer evento
              </button>
            </div>
          }

          <!-- Para esta semana -->
          @if (otherEvents().length > 0) {
            <section class="flex flex-col gap-3">
              <div class="flex items-center justify-between px-1">
                <h4 class="font-semibold text-lg text-[#1b1d20]">Para esta semana</h4>
                <span class="text-xs font-medium text-[#6e6e6e]">
                  {{ otherEvents().length }} {{ otherEvents().length === 1 ? 'evento activo' : 'eventos activos' }}
                </span>
              </div>

              <div class="flex flex-col gap-3">
                @for (evt of otherEvents(); track evt.id) {
                  <div class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-4 flex flex-col gap-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-full bg-white border border-[#e1dfd8] flex items-center justify-center text-xl shrink-0">
                          {{ evt.emoji }}
                        </div>
                        <div>
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-semibold text-sm sm:text-base text-[#1b1d20]">{{ evt.title }}</span>
                            <span class="px-2.5 py-0.5 rounded-full bg-white border border-[#e1dfd8] text-[11px] font-medium text-[#6e6e6e]">
                              {{ evt.dayLabel }}
                            </span>
                          </div>
                          <p class="text-xs text-[#6e6e6e] mt-0.5">
                            {{ evt.timeLabel }} • Avisó {{ evt.createdBy }}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        (click)="storage.removeEvent(evt.id)"
                        class="tap-btn w-8 h-8 rounded-full bg-white border border-[#e1dfd8] text-[#6e6e6e] hover:text-[#1b1d20] text-xs"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>

                    <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#e1dfd8]">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        @for (opt of rsvps; track opt.id) {
                          <button
                            type="button"
                            (click)="storage.setEventRsvp(evt.id, opt.id)"
                            [class]="'tap-btn px-3 py-1.5 rounded-full text-xs font-medium border ' + (myRsvp(evt) === opt.id ? 'bg-[#5196fe] text-white border-[#5196fe]' : 'bg-white text-[#6e6e6e] border-[#e1dfd8] hover:text-[#1b1d20]')"
                          >
                            {{ opt.emoji }} {{ opt.label }}
                          </button>
                        }
                      </div>

                      @if (rsvpList(evt).length > 0) {
                        <span class="text-[11px] font-medium text-[#6e6e6e]">
                          {{ rsvpList(evt).length }} confirmados
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </div>

        <!-- RIGHT COLUMN (5 Cols) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          <!-- Avisos Rápidos -->
          <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">📝</span>
                <h4 class="font-semibold text-base text-[#1b1d20]">Avisos Rápidos</h4>
              </div>
              <button
                type="button"
                (click)="addingNote.set(!addingNote())"
                class="tap-btn px-3.5 py-1.5 rounded-full bg-white border border-[#e1dfd8] text-[#1b1d20] text-xs font-medium"
              >
                {{ addingNote() ? 'Cancelar' : '+ Dejar nota' }}
              </button>
            </div>

            @if (addingNote()) {
              <form (ngSubmit)="addNote()" class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="newNoteText"
                  name="newNoteText"
                  placeholder="Ej. Dejé almuerzo listo en el refri..."
                  maxlength="120"
                  class="parker-input flex-1 px-3.5 py-2 text-xs"
                />
                <button
                  type="submit"
                  class="tap-btn px-4 py-2 rounded-full bg-[#5196fe] text-white text-xs font-medium"
                >
                  Enviar
                </button>
              </form>
            }

            <div class="flex flex-col gap-3">
              @for (note of notes(); track note.id) {
                <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-4 flex flex-col gap-2.5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-[#5196fe]/15 text-[#5196fe] text-xs font-semibold flex items-center justify-center">
                        {{ note.author.charAt(0).toUpperCase() }}
                      </span>
                      <span class="font-semibold text-sm text-[#1b1d20]">{{ note.author }}</span>
                    </div>
                    <span class="text-[11px] font-medium text-[#6e6e6e]">{{ note.timeLabel }}</span>
                  </div>
                  <p class="text-sm text-[#1b1d20] leading-relaxed">
                    "{{ note.text }}"
                  </p>
                  <div class="flex justify-end">
                    <button
                      type="button"
                      (click)="likeNote(note.id)"
                      class="tap-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f1ec] text-[#1b1d20] text-xs font-medium"
                    >
                      <span>{{ note.emoji }}</span>
                      <span>Gracias ({{ note.likes }})</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </section>

          <!-- Acciones con 1 Toque -->
          <section class="bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-5 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-[#6e6e6e]">
                Acciones con 1 Toque
              </span>
              <span class="text-sm">👆</span>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              @for (qa of quickActions; track qa.title) {
                <button
                  type="button"
                  (click)="quickPublish(qa)"
                  class="tap-btn p-3 rounded-[16px] bg-white border border-[#e1dfd8] hover:border-[#5196fe] text-left flex items-center gap-2.5 transition-colors"
                >
                  <div class="w-8 h-8 rounded-full bg-[#f2f1ec] flex items-center justify-center text-base shrink-0">
                    {{ qa.emoji }}
                  </div>
                  <span class="text-xs font-medium text-[#1b1d20] leading-tight">{{ qa.title }}</span>
                </button>
              }
            </div>
          </section>

          <!-- Editorial Quote Card -->
          <article class="bg-white border border-[#e1dfd8] rounded-[24px] p-6 text-center space-y-2">
            <span class="inline-block px-3 py-1 rounded-full bg-[#f2f1ec] text-[11px] font-medium uppercase tracking-widest text-[#6e6e6e]">
              Momento Hogar
            </span>
            <blockquote class="parker-flourish text-[22px] leading-snug text-[#1b1d20] pt-1">
              "La familia que coordina unida, disfruta más."
            </blockquote>
            <p class="text-[11px] font-medium uppercase tracking-widest text-[#6e6e6e]">
              Cuaderno del Hogar
            </p>
          </article>
        </div>
      </div>
    </div>
  `,
})
export class EventsComponent {
  storage = inject(StorageService);
  presets = EVENT_PRESETS;
  days = DAY_OPTIONS;
  times = TIME_OPTIONS;
  rsvps = RSVP_OPTIONS;

  creatorOpen = signal(false);
  selectedPreset = signal(EVENT_PRESETS[0]);
  selectedDay = signal(DAY_OPTIONS[0].label);
  selectedTime = signal(TIME_OPTIONS[1].label);
  customTitle = '';
  customDate = '';

  weekOffset = signal(0);
  selectedCalDay = signal(new Date().toISOString().slice(0, 10));

  addingNote = signal(false);
  newNoteText = '';
  notes = signal<QuickNote[]>([
    {
      id: 'n1',
      author: 'Mamá',
      text: 'Dejé almuerzo listo en el refri, solo calentar 🔥',
      timeLabel: 'Hoy 08:30 AM',
      emoji: '❤️',
      likes: 3,
    },
    {
      id: 'n2',
      author: 'Papá',
      text: 'No olviden poner doble llave a la reja principal al salir.',
      timeLabel: 'Ayer 11:20 PM',
      emoji: '👍',
      likes: 2,
    },
  ]);

  quickActions = [
    { title: 'Cena Familiar', emoji: '🍲', dayLabel: 'Hoy', timeLabel: 'Noche' },
    { title: 'Visita en Casa', emoji: '🏡', dayLabel: 'Este Sábado', timeLabel: 'Tarde' },
    { title: 'Compra urgente', emoji: '🛒', dayLabel: 'Hoy', timeLabel: 'Tarde' },
    { title: 'Tarea compartida', emoji: '🧹', dayLabel: 'Mañana', timeLabel: 'Mañana' },
  ];

  events = (): any[] => this.storage.roomState()?.events || [];
  featuredEvent = computed(() => this.events()[0] || null);
  otherEvents = computed(() => this.events().slice(1));

  currentMonthLabel = computed(() => {
    const base = new Date();
    base.setDate(base.getDate() + this.weekOffset() * 7);
    const label = base.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  weekDays = computed(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + this.weekOffset() * 7);

    const names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hasAnyEvent = this.events().length > 0;
    return names.map((shortName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return {
        shortName,
        dayNum: d.getDate(),
        iso: d.toISOString().slice(0, 10),
        hasEvent: hasAnyEvent && idx === 5,
      };
    });
  });

  shiftWeek(delta: number): void {
    this.weekOffset.set(this.weekOffset() + delta);
  }

  myRsvp(evt: any): string {
    const me = this.storage.session()?.memberName;
    return (me && evt.rsvps?.[me]) || '';
  }

  rsvpList(evt: any): { name: string; emoji: string; label: string }[] {
    return Object.entries(evt.rsvps || {}).map(([name, id]) => {
      const found = RSVP_OPTIONS.find((o) => o.id === id);
      return {
        name,
        emoji: found?.emoji || '👍',
        label: found?.label || 'Confirmado',
      };
    });
  }

  publish(): void {
    const title = this.customTitle.trim() || this.selectedPreset().label;
    const emoji = this.customTitle.trim() ? '📅' : this.selectedPreset().emoji;
    const dayLabel = this.customDate || this.selectedDay();
    this.storage.addEvent({
      title,
      emoji,
      dayLabel,
      timeLabel: this.selectedTime(),
    });
    this.customTitle = '';
    this.customDate = '';
    this.creatorOpen.set(false);
  }

  quickPublish(qa: { title: string; emoji: string; dayLabel: string; timeLabel: string }): void {
    this.storage.addEvent(qa);
  }

  addNote(): void {
    const text = this.newNoteText.trim();
    if (!text) return;
    const author = this.storage.session()?.memberName || 'Yo';
    const timeLabel = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    this.notes.update((prev) => [
      {
        id: `note_${Date.now()}`,
        author,
        text,
        timeLabel: `Hoy ${timeLabel}`,
        emoji: '❤️',
        likes: 1,
      },
      ...prev,
    ]);
    this.newNoteText = '';
    this.addingNote.set(false);
  }

  likeNote(id: string): void {
    this.notes.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, likes: n.likes + 1 } : n))
    );
  }
}
