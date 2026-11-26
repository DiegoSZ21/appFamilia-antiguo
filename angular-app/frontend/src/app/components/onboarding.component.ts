import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService, normalizeRoomCode } from '../services/storage.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-white">
      <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Left Editorial Hero (Join Parker) -->
        <div class="lg:col-span-5 space-y-5">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-[12.8px] bg-[#1b1d20] text-white text-xs font-medium">
            <span>🏡</span>
            <span>Hogar Conectado</span>
          </div>
          <h1 class="text-4xl sm:text-5xl font-semibold tracking-[-0.06em] leading-[1.08] text-[#1b1d20]">
            Tu hogar que
            <span class="parker-flourish font-medium text-[#5196fe]">conecta</span>
            en tiempo real.
          </h1>
          <p class="text-base text-[#6e6e6e] leading-[1.5]">
            Únete con el código de invitación que generó tu familia o crea un nuevo hogar para invitar a los tuyos.
          </p>
        </div>

        <!-- Right Form Card -->
        <div class="lg:col-span-7 bg-[#f2f1ec] border border-[#e1dfd8] rounded-[24px] p-6 sm:p-8 space-y-5">
          <!-- Mode Tabs: Unirme con código / Crear nueva familia -->
          <div class="grid grid-cols-2 gap-2 p-1.5 bg-white border border-[#e1dfd8] rounded-full">
            <button
              type="button"
              (click)="setMode('join')"
              [class]="'tap-btn py-2.5 px-3 rounded-full text-xs sm:text-sm font-medium transition-colors ' + (entryMode() === 'join' ? 'bg-[#5196fe] text-white' : 'text-[#6e6e6e]')"
            >
              🎟️ Tengo un código
            </button>
            <button
              type="button"
              (click)="setMode('create')"
              [class]="'tap-btn py-2.5 px-3 rounded-full text-xs sm:text-sm font-medium transition-colors ' + (entryMode() === 'create' ? 'bg-[#5196fe] text-white' : 'text-[#6e6e6e]')"
            >
              🛡️ Crear familia
            </button>
          </div>

          <!-- JOIN EXISTING FAMILY / INVITE FLOW -->
          @if (entryMode() === 'join') {
            <div>
              <label class="block text-xs font-semibold text-[#1b1d20] mb-2">
                Código de invitación o de familia
              </label>
              <input
                type="text"
                [ngModel]="roomCode()"
                (ngModelChange)="onRoomCodeChange($event)"
                name="roomCode"
                placeholder="Ej. INV-7392 o HOGAR-4281"
                class="parker-input w-full px-4 py-3 text-base font-medium uppercase tracking-wider"
              />
            </div>

            <!-- Group Found Preview ("Unirte al grupo") -->
            @if (resolvedGroup(); as group) {
              @if (!joinedPreview()) {
                <div class="bg-white border border-[#e1dfd8] rounded-[24px] p-5 space-y-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-[16px] bg-[#d6e3ff] text-[#005cb9] flex items-center justify-center text-2xl shrink-0">
                        🏡
                      </div>
                      <div>
                        <span class="text-[11px] font-semibold uppercase tracking-wider text-[#5196fe]">
                          {{ group.isInviteCode ? 'Invitación válida' : 'Grupo encontrado' }}
                        </span>
                        <h2 class="text-xl font-semibold text-[#1b1d20]">
                          {{ group.familyName }}
                        </h2>
                        <p class="text-xs text-[#6e6e6e] mt-0.5">
                          Código: {{ group.roomCode }} • {{ group.members.length }} {{ group.members.length === 1 ? 'integrante' : 'integrantes' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  @if (group.members.length > 0) {
                    <div class="flex items-center gap-2 flex-wrap pt-1">
                      @for (m of group.members; track m.name) {
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f1ec] text-xs font-medium text-[#1b1d20]">
                          <span>{{ isImage(m.avatar) ? '👤' : (m.avatar || '👤') }}</span>
                          <span>{{ m.name }}</span>
                        </span>
                      }
                    </div>
                  }

                  <button
                    type="button"
                    (click)="joinedPreview.set(true); error.set('')"
                    class="tap-btn w-full py-3.5 px-6 rounded-full bg-[#f9754e] text-white font-medium text-base"
                  >
                    Unirme a {{ group.familyName }} →
                  </button>
                </div>
              }
            } @else if (roomCode().trim().length >= 3) {
              <div class="p-4 rounded-[20px] bg-white border border-[#e1dfd8] text-xs text-[#6e6e6e]">
                No encontramos ese código en este dispositivo todavía. Si es correcto, puedes continuar para registrar tu perfil en la sala <strong class="text-[#1b1d20]">{{ normalizedInput() }}</strong>.
                <button
                  type="button"
                  (click)="joinedPreview.set(true)"
                  class="block mt-2 text-xs font-semibold text-[#5196fe] hover:underline"
                >
                  Continuar con {{ normalizedInput() }} →
                </button>
              </div>
            }
          }

          <!-- CREATE NEW FAMILY FLOW (ADMIN) -->
          @if (entryMode() === 'create') {
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-[#1b1d20] mb-2">
                  Nombre de tu familia o grupo *
                </label>
                <input
                  type="text"
                  [(ngModel)]="familyName"
                  name="familyName"
                  placeholder="Ej. Familia Pérez, Casa Central"
                  maxlength="32"
                  class="parker-input w-full px-4 py-3 text-sm font-medium"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-semibold text-[#1b1d20]">
                    Código de Familia
                  </label>
                  <button
                    type="button"
                    (click)="generateCode()"
                    class="text-xs font-medium text-[#5196fe] hover:underline"
                  >
                    ✨ Generar otro código
                  </button>
                </div>
                <input
                  type="text"
                  [ngModel]="roomCode()"
                  (ngModelChange)="onRoomCodeChange($event)"
                  name="createRoomCode"
                  placeholder="Ej. HOGAR-4281"
                  class="parker-input w-full px-4 py-3 text-base font-medium uppercase tracking-wider"
                />
              </div>
            </div>
          }

          <!-- STEP 2: LOGIN / REGISTER PROFILE (After clicking "Unirme" or when creating family) -->
          @if ((entryMode() === 'join' && joinedPreview()) || entryMode() === 'create') {
            <!-- Existing profiles inside the group -->
            @if (entryMode() === 'join' && existingProfiles().length > 0 && !creatingNew()) {
              <div class="space-y-3 pt-2 border-t border-[#e1dfd8]">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-[#1b1d20]">
                    ¿Ya tienes perfil en {{ resolvedGroup()?.familyName || 'este grupo' }}?
                  </label>
                  <button
                    type="button"
                    (click)="startNewProfile()"
                    class="text-xs font-semibold text-[#5196fe] hover:underline"
                  >
                    + Soy nuevo aquí
                  </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  @for (p of existingProfiles(); track p.name) {
                    <button
                      type="button"
                      (click)="selectProfile(p)"
                      [class]="'tap-btn p-3.5 rounded-[20px] border text-center flex flex-col items-center gap-2 transition-all ' + (selectedProfile()?.name === p.name ? 'bg-white border-[#5196fe] ring-2 ring-[#5196fe]' : 'bg-white border-[#e1dfd8] hover:border-[#5196fe]')"
                    >
                      <div
                        class="w-12 h-12 rounded-full flex items-center justify-center text-white overflow-hidden font-semibold text-base"
                        [style.backgroundColor]="p.color || '#5196fe'"
                      >
                        @if (isImage(p.avatar)) {
                          <img [src]="p.avatar" [alt]="p.name" class="w-full h-full object-cover" />
                        } @else if (p.avatar) {
                          <span class="text-2xl">{{ p.avatar }}</span>
                        } @else {
                          <span>{{ getInitials(p.name) }}</span>
                        }
                      </div>
                      <div class="min-w-0 w-full">
                        <p class="font-semibold text-sm text-[#1b1d20] truncate">{{ p.name }}</p>
                        <p class="text-[11px] text-[#6e6e6e]">
                          {{ p.role === 'admin' ? '🛡️ Admin' : '🔒 PIN' }}
                        </p>
                      </div>
                    </button>
                  }

                  <button
                    type="button"
                    (click)="startNewProfile()"
                    class="tap-btn p-3.5 rounded-[20px] border border-dashed border-[#a3a3a3] bg-white/60 hover:bg-white text-center flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    <div class="w-12 h-12 rounded-full bg-[#e1dfd8] text-[#1b1d20] flex items-center justify-center text-xl font-semibold">
                      +
                    </div>
                    <span class="font-medium text-xs text-[#1b1d20]">Registrarme</span>
                  </button>
                </div>

                @if (selectedProfile(); as prof) {
                  <form (ngSubmit)="loginWithProfile()" class="pt-2 space-y-4">
                    <div class="p-4 rounded-[20px] bg-white border border-[#e1dfd8] space-y-3">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-full flex items-center justify-center text-white overflow-hidden font-semibold text-sm shrink-0"
                          [style.backgroundColor]="prof.color || '#5196fe'"
                        >
                          @if (isImage(prof.avatar)) {
                            <img [src]="prof.avatar" [alt]="prof.name" class="w-full h-full object-cover" />
                          } @else if (prof.avatar) {
                            <span class="text-xl">{{ prof.avatar }}</span>
                          } @else {
                            <span>{{ getInitials(prof.name) }}</span>
                          }
                        </div>
                        <div>
                          <p class="font-semibold text-sm text-[#1b1d20]">Hola, {{ prof.name }}</p>
                          <p class="text-xs text-[#6e6e6e]">Ingresa tu PIN único de 4 dígitos</p>
                        </div>
                      </div>

                      <input
                        type="password"
                        inputmode="numeric"
                        maxlength="4"
                        [(ngModel)]="loginPin"
                        name="loginPin"
                        placeholder="••••"
                        class="parker-input w-full px-4 py-3 text-center text-xl font-semibold tracking-[0.5em]"
                      />
                    </div>

                    @if (error()) {
                      <div class="p-3.5 rounded-[12.8px] bg-[#1b1d20] text-white text-xs font-medium">
                        {{ error() }}
                      </div>
                    }

                    <button
                      type="submit"
                      class="tap-btn w-full py-4 px-6 rounded-full bg-[#f9754e] text-white font-medium text-base"
                    >
                      Entrar como {{ prof.name }} →
                    </button>
                  </form>
                }
              </div>
            }

            <!-- Registration Form (New Member or New Family Admin) -->
            @if (entryMode() === 'create' || existingProfiles().length === 0 || creatingNew()) {
              <form (ngSubmit)="registerProfile()" class="space-y-4 pt-2 border-t border-[#e1dfd8]">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-[#1b1d20]">
                    {{ entryMode() === 'create' ? 'Tu perfil de Administrador' : 'Completa tu registro en el grupo' }}
                  </label>
                  @if (entryMode() === 'join' && existingProfiles().length > 0) {
                    <button
                      type="button"
                      (click)="creatingNew.set(false); error.set('')"
                      class="text-xs font-medium text-[#5196fe] hover:underline"
                    >
                      ← Volver a perfiles
                    </button>
                  }
                </div>

                <!-- Optional Avatar / Photo Upload + Color Picker -->
                <div class="bg-white border border-[#e1dfd8] rounded-[20px] p-4 space-y-3">
                  <div class="flex items-start gap-3.5">
                    <div
                      class="w-14 h-14 rounded-full flex items-center justify-center text-white overflow-hidden font-semibold text-lg shrink-0 transition-colors"
                      [style.backgroundColor]="selectedColor()"
                    >
                      @if (isImage(selectedAvatar())) {
                        <img [src]="selectedAvatar()" alt="Tu foto" class="w-full h-full object-cover" />
                      } @else if (selectedAvatar()) {
                        <span class="text-3xl">{{ selectedAvatar() }}</span>
                      } @else {
                        <span>{{ getInitials(memberName) }}</span>
                      }
                    </div>

                    <div class="flex-1 min-w-0 space-y-2">
                      <div class="flex items-center justify-between gap-2 flex-wrap">
                        <p class="text-xs font-medium text-[#6e6e6e]">
                          Avatar o foto <span class="text-[#a3a3a3]">(opcional)</span>
                        </p>
                        <div class="flex items-center gap-1.5">
                          <label class="tap-btn cursor-pointer px-3 py-1 rounded-full bg-[#5196fe]/10 text-[#005cb9] text-[11px] font-semibold">
                            📷 Subir foto
                            <input
                              type="file"
                              accept="image/*"
                              (change)="onPhotoSelected($event)"
                              class="hidden"
                            />
                          </label>
                          @if (selectedAvatar()) {
                            <button
                              type="button"
                              (click)="selectedAvatar.set('')"
                              class="tap-btn px-2.5 py-1 rounded-full bg-[#f2f1ec] text-[#6e6e6e] text-[11px] font-medium"
                            >
                              Usar iniciales
                            </button>
                          }
                        </div>
                      </div>

                      <div class="flex flex-wrap gap-1.5">
                        @for (av of avatars; track av) {
                          <button
                            type="button"
                            (click)="selectedAvatar.set(av)"
                            [class]="'w-8 h-8 rounded-full text-base flex items-center justify-center border transition-transform ' + (selectedAvatar() === av ? 'border-[#1b1d20] scale-110 bg-[#f2f1ec]' : 'border-transparent hover:bg-[#f2f1ec]')"
                          >
                            {{ av }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <span class="text-xs font-medium text-[#6e6e6e] mr-1">Color:</span>
                    @for (c of colors; track c) {
                      <button
                        type="button"
                        (click)="selectedColor.set(c)"
                        [style.backgroundColor]="c"
                        [class]="'w-6 h-6 rounded-full transition-transform ' + (selectedColor() === c ? 'ring-2 ring-offset-2 ring-[#1b1d20] scale-110' : '')"
                      ></button>
                    }
                  </div>
                </div>

                <!-- Name + Mandatory Unique 4-digit PIN -->
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div class="sm:col-span-7">
                    <label class="block text-xs font-medium text-[#6e6e6e] mb-1.5">
                      Tu nombre o apodo *
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="memberName"
                      name="memberName"
                      placeholder="Ej. Sofía, Carlos, Mamá"
                      maxlength="24"
                      class="parker-input w-full px-4 py-3 text-sm font-medium"
                    />
                  </div>

                  <div class="sm:col-span-5">
                    <label class="block text-xs font-medium text-[#6e6e6e] mb-1.5">
                      PIN único (4 dígitos) *
                    </label>
                    <input
                      type="password"
                      inputmode="numeric"
                      maxlength="4"
                      [(ngModel)]="userPin"
                      name="userPin"
                      placeholder="Ej. 4829"
                      class="parker-input w-full px-4 py-3 text-sm font-semibold tracking-[0.35em] text-center"
                    />
                  </div>
                </div>

                @if (error()) {
                  <div class="p-3.5 rounded-[12.8px] bg-[#1b1d20] text-white text-xs font-medium">
                    {{ error() }}
                  </div>
                }

                <button
                  type="submit"
                  class="tap-btn w-full py-4 px-6 rounded-full bg-[#f9754e] text-white font-medium text-base"
                >
                  {{ entryMode() === 'create' ? 'Crear familia y entrar →' : 'Unirme y entrar →' }}
                </button>
              </form>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  private storage = inject(StorageService);

  avatars = ['👨', '👩', '👧', '👦', '👵', '👴', '🧑', '🐶', '🦊', '🌟'];
  colors = ['#5196fe', '#f9754e', '#1b1d20', '#10b981', '#8b5cf6', '#f59e0b'];

  entryMode = signal<'join' | 'create'>('join');
  roomCode = signal('');
  familyName = '';
  selectedAvatar = signal('');
  selectedColor = signal('#5196fe');
  memberName = '';
  userPin = '';
  loginPin = '';

  joinedPreview = signal(false);
  creatingNew = signal(false);
  selectedProfile = signal<any | null>(null);
  error = signal('');

  constructor() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite') || params.get('room');
      if (invite) {
        this.roomCode.set(invite);
      }
    }
  }

  normalizedInput = computed(() => normalizeRoomCode(this.roomCode()));

  resolvedGroup = computed(() => {
    return this.storage.resolveInviteOrRoom(this.roomCode());
  });

  existingProfiles = computed(() => {
    const group = this.resolvedGroup();
    if (group) return group.members;
    const code = this.normalizedInput();
    if (code.length < 3) return [];
    return this.storage.getCachedProfiles(code);
  });

  setMode(mode: 'join' | 'create'): void {
    this.entryMode.set(mode);
    this.joinedPreview.set(false);
    this.creatingNew.set(false);
    this.selectedProfile.set(null);
    this.error.set('');
    if (mode === 'create' && !this.roomCode().trim()) {
      this.generateCode();
    }
  }

  isImage(val?: string): boolean {
    return Boolean(val && val.startsWith('data:image/'));
  }

  getInitials(name = ''): string {
    const clean = name.trim();
    if (!clean) return '?';
    const parts = clean.split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        this.selectedAvatar.set(dataUrl);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  onRoomCodeChange(val: string): void {
    this.roomCode.set(val);
    this.joinedPreview.set(false);
    this.selectedProfile.set(null);
    this.creatingNew.set(false);
    this.error.set('');
  }

  generateCode(): void {
    const num = Math.floor(1000 + Math.random() * 9000);
    this.onRoomCodeChange(`HOGAR-${num}`);
  }

  selectProfile(p: any): void {
    this.selectedProfile.set(p);
    this.loginPin = '';
    this.error.set('');
  }

  startNewProfile(): void {
    this.creatingNew.set(true);
    this.selectedProfile.set(null);
    this.error.set('');
  }

  loginWithProfile(): void {
    const prof = this.selectedProfile();
    const targetRoom = this.resolvedGroup()?.roomCode || this.normalizedInput();
    if (!prof || targetRoom.length < 3) return;

    const cleanPin = this.loginPin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      this.error.set('Ingresa tu PIN de 4 dígitos numéricos.');
      return;
    }

    if (prof.userPin && prof.userPin !== cleanPin) {
      this.error.set('PIN incorrecto para este perfil.');
      return;
    }

    this.storage.joinRoom({
      memberName: prof.name,
      roomCode: targetRoom,
      role: prof.role || 'member',
      adminPin: prof.role === 'admin' ? cleanPin : '',
      avatar: prof.avatar || '',
      color: prof.color,
      userPin: prof.userPin || cleanPin,
      familyName: this.resolvedGroup()?.familyName,
    });
  }

  registerProfile(): void {
    const isCreatingFamily = this.entryMode() === 'create';
    const targetRoom = isCreatingFamily
      ? this.normalizedInput()
      : this.resolvedGroup()?.roomCode || this.normalizedInput();
    const cleanName = this.memberName.trim();
    const cleanPin = this.userPin.trim();
    const cleanFamilyName = this.familyName.trim();

    if (isCreatingFamily && !cleanFamilyName) {
      this.error.set('Escribe el nombre de tu familia o grupo (ej. Familia Pérez).');
      return;
    }
    if (targetRoom.length < 3) {
      this.error.set('Ingresa un Código de Familia válido (mínimo 3 caracteres).');
      return;
    }
    if (!cleanName) {
      this.error.set('Escribe tu nombre o apodo para identificarte.');
      return;
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      this.error.set('El PIN personal es obligatorio y debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    const profiles = this.existingProfiles();
    const nameTaken = profiles.some(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (nameTaken) {
      this.error.set('Ya existe un perfil con ese nombre en esta sala. Elige otro o entra desde tu perfil.');
      return;
    }

    const pinTaken = profiles.some((p) => p.userPin && p.userPin === cleanPin);
    if (pinTaken) {
      this.error.set('Ese PIN ya está en uso por otro integrante. Elige un PIN único de 4 dígitos.');
      return;
    }

    this.storage.joinRoom({
      memberName: cleanName,
      roomCode: targetRoom,
      role: isCreatingFamily ? 'admin' : 'member',
      adminPin: isCreatingFamily ? cleanPin : '',
      avatar: this.selectedAvatar(),
      color: this.selectedColor(),
      userPin: cleanPin,
      familyName: isCreatingFamily
        ? cleanFamilyName
        : this.resolvedGroup()?.familyName || `Familia ${targetRoom}`,
    });
  }
}
