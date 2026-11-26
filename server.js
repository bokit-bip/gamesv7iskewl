#!/usr/bin/env node
'use strict';
/**
 * GAMES V7 — INDEPENDENT FULL-STACK SERVER
 * Runs on http://localhost:8080 (configurable via PORT env var)
 *
 * Strictly separate from BokitCord:
 *  - Independent Accounts & Sync (scrypt + persistent JSON store)
 *  - Owner / Co-Owner / Moderator Permissions (with optional BokitCord Bokit owner bridge)
 *  - Real Online Visitor Presence Counter
 *  - Private Bug Reports & Contact Inbox (Owner-only read/manage)
 *  - Independent Built-in Web Proxy Gateway (with SSRF protection & compression)
 *  - Independent Music Catalog, Search & Audio Streamer
 *  - Independent Configurable AI Assistant Gateway (env-var API key, never exposed to client)
 *  - Zero external npm dependencies
 */

process.env.UV_THREADPOOL_SIZE = '64';

process.on('uncaughtException', (err) => {
  console.error('[GamesV7 UncaughtException]:', err && err.message ? err.message : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[GamesV7 UnhandledRejection]:', reason);
});

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { exec } = require('child_process');

const ROOT_DIR = __dirname;

// Lightweight zero-dependency .env loader (does not override already-set env vars)
(function loadDotEnv() {
  try {
    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.error('[GamesV7 .env] Load warning:', e.message);
  }
})();

const store = require('./backend/store');
const presence = require('./backend/presence');
const proxyGateway = require('./backend/proxy');
const musicBackend = require('./backend/music');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const BOKITCORD_API_URL = (process.env.BOKITCORD_API_URL || '').trim().replace(/\/+$/, '');
const AI_API_URL = (process.env.AI_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions').trim();
const AI_DEFAULT_MODEL = (process.env.AI_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b').trim();
const AI_VISION_MODEL = (process.env.AI_VISION_MODEL || 'nvidia/nemotron-3.5-super-vl-120b-a12b').trim();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.nes': 'application/octet-stream',
  '.sfc': 'application/octet-stream',
  '.z64': 'application/octet-stream',
  '.nds': 'application/octet-stream',
  '.chd': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.cue': 'text/plain',
  '.swf': 'application/x-shockwave-flash',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml']);

// Simple in-memory sliding-window rate limiter
const rateBuckets = new Map();
function checkRateLimit(bucketKey, maxHits, windowMs) {
  const now = Date.now();
  let arr = rateBuckets.get(bucketKey);
  if (!arr) {
    arr = [];
    rateBuckets.set(bucketKey, arr);
  }
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= maxHits) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - arr[0])) / 1000));
    return { allowed: false, retryAfterSec };
  }
  arr.push(now);
  if (rateBuckets.size > 5000) {
    const firstKey = rateBuckets.keys().next().value;
    if (firstKey) rateBuckets.delete(firstKey);
  }
  return { allowed: true, retryAfterSec: 0 };
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? String(req.socket.remoteAddress) : 'unknown';
}

function sendJson(req, res, statusCode, payload, extraHeaders = {}) {
  if (res.headersSent) return;
  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  const acceptEnc = String(req.headers['accept-encoding'] || '').toLowerCase();
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  };
  if (raw.length >= 1024 && acceptEnc.includes('gzip')) {
    const gz = zlib.gzipSync(raw, { level: 4 });
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = gz.length;
    res.writeHead(statusCode, headers);
    res.end(gz);
  } else {
    headers['Content-Length'] = raw.length;
    res.writeHead(statusCode, headers);
    res.end(raw);
  }
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function extractToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  if (req.headers['x-gamesv7-token']) return String(req.headers['x-gamesv7-token']).trim();
  // Cookie fallback
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)gv7_token=([a-f0-9]{32,128})/i);
  return m ? m[1] : '';
}

function getAuthContext(req) {
  const token = extractToken(req);
  if (!token) return { token: '', user: null, safeUser: null };
  const user = store.getUserByToken(token);
  return { token, user, safeUser: user ? store.sanitizeUser(user) : null };
}

function requireAuth(req, res) {
  const ctx = getAuthContext(req);
  if (!ctx.user) {
    sendJson(req, res, 401, { ok: false, error: 'Authentication required' });
    return null;
  }
  return ctx;
}

function requireStaff(req, res, requiredPerm = null) {
  const ctx = requireAuth(req, res);
  if (!ctx) return null;
  const role = ctx.safeUser.role;
  const isStaff = role === 'owner' || role === 'co-owner' || role === 'moderator';
  if (!isStaff) {
    sendJson(req, res, 403, { ok: false, error: 'Staff access required' });
    return null;
  }
  if (requiredPerm === 'owner_only' && role !== 'owner') {
    sendJson(req, res, 403, { ok: false, error: 'Owner permission required' });
    return null;
  }
  if (requiredPerm && requiredPerm !== 'owner_only' && !ctx.safeUser.permissions[requiredPerm]) {
    sendJson(req, res, 403, { ok: false, error: `Missing permission: ${requiredPerm}` });
    return null;
  }
  return ctx;
}

function roleRank(role) {
  if (role === 'owner') return 3;
  if (role === 'co-owner') return 2;
  if (role === 'moderator') return 1;
  return 0;
}

function fetchJsonUrl(targetUrl, headers = {}, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(targetUrl);
    } catch (e) {
      return reject(new Error('Invalid URL'));
    }
    const client = u.protocol === 'https:' ? https : http;
    const req = client.get(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body || '{}') });
          } catch (e) {
            resolve({ status: res.statusCode, data: null });
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
  });
}

function getAiApiKey() {
  return (process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || '').trim();
}

function sanitizeAccountData(input, existing = store.defaultUserData()) {
  const base = { ...store.defaultUserData(), ...(existing || {}) };
  if (!input || typeof input !== 'object') return base;

  const out = { ...base };
  if (Array.isArray(input.favorites)) {
    out.favorites = [...new Set(input.favorites.map((x) => String(x).slice(0, 120)))].slice(0, 500);
  }
  if (Array.isArray(input.recentlyPlayed)) {
    out.recentlyPlayed = [...new Set(input.recentlyPlayed.map((x) => String(x).slice(0, 120)))].slice(0, 100);
  }
  if (Array.isArray(input.bookmarks)) {
    out.bookmarks = input.bookmarks
      .filter((b) => b && typeof b === 'object' && b.url)
      .slice(0, 80)
      .map((b) => ({
        id: String(b.id || crypto.randomBytes(4).toString('hex')).slice(0, 40),
        name: String(b.name || b.url).trim().slice(0, 60),
        url: String(b.url).trim().slice(0, 500),
        icon: String(b.icon || '🌐').slice(0, 8),
        desc: String(b.desc || '').trim().slice(0, 40),
      }));
  }
  if (input.gameProgress && typeof input.gameProgress === 'object' && !Array.isArray(input.gameProgress)) {
    const cleanProg = { ...(base.gameProgress || {}) };
    for (const [k, v] of Object.entries(input.gameProgress).slice(0, 200)) {
      const key = String(k).slice(0, 100);
      if (v && typeof v === 'object') {
        cleanProg[key] = v;
      }
    }
    out.gameProgress = cleanProg;
  }
  if (input.settings && typeof input.settings === 'object') {
    const s = input.settings;
    const validPos = ['bottom', 'left', 'right'].includes(s.taskbarPosition) ? s.taskbarPosition : base.settings.taskbarPosition;
    out.settings = {
      ...base.settings,
      taskbarPosition: validPos,
      cloakKey: typeof s.cloakKey === 'string' ? s.cloakKey.slice(0, 40) : base.settings.cloakKey,
      panicUrl: typeof s.panicUrl === 'string' ? s.panicUrl.slice(0, 300) : base.settings.panicUrl,
      crtEnabled: typeof s.crtEnabled === 'boolean' ? s.crtEnabled : base.settings.crtEnabled,
      soundEnabled: typeof s.soundEnabled === 'boolean' ? s.soundEnabled : base.settings.soundEnabled,
      aiEndpoint: typeof s.aiEndpoint === 'string' ? s.aiEndpoint.slice(0, 300) : base.settings.aiEndpoint,
      musicProvider: typeof s.musicProvider === 'string' ? s.musicProvider.slice(0, 300) : base.settings.musicProvider,
    };
  }
  if (Array.isArray(input.musicLikes)) {
    out.musicLikes = input.musicLikes.slice(0, 400);
  }
  if (Array.isArray(input.musicPlaylists)) {
    out.musicPlaylists = input.musicPlaylists.slice(0, 50);
  }
  return out;
}

function safeResolveStaticPath(rootDir, reqPath) {
  const cleanRel = reqPath.replace(/^\/+/, '');
  if (!cleanRel || cleanRel.includes('\0')) return null;
  // Never expose backend data, server source, or env files over static file serving
  const lower = cleanRel.toLowerCase();
  if (
    lower === '.env' ||
    lower.startsWith('.env.') ||
    lower.startsWith('data/') ||
    lower === 'data' ||
    lower.startsWith('backend/') ||
    lower === 'backend' ||
    lower === 'server.js' ||
    lower.startsWith('.git')
  ) {
    return null;
  }
  const resolved = path.resolve(rootDir, cleanRel);
  const rootWithSep = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;
  if (resolved !== rootDir && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

function loadGamesCatalog() {
  const candidates = [
    path.join(ROOT_DIR, 'assets', 'games.json'),
    path.join(ROOT_DIR, 'games.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(c, 'utf8'));
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
  }
  return [];
}

const server = http.createServer(async (req, res) => {
  // CORS headers (allows standalone index.svg & cross-origin web hosting)
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin, Accept-Encoding');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GamesV7-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqUrlObj;
  try {
    reqUrlObj = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`);
  } catch (e) {
    return sendJson(req, res, 400, { ok: false, error: 'Malformed URL' });
  }

  let reqPath;
  try {
    reqPath = decodeURIComponent(reqUrlObj.pathname);
  } catch (e) {
    return sendJson(req, res, 400, { ok: false, error: 'Invalid URL encoding' });
  }
  if (reqPath.startsWith('/games-v7')) {
    reqPath = reqPath.slice('/games-v7'.length) || '/';
  }

  const ip = getClientIp(req);

  try {
    // =========================================================================
    // 1. HEALTH & PUBLIC SITE CONFIGURATION
    // =========================================================================
    if (reqPath === '/api/health' && req.method === 'GET') {
      return sendJson(req, res, 200, {
        ok: true,
        service: 'Games V7',
        version: '9.0',
        independent: true,
        aiConfigured: Boolean(getAiApiKey()),
        online: presence.getOnlineCount().online,
        uptimeSec: Math.round(process.uptime()),
      });
    }

    if (reqPath === '/api/site/state' && req.method === 'GET') {
      const cfg = store.getSiteConfig();
      const activeAnnouncements = (cfg.announcements || []).filter((a) => a && a.active !== false);
      return sendJson(req, res, 200, {
        ok: true,
        siteName: cfg.siteName || 'Games V7',
        tagline: cfg.tagline || 'Skeletal Flowers Retro Arcade',
        bannerText: cfg.bannerText || '',
        maintenanceNotice: cfg.maintenanceNotice || '',
        featured: cfg.featured,
        announcements: activeAnnouncements,
        hiddenGames: cfg.hiddenGames || [],
        customGames: cfg.customGames || [],
        online: presence.getOnlineCount().online,
        updatedAt: cfg.updatedAt,
      });
    }

    // =========================================================================
    // 2. REAL ONLINE VISITOR PRESENCE COUNTER
    // =========================================================================
    if (reqPath === '/api/presence/count' && req.method === 'GET') {
      return sendJson(req, res, 200, presence.getOnlineCount());
    }

    if (reqPath === '/api/presence/heartbeat' && req.method === 'POST') {
      const body = await readJsonBody(req, 16 * 1024);
      const result = presence.recordHeartbeat(body.sessionId, ip);
      return sendJson(req, res, result.ok ? 200 : 400, result);
    }

    if (reqPath === '/api/presence/leave' && req.method === 'POST') {
      const body = await readJsonBody(req, 16 * 1024);
      const result = presence.removeSession(body.sessionId);
      return sendJson(req, res, 200, result);
    }

    // =========================================================================
    // 3. OPTIONAL ACCOUNTS & AUTHENTICATION
    // =========================================================================
    if (reqPath === '/api/auth/register' && req.method === 'POST') {
      const rl = checkRateLimit(`register:${ip}`, 10, 15 * 60 * 1000);
      if (!rl.allowed) {
        return sendJson(req, res, 429, { ok: false, error: `Too many registrations. Retry in ${rl.retryAfterSec}s.` });
      }
      const body = await readJsonBody(req, 256 * 1024);
      const rawUser = String(body.username || '').trim();
      const username = rawUser.toLowerCase();
      const password = String(body.password || '');
      const displayName = String(body.displayName || rawUser).trim().slice(0, 32) || rawUser;

      if (!/^[a-z0-9_.-]{3,24}$/i.test(username)) {
        return sendJson(req, res, 400, { ok: false, error: 'Username must be 3–24 characters (letters, numbers, _, ., -).' });
      }
      if (password.length < 6 || password.length > 128) {
        return sendJson(req, res, 400, { ok: false, error: 'Password must be between 6 and 128 characters.' });
      }
      if (username === store.OWNER_USERNAME) {
        return sendJson(req, res, 403, { ok: false, error: 'This username is reserved for the official Games V7 owner.' });
      }

      const users = store.getAllUsers();
      if (users.some((u) => u.username.toLowerCase() === username)) {
        return sendJson(req, res, 409, { ok: false, error: 'Username is already taken.' });
      }

      const newUser = {
        id: 'usr_' + crypto.randomBytes(8).toString('hex'),
        username,
        displayName,
        passwordHash: store.hashPassword(password),
        role: 'user', // Strictly non-privileged — self-promotion is impossible
        permissions: store.defaultPermissionsForRole('user'),
        banned: false,
        banReason: '',
        linkedBokitCord: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        data: sanitizeAccountData(body.importData, store.defaultUserData()),
      };

      users.push(newUser);
      store.saveAllUsers(users);
      const token = store.createSession(newUser.id);
      return sendJson(req, res, 201, {
        ok: true,
        token,
        user: store.sanitizeUser(newUser),
        data: newUser.data,
      });
    }

    if (reqPath === '/api/auth/login' && req.method === 'POST') {
      const rl = checkRateLimit(`login:${ip}`, 20, 10 * 60 * 1000);
      if (!rl.allowed) {
        return sendJson(req, res, 429, { ok: false, error: `Too many login attempts. Retry in ${rl.retryAfterSec}s.` });
      }
      const body = await readJsonBody(req, 64 * 1024);
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');

      const users = store.getAllUsers();
      const user = users.find((u) => u.username.toLowerCase() === username);
      if (!user) {
        return sendJson(req, res, 401, { ok: false, error: 'Invalid username or password.' });
      }
      if (user.banned) {
        return sendJson(req, res, 403, { ok: false, error: user.banReason ? `Account suspended: ${user.banReason}` : 'Account suspended.' });
      }
      if (!user.passwordHash) {
        if (user.role === 'owner') {
          return sendJson(req, res, 401, {
            ok: false,
            error: 'Owner local password is not set in GAMESV7_OWNER_PASSWORD. Sign in via the Official Bokit (BokitCord) Owner Verification tab or set GAMESV7_OWNER_PASSWORD in .env.',
          });
        }
        return sendJson(req, res, 401, { ok: false, error: 'Password login unavailable for this account.' });
      }
      if (!store.verifyPassword(password, user.passwordHash)) {
        return sendJson(req, res, 401, { ok: false, error: 'Invalid username or password.' });
      }

      user.lastLoginAt = new Date().toISOString();
      store.saveAllUsers(users);
      const token = store.createSession(user.id);
      return sendJson(req, res, 200, {
        ok: true,
        token,
        user: store.sanitizeUser(user),
        data: user.data || store.defaultUserData(),
      });
    }

    // Official Bokit Owner Verification Bridge (verifies a BokitCord session token server-side)
    if (reqPath === '/api/auth/bokitcord-verify' && req.method === 'POST') {
      const rl = checkRateLimit(`bcverify:${ip}`, 15, 10 * 60 * 1000);
      if (!rl.allowed) {
        return sendJson(req, res, 429, { ok: false, error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` });
      }
      if (!BOKITCORD_API_URL) {
        return sendJson(req, res, 503, {
          ok: false,
          error: 'BokitCord verification bridge is not configured on this Games V7 server (set BOKITCORD_API_URL in .env).',
        });
      }
      const body = await readJsonBody(req, 32 * 1024);
      const bcToken = String(body.bokitCordToken || '').trim();
      if (!bcToken || bcToken.length < 10) {
        return sendJson(req, res, 400, { ok: false, error: 'Please provide a valid BokitCord session token.' });
      }
      try {
        const verifyRes = await fetchJsonUrl(`${BOKITCORD_API_URL}/api/auth/me`, {
          Authorization: `Bearer ${bcToken}`,
          'User-Agent': 'GamesV7-OwnerBridge/1.0',
        }, 6000);

        if (verifyRes.status !== 200 || !verifyRes.data) {
          return sendJson(req, res, 401, { ok: false, error: 'BokitCord rejected that session token.' });
        }
        const remoteUser = verifyRes.data.user || verifyRes.data;
        const remoteUsername = String(remoteUser.username || '').trim().toLowerCase();
        if (remoteUsername !== store.OWNER_USERNAME) {
          return sendJson(req, res, 403, {
            ok: false,
            error: `Only the official "${store.OWNER_USERNAME}" BokitCord account can claim Games V7 Owner access.`,
          });
        }

        const users = store.getAllUsers();
        const owner = users.find((u) => u.username.toLowerCase() === store.OWNER_USERNAME);
        if (!owner) {
          return sendJson(req, res, 500, { ok: false, error: 'Owner record missing.' });
        }
        owner.role = 'owner';
        owner.linkedBokitCord = true;
        owner.lastLoginAt = new Date().toISOString();
        store.saveAllUsers(users);
        const token = store.createSession(owner.id);
        return sendJson(req, res, 200, {
          ok: true,
          token,
          user: store.sanitizeUser(owner),
          data: owner.data || store.defaultUserData(),
          verifiedVia: 'bokitcord',
        });
      } catch (err) {
        return sendJson(req, res, 502, {
          ok: false,
          error: 'Could not reach BokitCord to verify token (Games V7 continues running independently).',
        });
      }
    }

    if (reqPath === '/api/auth/logout' && req.method === 'POST') {
      const token = extractToken(req);
      if (token) store.revokeSession(token);
      return sendJson(req, res, 200, { ok: true });
    }

    if (reqPath === '/api/auth/me' && req.method === 'GET') {
      const ctx = getAuthContext(req);
      if (!ctx.user) {
        return sendJson(req, res, 200, { ok: true, authenticated: false, user: null });
      }
      return sendJson(req, res, 200, {
        ok: true,
        authenticated: true,
        user: ctx.safeUser,
        data: ctx.user.data || store.defaultUserData(),
      });
    }

    // =========================================================================
    // 4. USER ACCOUNT DATA SYNC (Favorites, Progress, Bookmarks, Settings)
    // =========================================================================
    if (reqPath === '/api/account/data' && req.method === 'GET') {
      const ctx = requireAuth(req, res);
      if (!ctx) return;
      return sendJson(req, res, 200, { ok: true, data: ctx.user.data || store.defaultUserData() });
    }

    if (reqPath === '/api/account/data' && (req.method === 'PUT' || req.method === 'POST')) {
      const ctx = requireAuth(req, res);
      if (!ctx) return;
      const body = await readJsonBody(req, 512 * 1024);
      const users = store.getAllUsers();
      const idx = users.findIndex((u) => u.id === ctx.user.id);
      if (idx === -1) return sendJson(req, res, 404, { ok: false, error: 'Account not found' });

      const mergeMode = body.merge === true;
      const incoming = body.data && typeof body.data === 'object' ? body.data : body;
      let nextData;
      if (mergeMode) {
        const cur = users[idx].data || store.defaultUserData();
        const mergedInput = {
          favorites: [...new Set([...(cur.favorites || []), ...(Array.isArray(incoming.favorites) ? incoming.favorites : [])])],
          recentlyPlayed: [...new Set([...(Array.isArray(incoming.recentlyPlayed) ? incoming.recentlyPlayed : []), ...(cur.recentlyPlayed || [])])],
          bookmarks: [...(cur.bookmarks || []), ...(Array.isArray(incoming.bookmarks) ? incoming.bookmarks : [])],
          gameProgress: { ...(cur.gameProgress || {}), ...(incoming.gameProgress || {}) },
          settings: { ...(cur.settings || {}), ...(incoming.settings || {}) },
          musicLikes: [...(cur.musicLikes || []), ...(Array.isArray(incoming.musicLikes) ? incoming.musicLikes : [])],
          musicPlaylists: Array.isArray(incoming.musicPlaylists) && incoming.musicPlaylists.length ? incoming.musicPlaylists : (cur.musicPlaylists || []),
        };
        nextData = sanitizeAccountData(mergedInput, cur);
      } else {
        nextData = sanitizeAccountData(incoming, users[idx].data);
      }

      users[idx].data = nextData;
      store.saveAllUsers(users);
      return sendJson(req, res, 200, { ok: true, data: nextData });
    }

    // =========================================================================
    // 5. PRIVATE BUG REPORT & CONTACT FORM (Write-only public; Owner-only read)
    // =========================================================================
    if (reqPath === '/api/reports' && req.method === 'POST') {
      const rl = checkRateLimit(`reports:${ip}`, 5, 15 * 60 * 1000);
      if (!rl.allowed) {
        return sendJson(req, res, 429, {
          ok: false,
          error: `You've submitted several reports recently. Please wait ${rl.retryAfterSec}s before sending another.`,
        });
      }
      const body = await readJsonBody(req, 64 * 1024);
      // Honeypot spam trap: bots fill hidden `_hp` field; silently acknowledge without storing
      if (body._hp && String(body._hp).trim().length > 0) {
        return sendJson(req, res, 201, { ok: true, id: 'rep_ok', message: 'Report received.' });
      }

      const subject = String(body.subject || '').trim().slice(0, 140);
      const categoryRaw = String(body.category || 'bug').trim().toLowerCase();
      const category = ['bug', 'feature', 'feedback'].includes(categoryRaw) ? categoryRaw : 'bug';
      const message = String(body.message || '').trim().slice(0, 4000);
      const contact = String(body.contact || '').trim().slice(0, 140);

      if (subject.length < 3) {
        return sendJson(req, res, 400, { ok: false, error: 'Please enter a subject (at least 3 characters).' });
      }
      if (message.length < 10) {
        return sendJson(req, res, 400, { ok: false, error: 'Please describe the issue or feedback (at least 10 characters).' });
      }

      const ctx = getAuthContext(req);
      const reports = store.getReports();
      const entry = {
        id: 'rep_' + crypto.randomBytes(6).toString('hex'),
        subject,
        category,
        message,
        contact,
        status: 'open',
        ownerNote: '',
        submittedBy: ctx.safeUser ? ctx.safeUser.username : 'guest',
        pageContext: String(body.pageContext || '').slice(0, 120),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reports.unshift(entry);
      if (reports.length > 1000) reports.length = 1000;
      store.saveReports(reports);

      return sendJson(req, res, 201, {
        ok: true,
        id: entry.id,
        message: 'Thank you! Your private report has been delivered directly to the Games V7 owner.',
      });
    }

    // OWNER-ONLY: List private bug reports
    if (reqPath === '/api/admin/reports' && req.method === 'GET') {
      const ctx = requireStaff(req, res, 'owner_only');
      if (!ctx) return;
      const statusFilter = (reqUrlObj.searchParams.get('status') || 'all').toLowerCase();
      let reports = store.getReports();
      if (statusFilter !== 'all') {
        reports = reports.filter((r) => r.status === statusFilter);
      }
      return sendJson(req, res, 200, { ok: true, reports, total: reports.length });
    }

    // OWNER-ONLY: Update report status (open | reviewed | resolved)
    const reportPatchMatch = reqPath.match(/^\/api\/admin\/reports\/([a-zA-Z0-9_-]+)$/);
    if (reportPatchMatch && req.method === 'PATCH') {
      const ctx = requireStaff(req, res, 'owner_only');
      if (!ctx) return;
      const reportId = reportPatchMatch[1];
      const body = await readJsonBody(req, 32 * 1024);
      const reports = store.getReports();
      const idx = reports.findIndex((r) => r.id === reportId);
      if (idx === -1) return sendJson(req, res, 404, { ok: false, error: 'Report not found' });

      if (body.status && ['open', 'reviewed', 'resolved'].includes(body.status)) {
        reports[idx].status = body.status;
      }
      if (typeof body.ownerNote === 'string') {
        reports[idx].ownerNote = body.ownerNote.trim().slice(0, 500);
      }
      reports[idx].updatedAt = new Date().toISOString();
      store.saveReports(reports);
      return sendJson(req, res, 200, { ok: true, report: reports[idx] });
    }

    // =========================================================================
    // 6. GAMES V7 MOD MENU & OWNER / CO-OWNER ADMIN API
    // =========================================================================
    if (reqPath === '/api/admin/overview' && req.method === 'GET') {
      const ctx = requireStaff(req, res);
      if (!ctx) return;
      const users = store.getAllUsers();
      const cfg = store.getSiteConfig();
      const isOwner = ctx.safeUser.role === 'owner';
      const reports = isOwner ? store.getReports() : [];
      return sendJson(req, res, 200, {
        ok: true,
        role: ctx.safeUser.role,
        permissions: ctx.safeUser.permissions,
        stats: {
          online: presence.getOnlineCount().online,
          totalUsers: users.length,
          coOwners: users.filter((u) => u.role === 'co-owner').length,
          moderators: users.filter((u) => u.role === 'moderator').length,
          bannedUsers: users.filter((u) => u.banned).length,
          activeAnnouncements: (cfg.announcements || []).filter((a) => a.active !== false).length,
          hiddenGames: (cfg.hiddenGames || []).length,
          openReports: isOwner ? reports.filter((r) => r.status === 'open').length : null,
        },
        siteConfig: cfg,
      });
    }

    if (reqPath === '/api/admin/users' && req.method === 'GET') {
      const ctx = requireStaff(req, res);
      if (!ctx) return;
      const users = store.getAllUsers().map(store.sanitizeUser);
      return sendJson(req, res, 200, { ok: true, users });
    }

    // OWNER-ONLY: Assign or revoke Co-Owner / Moderator / User roles & permissions
    const roleMatch = reqPath.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/role$/);
    if (roleMatch && req.method === 'PATCH') {
      const ctx = requireStaff(req, res, 'owner_only');
      if (!ctx) return;
      const targetId = roleMatch[1];
      const body = await readJsonBody(req, 32 * 1024);
      const nextRole = String(body.role || '').trim().toLowerCase();
      if (!['user', 'moderator', 'co-owner'].includes(nextRole)) {
        return sendJson(req, res, 400, { ok: false, error: 'Role must be "user", "moderator", or "co-owner".' });
      }
      const users = store.getAllUsers();
      const target = users.find((u) => u.id === targetId);
      if (!target) return sendJson(req, res, 404, { ok: false, error: 'User not found.' });
      if (target.username.toLowerCase() === store.OWNER_USERNAME || target.role === 'owner') {
        return sendJson(req, res, 403, { ok: false, error: 'Cannot alter the primary Games V7 Owner account role.' });
      }

      const defaults = store.defaultPermissionsForRole(nextRole);
      const customPerms = body.permissions && typeof body.permissions === 'object' ? body.permissions : {};
      target.role = nextRole;
      target.permissions = {
        ...defaults,
        manageGames: typeof customPerms.manageGames === 'boolean' ? customPerms.manageGames : defaults.manageGames,
        manageFeatured: typeof customPerms.manageFeatured === 'boolean' ? customPerms.manageFeatured : defaults.manageFeatured,
        manageAnnouncements: typeof customPerms.manageAnnouncements === 'boolean' ? customPerms.manageAnnouncements : defaults.manageAnnouncements,
        moderateUsers: typeof customPerms.moderateUsers === 'boolean' ? customPerms.moderateUsers : defaults.moderateUsers,
        // Strictly owner-only capabilities can NEVER be delegated
        manageRoles: false,
        viewReports: false,
        manageSiteSettings: false,
      };
      store.saveAllUsers(users);
      return sendJson(req, res, 200, { ok: true, user: store.sanitizeUser(target) });
    }

    // Staff (moderateUsers): Ban or unban lower-ranked accounts
    const modMatch = reqPath.match(/^\/api\/admin\/users\/([a-zA-Z0-9_-]+)\/moderate$/);
    if (modMatch && req.method === 'PATCH') {
      const ctx = requireStaff(req, res, 'moderateUsers');
      if (!ctx) return;
      const targetId = modMatch[1];
      const body = await readJsonBody(req, 32 * 1024);
      const users = store.getAllUsers();
      const target = users.find((u) => u.id === targetId);
      if (!target) return sendJson(req, res, 404, { ok: false, error: 'User not found.' });
      if (roleRank(target.role) >= roleRank(ctx.safeUser.role)) {
        return sendJson(req, res, 403, { ok: false, error: 'Cannot moderate an account with equal or higher rank.' });
      }

      target.banned = Boolean(body.banned);
      target.banReason = target.banned ? String(body.reason || 'Moderated by Games V7 staff').trim().slice(0, 200) : '';
      store.saveAllUsers(users);
      return sendJson(req, res, 200, { ok: true, user: store.sanitizeUser(target) });
    }

    // Manage Featured Games Categories
    if (reqPath === '/api/admin/featured' && req.method === 'PUT') {
      const ctx = requireStaff(req, res, 'manageFeatured');
      if (!ctx) return;
      const body = await readJsonBody(req, 128 * 1024);
      if (!body.categories || !Array.isArray(body.categories)) {
        return sendJson(req, res, 400, { ok: false, error: 'Expected categories array.' });
      }
      const cleanCategories = body.categories.slice(0, 12).map((cat, i) => ({
        id: String(cat.id || `cat-${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48),
        title: String(cat.title || 'Featured').trim().slice(0, 60),
        subtitle: String(cat.subtitle || '').trim().slice(0, 120),
        gameIds: Array.isArray(cat.gameIds)
          ? [...new Set(cat.gameIds.map((g) => String(g).trim().slice(0, 100)).filter(Boolean))].slice(0, 24)
          : [],
      }));
      const saved = store.saveSiteConfig({ featured: { categories: cleanCategories } });
      return sendJson(req, res, 200, { ok: true, featured: saved.featured });
    }

    // Manage Announcements
    if (reqPath === '/api/admin/announcements' && req.method === 'POST') {
      const ctx = requireStaff(req, res, 'manageAnnouncements');
      if (!ctx) return;
      const body = await readJsonBody(req, 32 * 1024);
      const title = String(body.title || 'Announcement').trim().slice(0, 100);
      const message = String(body.message || '').trim().slice(0, 500);
      const tone = ['info', 'success', 'warning', 'alert'].includes(body.tone) ? body.tone : 'info';
      if (message.length < 3) {
        return sendJson(req, res, 400, { ok: false, error: 'Announcement message is too short.' });
      }
      const cfg = store.getSiteConfig();
      const item = {
        id: 'ann_' + crypto.randomBytes(5).toString('hex'),
        title,
        message,
        tone,
        active: true,
        author: ctx.safeUser.displayName,
        createdAt: new Date().toISOString(),
      };
      const list = [item, ...(cfg.announcements || [])].slice(0, 20);
      store.saveSiteConfig({ announcements: list });
      return sendJson(req, res, 201, { ok: true, announcement: item, announcements: list });
    }

    const annDelMatch = reqPath.match(/^\/api\/admin\/announcements\/([a-zA-Z0-9_-]+)$/);
    if (annDelMatch && req.method === 'DELETE') {
      const ctx = requireStaff(req, res, 'manageAnnouncements');
      if (!ctx) return;
      const annId = annDelMatch[1];
      const cfg = store.getSiteConfig();
      const next = (cfg.announcements || []).filter((a) => a.id !== annId);
      store.saveSiteConfig({ announcements: next });
      return sendJson(req, res, 200, { ok: true, announcements: next });
    }

    // Co-Owner / Owner: Manage Game Catalog Visibility & Custom Entries
    if (reqPath === '/api/admin/games' && req.method === 'PUT') {
      const ctx = requireStaff(req, res, 'manageGames');
      if (!ctx) return;
      const body = await readJsonBody(req, 128 * 1024);
      const patch = {};
      if (Array.isArray(body.hiddenGames)) {
        patch.hiddenGames = [...new Set(body.hiddenGames.map((id) => String(id).trim().slice(0, 120)).filter(Boolean))].slice(0, 500);
      }
      if (Array.isArray(body.customGames)) {
        patch.customGames = body.customGames.slice(0, 50).map((g) => ({
          id: String(g.id || crypto.randomBytes(4).toString('hex')).slice(0, 80),
          title: String(g.title || 'Custom Game').trim().slice(0, 80),
          url: String(g.url || '').trim().slice(0, 500),
          cover: String(g.cover || '').trim().slice(0, 500),
          system: String(g.system || 'html5').trim().slice(0, 24),
          description: String(g.description || '').trim().slice(0, 200),
        }));
      }
      const saved = store.saveSiteConfig(patch);
      return sendJson(req, res, 200, { ok: true, hiddenGames: saved.hiddenGames, customGames: saved.customGames });
    }

    // OWNER-ONLY: Site Settings & Branding Customization
    if (reqPath === '/api/admin/settings' && req.method === 'PUT') {
      const ctx = requireStaff(req, res, 'owner_only');
      if (!ctx) return;
      const body = await readJsonBody(req, 32 * 1024);
      const patch = {};
      if (typeof body.siteName === 'string' && body.siteName.trim()) {
        patch.siteName = body.siteName.trim().slice(0, 48);
      }
      if (typeof body.tagline === 'string') {
        patch.tagline = body.tagline.trim().slice(0, 80);
      }
      if (typeof body.bannerText === 'string') {
        patch.bannerText = body.bannerText.trim().slice(0, 240);
      }
      if (typeof body.maintenanceNotice === 'string') {
        patch.maintenanceNotice = body.maintenanceNotice.trim().slice(0, 240);
      }
      const saved = store.saveSiteConfig(patch);
      return sendJson(req, res, 200, { ok: true, siteConfig: saved });
    }

    // =========================================================================
    // 7. INDEPENDENT MUSIC API (Works without BokitCord)
    // =========================================================================
    if (reqPath === '/api/music/recommended' && req.method === 'GET') {
      const tracks = musicBackend.loadRecommendedCatalog();
      return sendJson(req, res, 200, { ok: true, tracks, provider: 'gamesv7-local' });
    }

    if (reqPath === '/api/music/search' && req.method === 'GET') {
      const q = reqUrlObj.searchParams.get('q') || '';
      const tracks = await musicBackend.searchMusic(q);
      return sendJson(req, res, 200, { ok: true, query: q, tracks, results: tracks, provider: 'gamesv7-independent' });
    }

    if (reqPath === '/api/music/stream' && req.method === 'GET') {
      const id = reqUrlObj.searchParams.get('id') || '';
      if (!id) return sendJson(req, res, 400, { ok: false, error: 'Missing ?id=' });
      return await musicBackend.handleMusicStream(req, res, id);
    }

    // =========================================================================
    // 8. INDEPENDENT AI ASSISTANT GATEWAY (No hardcoded keys, no BokitCord dependency)
    // =========================================================================
    if (reqPath === '/api/ai/health' && req.method === 'GET') {
      const configured = Boolean(getAiApiKey());
      return sendJson(req, res, 200, {
        ok: true,
        status: configured ? 'ok' : 'unconfigured',
        configured,
        name: 'Games V7 AI Assistant',
        provider: AI_API_URL.includes('nvidia.com') ? 'nvidia-nim' : 'custom-openai-compatible',
        textModel: AI_DEFAULT_MODEL,
        visionModel: AI_VISION_MODEL,
      });
    }

    if (reqPath === '/api/ai/chat' && req.method === 'POST') {
      const rl = checkRateLimit(`ai:${ip}`, 30, 5 * 60 * 1000);
      if (!rl.allowed) {
        return sendJson(req, res, 429, { error: `AI rate limit reached. Retry in ${rl.retryAfterSec}s.` });
      }
      const parsed = await readJsonBody(req, 4 * 1024 * 1024);
      const apiKey = getAiApiKey();
      if (!apiKey) {
        return sendJson(req, res, 503, {
          error: 'Games V7 AI backend is not configured yet. Set AI_API_KEY (or NVIDIA_API_KEY) in the server .env file, or configure a custom AI endpoint in Settings.',
          code: 'AI_UNCONFIGURED',
        });
      }

      let model = parsed.model || AI_DEFAULT_MODEL;
      const rawMessages = Array.isArray(parsed.messages) ? parsed.messages.slice(-40) : [];
      if (!rawMessages.length) {
        return sendJson(req, res, 400, { error: 'messages array is required' });
      }

      const hasImage = rawMessages.some(
        (msg) => Array.isArray(msg.content) && msg.content.some((part) => part && (part.type === 'image_url' || part.image_url))
      );
      if (hasImage && (!model || model === AI_DEFAULT_MODEL)) {
        model = AI_VISION_MODEL;
      }

      const payload = {
        model,
        messages: rawMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature: Math.min(2, Math.max(0, Number(parsed.temperature) || 0.8)),
        top_p: Math.min(1, Math.max(0.05, Number(parsed.top_p) || 0.95)),
        max_tokens: Math.min(16384, Math.max(64, Number(parsed.max_tokens) || 4096)),
        stream: parsed.stream !== false,
      };
      if (AI_API_URL.includes('nvidia.com')) {
        payload.chat_template_kwargs = { enable_thinking: parsed.enable_thinking !== false };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      req.on('close', () => controller.abort());

      try {
        const upstream = await fetch(AI_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!upstream.ok) {
          const errTxt = await upstream.text();
          return sendJson(req, res, upstream.status, { error: errTxt || `Upstream AI HTTP ${upstream.status}` });
        }
        if (!payload.stream) {
          const data = await upstream.json();
          return sendJson(req, res, 200, data);
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        req.on('close', () => { try { reader.cancel(); } catch (e) {} });
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
      } catch (e) {
        clearTimeout(timeoutId);
        if (!res.headersSent) {
          return sendJson(req, res, 502, { error: e.name === 'AbortError' ? 'AI request timed out.' : e.message });
        }
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
        res.end();
      }
      return;
    }

    // =========================================================================
    // 9. INDEPENDENT WEB PROXY GATEWAY & WISP PING
    // =========================================================================
    if (reqPath === '/wisp/ping' || reqPath === '/wisp') {
      const isHttps = req.headers['x-forwarded-proto'] === 'https';
      return sendJson(req, res, 200, {
        status: 'online',
        service: 'Games V7 Proxy & Wisp Gateway',
        protocol: 'http-gateway+wisp',
        wispUrl: `${isHttps ? 'wss' : 'ws'}://${req.headers.host || `localhost:${PORT}`}/wisp/`,
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
      });
    }

    if (
      reqPath.startsWith('/browser/gateway') ||
      reqPath.startsWith('/proxy/gateway') ||
      reqPath.startsWith('/api/proxy') ||
      reqPath.startsWith('/api/movies/proxy')
    ) {
      return proxyGateway.handleProxyRequest(req, res, '/browser/gateway?url=');
    }

    if (reqPath === '/browser/core.js' || reqPath === '/core.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end('/* Games V7 Proxy Runtime Stub */ (function(){})();');
      return;
    }

    // =========================================================================
    // 10. GAMES CATALOG, MOVIES CATALOG, VIP CODES & STANDALONE DOWNLOAD
    // =========================================================================
    if (reqPath === '/api/codes/redeem' && req.method === 'POST') {
      const body = await readJsonBody(req, 16 * 1024);
      const code = String(body.code || '').trim().toUpperCase();
      if (!code) return sendJson(req, res, 400, { success: false, error: 'Please enter a code.' });

      // Check local Games V7 VIP codes first (independent of BokitCord)
      const localCodes = (process.env.GAMESV7_VIP_CODES || '')
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      if (localCodes.includes(code)) {
        return sendJson(req, res, 200, {
          success: true,
          active: true,
          plan: 'Games V7 VIP',
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          message: 'Games V7 VIP Ad-Free unlocked!',
        });
      }

      // Optional BokitCord relay if configured and reachable
      if (BOKITCORD_API_URL) {
        try {
          const r = await fetch(`${BOKITCORD_API_URL}/api/codes/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, username: body.username || 'gamesv7_user' }),
          });
          const data = await r.json();
          return sendJson(req, res, r.ok ? 200 : 400, data);
        } catch (e) {}
      }

      return sendJson(req, res, 400, {
        success: false,
        error: 'Invalid or expired code.',
      });
    }

    if (reqPath === '/api/games' && req.method === 'GET') {
      const games = loadGamesCatalog();
      const cfg = store.getSiteConfig();
      const hidden = new Set(cfg.hiddenGames || []);
      const merged = [
        ...games.filter((g) => !hidden.has(g.id || g.folder)),
        ...(cfg.customGames || []),
      ];
      return sendJson(req, res, 200, merged);
    }

    if (reqPath === '/api/movies/homepage' || reqPath === '/api/movies' || reqPath === '/movies_homepage.json') {
      const candidates = [
        path.join(ROOT_DIR, 'movies_homepage.json'),
        path.join(ROOT_DIR, 'assets', 'movies_homepage.json'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
          fs.createReadStream(c).pipe(res);
          return;
        }
      }
      return sendJson(req, res, 200, { sections: [] });
    }

    if (reqPath === '/api/download-game' || reqPath === '/download-game') {
      const gameId = reqUrlObj.searchParams.get('id') || reqUrlObj.searchParams.get('game');
      if (!gameId) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end('Missing ?id= parameter');
      }
      const cleanFileName = gameId.replace(/[^a-zA-Z0-9_-]/g, '_') + '.html';
      const prebuiltLocal = path.join(ROOT_DIR, 'html-games', cleanFileName);

      let outputHtml = '';
      if (fs.existsSync(prebuiltLocal)) {
        outputHtml = fs.readFileSync(prebuiltLocal, 'utf8');
      } else {
        const gamesList = loadGamesCatalog();
        const game = gamesList.find((g) => (g.id || g.folder) === gameId) || { id: gameId, folder: gameId, title: gameId };
        const folder = game.folder || game.id || gameId;
        const title = game.title || game.name || gameId;
        const safeTitle = (title || 'Arcade Game').replace(/[<>&"]/g, '');
        const isEmulator = Boolean(
          game.isEmulator ||
          (game.url && (game.url.includes('/emulator/') || game.url.includes('player.'))) ||
          ['nes', 'snes', 'n64', 'nds', 'psx', 'gba', 'gb', 'atari'].includes(game.core)
        );
        const queryIdx = (game.url || '').indexOf('?');
        const queryStr = queryIdx !== -1 ? game.url.slice(queryIdx + 1) : (game.core ? `core=${game.core}&rom=${encodeURIComponent(game.rom || '')}` : '');

        let inlineHtml = '';
        if (!isEmulator) {
          const localIdx = path.join(ROOT_DIR, 'games', folder, 'index.html');
          if (fs.existsSync(localIdx)) {
            try { inlineHtml = fs.readFileSync(localIdx, 'utf8'); } catch (e) {}
          }
        }
        outputHtml = generateServerStandaloneGameHtml({
          id: game.id || gameId,
          folder,
          title: safeTitle,
          isEmulator,
          queryStr,
          inlineHtml,
        });
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      });
      return res.end(outputHtml);
    }

    // =========================================================================
    // 11. STATIC FILE SERVER (Games V7 directory only — path-traversal protected, gzip)
    // =========================================================================
    let staticPath = reqPath === '/' || reqPath === '' ? '/index.html' : reqPath;
    const candidates = [
      safeResolveStaticPath(ROOT_DIR, staticPath),
      safeResolveStaticPath(ROOT_DIR, path.join('html-games', staticPath)),
      safeResolveStaticPath(ROOT_DIR, path.join('html-games', path.basename(staticPath))),
    ].filter(Boolean);

    let filePath = null;
    for (const c of candidates) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        filePath = c;
        break;
      }
    }
    if (!filePath) {
      for (const c of candidates) {
        const idx = path.join(c, 'index.html');
        if (fs.existsSync(idx) && fs.statSync(idx).isFile()) {
          filePath = idx;
          break;
        }
      }
    }

    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(
        `<!DOCTYPE html><html><body style="background:#06070a;color:#fff;font-family:monospace;padding:40px;"><h2>404 Not Found</h2><p>${String(reqPath).replace(/[<>&"]/g, '')}</p></body></html>`
      );
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    // Cache-Control: short/revalidate for HTML, longer for static assets
    const cacheControl =
      ext === '.html' || ext === '.svg'
        ? 'no-cache'
        : reqUrlObj.searchParams.has('v')
          ? 'public, max-age=86400'
          : 'public, max-age=3600';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? Math.min(stat.size - 1, parseInt(parts[1], 10)) : stat.size - 1;
      if (isNaN(start) || start >= stat.size || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    const acceptEnc = String(req.headers['accept-encoding'] || '').toLowerCase();
    const shouldGzip =
      req.method !== 'HEAD' &&
      COMPRESSIBLE_EXTS.has(ext) &&
      stat.size >= 1024 &&
      stat.size <= 15 * 1024 * 1024 &&
      acceptEnc.includes('gzip');

    const headers = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl,
    };
    if (reqUrlObj.searchParams.get('download') === '1' || reqUrlObj.searchParams.get('download') === 'true') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }

    if (shouldGzip) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 4 })).pipe(res);
    } else {
      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error(`[GamesV7 Server Error] ${req.method} ${reqPath}:`, err.message);
    if (!res.headersSent) {
      sendJson(req, res, 500, { ok: false, error: err.message || 'Internal server error' });
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('  🎮 Games V7 — Skeletal Flowers Retro Arcade');
  console.log(`  🌐 Local Server:   http://localhost:${PORT}`);
  console.log(`  📡 Network Access: http://127.0.0.1:${PORT}`);
  console.log(`  🤖 AI Gateway:     ${getAiApiKey() ? 'Configured' : 'Unconfigured (set AI_API_KEY in .env)'}`);
  console.log(`  👑 Owner Account:  ${store.OWNER_USERNAME}`);
  console.log('====================================================');
  console.log('  Press Ctrl+C to stop the server anytime.\n');

  if (process.env.DISPLAY && !process.env.NO_BROWSER_OPEN) {
    exec(`xdg-open http://localhost:${PORT}/ >/dev/null 2>&1 || true`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR]: Port ${PORT} is already in use by another process.`);
    console.error(`Run './run.sh' to free port ${PORT}, or choose another PORT in .env.\n`);
    process.exit(1);
  } else {
    console.error('[SERVER ERROR]:', err);
    process.exit(1);
  }
});

function generateServerStandaloneGameHtml(params) {
  const { id, folder, title, isEmulator, queryStr, inlineHtml } = params;
  const safeTitle = (title || id || 'Arcade Game').replace(/[<>&"]/g, '');
  const inlineBase64 = inlineHtml ? Buffer.from(inlineHtml, 'utf8').toString('base64') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <title id="page-title">${safeTitle} — Games V7</title>
  <link id="page-favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.3 78'%3E%3Cpath fill='%230066da' d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z'/%3E%3Cpath fill='%2300ac47' d='M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z'/%3E%3Cpath fill='%23ea4335' d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z'/%3E%3Cpath fill='%2300832d' d='M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z'/%3E%3Cpath fill='%232684fc' d='M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z'/%3E%3Cpath fill='%23ffba00' d='m73.55 76.8-13.75-23.8H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h23.3c1.6 0 3.15-.4 4.5-1.2z'/%3E%3C/svg%3E">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; touch-action: none; }
    #game-container { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
    #game-frame { width: 100%; height: 100%; border: none; display: block; background: #0b0e14; }
    #loading-overlay { position: absolute; inset: 0; background: #0b0e14; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #94a3b8; font-size: 14px; font-weight: 500; z-index: 10; transition: opacity 0.3s ease, visibility 0.3s ease; pointer-events: none; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255, 255, 255, 0.1); border-top-color: #ff2a4b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hud-controls { position: fixed; bottom: 12px; right: 12px; display: flex; align-items: center; gap: 7px; z-index: 9999; opacity: 0.35; transition: opacity 0.2s, transform 0.2s; }
    .hud-controls:hover, .hud-controls:focus-within { opacity: 1; transform: translateY(-2px); }
    .hud-btn, .hud-select { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 11px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 7px; color: #f1f5f9; font-size: 12px; font-weight: 500; cursor: pointer; backdrop-filter: blur(8px); text-decoration: none; user-select: none; }
    .hud-btn:hover { background: rgba(30, 41, 59, 0.95); border-color: rgba(255, 255, 255, 0.35); }
    .hud-btn-danger { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
    .hud-btn-danger:hover { background: #ef4444; color: #fff; }
    .hud-select { outline: none; font-family: inherit; background: #0f172a; }
  </style>
  <script>
    const GAME_FOLDER = ${JSON.stringify(folder)};
    const IS_EMULATOR = ${JSON.stringify(isEmulator)};
    const QUERY_STR = ${JSON.stringify(queryStr)};
    const INLINE_B64 = ${JSON.stringify(inlineBase64)};
    const CLOAK_PRESETS = {
      drive: { title: "My Drive - Google Drive", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.3 78'%3E%3Cpath fill='%230066da' d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z'/%3E%3Cpath fill='%2300ac47' d='M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z'/%3E%3Cpath fill='%23ea4335' d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z'/%3E%3Cpath fill='%2300832d' d='M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z'/%3E%3Cpath fill='%232684fc' d='M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z'/%3E%3Cpath fill='%23ffba00' d='m73.55 76.8-13.75-23.8H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h23.3c1.6 0 3.15-.4 4.5-1.2z'/%3E%3C/svg%3E" },
      classroom: { title: "Classes", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%231e8e3e' d='M22 6.5C22 5.12 20.88 4 19.5 4h-15C3.12 4 2 5.12 2 6.5v11C2 18.88 3.12 20 4.5 20h15c1.38 0 2.5-1.12 2.5-2.5v-11z'/%3E%3C/svg%3E" },
      docs: { title: "Untitled document - Google Docs", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z'/%3E%3C/svg%3E" },
      default: { title: ${JSON.stringify(safeTitle)}, icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff2a4b'%3E%3Cpath d='M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z'/%3E%3C/svg%3E" }
    };
    function setTabCloak(key) {
      const preset = CLOAK_PRESETS[key] || CLOAK_PRESETS.default;
      document.title = preset.title;
      const favicon = document.getElementById('page-favicon');
      if (favicon) favicon.href = preset.icon;
      try { localStorage.setItem('gamesv7_tab_cloak', key); } catch(e) {}
    }
  </script>
</head>
<body>
  <div id="game-container">
    <div id="loading-overlay">
      <div class="spinner"></div>
      <div style="font-family:monospace;letter-spacing:1px;">LOADING ${safeTitle.toUpperCase()}...</div>
    </div>
    <iframe id="game-frame" src="about:blank" allow="fullscreen; gamepad; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="true"></iframe>
  </div>
  <div class="hud-controls">
    <select id="cloak-select" class="hud-select" onchange="setTabCloak(this.value)" title="Tab Cloak">
      <option value="drive">Google Drive</option>
      <option value="classroom">Google Classroom</option>
      <option value="docs">Google Docs</option>
      <option value="default">Cloak: Off</option>
    </select>
    <button class="hud-btn" onclick="restartGame()">Reload (R)</button>
    <button class="hud-btn" onclick="toggleFullscreen()">Fullscreen (F)</button>
    <button class="hud-btn hud-btn-danger" onclick="panicRedirect()">Panic (~)</button>
  </div>
  <script>
    const frame = document.getElementById('game-frame');
    const overlay = document.getElementById('loading-overlay');
    const enc = encodeURIComponent(GAME_FOLDER);
    async function resolveAndLoadGame() {
      const candidates = IS_EMULATOR
        ? ['http://localhost:8080/emulator/player.html', 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/emulator/player.html']
        : ['http://localhost:8080/games/' + enc + '/index.html', 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/games/' + enc + '/index.html'];
      for (const url of candidates) {
        try {
          const c = new AbortController();
          const t = setTimeout(() => c.abort(), 1500);
          const r = await fetch(url, { signal: c.signal });
          clearTimeout(t);
          if (r.ok) {
            const html = await r.text();
            const base = new URL('./', url).href;
            const inject = IS_EMULATOR ? '<script>window.__INJECTED_QUERY__=' + JSON.stringify(QUERY_STR) + ';<' + '/script>' : '';
            const full = html.includes('<head>') ? html.replace('<head>', '<head><base href="' + base + '">' + inject) : ('<base href="' + base + '">' + inject + html);
            frame.src = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
            return;
          }
        } catch(e) {}
      }
      frame.src = candidates[candidates.length - 1] + (IS_EMULATOR && QUERY_STR ? '?' + QUERY_STR : '');
    }
    resolveAndLoadGame();
    frame.addEventListener('load', () => {
      if (frame.src !== 'about:blank' && overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 350);
      }
    });
    function restartGame() { frame.src = 'about:blank'; setTimeout(resolveAndLoadGame, 80); }
    function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); }
    function panicRedirect() { window.location.replace('https://classroom.google.com'); }
    window.addEventListener('keydown', (e) => {
      if (e.key === '\`' || e.key === '~') { e.preventDefault(); panicRedirect(); }
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'r' || e.key === 'R') restartGame();
    });
  </script>
</body>
</html>`;
}
