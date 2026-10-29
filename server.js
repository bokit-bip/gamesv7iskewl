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

  // Handle Proxy Gateway
  if (reqPath.startsWith('/browser/gateway') || reqPath.startsWith('/proxy/gateway')) {
    try {
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
    path.join(SHARED_DIR, reqPath),
    path.join(SHARED_DIR, 'public', reqPath),
    path.join(SHARED_DIR, 'data', reqPath)
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
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    });
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
