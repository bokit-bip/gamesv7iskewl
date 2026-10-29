#!/usr/bin/env node
/**
 * GAMES V7 — STANDALONE LOCAL SERVER
 * Runs on http://localhost:8080
 */

process.env.UV_THREADPOOL_SIZE = '64';

// Top-level crash guards for upstream network/socket errors
process.on('uncaughtException', (err) => {
  console.error('[Process UncaughtException]:', err && err.message ? err.message : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process UnhandledRejection]:', reason);
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT_DIR = __dirname;
const SHARED_DIR = path.resolve(__dirname, '..', 'dead bokitware');

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
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.nes': 'application/octet-stream',
  '.sfc': 'application/octet-stream',
  '.z64': 'application/octet-stream',
  '.nds': 'application/octet-stream',
  '.chd': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.cue': 'text/plain',
  '.swf': 'application/x-shockwave-flash'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath.startsWith('/games-v7')) {
    reqPath = reqPath.slice('/games-v7'.length) || '/';
  }
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  // API endpoint for games
  if (reqPath === '/api/games') {
    const candidates = [
      path.join(ROOT_DIR, 'assets', 'games.json'),
      path.join(ROOT_DIR, 'games.json'),
      path.join(SHARED_DIR, 'public', 'games.json')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(c).pipe(res);
        return;
      }
    }
  }

  // API endpoint to download any game as a single standalone HTML file
  if (reqPath === '/api/download-game' || reqPath === '/download-game') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
      const gameId = urlObj.searchParams.get('id') || urlObj.searchParams.get('game');
      if (!gameId) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing ?id= parameter');
        return;
      }
      const cleanFileName = gameId.replace(/[^a-zA-Z0-9_-]/g, '_') + '.html';
      const prebuiltLocal = path.join(ROOT_DIR, 'html-games', cleanFileName);
      const prebuiltShared = path.join(SHARED_DIR, 'html-games', cleanFileName);

      let outputHtml = '';
      if (fs.existsSync(prebuiltLocal)) {
        outputHtml = fs.readFileSync(prebuiltLocal, 'utf8');
      } else if (fs.existsSync(prebuiltShared)) {
        outputHtml = fs.readFileSync(prebuiltShared, 'utf8');
      } else {
        const candidates = [
          path.join(ROOT_DIR, 'games.json'),
          path.join(ROOT_DIR, 'assets', 'games.json'),
          path.join(SHARED_DIR, 'public', 'games.json')
        ];
        let gamesList = [];
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            try { gamesList = JSON.parse(fs.readFileSync(c, 'utf8')); break; } catch (e) {}
          }
        }
        const game = gamesList.find(g => (g.id || g.folder) === gameId) || { id: gameId, folder: gameId, title: gameId };
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
          const sharedIdx = path.join(SHARED_DIR, 'games', folder, 'index.html');
          if (fs.existsSync(localIdx)) {
            try { inlineHtml = fs.readFileSync(localIdx, 'utf8'); } catch (e) {}
          } else if (fs.existsSync(sharedIdx)) {
            try { inlineHtml = fs.readFileSync(sharedIdx, 'utf8'); } catch (e) {}
          }
        }

        outputHtml = generateServerStandaloneGameHtml({
          id: game.id || gameId,
          folder,
          title: safeTitle,
          isEmulator,
          queryStr,
          inlineHtml
        });
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(outputHtml);
      return;
    } catch (err) {
      console.error('Download game API error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error generating standalone HTML file');
      return;
    }
  }

  // Wisp Diagnostic & Ping endpoint
  if (reqPath === '/wisp/ping' || reqPath === '/wisp') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const isHttps = req.headers['x-forwarded-proto'] === 'https';
    res.end(JSON.stringify({
      status: 'online',
      service: 'Games V7 Wisp Server',
      protocol: 'wisp-v1',
      transport: 'libcurl',
      backend: 'scramjet',
      wispUrl: `${isHttps ? 'wss' : 'ws'}://${req.headers.host || 'localhost:8080'}/wisp/`,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    }));
    return;
  }

  // PNS Runtime Core JS stub for proxied TikTok sessions
  if (reqPath === '/browser/core.js' || reqPath === '/core.js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
    });
    res.end('/* [Scramjet] PNS Runtime Core stub */ (function(){})();');
    return;
  }

  // Handle Proxy Gateway
  if (reqPath.startsWith('/browser/gateway') || reqPath.startsWith('/proxy/gateway') || reqPath.startsWith('/api/proxy') || reqPath.startsWith('/api/movies/proxy')) {
    try {
      if (!req.originalUrl) req.originalUrl = req.url || '';
      if (!req.query) {
        req.query = {};
        if (req.url && req.url.includes('?')) {
          try {
            const u = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
            for (const [k, v] of u.searchParams.entries()) {
              req.query[k] = v;
            }
          } catch (e) {}
        }
      }
      const scramjetPath = path.join(SHARED_DIR, 'proxy_scramjet.js');
      if (fs.existsSync(scramjetPath)) {
        return require(scramjetPath).handleProxyRequest(req, res);
      }
    } catch (e) {
      console.error('Proxy error in Games V7 server:', e);
    }
  }

  // Candidate paths to search
  const candidates = [
    path.join(ROOT_DIR, reqPath),
    path.join(ROOT_DIR, 'html-games', reqPath),
    path.join(ROOT_DIR, 'html-games', path.basename(reqPath)),
    path.join(SHARED_DIR, reqPath),
    path.join(SHARED_DIR, 'public', reqPath),
    path.join(SHARED_DIR, 'data', reqPath),
    path.join(SHARED_DIR, 'html-games', reqPath),
    path.join(SHARED_DIR, 'html-games', path.basename(reqPath))
  ];

  let filePath = null;
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      filePath = c;
      break;
    }
  }

  // Handle directory index.html
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
    res.end(`<!DOCTYPE html><html><body style="background:#06070a;color:#fff;font-family:monospace;padding:40px;"><h2>404 Not Found</h2><p>${reqPath}</p></body></html>`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    const headers = {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    };
    if (req.url.includes('download=1') || req.url.includes('download=true')) {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Initialize Wisp WebSocket Server on http server if available
try {
  const wispPath = path.join(SHARED_DIR, 'wisp_server.js');
  if (fs.existsSync(wispPath)) {
    require(wispPath).createWispServer(server);
  }
} catch (e) {
  console.error('[WISP ERROR]:', e);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`  🎮 Games V7 — Skeletal Flowers Retro Arcade`);
  console.log(`  🌐 Local Server:   http://localhost:${PORT}`);
  console.log(`  📡 Network Access: http://127.0.0.1:${PORT}`);
  console.log('====================================================');
  console.log('  Press Ctrl+C to stop the server anytime.\n');

  // Open default browser if running in desktop graphical session
  if (process.env.DISPLAY) {
    exec(`xdg-open http://localhost:${PORT}/ >/dev/null 2>&1 || true`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR]: Port ${PORT} is already in use by another process.`);
    console.error(`Please run 'run.sh' which automatically frees port ${PORT}, or kill the process manually.\n`);
    process.exit(1);
  } else {
    console.error('[SERVER ERROR]:', err);
    process.exit(1);
  }
});

function generateServerStandaloneGameHtml(params) {
  const { id, folder, title, isEmulator, queryStr, inlineHtml } = params;
  const safeTitle = (title || id || 'Arcade Game').replace(/[<>&"]/g, '');
  const safeInlineSrc = inlineHtml ? inlineHtml.replace(/<\/script/gi, '<\\/script') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <title id="page-title">${safeTitle}</title>
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
    .hud-btn, .hud-select { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 11px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 7px; color: #f1f5f9; font-size: 12px; font-weight: 500; cursor: pointer; backdrop-filter: blur(8px); text-decoration: none; user-select: none; transition: background 0.15s; }
    .hud-btn:hover { background: rgba(30, 41, 59, 0.95); border-color: rgba(255, 255, 255, 0.35); }
    .hud-btn-direct { background: linear-gradient(135deg, rgba(255,42,75,0.3), rgba(168,85,247,0.3)); border-color: rgba(255,42,75,0.6); color: #ff9fb2; font-weight: 700; }
    .hud-btn-direct:hover { background: linear-gradient(135deg, #ff2a4b, #a855f7); color: #fff; }
    .hud-btn-danger { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
    .hud-btn-danger:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
    .hud-select { outline: none; font-family: inherit; background: #0f172a; }
  </style>
  <script>
    const TAILSCALE_ORIGIN = "https://pop-leave.tailcb4af7.ts.net";
    const GAME_FOLDER = ${JSON.stringify(folder)};
    const IS_EMULATOR = ${JSON.stringify(isEmulator)};
    const QUERY_STR = ${JSON.stringify(queryStr)};
    const INLINE_SRC = ${JSON.stringify(safeInlineSrc)};

    const CLOAK_PRESETS = {
      drive: { title: "My Drive - Google Drive", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.3 78'%3E%3Cpath fill='%230066da' d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z'/%3E%3Cpath fill='%2300ac47' d='M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z'/%3E%3Cpath fill='%23ea4335' d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z'/%3E%3Cpath fill='%2300832d' d='M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z'/%3E%3Cpath fill='%232684fc' d='M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z'/%3E%3Cpath fill='%23ffba00' d='m73.55 76.8-13.75-23.8H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h23.3c1.6 0 3.15-.4 4.5-1.2z'/%3E%3C/svg%3E" },
      classroom: { title: "Classes", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%231e8e3e' d='M22 6.5C22 5.12 20.88 4 19.5 4h-15C3.12 4 2 5.12 2 6.5v11C2 18.88 3.12 20 4.5 20h15c1.38 0 2.5-1.12 2.5-2.5v-11z'/%3E%3Cpath fill='%23f9ab00' d='M20.5 5.5h-17c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-11c0-.55-.45-1-1-1z'/%3E%3Ccircle cx='12' cy='10' r='2.2' fill='%23fff'/%3E%3Cpath fill='%23fff' d='M12 13.2c-2.4 0-4.5 1.2-4.5 2.5V17h9v-1.3c0-1.3-2.1-2.5-4.5-2.5z'/%3E%3Ccircle cx='7' cy='11' r='1.6' fill='%23fff' opacity='.8'/%3E%3Cpath fill='%23fff' opacity='.8' d='M7 13.5c-1.8 0-3.2.9-3.2 2V16h2.2v-.8c0-.6.4-1.2 1-1.7z'/%3E%3Ccircle cx='17' cy='11' r='1.6' fill='%23fff' opacity='.8'/%3E%3Cpath fill='%23fff' opacity='.8' d='M17 13.5c1.8 0 3.2.9 3.2 2V16H18v-.8c0-.6-.4-1.2-1-1.7z'/%3E%3C/svg%3E" },
      docs: { title: "Untitled document - Google Docs", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z'/%3E%3Cpath fill='%23A1C2FA' d='M14 2v6h6'/%3E%3Cpath fill='%23FFF' d='M8 12h8v1.5H8zm0 3h8v1.5H8zm0 3h5v1.5H8z'/%3E%3C/svg%3E" },
      canvas: { title: "Dashboard", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23E02424' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z'/%3E%3C/svg%3E" },
      desmos: { title: "Desmos | Graphing Calculator", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%232F7B18' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E" },
      default: { title: ${JSON.stringify(safeTitle)}, icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff2a4b'%3E%3Cpath d='M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E" }
    };

    function setTabCloak(key) {
      const preset = CLOAK_PRESETS[key] || CLOAK_PRESETS.default;
      document.title = preset.title;
      let favicon = document.getElementById('page-favicon');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.id = 'page-favicon';
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = preset.icon;
      try { localStorage.setItem('gamesv7_tab_cloak', key); } catch(e) {}
    }

    (function() {
      try {
        const saved = localStorage.getItem('gamesv7_tab_cloak') || 'drive';
        if (CLOAK_PRESETS[saved]) document.title = CLOAK_PRESETS[saved].title;
      } catch(e) {}
    })();
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
      <option value="drive">🎭 Google Drive</option>
      <option value="classroom">🎭 Google Classroom</option>
      <option value="docs">🎭 Google Docs</option>
      <option value="canvas">🎭 Canvas</option>
      <option value="desmos">🎭 Desmos</option>
      <option value="default">🎭 Cloak: Off</option>
    </select>
    <button class="hud-btn" onclick="launchAboutBlank()" title="about:blank (Hotkey: B)">
      <span>about:blank (B)</span>
    </button>
    <button class="hud-btn" onclick="restartGame()" title="Reload (Hotkey: R)">
      <span>Reload (R)</span>
    </button>
    <button class="hud-btn" onclick="toggleFullscreen()" title="Fullscreen (Hotkey: F)">
      <span>Fullscreen (F)</span>
    </button>
    <button class="hud-btn hud-btn-danger" onclick="panicRedirect()" title="Panic (Hotkey: ~)">
      <span>🚨 Panic (~)</span>
    </button>
  </div>

  <script>
    const frame = document.getElementById('game-frame');
    const overlay = document.getElementById('loading-overlay');
    const cloakSelect = document.getElementById('cloak-select');
    let effectiveGameUrl = '';

    try {
      const current = localStorage.getItem('gamesv7_tab_cloak') || 'drive';
      if (cloakSelect && CLOAK_PRESETS[current]) cloakSelect.value = current;
      setTabCloak(cloakSelect ? cloakSelect.value : 'drive');
    } catch(e) {}

    async function resolveAndLoadGame() {
      const base = document.baseURI || window.location.href;
      const enc = encodeURIComponent(GAME_FOLDER);

      if (IS_EMULATOR) {
        const playerCandidates = [
          new URL('emulator/player.html', base).href,
          new URL('../emulator/player.html', base).href,
          'http://localhost:8080/emulator/player.html',
          TAILSCALE_ORIGIN + '/emulator/player.html',
          'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/emulator/player.html',
          'https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/emulator/player.html'
        ];
        for (const p of playerCandidates) {
          try {
            const r = await fetch(p);
            if (r.ok) {
              const html = await r.text();
              const baseTag = '<base href="' + new URL('./', p).href + '">';
              const injectScript = '<script>window.__INJECTED_QUERY__ = ' + JSON.stringify(QUERY_STR) + ';<' + '/script>';
              const full = html.includes('<head>') ? html.replace('<head>', '<head>' + baseTag + injectScript) : (baseTag + injectScript + html);
              frame.src = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
              return;
            }
          } catch(e) {}
        }
        frame.src = new URL('emulator/player.svg?' + QUERY_STR, base).href;
        return;
      }

      if (INLINE_SRC && INLINE_SRC.length > 50) {
        const targetBase = new URL('games/' + enc + '/', base).href;
        const baseTag = '<base href="' + targetBase + '">';
        const shimScript = '<script>(function(){var tb=' + JSON.stringify(targetBase) + ';class PatchedURL extends URL{constructor(u,b){var bStr="";if(b){bStr=(typeof b==="object"&&b.href)?b.href:String(b);}if(!bStr||bStr.indexOf("blob:")===0||bStr.indexOf("about:")===0){bStr=tb;}super(u,bStr);}}window.URL=PatchedURL;})();<' + '/script>';
        const full = INLINE_SRC.includes('<head>') ? INLINE_SRC.replace('<head>', '<head>' + baseTag + shimScript) : (baseTag + shimScript + INLINE_SRC);
        frame.src = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
        return;
      }

      const candidates = [
        new URL('games/' + enc + '/index.html', base).href,
        new URL('../games/' + enc + '/index.html', base).href,
        'http://localhost:8080/games/' + enc + '/index.html',
        TAILSCALE_ORIGIN + '/games/' + enc + '/index.html',
        'https://raw.githubusercontent.com/bokit-bip/gamesv7iskewl@main/games/' + enc + '/index.html',
        'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/games/' + enc + '/index.html',
        'https://raw.githubusercontent.com/bokit-bip/gamesssv7/main/games/' + enc + '/index.html',
        'https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/games/' + enc + '/index.html'
      ];

      for (const url of candidates) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(url, { signal: timer.signal });
          clearTimeout(timer);
          if (res.ok) {
            let html = await res.text();
            if (html.includes('Package size exceeded') || html.includes('Cannot find "') || html.trim().startsWith('404')) continue;
            effectiveGameUrl = url;
            const targetBase = new URL('./', url).href;
            const baseTag = '<base href="' + targetBase + '">';
            const shimScript = '<script>(function(){var tb=' + JSON.stringify(targetBase) + ';class PatchedURL extends URL{constructor(u,b){var bStr="";if(b){bStr=(typeof b==="object"&&b.href)?b.href:String(b);}if(!bStr||bStr.indexOf("blob:")===0||bStr.indexOf("about:")===0){bStr=tb;}super(u,bStr);}}window.URL=PatchedURL;})();<' + '/script>';
            const full = html.includes('<head>') ? html.replace('<head>', '<head>' + baseTag + shimScript) : (baseTag + shimScript + html);
            frame.src = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
            return;
          }
        } catch(e) {}
      }

      effectiveGameUrl = TAILSCALE_ORIGIN + '/games/' + enc + '/index.html';
      frame.src = effectiveGameUrl;
    }

    resolveAndLoadGame();

    frame.addEventListener('load', () => {
      if (frame.src && frame.src !== 'about:blank' && overlay) {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        setTimeout(() => overlay.remove(), 400);
      }
      try {
        frame.focus();
        if (frame.contentWindow) frame.contentWindow.focus();
      } catch(e) {}
    });

    function restartGame() {
      if (frame) {
        frame.src = 'about:blank';
        setTimeout(() => { resolveAndLoadGame(); }, 80);
      }
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    function panicRedirect() {
      window.location.replace('https://classroom.google.com');
    }

    function launchAboutBlank() {
      const win = window.open('about:blank', '_blank');
      if (!win) { alert('Popout blocked.'); return; }
      const curKey = (cloakSelect && cloakSelect.value) || 'drive';
      const preset = CLOAK_PRESETS[curKey] || CLOAK_PRESETS.drive;
      const targetSrc = (frame && frame.src && frame.src !== 'about:blank') ? frame.src : (effectiveGameUrl || (window.location.origin + '/games/' + GAME_FOLDER + '/index.html'));
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + preset.title + '</title><link rel="icon" type="image/svg+xml" href="' + preset.icon + '"><style>body,html{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#0b0e14;}iframe{width:100%;height:100%;border:none;display:block;}</style></head><body><iframe src="' + targetSrc + '" allow="fullscreen; gamepad; autoplay; clipboard-write; encrypted-media"></iframe></body></html>';
      win.document.open();
      win.document.write(html);
      win.document.close();
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === '\`' || e.key === '~') {
        e.preventDefault();
        panicRedirect();
      } else if ((e.key === 'b' || e.key === 'B') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        launchAboutBlank();
      } else if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        toggleFullscreen();
      } else if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        restartGame();
      }
    });
  </script>

  <!-- Direct Link Ad Integration -->
  <script>
    (function() {
      var opened = false;
      function openAd() {
        if (opened) return;
        opened = true;
        try { window.open('https://uplcm.com/4/11930399', '_blank', 'noopener,noreferrer'); } catch(e) {}
        ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(function(evt) {
          window.removeEventListener(evt, openAd);
        });
      }
      ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(function(evt) {
        window.addEventListener(evt, openAd, { once: true });
      });
    })();
  </script>
</body>
</html>`;
}
