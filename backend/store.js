'use strict';
/**
 * GAMES V7 — SECURE FILE-BACKED DATA STORE & ROLE ENGINE
 * Zero external npm dependencies (uses Node.js built-in crypto & fs).
 * Keeps Games V7 accounts, permissions, bug reports, and settings strictly separate from BokitCord.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  site: path.join(DATA_DIR, 'site_config.json'),
};

const OWNER_USERNAME = (process.env.GAMESV7_OWNER_USERNAME || 'bokit').trim().toLowerCase();

const DEFAULT_FEATURED = {
  categories: [
    {
      id: 'editors-picks',
      title: "Editor's Picks",
      subtitle: 'Hand-picked favorites from the Games V7 vault',
      gameIds: ['slope', 'retrobowl', 'minecraft', 'drift-boss', 'drive-mad', '10minutestilldawn'],
    },
    {
      id: 'arcade-hits',
      title: 'Most Popular',
      subtitle: 'Fast-loading fan favorites',
      gameIds: ['subwaysurfers', 'bitlife', 'cookieclicker', 'stickmanhook', 'crossy road', 'basket random'],
    },
    {
      id: 'retro-legends',
      title: 'Retro Console Legends',
      subtitle: 'Classic NES, SNES, N64, Game Boy & PS1',
      gameIds: ['nes-super-mario-bros', 'snes-super-mario-world', 'n64-super-mario-64', 'snes-chrono-trigger', 'gb-pokemon-red', 'ps1-crash-bandicoot'],
    },
    {
      id: 'horror-thrills',
      title: 'Horror & Survival',
      subtitle: 'Late-night chills and survival challenges',
      gameIds: ['fnaf1', 'fnaf2', 'baldis-basics', 'buckshot-roulette', 'granny', 'burgers and frights'],
    },
  ],
};

const DEFAULT_SITE_CONFIG = {
  siteName: 'Games V7',
  tagline: 'Skeletal Flowers Retro Arcade',
  bannerText: '',
  maintenanceNotice: '',
  featured: DEFAULT_FEATURED,
  announcements: [],
  hiddenGames: [],
  customGames: [],
  updatedAt: new Date().toISOString(),
};

function readJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      if (raw.trim()) return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[GamesV7 Store] Failed reading ${path.basename(filePath)}:`, err.message);
  }
  return typeof fallback === 'function' ? fallback() : JSON.parse(JSON.stringify(fallback));
}

function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, keyHex] = parts;
  try {
    const derived = crypto.scryptSync(String(password), salt, 64);
    const expected = Buffer.from(keyHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch (e) {
    return false;
  }
}

function defaultUserData() {
  return {
    favorites: [],
    recentlyPlayed: [],
    bookmarks: [],
    gameProgress: {},
    settings: {
      taskbarPosition: 'bottom',
      cloakKey: 'default',
      panicUrl: 'https://classroom.google.com',
      crtEnabled: true,
      soundEnabled: true,
      aiEndpoint: '',
      musicProvider: '',
    },
    musicLikes: [],
    musicPlaylists: [],
  };
}

function defaultPermissionsForRole(role) {
  if (role === 'owner') {
    return {
      manageRoles: true,
      viewReports: true,
      manageSiteSettings: true,
      manageGames: true,
      manageFeatured: true,
      manageAnnouncements: true,
      moderateUsers: true,
    };
  }
  if (role === 'co-owner') {
    return {
      manageRoles: false,
      viewReports: false,
      manageSiteSettings: false,
      manageGames: true,
      manageFeatured: true,
      manageAnnouncements: true,
      moderateUsers: true,
    };
  }
  if (role === 'moderator') {
    return {
      manageRoles: false,
      viewReports: false,
      manageSiteSettings: false,
      manageGames: false,
      manageFeatured: true,
      manageAnnouncements: true,
      moderateUsers: true,
    };
  }
  return {
    manageRoles: false,
    viewReports: false,
    manageSiteSettings: false,
    manageGames: false,
    manageFeatured: false,
    manageAnnouncements: false,
    moderateUsers: false,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const role = user.role || 'user';
  const basePerms = defaultPermissionsForRole(role);
  const perms = role === 'owner'
    ? basePerms
    : {
        ...basePerms,
        ...(user.permissions || {}),
        manageRoles: false,
        viewReports: false,
        manageSiteSettings: false,
      };
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    role,
    permissions: perms,
    banned: Boolean(user.banned),
    banReason: user.banReason || '',
    linkedBokitCord: Boolean(user.linkedBokitCord),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || user.createdAt,
  };
}

function ensureBootstrap() {
  const users = readJson(FILES.users, []);
  let owner = users.find((u) => u.username.toLowerCase() === OWNER_USERNAME);
  if (!owner) {
    const initialOwnerPass = process.env.GAMESV7_OWNER_PASSWORD || '';
    owner = {
      id: 'owner_bokit',
      username: OWNER_USERNAME,
      displayName: 'Bokit (Owner)',
      passwordHash: initialOwnerPass ? hashPassword(initialOwnerPass) : null,
      role: 'owner',
      permissions: defaultPermissionsForRole('owner'),
      linkedBokitCord: true,
      banned: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      data: defaultUserData(),
    };
    users.unshift(owner);
    writeJsonAtomic(FILES.users, users);
  } else if (process.env.GAMESV7_OWNER_PASSWORD && !owner.passwordHash) {
    owner.passwordHash = hashPassword(process.env.GAMESV7_OWNER_PASSWORD);
    writeJsonAtomic(FILES.users, users);
  }

  if (!fs.existsSync(FILES.sessions)) writeJsonAtomic(FILES.sessions, {});
  if (!fs.existsSync(FILES.reports)) writeJsonAtomic(FILES.reports, []);
  if (!fs.existsSync(FILES.site)) writeJsonAtomic(FILES.site, DEFAULT_SITE_CONFIG);
}

ensureBootstrap();

// Sessions (token -> { userId, createdAt, expiresAt })
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function loadSessions() {
  const raw = readJson(FILES.sessions, {});
  const now = Date.now();
  let changed = false;
  for (const [tok, meta] of Object.entries(raw)) {
    if (!meta || !meta.userId || (meta.expiresAt && now > meta.expiresAt)) {
      delete raw[tok];
      changed = true;
    }
  }
  if (changed) writeJsonAtomic(FILES.sessions, raw);
  return raw;
}

function createSession(userId) {
  const sessions = loadSessions();
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  writeJsonAtomic(FILES.sessions, sessions);
  return token;
}

function revokeSession(token) {
  if (!token) return;
  const sessions = loadSessions();
  if (sessions[token]) {
    delete sessions[token];
    writeJsonAtomic(FILES.sessions, sessions);
  }
}

function getUserByToken(token) {
  if (!token) return null;
  const sessions = loadSessions();
  const sess = sessions[token];
  if (!sess) return null;
  const users = readJson(FILES.users, []);
  const user = users.find((u) => u.id === sess.userId);
  if (!user || user.banned) return null;
  return user;
}

function getAllUsers() {
  return readJson(FILES.users, []);
}

function saveAllUsers(users) {
  writeJsonAtomic(FILES.users, users);
}

function getSiteConfig() {
  const cfg = readJson(FILES.site, DEFAULT_SITE_CONFIG);
  return {
    ...DEFAULT_SITE_CONFIG,
    ...cfg,
    featured: cfg.featured && Array.isArray(cfg.featured.categories) ? cfg.featured : DEFAULT_FEATURED,
    announcements: Array.isArray(cfg.announcements) ? cfg.announcements : [],
    hiddenGames: Array.isArray(cfg.hiddenGames) ? cfg.hiddenGames : [],
    customGames: Array.isArray(cfg.customGames) ? cfg.customGames : [],
  };
}

function saveSiteConfig(next) {
  const merged = {
    ...getSiteConfig(),
    ...next,
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(FILES.site, merged);
  return merged;
}

function getReports() {
  return readJson(FILES.reports, []);
}

function saveReports(list) {
  writeJsonAtomic(FILES.reports, list);
}

module.exports = {
  OWNER_USERNAME,
  DEFAULT_FEATURED,
  hashPassword,
  verifyPassword,
  defaultUserData,
  defaultPermissionsForRole,
  sanitizeUser,
  createSession,
  revokeSession,
  getUserByToken,
  getAllUsers,
  saveAllUsers,
  getSiteConfig,
  saveSiteConfig,
  getReports,
  saveReports,
};
