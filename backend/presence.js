'use strict';
/**
 * GAMES V7 — REAL ONLINE VISITOR PRESENCE TRACKER
 * Anonymous session-deduplicated active presence with automatic TTL expiration.
 * Never fabricates or inflates visitor counts.
 */

const PRESENCE_TTL_MS = 65 * 1000; // 65 seconds sliding window (clients heartbeat every 25s)
const MAX_SESSIONS_PER_IP = 8; // Prevent single-IP session flooding
const MAX_TOTAL_SESSIONS = 10000;

const activeSessions = new Map(); // sessionId -> { lastSeen, ip }

function pruneExpired(now = Date.now()) {
  for (const [sid, info] of activeSessions.entries()) {
    if (!info || now - info.lastSeen > PRESENCE_TTL_MS) {
      activeSessions.delete(sid);
    }
  }
}

function recordHeartbeat(sessionId, ip = '') {
  const now = Date.now();
  pruneExpired(now);

  const cleanSid = String(sessionId || '').trim().slice(0, 80);
  if (!cleanSid || !/^[a-zA-Z0-9_-]{8,80}$/.test(cleanSid)) {
    return { ok: false, error: 'Invalid sessionId' };
  }

  const cleanIp = String(ip || '').slice(0, 64);

  if (!activeSessions.has(cleanSid)) {
    // Enforce per-IP session cap to avoid duplicate-tab inflation
    if (cleanIp) {
      let sameIpCount = 0;
      let oldestSameIpSid = null;
      let oldestSameIpTs = Infinity;
      for (const [sid, info] of activeSessions.entries()) {
        if (info.ip === cleanIp) {
          sameIpCount++;
          if (info.lastSeen < oldestSameIpTs) {
            oldestSameIpTs = info.lastSeen;
            oldestSameIpSid = sid;
          }
        }
      }
      if (sameIpCount >= MAX_SESSIONS_PER_IP && oldestSameIpSid) {
        activeSessions.delete(oldestSameIpSid);
      }
    }
    if (activeSessions.size >= MAX_TOTAL_SESSIONS) {
      const oldestKey = activeSessions.keys().next().value;
      if (oldestKey) activeSessions.delete(oldestKey);
    }
  }

  activeSessions.set(cleanSid, { lastSeen: now, ip: cleanIp });
  return {
    ok: true,
    online: activeSessions.size,
    ttlSec: Math.round(PRESENCE_TTL_MS / 1000),
    timestamp: new Date(now).toISOString(),
  };
}

function removeSession(sessionId) {
  const cleanSid = String(sessionId || '').trim();
  if (cleanSid) activeSessions.delete(cleanSid);
  pruneExpired();
  return { ok: true, online: activeSessions.size };
}

function getOnlineCount() {
  pruneExpired();
  return {
    ok: true,
    online: activeSessions.size,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  recordHeartbeat,
  removeSession,
  getOnlineCount,
};
