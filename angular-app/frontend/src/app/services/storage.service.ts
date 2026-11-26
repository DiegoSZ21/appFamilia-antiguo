import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { NotificationService } from './notification.service';

export interface SessionData {
  memberName: string;
  roomCode: string;
  role: 'member' | 'admin';
  adminPin?: string;
  avatar?: string;
  color?: string;
  userPin?: string;
  familyName?: string;
}

const SESSION_KEY = 'hogar_ng_session_v1';
const THEME_KEY = 'hogar_ng_theme_v1';
const ROOM_CACHE_PREFIX = 'hogar_ng_room_v1_';
const INVITE_CACHE_PREFIX = 'hogar_ng_invite_v1_';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const BACKEND_URL = isLocalhost
  ? 'http://localhost:3001'
  : typeof window !== 'undefined'
  ? window.location.origin
  : '';

export function normalizeRoomCode(code = ''): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-_]/g, '');
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private notif = inject(NotificationService);
  private socket: Socket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollIntervalId: any = null;

  session = signal<SessionData | null>(this.loadSession());
  roomState = signal<any | null>(null);
  connectionStatus = signal<'connected' | 'syncing' | 'offline'>('offline');
  theme = signal<'light' | 'dark'>(this.loadTheme());

  constructor() {
    this.applyTheme(this.theme());
    const existing = this.session();
    if (existing?.roomCode) {
      this.connect(existing);
    }
  }

  private loadSession(): SessionData | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private loadTheme(): 'light' | 'dark' {
    try {
      return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  }

  private applyTheme(t: 'light' | 'dark'): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', t === 'dark');
    }
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // Ignore
    }
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);
  }

  joinRoom(data: SessionData): void {
    const clean: SessionData = {
      ...data,
      roomCode: normalizeRoomCode(data.roomCode),
      memberName: data.memberName.trim(),
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(clean));
    } catch {
      // Ignore
    }
    this.session.set(clean);
    this.connect(clean);
  }

  logout(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
    this.disconnect();
    this.session.set(null);
    this.roomState.set(null);
  }

  private loadCachedRoom(code: string): any | null {
    try {
      const raw = localStorage.getItem(`${ROOM_CACHE_PREFIX}${code}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveCachedRoom(code: string, state: any): void {
    try {
      localStorage.setItem(`${ROOM_CACHE_PREFIX}${code}`, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }

  getCachedProfiles(roomCode: string): any[] {
    const code = normalizeRoomCode(roomCode);
    if (!code) return [];
    const cached = this.loadCachedRoom(code);
    return Object.values(cached?.members || {});
  }

  resolveInviteOrRoom(rawCode: string): {
    found: boolean;
    roomCode: string;
    familyName: string;
    members: any[];
    isInviteCode: boolean;
  } | null {
    const code = normalizeRoomCode(rawCode);
    if (code.length < 3) return null;

    try {
      const inviteRaw = localStorage.getItem(`${INVITE_CACHE_PREFIX}${code}`);
      if (inviteRaw) {
        const inv = JSON.parse(inviteRaw);
        const room = this.loadCachedRoom(inv.roomCode);
        return {
          found: true,
          roomCode: inv.roomCode,
          familyName: room?.meta?.familyName || inv.familyName || `Familia ${inv.roomCode}`,
          members: Object.values(room?.members || {}),
          isInviteCode: true,
        };
      }
    } catch {
      // Ignore
    }

    const room = this.loadCachedRoom(code);
    if (room) {
      return {
        found: true,
        roomCode: code,
        familyName: room?.meta?.familyName || `Familia ${code}`,
        members: Object.values(room?.members || {}),
        isInviteCode: false,
      };
    }

    return null;
  }

  generateInviteCode(): string {
    const sess = this.session();
    const state = this.roomState();
    if (!sess || !state) return '';
    const code = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const familyName = state.meta?.familyName || `Familia ${sess.roomCode}`;

    this.commit((draft) => {
      if (!draft.meta) draft.meta = {};
      if (!Array.isArray(draft.meta.inviteCodes)) draft.meta.inviteCodes = [];
      draft.meta.inviteCodes.unshift({
        code,
        createdAt: Date.now(),
        createdBy: sess.memberName,
      });
      draft.meta.inviteCodes = draft.meta.inviteCodes.slice(0, 10);
      return draft;
    });

    try {
      localStorage.setItem(
        `${INVITE_CACHE_PREFIX}${code}`,
        JSON.stringify({ roomCode: normalizeRoomCode(sess.roomCode), familyName })
      );
    } catch {
      // Ignore
    }
    return code;
  }

  updateFamilyName(familyName: string): void {
    const clean = familyName.trim();
    if (!clean) return;
    this.commit((draft) => {
      if (!draft.meta) draft.meta = {};
      draft.meta.familyName = clean;
      return draft;
    });
  }

  private createFallbackRoomState(code: string, sess: SessionData): any {
    const now = Date.now();
    return {
      meta: {
        roomCode: code,
        familyName: sess.familyName || `Familia ${code}`,
        inviteCodes: [],
        adminPin: sess.adminPin || '',
        weeklyBudget: 500,
        currency: 'S/',
        createdAt: now,
      },
      members: {
        [sess.memberName]: {
          name: sess.memberName,
          role: sess.role || 'member',
          avatar: sess.avatar || '👤',
          color: sess.color || '#5196fe',
          userPin: sess.userPin || '',
          statusId: 'home',
          statusLabel: 'En casa',
          statusEmoji: '🏠',
          location: null,
          lastSeen: now,
        },
      },
      customStatuses: [],
      shopping: { pending: [], bought: [] },
      savings: { goals: [] },
      chores: [],
      choreLogs: [],
      events: [],
      lastActivity: null,
      updatedAt: now,
      updatedBy: sess.memberName,
    };
  }

  connect(sess: SessionData): void {
    const code = normalizeRoomCode(sess.roomCode);
    if (!code) return;

    this.disconnect();
    const cached = this.loadCachedRoom(code);
    if (cached) {
      if (!cached.members) cached.members = {};
      const existingMember = cached.members[sess.memberName];
      cached.members[sess.memberName] = {
        name: sess.memberName,
        role: sess.role || existingMember?.role || 'member',
        avatar: sess.avatar || existingMember?.avatar || '👤',
        color: sess.color || existingMember?.color || '#5196fe',
        userPin: sess.userPin || existingMember?.userPin || '',
        statusId: existingMember?.statusId || 'home',
        statusLabel: existingMember?.statusLabel || 'En casa',
        statusEmoji: existingMember?.statusEmoji || '🏠',
        location: existingMember?.location || null,
        lastSeen: Date.now(),
      };
      this.saveCachedRoom(code, cached);
      this.roomState.set(cached);
      this.notif.setInitialActivityId(cached?.lastActivity?.id || null);
    } else {
      const initial = this.createFallbackRoomState(code, sess);
      this.roomState.set(initial);
      this.saveCachedRoom(code, initial);
    }

    this.connectionStatus.set('syncing');

    // Cloudflare Worker API: Register join & get authoritative cloud state
    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          memberName: sess.memberName,
          role: sess.role,
          adminPin: sess.adminPin,
          avatar: sess.avatar,
          color: sess.color,
          userPin: sess.userPin,
          familyName: sess.familyName,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((cloudState) => {
          if (cloudState) {
            this.connectionStatus.set('connected');
            this.roomState.set(cloudState);
            this.saveCachedRoom(code, cloudState);
          }
        })
        .catch(() => {});

      // Setup continuous real-time polling on Cloudflare
      if (this.pollIntervalId) clearInterval(this.pollIntervalId);
      this.pollIntervalId = setInterval(() => {
        fetch(`${BACKEND_URL}/api/rooms/${code}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((live) => {
            if (!live) return;
            const cur = this.roomState();
            if (!cur || (live.updatedAt || 0) > (cur.updatedAt || 0)) {
              this.connectionStatus.set('connected');
              this.roomState.set(live);
              this.saveCachedRoom(code, live);
              if (live.lastActivity && live.lastActivity.actor !== this.session()?.memberName) {
                this.notif.notifyFromActivity(live.lastActivity, this.session()?.memberName);
              }
            }
          })
          .catch(() => {});
      }, 2000);
    }

    // Setup inter-tab BroadcastChannel for 0ms local sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel?.close();
        this.broadcastChannel = new BroadcastChannel(`hogar_tab_sync_${code}`);
        this.broadcastChannel.onmessage = (ev) => {
          if (ev.data?.type === 'state_update' && ev.data?.state) {
            this.roomState.set(ev.data.state);
            this.saveCachedRoom(code, ev.data.state);
            if (ev.data.state.lastActivity) {
              this.notif.notifyFromActivity(ev.data.state.lastActivity, this.session()?.memberName);
            }
          }
        };
      } catch {
        // BroadcastChannel not available or restricted
      }
    }

    // Connect to Socket.IO when running locally
    if (isLocalhost) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      this.socket.on('connect', () => {
        this.connectionStatus.set('connected');
        this.socket?.emit('join_room', {
          roomCode: code,
          memberName: sess.memberName,
          role: sess.role,
          adminPin: sess.adminPin,
          avatar: sess.avatar,
          color: sess.color,
          userPin: sess.userPin,
          familyName: sess.familyName,
        });
      });

      this.socket.on('disconnect', () => {
        this.connectionStatus.set('offline');
      });

      this.socket.on('connect_error', () => {
        this.connectionStatus.set('offline');
      });

      this.socket.on('room_state', (incoming: any) => {
        if (!incoming) return;
        this.roomState.set(incoming);
        this.saveCachedRoom(code, incoming);
        if (incoming.lastActivity) {
          this.notif.notifyFromActivity(incoming.lastActivity, this.session()?.memberName);
        }
      });
    }
  }

  refreshConnection(): void {
    const sess = this.session();
    if (sess) this.connect(sess);
  }

  disconnect(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus.set('offline');
  }

  private commit(updater: (draft: any) => any, activity: any = null): void {
    const sess = this.session();
    if (!sess) return;
    const current = this.roomState() || this.createFallbackRoomState(normalizeRoomCode(sess.roomCode), sess);

    const next = updater(structuredClone(current));
    next.updatedAt = Date.now();
    next.updatedBy = sess.memberName;

    if (activity) {
      next.lastActivity = {
        id: `act_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        actor: sess.memberName,
        createdAt: Date.now(),
        ...activity,
      };
      this.notif.notifyFromActivity(next.lastActivity, sess.memberName);
    }

    this.roomState.set(next);
    this.saveCachedRoom(sess.roomCode, next);

    // Save to Cloudflare Worker KV database
    if (BACKEND_URL) {
      fetch(`${BACKEND_URL}/api/rooms/${sess.roomCode}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
    }

    // Broadcast instantly to all tabs/windows via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'state_update', state: next });
      } catch {}
    }

    // Broadcast across devices via WebSocket when local
    if (this.socket?.connected) {
      this.socket.emit('update_state', { roomCode: sess.roomCode, state: next });
    }
  }

  // --- MEMBER STATUS & LOCATION ---
  updateMemberStatus(statusObj: { id: string; label: string; emoji: string }): void {
    const name = this.session()?.memberName;
    if (!name) return;
    this.commit(
      (draft) => {
        const cur = draft.members[name] || { name, role: 'member' };
        draft.members[name] = {
          ...cur,
          statusId: statusObj.id,
          statusLabel: statusObj.label,
          statusEmoji: statusObj.emoji,
          lastSeen: Date.now(),
        };
        return draft;
      },
      {
        module: 'status',
        title: 'Estado Familiar',
        message: `${name} ahora está: ${statusObj.label}`,
        emoji: statusObj.emoji,
      }
    );
  }

  updateMemberLocation(location: { lat: number; lng: number; updatedAt: number } | null): void {
    const name = this.session()?.memberName;
    if (!name) return;
    const hadLocation = Boolean(this.roomState()?.members?.[name]?.location?.lat);
    this.commit(
      (draft) => {
        if (!draft.members) draft.members = {};
        const cur = draft.members[name] || { name, role: 'member' };
        draft.members[name] = { ...cur, location, lastSeen: Date.now() };
        return draft;
      },
      location && !hadLocation
        ? {
            module: 'status',
            title: 'Ubicación en vivo',
            message: `${name} compartió su ubicación en tiempo real`,
            emoji: '📍',
          }
        : null
    );
  }

  addCustomStatus(label: string, emoji: string): void {
    const name = this.session()?.memberName;
    if (!name || !label.trim()) return;
    const st = { id: `custom_${Date.now()}`, label: label.trim(), emoji: emoji || '✨' };
    this.commit((draft) => {
      draft.customStatuses = draft.customStatuses || [];
      draft.customStatuses.push(st);
      const cur = draft.members[name] || { name, role: 'member' };
      draft.members[name] = {
        ...cur,
        statusId: st.id,
        statusLabel: st.label,
        statusEmoji: st.emoji,
        lastSeen: Date.now(),
      };
      return draft;
    });
  }

  removeCustomStatus(statusId: string): void {
    this.commit((draft) => {
      draft.customStatuses = (draft.customStatuses || []).filter((s: any) => s.id !== statusId);
      return draft;
    });
  }

  // --- SHOPPING ---
  addShoppingItem(item: { label: string; emoji?: string }): void {
    const name = this.session()?.memberName || 'Familia';
    this.commit(
      (draft) => {
        const exists = draft.shopping.pending.some(
          (p: any) => p.label.toLowerCase() === item.label.toLowerCase()
        );
        if (exists) return draft;
        draft.shopping.pending.unshift({
          id: `shop_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          label: item.label,
          emoji: item.emoji || '🛒',
          requestedBy: name,
          createdAt: Date.now(),
        });
        return draft;
      },
      {
        module: 'shopping',
        title: 'Lista de Compras',
        message: `${name} pidió: ${item.label}`,
        emoji: item.emoji || '🛒',
      }
    );
  }

  markItemBought(itemId: string, amount: number): void {
    const name = this.session()?.memberName || 'Familia';
    const curSym = this.roomState()?.meta?.currency || 'S/';
    let label = 'producto';
    let emoji = '✅';
    this.commit(
      (draft) => {
        const idx = draft.shopping.pending.findIndex((i: any) => i.id === itemId);
        if (idx === -1) return draft;
        const [item] = draft.shopping.pending.splice(idx, 1);
        label = item.label;
        emoji = item.emoji || '✅';
        draft.shopping.bought.unshift({
          ...item,
          amount: Number(amount) || 0,
          boughtBy: name,
          boughtAt: Date.now(),
        });
        return draft;
      },
      {
        module: 'shopping',
        title: 'Compra Registrada',
        message: `${name} compró ${label} (${curSym} ${Number(amount || 0).toFixed(2)})`,
        emoji,
      }
    );
  }

  removeShoppingPending(itemId: string): void {
    this.commit((draft) => {
      draft.shopping.pending = draft.shopping.pending.filter((i: any) => i.id !== itemId);
      return draft;
    });
  }

  removeShoppingBought(itemId: string): void {
    this.commit((draft) => {
      draft.shopping.bought = draft.shopping.bought.filter((i: any) => i.id !== itemId);
      return draft;
    });
  }

  // --- SAVINGS (MULTI-GOAL) ---
  addSavingsGoal(goal: { title: string; emoji: string; targetAmount: number }): void {
    const name = this.session()?.memberName || 'Familia';
    this.commit(
      (draft) => {
        draft.savings.goals.push({
          id: `goal_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          title: goal.title.trim(),
          emoji: goal.emoji || '🐷',
          targetAmount: Number(goal.targetAmount) || 500,
          contributions: [],
          createdAt: Date.now(),
          createdBy: name,
        });
        return draft;
      },
      {
        module: 'savings',
        title: 'Nueva Meta Familiar',
        message: `${name} creó la meta: ${goal.title}`,
        emoji: goal.emoji || '🎯',
      }
    );
  }

  updateSavingsGoal(goalId: string, goal: { title: string; emoji: string; targetAmount: number }): void {
    this.commit((draft) => {
      const g = draft.savings.goals.find((x: any) => x.id === goalId);
      if (!g) return draft;
      if (goal.title) g.title = goal.title;
      if (goal.emoji) g.emoji = goal.emoji;
      if (goal.targetAmount > 0) g.targetAmount = Number(goal.targetAmount);
      return draft;
    });
  }

  deleteSavingsGoal(goalId: string): void {
    this.commit((draft) => {
      draft.savings.goals = draft.savings.goals.filter((g: any) => g.id !== goalId);
      return draft;
    });
  }

  addSavingsContribution(goalId: string, amount: number): void {
    const name = this.session()?.memberName || 'Familia';
    const curSym = this.roomState()?.meta?.currency || 'S/';
    let title = 'Alcancía';
    let emoji = '🐷';
    this.commit(
      (draft) => {
        const g = draft.savings.goals.find((x: any) => x.id === goalId);
        if (!g) return draft;
        title = g.title;
        emoji = g.emoji || '🐷';
        g.contributions.unshift({
          id: `sav_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          amount: Number(amount) || 0,
          memberName: name,
          createdAt: Date.now(),
        });
        return draft;
      },
      {
        module: 'savings',
        title: 'Aporte a la Alcancía',
        message: `${name} aportó +${curSym} ${amount} a ${title}`,
        emoji,
      }
    );
  }

  removeSavingsContribution(goalId: string, contributionId: string): void {
    this.commit((draft) => {
      const g = draft.savings.goals.find((x: any) => x.id === goalId);
      if (!g) return draft;
      g.contributions = g.contributions.filter((c: any) => c.id !== contributionId);
      return draft;
    });
  }

  // --- CHORES ---
  setChoreState(choreId: string, nextStatus: string): void {
    const name = this.session()?.memberName || 'Familia';
    let label = 'una tarea';
    let emoji = '🧹';
    this.commit(
      (draft) => {
        const c = draft.chores.find((x: any) => x.id === choreId);
        if (!c) return draft;
        label = c.label;
        emoji = c.emoji || '🧹';
        c.status = nextStatus;
        c.updatedAt = Date.now();
        if (nextStatus === 'assigned') {
          c.assignedTo = name;
          c.completedBy = null;
        } else if (nextStatus === 'done') {
          c.completedBy = name;
          draft.choreLogs = draft.choreLogs || [];
          draft.choreLogs.unshift({
            id: `clog_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
            choreId: c.id,
            choreLabel: c.label,
            choreEmoji: c.emoji,
            memberName: name,
            createdAt: Date.now(),
          });
        } else {
          c.assignedTo = null;
          c.completedBy = null;
        }
        return draft;
      },
      nextStatus !== 'idle'
        ? {
            module: 'chores',
            title: 'Tareas del Hogar',
            message:
              nextStatus === 'urgent'
                ? `${name} marcó urgente: ${label}`
                : nextStatus === 'assigned'
                ? `${name} se encarga de: ${label}`
                : `${name} completó: ${label} 🎉`,
            emoji,
          }
        : null
    );
  }

  addCustomChore(label: string, emoji = '✨'): void {
    const name = this.session()?.memberName || 'Familia';
    this.commit(
      (draft) => {
        draft.chores.unshift({
          id: `chore_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          label: label.trim(),
          emoji,
          status: 'urgent',
          assignedTo: null,
          completedBy: null,
          updatedAt: Date.now(),
          isPreset: false,
        });
        return draft;
      },
      {
        module: 'chores',
        title: 'Nueva Tarea',
        message: `${name} añadió: ${label}`,
        emoji,
      }
    );
  }

  editChore(choreId: string, data: { label: string; emoji: string }): void {
    this.commit((draft) => {
      const c = draft.chores.find((x: any) => x.id === choreId);
      if (!c) return draft;
      if (data.label?.trim()) c.label = data.label.trim();
      if (data.emoji) c.emoji = data.emoji;
      c.updatedAt = Date.now();
      return draft;
    });
  }

  deleteChore(choreId: string): void {
    this.commit((draft) => {
      draft.chores = draft.chores.filter((c: any) => c.id !== choreId);
      return draft;
    });
  }

  // --- EVENTS ---
  addEvent(evt: { title: string; emoji: string; dayLabel: string; timeLabel: string }): void {
    const name = this.session()?.memberName || 'Familia';
    this.commit(
      (draft) => {
        draft.events.unshift({
          id: `evt_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          ...evt,
          createdBy: name,
          rsvps: { [name]: 'going' },
          createdAt: Date.now(),
        });
        return draft;
      },
      {
        module: 'events',
        title: 'Nuevo Evento Familiar',
        message: `${name}: ${evt.title} (${evt.dayLabel} • ${evt.timeLabel})`,
        emoji: evt.emoji || '📅',
      }
    );
  }

  setEventRsvp(eventId: string, rsvpId: string): void {
    const name = this.session()?.memberName || 'Familia';
    let title = 'un evento';
    this.commit(
      (draft) => {
        const e = draft.events.find((x: any) => x.id === eventId);
        if (!e) return draft;
        title = e.title;
        e.rsvps = e.rsvps || {};
        e.rsvps[name] = rsvpId;
        return draft;
      },
      {
        module: 'events',
        title: 'Confirmación de Evento',
        message: `${name} respondió a: ${title}`,
        emoji: rsvpId === 'going' ? '👍' : rsvpId === 'late' ? '🏃' : '❌',
      }
    );
  }

  removeEvent(eventId: string): void {
    this.commit((draft) => {
      draft.events = draft.events.filter((e: any) => e.id !== eventId);
      return draft;
    });
  }

  // --- ADMIN ---
  updateBudget(weeklyBudget: number): void {
    this.commit((draft) => {
      draft.meta.weeklyBudget = Number(weeklyBudget) || 500;
      return draft;
    });
  }

  updateCurrency(currency: string): void {
    this.commit((draft) => {
      draft.meta.currency = currency || 'S/';
      return draft;
    });
  }

  resetWeeklyExpenses(): void {
    const name = this.session()?.memberName || 'Admin';
    this.commit(
      (draft) => {
        draft.shopping.bought = [];
        draft.chores = draft.chores.map((c: any) => ({
          ...c,
          status: 'idle',
          assignedTo: null,
          completedBy: null,
          updatedAt: Date.now(),
        }));
        return draft;
      },
      {
        module: 'chores',
        title: 'Semana Reiniciada',
        message: `${name} reinició los gastos y tareas de la semana`,
        emoji: '🔄',
      }
    );
  }

  removeMember(memberName: string): void {
    this.commit((draft) => {
      delete draft.members[memberName];
      return draft;
    });
  }
}
