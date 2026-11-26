'use strict';
/**
 * GAMES V7 — MUSIC ENGINE (BokitCord-Parity yt-dlp Full-Track Search, Streaming & MP3 Download)
 * Runs completely independently inside Games V7:
 *  - Uses yt-dlp (~/.local/bin/yt-dlp or PATH) for full-track search (`ytsearch15:`) & audio URL resolution (`-g -f ba/b`)
 *  - Deduplicates concurrent resolves (`pendingStreamResolves`) & caches stream URLs for 3.5 hours
 *  - Full HTTP Range / 206 Partial Content streaming + automatic 403 expired GoogleVideo URL refresh
 *  - Supports /api/music/catalog, /api/music/recommended, /api/music/search, /api/music/stream, /api/music/download
 *  - Graceful iTunes Search M4A preview fallback if yt-dlp is unavailable on a deployment host
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const { execFile } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RECOMMENDED_MUSIC_PATH = path.join(ROOT_DIR, 'assets', 'recommended_music.json');
const MUSIC_CATALOG_PATH = path.join(ROOT_DIR, 'assets', 'music_catalog.json');

function resolveYtDlpBinary() {
  if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
    return process.env.YTDLP_PATH;
  }
  const localBin = path.join(os.homedir(), '.local', 'bin', 'yt-dlp');
  if (fs.existsSync(localBin)) return localBin;
  return 'yt-dlp';
}

const ytDlpPath = resolveYtDlpBinary();
const ytStreamCache = new Map(); // id -> { url, expiresAt }
const pendingStreamResolves = new Map();
const searchCache = new Map(); // query -> { results, expiresAt }
const musicHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 32, timeout: 15000 });

function getMusicCatalog() {
  if (fs.existsSync(RECOMMENDED_MUSIC_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(RECOMMENDED_MUSIC_PATH, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}
  }
  if (fs.existsSync(MUSIC_CATALOG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(MUSIC_CATALOG_PATH, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}
  }
  return [];
}

function enrichTrack(track) {
  const id = track.id || '';
  const title = track.title || 'Track';
  const artist = track.artist || 'Artist';
  return {
    ...track,
    streamUrl: track.streamUrl || `/api/music/stream?id=${encodeURIComponent(id)}`,
    downloadUrl:
      track.downloadUrl ||
      `/api/music/download?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
  };
}

function loadRecommendedCatalog() {
  return getMusicCatalog().map(enrichTrack);
}

function getFilteredCatalog(genre, search) {
  let filtered = [...getMusicCatalog()];
  if (genre && genre !== 'all') {
    const g = String(genre).toLowerCase();
    filtered = filtered.filter((t) => t.genre && t.genre.toLowerCase().includes(g));
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q)) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q))
    );
  }
  return filtered.map(enrichTrack);
}

function resolveYouTubeAudioUrl(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return Promise.reject(new Error('Missing YouTube ID'));

  const cached = ytStreamCache.get(cleanId);
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.url);
  }

  if (pendingStreamResolves.has(cleanId)) {
    return pendingStreamResolves.get(cleanId);
  }

  const promise = new Promise((resolve, reject) => {
    const ytUrl = `https://www.youtube.com/watch?v=${cleanId}`;
    execFile(ytDlpPath, ['--no-warnings', '-g', '-f', 'ba/b', ytUrl], { timeout: 15000 }, (err, stdout, stderr) => {
      pendingStreamResolves.delete(cleanId);
      if (err || !stdout || !stdout.trim()) {
        console.error(`[GamesV7 Music] yt-dlp resolution error for ${cleanId}:`, err ? err.message : stderr);
        return reject(new Error('Failed to resolve YouTube audio stream'));
      }
      const streamUrl = stdout.trim().split('\n')[0].trim();
      // Cache for 3.5 hours (same as BokitCord)
      if (ytStreamCache.size > 300) ytStreamCache.delete(ytStreamCache.keys().next().value);
      ytStreamCache.set(cleanId, { url: streamUrl, expiresAt: Date.now() + 3.5 * 3600 * 1000 });
      resolve(streamUrl);
    });
  });

  pendingStreamResolves.set(cleanId, promise);
  return promise;
}

function fetchItunesFallback(query) {
  return new Promise((resolve) => {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`;
    const req = https.get(url, { headers: { 'User-Agent': 'GamesV7-Music/1.0' }, agent: musicHttpsAgent, timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const list = (data && Array.isArray(data.results) ? data.results : [])
            .filter((item) => item.previewUrl)
            .map((item) => {
              const sec = Math.max(0, Math.round((item.trackTimeMillis || 30000) / 1000));
              const m = Math.floor(sec / 60);
              const s = String(sec % 60).padStart(2, '0');
              return {
                id: `itunes_${item.trackId}`,
                title: item.trackName || 'Untitled',
                artist: item.artistName || 'Unknown Artist',
                duration: `${m}:${s}`,
                durationSec: sec,
                coverUrl: (item.artworkUrl100 || '').replace('100x100', '300x300'),
                streamUrl: item.previewUrl,
                downloadUrl: item.previewUrl,
              };
            });
          resolve(list);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve([]); });
    req.on('error', () => resolve([]));
  });
}

// Search Music: mirrors BokitCord's yt-dlp `ytsearch15:` full-track search with local + iTunes fallback
function searchMusic(query) {
  const clean = String(query || '').trim();
  if (!clean) return Promise.resolve(loadRecommendedCatalog());

  const cacheKey = clean.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.results);
  }

  const catalog = getMusicCatalog();
  const localMatches = catalog
    .filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(cacheKey)) ||
        (t.artist && t.artist.toLowerCase().includes(cacheKey))
    )
    .map(enrichTrack);

  return new Promise((resolve) => {
    execFile(
      ytDlpPath,
      ['--no-warnings', '--flat-playlist', '--dump-json', `ytsearch15:${clean}`],
      { timeout: 12000 },
      async (err, stdout) => {
        if (err || !stdout || !stdout.trim()) {
          console.warn(`[GamesV7 Music Search] yt-dlp search fallback for "${clean}":`, err ? err.message : 'no output');
          const itunes = await fetchItunesFallback(clean);
          const fallbackCombined = [...localMatches, ...itunes];
          if (fallbackCombined.length > 0) {
            searchCache.set(cacheKey, { results: fallbackCombined, expiresAt: Date.now() + 10 * 60 * 1000 });
          }
          return resolve(fallbackCombined);
        }

        try {
          const lines = stdout.trim().split('\n').filter(Boolean);
          const ytResults = lines
            .map((line) => {
              try {
                const d = JSON.parse(line);
                if (!d.id) return null;
                const dur = d.duration || 210;
                const m = Math.floor(dur / 60);
                const s = Math.floor(dur % 60).toString().padStart(2, '0');
                const displayTitle = d.title || 'Untitled';
                const displayArtist = d.uploader || d.channel || 'Artist';
                return {
                  id: d.id,
                  title: displayTitle,
                  artist: displayArtist,
                  duration: `${m}:${s}`,
                  durationSec: dur,
                  coverUrl: `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
                  streamUrl: `/api/music/stream?id=${encodeURIComponent(d.id)}`,
                  downloadUrl: `/api/music/download?id=${encodeURIComponent(d.id)}&title=${encodeURIComponent(displayTitle)}&artist=${encodeURIComponent(displayArtist)}`,
                };
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);

          const seenIds = new Set();
          const combined = [];
          for (const t of [...ytResults, ...localMatches]) {
            if (!seenIds.has(t.id)) {
              seenIds.add(t.id);
              combined.push(t);
            }
          }

          if (searchCache.size > 200) searchCache.delete(searchCache.keys().next().value);
          searchCache.set(cacheKey, { results: combined, expiresAt: Date.now() + 10 * 60 * 1000 });
          return resolve(combined);
        } catch (e) {
          return resolve(localMatches);
        }
      }
    );
  });
}

// Audio Streaming Proxy with Range / 206 Partial Content Support & 403 Refresh (BokitCord parity)
async function handleMusicStream(req, res, trackId, directUrl = null) {
  let targetUrl = directUrl;
  if (targetUrl === 'undefined' || targetUrl === 'null') targetUrl = null;

  if (!targetUrl && trackId) {
    try {
      targetUrl = await resolveYouTubeAudioUrl(trackId);
    } catch (e) {
      const catalog = getMusicCatalog();
      const track = catalog.find((t) => String(t.id) === String(trackId));
      if (track && track.audioUrl) {
        targetUrl = track.audioUrl;
      } else if (track) {
        const fallback = await fetchItunesFallback(`${track.title || ''} ${track.artist || ''}`);
        if (fallback.length && fallback[0].streamUrl) {
          targetUrl = fallback[0].streamUrl;
        }
      }
      if (!targetUrl) {
        res.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
        return res.end('Error resolving audio stream: ' + e.message);
      }
    }
  }

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    return res.end('Missing audio stream ?id= or ?url= parameter');
  }

  const streamFromUrl = (audioUrl, isRetry) => {
    try {
      const parsed = new URL(audioUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: '*/*',
      };
      if (req.headers.range) {
        requestHeaders.Range = req.headers.range;
      }

      const proxyReq = client.get(audioUrl, { headers: requestHeaders, timeout: 20000 }, (upstreamRes) => {
        // Handle expired GoogleVideo token (403 Forbidden) by re-resolving once
        if (upstreamRes.statusCode === 403 && !isRetry && trackId) {
          upstreamRes.resume();
          ytStreamCache.delete(trackId);
          resolveYouTubeAudioUrl(trackId)
            .then((freshUrl) => streamFromUrl(freshUrl, true))
            .catch(() => {
              if (!res.headersSent) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Stream URL expired');
              }
            });
          return;
        }

        const outHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Accept-Ranges': 'bytes',
          'Content-Type': upstreamRes.headers['content-type'] || 'audio/webm',
        };
        if (upstreamRes.headers['content-length']) {
          outHeaders['Content-Length'] = upstreamRes.headers['content-length'];
        }
        if (upstreamRes.headers['content-range']) {
          outHeaders['Content-Range'] = upstreamRes.headers['content-range'];
        }

        res.writeHead(upstreamRes.statusCode || 200, outHeaders);
        upstreamRes.pipe(res);
      });

      req.on('close', () => {
        if (!proxyReq.destroyed) proxyReq.destroy();
      });
      proxyReq.on('error', (err) => {
        console.error('[GamesV7 Music Stream] proxy error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end('Error streaming audio');
        }
      });
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid audio URL');
      }
    }
  };

  streamFromUrl(targetUrl, false);
}

// MP3 / Audio Download Endpoint (BokitCord parity)
async function handleMusicDownload(req, res, params = {}) {
  let targetUrl = params.url;
  const trackId = params.id;
  const title = String(params.title || 'Track').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Track';
  const artist = String(params.artist || 'Artist').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Artist';
  const filename = `${artist} - ${title}.mp3`;

  if (targetUrl === 'undefined' || targetUrl === 'null') targetUrl = null;

  if (!targetUrl && trackId) {
    try {
      targetUrl = await resolveYouTubeAudioUrl(trackId);
    } catch (e) {
      const catalog = getMusicCatalog();
      const track = catalog.find((t) => String(t.id) === String(trackId));
      if (track && track.audioUrl) targetUrl = track.audioUrl;
    }
  }

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Missing ?id= or ?url= parameter');
  }

  try {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const proxyReq = client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 25000 }, (upstreamRes) => {
      const outHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': upstreamRes.headers['content-type'] || 'audio/webm',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      };
      if (upstreamRes.headers['content-length']) {
        outHeaders['Content-Length'] = upstreamRes.headers['content-length'];
      }
      res.writeHead(upstreamRes.statusCode || 200, outHeaders);
      upstreamRes.pipe(res);
    });

    req.on('close', () => {
      if (!proxyReq.destroyed) proxyReq.destroy();
    });
    proxyReq.on('error', (err) => {
      console.error('[GamesV7 Music Download] error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Error downloading audio');
      }
    });
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid audio URL');
  }
}

module.exports = {
  ytDlpPath,
  loadRecommendedCatalog,
  getFilteredCatalog,
  searchMusic,
  handleMusicStream,
  handleMusicDownload,
};
