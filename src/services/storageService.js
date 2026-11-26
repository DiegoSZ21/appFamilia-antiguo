import mqtt from 'mqtt';
import { CHORE_PRESETS, MEMBER_STATUSES } from '../constants/familyPresets';
import { notificationService } from './notificationService';

const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const TOPIC_PREFIX = 'hogar-conectado/v1';
const SESSION_KEY = 'hogar_conectado_session_v1';
const THEME_KEY = 'hogar_conectado_theme_v1';
const ROOM_STORAGE_PREFIX = 'hogar_conectado_room_v1_';
const CHANNEL_NAME = 'hogar_conectado_sync_v1';

export function normalizeRoomCode(code = '') {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-_]/g, '');
}

export function createInitialRoomState(roomCode, adminPin = '') {
  return {
    meta: {
      roomCode,
      adminPin,
      weeklyBudget: 500,
      currency: 'S/',
      createdAt: Date.now(),
    },
    members: {},
    customStatuses: [],
    shopping: {
      pending: [],
      bought: [],
    },
    savings: {
      goals: [
        {
          id: 'goal_vacaciones',
          title: 'Vacaciones',
          emoji: '🏖️',
          targetAmount: 2000,
          contributions: [],
          createdAt: Date.now(),
          createdBy: 'Sistema',
        },
      ],
    },
    chores: CHORE_PRESETS.map((preset) => ({
      id: preset.id,
      label: preset.label,
      emoji: preset.emoji,
      status: 'idle', // 'idle' | 'urgent' | 'assigned' | 'done'
      assignedTo: null,
      completedBy: null,
      updatedAt: Date.now(),
      isPreset: true,
    })),
    choreLogs: [],
    events: [],
    lastActivity: null,
    updatedAt: Date.now(),
    updatedBy: 'Sistema',
  };
}

function migrateState(state) {
  if (!state) return state;
  const copy = structuredClone(state);
  if (!copy.customStatuses) copy.customStatuses = [];
  if (!copy.choreLogs) copy.choreLogs = [];
  if (!copy.savings) {
    copy.savings = { goals: [] };
  }
  if (!Array.isArray(copy.savings.goals)) {
    copy.savings.goals = [
      {
        id: 'goal_migrated',
        title: copy.savings.goalTitle || 'Vacaciones',
        emoji: copy.savings.goalEmoji || '🏖️',
        targetAmount: Number(copy.savings.targetAmount) || 2000,
        contributions: Array.isArray(copy.savings.contributions)
          ? copy.savings.contributions
          : [],
        createdAt: Date.now(),
        createdBy: 'Familia',
      },
    ];
  }
  return copy;
}

class StorageService {
  constructor() {
    this.client = null;
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
    this.roomCode = null;
    this.state = null;
    this.connectionStatus = 'offline'; // 'connected' | 'syncing' | 'offline'
    this.stateListeners = new Set();
    this.statusListeners = new Set();

    if (this.channel) {
      this.channel.onmessage = (event) => {
        const { type, roomCode, payload } = event.data || {};
        if (type === 'STATE_UPDATE' && roomCode === this.roomCode && payload) {
          this.applyIncomingState(payload, false);
        }
      };
    }
  }

  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage quota errors
    }
  }

  clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
    this.disconnect();
  }

  getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore
    }
  }

  loadLocalRoom(roomCode) {
    try {
      const raw = localStorage.getItem(`${ROOM_STORAGE_PREFIX}${roomCode}`);
      return raw ? migrateState(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  saveLocalRoom(roomCode, state) {
    try {
      localStorage.setItem(`${ROOM_STORAGE_PREFIX}${roomCode}`, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }

  subscribeState(listener) {
    this.stateListeners.add(listener);
    if (this.state) listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => this.statusListeners.delete(listener);
  }

  notifyState() {
    this.stateListeners.forEach((fn) => fn(this.state));
  }

  setStatus(status) {
    this.connectionStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  getTopic(roomCode) {
    return `${TOPIC_PREFIX}/${roomCode}/state`;
  }

  connect(roomCode, session) {
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized) return;

    if (this.roomCode === normalized && this.client && this.client.connected) {
      this.registerMemberInState(session);
      return;
    }

    this.disconnect();
    this.roomCode = normalized;

    const cached = this.loadLocalRoom(normalized);
    this.state = cached || createInitialRoomState(normalized, session?.role === 'admin' ? session.adminPin || '' : '');
    if (this.state?.lastActivity?.id) {
      notificationService.lastSeenActivityId = this.state.lastActivity.id;
    }
    this.notifyState();

    this.setStatus('syncing');

    const clientId = `hogar_${normalized}_${Math.random().toString(16).slice(2, 10)}`;
    this.client = mqtt.connect(BROKER_URL, {
      clientId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 4000,
    });

    const topic = this.getTopic(normalized);

    this.client.on('connect', () => {
      this.setStatus('connected');
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (!err && session) {
          setTimeout(() => {
            if (this.roomCode === normalized) {
              this.registerMemberInState(session);
            }
          }, 450);
        }
      });
    });

    this.client.on('reconnect', () => {
      this.setStatus('syncing');
    });

    this.client.on('offline', () => {
      this.setStatus('offline');
    });

    this.client.on('error', () => {
      this.setStatus('offline');
    });

    this.client.on('message', (msgTopic, message) => {
      if (msgTopic !== topic) return;
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed && parsed.meta && parsed.meta.roomCode === normalized) {
          this.applyIncomingState(parsed, true);
        }
      } catch {
        // Ignore malformed payloads
      }
    });
  }

  refreshConnection() {
    if (!this.roomCode) return;
    const session = this.getSession();
    this.setStatus('syncing');
    if (this.client) {
      try {
        this.client.reconnect();
      } catch {
        this.connect(this.roomCode, session);
      }
    } else {
      this.connect(this.roomCode, session);
    }
  }

  disconnect() {
    if (this.client) {
      try {
        this.client.end(true);
      } catch {
        // Ignore
      }
      this.client = null;
    }
    this.roomCode = null;
    this.setStatus('offline');
  }

  applyIncomingState(incoming, fromMqtt = false) {
    if (!incoming) return;
    const migrated = migrateState(incoming);
    const currentUpdated = this.state?.updatedAt || 0;
    const incomingUpdated = migrated.updatedAt || 0;

    if (!this.state || incomingUpdated >= currentUpdated) {
      this.state = migrated;
      this.saveLocalRoom(this.roomCode, this.state);
      this.notifyState();

      const session = this.getSession();
      if (migrated.lastActivity) {
        notificationService.notifyFromActivity(migrated.lastActivity, session?.memberName);
      }

      if (fromMqtt && this.channel) {
        this.channel.postMessage({
          type: 'STATE_UPDATE',
          roomCode: this.roomCode,
          payload: this.state,
        });
      }
    }
  }

  commitState(updater, actorName = 'Familia', activity = null) {
    if (!this.roomCode) return;
    const base = migrateState(this.state || createInitialRoomState(this.roomCode));
    const next = updater(structuredClone(base));
    next.updatedAt = Date.now();
    next.updatedBy = actorName;

    if (activity) {
      next.lastActivity = {
        id: `act_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        actor: actorName,
        createdAt: Date.now(),
        ...activity,
      };
      notificationService.notifyFromActivity(next.lastActivity, actorName);
    }

    this.state = next;
    this.saveLocalRoom(this.roomCode, next);
    this.notifyState();

    if (this.channel) {
      this.channel.postMessage({
        type: 'STATE_UPDATE',
        roomCode: this.roomCode,
        payload: next,
      });
    }

    if (this.client && this.client.connected) {
      this.client.publish(this.getTopic(this.roomCode), JSON.stringify(next), {
        retain: true,
        qos: 1,
      });
    }
  }

  registerMemberInState(session) {
    if (!session?.memberName || !this.roomCode) return;
    const existing = this.state?.members?.[session.memberName];
    const defaultStatus = MEMBER_STATUSES[0];

    this.commitState((draft) => {
      if (session.role === 'admin' && session.adminPin && !draft.meta.adminPin) {
        draft.meta.adminPin = session.adminPin;
      }
      draft.members[session.memberName] = {
        name: session.memberName,
        role: session.role || existing?.role || 'member',
        statusId: existing?.statusId || defaultStatus.id,
        statusLabel: existing?.statusLabel || defaultStatus.label,
        statusEmoji: existing?.statusEmoji || defaultStatus.emoji,
        location: existing?.location || null,
        lastSeen: Date.now(),
      };
      return draft;
    }, session.memberName);
  }

  updateMemberStatus(memberName, statusObj) {
    this.commitState(
      (draft) => {
        const current = draft.members[memberName] || { name: memberName, role: 'member' };
        draft.members[memberName] = {
          ...current,
          statusId: statusObj.id,
          statusLabel: statusObj.label,
          statusEmoji: statusObj.emoji,
          lastSeen: Date.now(),
        };
        return draft;
      },
      memberName,
      {
        module: 'status',
        title: 'Estado Familiar',
        message: `${memberName} ahora está: ${statusObj.label}`,
        emoji: statusObj.emoji,
      }
    );
  }

  updateMemberLocation(memberName, location) {
    this.commitState(
      (draft) => {
        const current = draft.members[memberName] || { name: memberName, role: 'member' };
        draft.members[memberName] = {
          ...current,
          location,
          lastSeen: Date.now(),
        };
        return draft;
      },
      memberName,
      location
        ? {
            module: 'status',
            title: 'Ubicación en vivo',
            message: `${memberName} compartió su ubicación en tiempo real`,
            emoji: '📍',
          }
        : null
    );
  }

  addCustomStatus(label, emoji, memberName) {
    const clean = label.trim();
    if (!clean) return null;
    const newStatus = {
      id: `custom_${Date.now()}`,
      label: clean,
      emoji: emoji || '✨',
    };
    this.commitState((draft) => {
      draft.customStatuses.push(newStatus);
      const current = draft.members[memberName] || { name: memberName, role: 'member' };
      draft.members[memberName] = {
        ...current,
        statusId: newStatus.id,
        statusLabel: newStatus.label,
        statusEmoji: newStatus.emoji,
        lastSeen: Date.now(),
      };
      return draft;
    }, memberName);
    return newStatus;
  }

  removeCustomStatus(statusId, actor) {
    this.commitState((draft) => {
      draft.customStatuses = draft.customStatuses.filter((s) => s.id !== statusId);
      return draft;
    }, actor);
  }

  // --- COMPRAS Y GASTOS ---
  addShoppingItem(item, requestedBy) {
    this.commitState(
      (draft) => {
        const exists = draft.shopping.pending.some(
          (p) => p.label.toLowerCase() === item.label.toLowerCase()
        );
        if (exists) return draft;
        draft.shopping.pending.unshift({
          id: `shop_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          label: item.label,
          emoji: item.emoji || '🛒',
          requestedBy,
          createdAt: Date.now(),
        });
        return draft;
      },
      requestedBy,
      {
        module: 'shopping',
        title: 'Lista de Compras',
        message: `${requestedBy} pidió: ${item.label}`,
        emoji: item.emoji || '🛒',
      }
    );
  }

  markItemBought(itemId, amount, boughtBy) {
    let boughtLabel = 'un producto';
    let boughtEmoji = '✅';
    this.commitState(
      (draft) => {
        const idx = draft.shopping.pending.findIndex((i) => i.id === itemId);
        if (idx === -1) return draft;
        const [item] = draft.shopping.pending.splice(idx, 1);
        boughtLabel = item.label;
        boughtEmoji = item.emoji || '✅';
        draft.shopping.bought.unshift({
          ...item,
          amount: Number(amount) || 0,
          boughtBy,
          boughtAt: Date.now(),
        });
        return draft;
      },
      boughtBy,
      {
        module: 'shopping',
        title: 'Compra Registrada',
        message: `${boughtBy} compró ${boughtLabel} (${this.state?.meta?.currency || 'S/'} ${Number(amount || 0).toFixed(2)})`,
        emoji: boughtEmoji,
      }
    );
  }

  removeShoppingPending(itemId, actor) {
    this.commitState((draft) => {
      draft.shopping.pending = draft.shopping.pending.filter((i) => i.id !== itemId);
      return draft;
    }, actor);
  }

  removeShoppingBought(itemId, actor) {
    this.commitState((draft) => {
      draft.shopping.bought = draft.shopping.bought.filter((i) => i.id !== itemId);
      return draft;
    }, actor);
  }

  // --- ALCANCÍA Y AHORRO (MÚLTIPLES METAS) ---
  addSavingsGoal({ title, emoji, targetAmount }, actor) {
    this.commitState(
      (draft) => {
        draft.savings.goals.push({
          id: `goal_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          title: title.trim(),
          emoji: emoji || '🐷',
          targetAmount: Number(targetAmount) || 500,
          contributions: [],
          createdAt: Date.now(),
          createdBy: actor,
        });
        return draft;
      },
      actor,
      {
        module: 'savings',
        title: 'Nueva Meta Familiar',
        message: `${actor} creó la meta: ${title}`,
        emoji: emoji || '🎯',
      }
    );
  }

  deleteSavingsGoal(goalId, actor) {
    this.commitState((draft) => {
      draft.savings.goals = draft.savings.goals.filter((g) => g.id !== goalId);
      return draft;
    }, actor);
  }

  addSavingsContribution(goalId, amount, memberName) {
    let goalName = 'Alcancía';
    let goalEmoji = '🐷';
    this.commitState(
      (draft) => {
        const goal = draft.savings.goals.find((g) => g.id === goalId);
        if (!goal) return draft;
        goalName = goal.title;
        goalEmoji = goal.emoji || '🐷';
        goal.contributions.unshift({
          id: `sav_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          amount: Number(amount) || 0,
          memberName,
          createdAt: Date.now(),
        });
        return draft;
      },
      memberName,
      {
        module: 'savings',
        title: 'Aporte a la Alcancía',
        message: `${memberName} aportó +${this.state?.meta?.currency || 'S/'} ${amount} a ${goalName}`,
        emoji: goalEmoji,
      }
    );
  }

  removeSavingsContribution(goalId, contributionId, actor) {
    this.commitState((draft) => {
      const goal = draft.savings.goals.find((g) => g.id === goalId);
      if (!goal) return draft;
      goal.contributions = goal.contributions.filter((c) => c.id !== contributionId);
      return draft;
    }, actor);
  }

  updateSavingsGoal(goalId, { title, emoji, targetAmount }, actor) {
    this.commitState((draft) => {
      const goal = draft.savings.goals.find((g) => g.id === goalId);
      if (!goal) return draft;
      if (title) goal.title = title;
      if (emoji) goal.emoji = emoji;
      if (targetAmount && Number(targetAmount) > 0) {
        goal.targetAmount = Number(targetAmount);
      }
      return draft;
    }, actor);
  }

  // --- PENDIENTES DOMÉSTICOS ---
  setChoreState(choreId, nextStatus, memberName) {
    let label = 'una tarea';
    let emoji = '🧹';
    this.commitState(
      (draft) => {
        const chore = draft.chores.find((c) => c.id === choreId);
        if (!chore) return draft;
        label = chore.label;
        emoji = chore.emoji || '🧹';
        chore.status = nextStatus;
        chore.updatedAt = Date.now();
        if (nextStatus === 'assigned') {
          chore.assignedTo = memberName;
          chore.completedBy = null;
        } else if (nextStatus === 'done') {
          chore.completedBy = memberName;
          draft.choreLogs.unshift({
            id: `clog_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
            choreId: chore.id,
            choreLabel: chore.label,
            choreEmoji: chore.emoji,
            memberName,
            createdAt: Date.now(),
          });
          if (draft.choreLogs.length > 60) {
            draft.choreLogs = draft.choreLogs.slice(0, 60);
          }
        } else if (nextStatus === 'urgent' || nextStatus === 'idle') {
          chore.assignedTo = null;
          chore.completedBy = null;
        }
        return draft;
      },
      memberName,
      nextStatus !== 'idle'
        ? {
            module: 'chores',
            title: 'Tareas del Hogar',
            message:
              nextStatus === 'urgent'
                ? `${memberName} marcó urgente: ${label}`
                : nextStatus === 'assigned'
                ? `${memberName} se encarga de: ${label}`
                : `${memberName} completó: ${label} 🎉`,
            emoji,
          }
        : null
    );
  }

  addCustomChore(label, emoji, memberName) {
    this.commitState(
      (draft) => {
        draft.chores.unshift({
          id: `chore_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          label,
          emoji: emoji || '✨',
          status: 'urgent',
          assignedTo: null,
          completedBy: null,
          updatedAt: Date.now(),
          isPreset: false,
        });
        return draft;
      },
      memberName,
      {
        module: 'chores',
        title: 'Nueva Tarea',
        message: `${memberName} añadió: ${label}`,
        emoji: emoji || '✨',
      }
    );
  }

  editChore(choreId, { label, emoji }, actor) {
    this.commitState((draft) => {
      const chore = draft.chores.find((c) => c.id === choreId);
      if (!chore) return draft;
      if (label?.trim()) chore.label = label.trim();
      if (emoji) chore.emoji = emoji;
      chore.updatedAt = Date.now();
      return draft;
    }, actor);
  }

  deleteChore(choreId, actor) {
    this.commitState((draft) => {
      draft.chores = draft.chores.filter((c) => c.id !== choreId);
      return draft;
    }, actor);
  }

  // --- EVENTOS Y AVISOS ---
  addEvent({ title, emoji, dayLabel, timeLabel }, createdBy) {
    this.commitState(
      (draft) => {
        draft.events.unshift({
          id: `evt_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
          title,
          emoji: emoji || '📅',
          dayLabel,
          timeLabel,
          createdBy,
          rsvps: {
            [createdBy]: 'going',
          },
          createdAt: Date.now(),
        });
        return draft;
      },
      createdBy,
      {
        module: 'events',
        title: 'Nuevo Evento Familiar',
        message: `${createdBy}: ${title} (${dayLabel} • ${timeLabel})`,
        emoji: emoji || '📅',
      }
    );
  }

  setEventRsvp(eventId, memberName, rsvpId) {
    let evtTitle = 'un evento';
    this.commitState(
      (draft) => {
        const evt = draft.events.find((e) => e.id === eventId);
        if (!evt) return draft;
        evtTitle = evt.title;
        if (!evt.rsvps) evt.rsvps = {};
        evt.rsvps[memberName] = rsvpId;
        return draft;
      },
      memberName,
      {
        module: 'events',
        title: 'Confirmación de Evento',
        message: `${memberName} respondió a: ${evtTitle}`,
        emoji: rsvpId === 'going' ? '👍' : rsvpId === 'late' ? '🏃' : '❌',
      }
    );
  }

  removeEvent(eventId, actor) {
    this.commitState((draft) => {
      draft.events = draft.events.filter((e) => e.id !== eventId);
      return draft;
    }, actor);
  }

  // --- ADMIN & SETTINGS ---
  updateBudget(weeklyBudget, adminName) {
    this.commitState((draft) => {
      draft.meta.weeklyBudget = Number(weeklyBudget) || 500;
      return draft;
    }, adminName);
  }

  updateCurrency(currency, adminName) {
    this.commitState((draft) => {
      draft.meta.currency = currency || 'S/';
      return draft;
    }, adminName);
  }

  resetWeeklyExpenses(adminName) {
    this.commitState(
      (draft) => {
        draft.shopping.bought = [];
        draft.chores = draft.chores.map((c) => ({
          ...c,
          status: 'idle',
          assignedTo: null,
          completedBy: null,
          updatedAt: Date.now(),
        }));
        return draft;
      },
      adminName,
      {
        module: 'chores',
        title: 'Semana Reiniciada',
        message: `${adminName} reinició los gastos y tareas de la semana`,
        emoji: '🔄',
      }
    );
  }

  removeMember(memberName, adminName) {
    this.commitState((draft) => {
      delete draft.members[memberName];
      return draft;
    }, adminName);
  }
}

export const storageService = new StorageService();
