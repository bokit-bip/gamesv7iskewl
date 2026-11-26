'use strict';
/**
 * GAMES V7 — INDEPENDENT MUSIC BACKEND
 * Works completely without BokitCord:
 *  - Local catalog (assets/recommended_music.json)
 *  - Live search via local catalog + iTunes Search API (free, no key, direct M4A previews) + optional yt-dlp
 *  - Audio streaming via local yt-dlp (if installed) or direct preview/mirror fallback
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFile } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RECOMMENDED_PATH = path.join(ROOT_DIR, 'assets', 'recommended_music.json');

const musicAgent = new https.Agent({ keepAlive: true, maxSockets: 24, timeout: 10000 });
const searchCache = new Map();
const streamCache = new Map();

function loadRecommendedCatalog() {
  try {
    if (fs.existsSync(RECOMMENDED_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(RECOMMENDED_PATH, 'utf8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function fetchJsonHttps(url, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'GamesV7-Music/1.0' }, agent: musicAgent, timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
  });
}

function formatMs(ms) {
  const sec = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

async function searchMusic(query) {
  const clean = String(query || '').trim();
  if (!clean) return loadRecommendedCatalog();
  const key = clean.toLowerCase();
  const cached = searchCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.results;

  const local = loadRecommendedCatalog().filter((t) =>
    `${t.title || ''} ${t.artist || ''}`.toLowerCase().includes(key)
  );

  const results = [...local];
  const seen = new Set(results.map((t) => `${(t.title || '').toLowerCase()}|${(t.artist || '').toLowerCase()}`));

  // Independent public iTunes Search API (reliable, direct HTTPS audio streams, zero API key required)
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(clean)}&media=music&entity=song&limit=20`;
    const data = await fetchJsonHttps(itunesUrl, 5000);
    if (data && Array.isArray(data.results)) {
      for (const item of data.results) {
        if (!item.previewUrl) continue;
        const dedupeKey = `${(item.trackName || '').toLowerCase()}|${(item.artistName || '').toLowerCase()}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push({
          id: `itunes_${item.trackId}`,
          title: item.trackName || 'Untitled',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || '',
          duration: formatMs(item.trackTimeMillis || 30000),
          durationSec: Math.round((item.trackTimeMillis || 30000) / 1000),
          coverUrl: (item.artworkUrl100 || '').replace('100x100', '300x300'),
          streamUrl: item.previewUrl,
          provider: 'itunes-preview',
        });
      }
    }
  } catch (e) {}

  if (searchCache.size > 200) searchCache.delete(searchCache.keys().next().value);
  searchCache.set(key, { results, expiresAt: Date.now() + 10 * 60 * 1000 });
  return results;
}

function resolveWithYtDlp(videoId) {
  return new Promise((resolve, reject) => {
    const cleanId = String(videoId || '').trim();
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(cleanId)) {
      return reject(new Error('Invalid track id'));
    }
    const cached = streamCache.get(cleanId);
    if (cached && Date.now() < cached.expiresAt) return resolve(cached.url);

    const ytUrl = `https://www.youtube.com/watch?v=${cleanId}`;
    execFile('yt-dlp', ['--no-warnings', '-g', '-f', 'bestaudio[ext=m4a]/bestaudio/best', ytUrl], { timeout: 14000 }, (err, stdout) => {
      if (err) return reject(err);
      const streamUrl = String(stdout || '').trim().split('\n')[0];
      if (!streamUrl || !streamUrl.startsWith('http')) return reject(new Error('No audio URL resolved'));
      if (streamCache.size > 200) streamCache.delete(streamCache.keys().next().value);
      streamCache.set(cleanId, { url: streamUrl, expiresAt: Date.now() + 45 * 60 * 1000 });
      resolve(streamUrl);
    });
  });
}

async function resolveFallbackPreviewForTrack(trackId) {
  const catalog = loadRecommendedCatalog();
  const track = catalog.find((t) => String(t.id) === String(trackId));
  if (!track) return null;
  try {
    const q = `${track.title || ''} ${track.artist || ''}`.trim();
    const data = await fetchJsonHttps(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=3`, 4500);
    const match = data && Array.isArray(data.results) ? data.results.find((r) => r.previewUrl) : null;
    return match ? match.previewUrl : null;
  } catch (e) {
    return null;
  }
}

async function handleMusicStream(req, res, trackId) {
  let targetUrl = null;
  try {
    targetUrl = await resolveWithYtDlp(trackId);
  } catch (e) {
    targetUrl = await resolveFallbackPreviewForTrack(trackId);
  }

  if (!targetUrl) {
    res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ ok: false, error: 'Audio stream currently unavailable on independent providers.' }));
  }

  try {
    const u = new URL(targetUrl);
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (req.headers.range) headers.Range = req.headers.range;
    const upReq = https.get(u, { headers, agent: musicAgent, timeout: 15000 }, (upRes) => {
      const outHeaders = {
        'Content-Type': upRes.headers['content-type'] || 'audio/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      };
      if (upRes.headers['content-length']) outHeaders['Content-Length'] = upRes.headers['content-length'];
      if (upRes.headers['content-range']) outHeaders['Content-Range'] = upRes.headers['content-range'];
      res.writeHead(upRes.statusCode || 200, outHeaders);
      upRes.pipe(res);
    });
    upReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Upstream audio stream error' }));
      }
    });
    res.on('close', () => { if (!res.writableEnded) upReq.destroy(); });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}

module.exports = {
  loadRecommendedCatalog,
  searchMusic,
  handleMusicStream,
};
