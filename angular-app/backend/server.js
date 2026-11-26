import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Initialize SQLite database
const db = new DatabaseSync(path.join(__dirname, 'hogar.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    room_code TEXT PRIMARY KEY,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

const CHORE_PRESETS = [
  { id: 'platos', label: 'Lavar platos', emoji: '🍽️' },
  { id: 'basura', label: 'Sacar la basura', emoji: '🗑️' },
  { id: 'barrer', label: 'Barrer / Limpiar', emoji: '🧹' },
  { id: 'mascota', label: 'Dar de comer a la mascota', emoji: '🐶' },
  { id: 'ropa', label: 'Lavar / Tender ropa', emoji: '👕' },
  { id: 'plantas', label: 'Regar plantas', emoji: '🪴' },
  { id: 'cerrar', label: 'Cerrar bien la casa', emoji: '🔒' },
];

export function normalizeRoomCode(code = '') {
  return String(code)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-_]/g, '');
}

function createInitialRoomState(roomCode, adminPin = '') {
  const now = Date.now();
  return {
    meta: {
      roomCode,
      adminPin,
      weeklyBudget: 500,
      currency: 'S/',
      createdAt: now,
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
          createdAt: now,
          createdBy: 'Sistema',
        },
      ],
    },
    chores: CHORE_PRESETS.map((p) => ({
      id: p.id,
      label: p.label,
      emoji: p.emoji,
      status: 'idle',
      assignedTo: null,
      completedBy: null,
      updatedAt: now,
      isPreset: true,
    })),
    choreLogs: [],
    events: [],
    lastActivity: null,
    updatedAt: now,
    updatedBy: 'Sistema',
  };
}

const getRoomStmt = db.prepare('SELECT state_json FROM rooms WHERE room_code = ?');
const upsertRoomStmt = db.prepare(`
  INSERT INTO rooms (room_code, state_json, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(room_code) DO UPDATE SET
    state_json = excluded.state_json,
    updated_at = excluded.updated_at
`);

function loadOrCreateRoom(roomCode, adminPin = '') {
  const code = normalizeRoomCode(roomCode);
  const row = getRoomStmt.get(code);
  if (row) {
    return JSON.parse(row.state_json);
  }
  const initial = createInitialRoomState(code, adminPin);
  upsertRoomStmt.run(code, JSON.stringify(initial), initial.updatedAt);
  return initial;
}

function saveRoom(roomCode, state) {
  const code = normalizeRoomCode(roomCode);
  const updatedAt = state.updatedAt || Date.now();
  upsertRoomStmt.run(code, JSON.stringify(state), updatedAt);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hogar-conectado-backend', db: 'sqlite' });
});

app.get('/api/rooms/:roomCode', (req, res) => {
  const code = normalizeRoomCode(req.params.roomCode);
  if (code.length < 3) {
    return res.status(400).json({ error: 'Código de familia inválido' });
  }
  const state = loadOrCreateRoom(code);
  return res.json(state);
});

app.post('/api/rooms/:roomCode/state', (req, res) => {
  const code = normalizeRoomCode(req.params.roomCode);
  if (code.length < 3) {
    return res.status(400).json({ error: 'Código de familia inválido' });
  }
  const incoming = req.body;
  if (!incoming || !incoming.meta) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  saveRoom(code, incoming);
  io.to(code).emit('room_state', incoming);
  return res.json({ ok: true, updatedAt: incoming.updatedAt });
});

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomCode, memberName, role, adminPin, avatar, color, userPin, familyName }) => {
    const code = normalizeRoomCode(roomCode);
    if (!code) return;
    socket.join(code);

    const state = loadOrCreateRoom(code, role === 'admin' ? adminPin || '' : '');
    if (familyName && !state.meta.familyName) {
      state.meta.familyName = familyName;
    }
    if (memberName) {
      const existing = state.members[memberName];
      if (role === 'admin' && adminPin && !state.meta.adminPin) {
        state.meta.adminPin = adminPin;
      }
      state.members[memberName] = {
        name: memberName,
        role: role || existing?.role || 'member',
        avatar: avatar || existing?.avatar || '👤',
        color: color || existing?.color || '#5196fe',
        userPin: userPin || existing?.userPin || '',
        statusId: existing?.statusId || 'home',
        statusLabel: existing?.statusLabel || 'En casa',
        statusEmoji: existing?.statusEmoji || '🏠',
        location: existing?.location || null,
        lastSeen: Date.now(),
      };
      state.updatedAt = Date.now();
      saveRoom(code, state);
    }

    io.to(code).emit('room_state', state);
  });

  socket.on('update_state', ({ roomCode, state }) => {
    const code = normalizeRoomCode(roomCode);
    if (!code || !state) return;
    const current = loadOrCreateRoom(code);
    
    // Merge members so no member profile is lost when another client updates state
    const mergedMembers = { ...current.members, ...state.members };
    state.members = mergedMembers;
    state.updatedAt = Date.now();
    saveRoom(code, state);
    
    // Broadcast to everyone else in this room
    socket.to(code).emit('room_state', state);
  });
});

server.listen(PORT, () => {
  console.log(`Hogar Conectado Backend running on http://localhost:${PORT}`);
});
