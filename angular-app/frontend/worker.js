// Cloudflare Worker backend for Hogar Conectado
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API Routes for Cloudflare-hosted real-time room sync
    if (url.pathname.startsWith('/api/rooms/')) {
      const parts = url.pathname.replace('/api/rooms/', '').split('/');
      const rawCode = parts[0] ? parts[0].trim().toUpperCase() : '';
      const action = parts[1] || '';

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      if (!rawCode) {
        return new Response(JSON.stringify({ error: 'Código de sala inválido' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const kvKey = `room_${rawCode}`;

      // POST /api/rooms/:roomCode/join
      if (request.method === 'POST' && action === 'join') {
        try {
          const body = await request.json();
          let state = await env.HOGAR_KV.get(kvKey, 'json');
          const now = Date.now();

          if (!state) {
            state = {
              meta: {
                roomCode: rawCode,
                familyName: body.familyName || `Familia ${rawCode}`,
                inviteCodes: [],
                adminPin: body.role === 'admin' ? body.adminPin || '' : '',
                weeklyBudget: 500,
                currency: 'S/',
                createdAt: now,
              },
              members: {},
              customStatuses: [],
              shopping: { pending: [], bought: [] },
              savings: { goals: [] },
              chores: [
                { id: 'platos', label: 'Lavar platos', emoji: '🍽️', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
                { id: 'basura', label: 'Sacar la basura', emoji: '🗑️', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
                { id: 'barrer', label: 'Barrer / Limpiar', emoji: '🧹', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
                { id: 'mascota', label: 'Dar de comer a la mascota', emoji: '🐶', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
                { id: 'ropa', label: 'Lavar / Tender ropa', emoji: '👕', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
                { id: 'plantas', label: 'Regar plantas', emoji: '🪴', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
                { id: 'cerrar', label: 'Cerrar bien la casa', emoji: '🔒', status: 'idle', assignedTo: null, completedBy: null, updatedAt: now },
              ],
              choreLogs: [],
              events: [],
              lastActivity: null,
              updatedAt: now,
              updatedBy: body.memberName || 'Sistema',
            };
          }

          if (body.memberName) {
            const existingMember = state.members[body.memberName];
            state.members[body.memberName] = {
              name: body.memberName,
              role: body.role || existingMember?.role || 'member',
              avatar: body.avatar || existingMember?.avatar || '👤',
              color: body.color || existingMember?.color || '#5196fe',
              userPin: body.userPin || existingMember?.userPin || '',
              statusId: existingMember?.statusId || 'home',
              statusLabel: existingMember?.statusLabel || 'En casa',
              statusEmoji: existingMember?.statusEmoji || '🏠',
              location: existingMember?.location || null,
              lastSeen: now,
            };
            state.updatedAt = now;
            await env.HOGAR_KV.put(kvKey, JSON.stringify(state));
          }

          return new Response(JSON.stringify(state), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      // POST /api/rooms/:roomCode/state
      if (request.method === 'POST') {
        try {
          const incomingState = await request.json();
          let current = await env.HOGAR_KV.get(kvKey, 'json');

          if (current) {
            // Merge members so no family member is ever lost
            incomingState.members = { ...(current.members || {}), ...(incomingState.members || {}) };
          }

          incomingState.updatedAt = Date.now();
          await env.HOGAR_KV.put(kvKey, JSON.stringify(incomingState));
          return new Response(JSON.stringify(incomingState), { headers: corsHeaders });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      // GET /api/rooms/:roomCode
      if (request.method === 'GET') {
        const state = await env.HOGAR_KV.get(kvKey, 'json');
        if (!state) {
          return new Response(JSON.stringify({ error: 'Sala no encontrada' }), { status: 404, headers: corsHeaders });
        }
        return new Response(JSON.stringify(state), { headers: corsHeaders });
      }
    }

    // Default: Serve frontend static assets (Angular SPA)
    return env.ASSETS.fetch(request);
  },
};
