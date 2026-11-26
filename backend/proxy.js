'use strict';
/**
 * GAMES V7 — INDEPENDENT BUILT-IN WEB PROXY GATEWAY
 * Self-contained HTTP/HTTPS proxy with keep-alive pooling, compression,
 * HTML/CSS rewriting, redirect handling, SSRF guard, and timeout cleanup.
 * Does NOT depend on BokitCord.
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const { URL } = require('url');

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 256,
  maxFreeSockets: 64,
  timeout: 25000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 256,
  maxFreeSockets: 64,
  timeout: 25000,
  rejectUnauthorized: false,
});

const MAX_REWRITE_BYTES = 12 * 1024 * 1024;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function isPrivateOrLoopbackHost(hostname) {
  if (!hostname) return true;
  const h = String(hostname).toLowerCase().replace(/^\[|\]$/g, '');
  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h === '::' ||
    h.startsWith('127.') ||
    h.startsWith('169.254.') ||
    h.startsWith('10.') ||
    h.startsWith('192.168.') ||
    h.startsWith('fc') ||
    h.startsWith('fd') ||
    h.startsWith('fe80:')
  ) {
    return true;
  }
  const m172 = h.match(/^172\.(\d+)\./);
  if (m172) {
    const oct = parseInt(m172[1], 10);
    if (oct >= 16 && oct <= 31) return true;
  }
  return false;
}

function buildGatewayUrl(targetUrl, prefix = '/browser/gateway?url=') {
  return `${prefix}${encodeURIComponent(targetUrl)}`;
}

function resolveAbs(raw, baseUrl) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || /^(?:javascript:|data:|blob:|mailto:|tel:|#)/i.test(trimmed)) return null;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch (e) {
    return null;
  }
}

function rewriteCssUrls(css, baseUrl, prefix) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, rawUrl) => {
    const abs = resolveAbs(rawUrl, baseUrl);
    if (!abs) return match;
    return `url(${quote}${buildGatewayUrl(abs, prefix)}${quote})`;
  });
}

function rewriteHtml(html, baseUrl, prefix) {
  let out = html;
  // Strip restrictive CSP meta tags
  out = out.replace(/<meta[^>]+http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, '');

  // Rewrite href, src, action attributes to route through Games V7 gateway
  out = out.replace(/(<(?:a|link|script|img|iframe|form|source|video|audio)\b[^>]*?\s)(href|src|action)\s*=\s*("([^"]*)"|'([^']*)')/gi, (full, before, attr, quoted, dq, sq) => {
    const val = dq !== undefined ? dq : sq;
    if (!val || val.startsWith(prefix)) return full;
    const abs = resolveAbs(val, baseUrl);
    if (!abs) return full;
    const q = dq !== undefined ? '"' : "'";
    return `${before}${attr}=${q}${buildGatewayUrl(abs, prefix)}${q}`;
  });

  // Inject lightweight client navigation & fetch/XHR helper
  const helperScript = `<script>(function(){var P=${JSON.stringify(prefix)};var B=${JSON.stringify(baseUrl)};function w(u){if(!u||typeof u!=='string')return u;if(u.indexOf(P)===0||/^(?:data:|blob:|javascript:|mailto:|#)/i.test(u))return u;try{var a=new URL(u,B).href;if(/^https?:/i.test(a))return P+encodeURIComponent(a);}catch(e){}return u;}var of=window.fetch;if(of){window.fetch=function(i,n){if(typeof i==='string')return of.call(this,w(i),n);return of.call(this,i,n);};}var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){var a=Array.prototype.slice.call(arguments);if(typeof u==='string')a[1]=w(u);return ox.apply(this,a);};document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var h=a.getAttribute('href');if(h&&h.indexOf(P)!==0&&!/^(?:javascript:|#|mailto:)/i.test(h)){a.href=w(h);}if(a.target==='_blank'){a.target='_self';}},true);try{if(window.parent&&window.parent!==window){window.parent.postMessage({type:'GV7_PROXY_LOADED',url:B,title:document.title||B},'*');}}catch(e){}})();</script>`;

  const baseTag = `<base href="${baseUrl.replace(/"/g, '&quot;')}">`;
  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}${helperScript}`);
  } else {
    out = `${baseTag}${helperScript}${out}`;
  }
  return out;
}

function decompress(buf, encoding) {
  const enc = String(encoding || '').toLowerCase();
  if (enc.includes('gzip')) return zlib.gunzipSync(buf);
  if (enc.includes('deflate')) return zlib.inflateSync(buf);
  if (enc.includes('br')) return zlib.brotliDecompressSync(buf);
  return buf;
}

function sendErrorPage(res, status, host, message) {
  if (res.headersSent) return;
  const safeHost = String(host || 'destination').replace(/[<>&"]/g, '');
  const safeMsg = String(message || 'Connection failed').replace(/[<>&"]/g, '');
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Proxy Error — Games V7</title></head><body style="margin:0;background:#06070a;color:#f8fafc;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;"><div style="max-width:480px;padding:28px;background:#0c0e15;border:1px solid rgba(255,42,75,0.45);border-radius:12px;text-align:center;"><h2 style="margin:0 0 8px;color:#ff2a4b;">Unable to Reach ${safeHost}</h2><p style="color:#94a3b8;font-size:14px;margin:0 0 14px;">Games V7 Proxy could not load this address.</p><div style="background:#121622;padding:10px 14px;border-radius:8px;font-family:monospace;font-size:12px;color:#fbbf24;word-break:break-word;margin-bottom:18px;">${safeMsg}</div><button onclick="history.back()" style="background:#ff2a4b;color:#fff;border:none;padding:9px 18px;border-radius:8px;font-weight:700;cursor:pointer;">Go Back</button></div></body></html>`);
}

function handleProxyRequest(req, res, prefix = '/browser/gateway?url=') {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
  let rawTarget = (urlObj.searchParams.get('url') || '').trim();
  if (!rawTarget) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing ?url= parameter' }));
    return;
  }
  if (!/^https?:\/\//i.test(rawTarget)) {
    rawTarget = 'https://' + rawTarget;
  }

  let parsed;
  try {
    parsed = new URL(rawTarget);
  } catch (e) {
    return sendErrorPage(res, 400, rawTarget, 'Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || isPrivateOrLoopbackHost(parsed.hostname)) {
    return sendErrorPage(res, 403, parsed.hostname, 'Access to local or private network addresses is blocked.');
  }

  const isHttps = parsed.protocol === 'https:';
  const client = isHttps ? https : http;
  const forwardHeaders = {
    'User-Agent': USER_AGENT,
    Accept: req.headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
    'Accept-Encoding': req.headers.range ? 'identity' : 'gzip, deflate, br',
    Host: parsed.host,
    Referer: parsed.origin + '/',
  };
  if (req.headers.range) forwardHeaders.Range = req.headers.range;
  if (req.headers['content-type']) forwardHeaders['Content-Type'] = req.headers['content-type'];

  const proxyReq = client.request(
    {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: req.method,
      headers: forwardHeaders,
      agent: isHttps ? httpsAgent : httpAgent,
      timeout: 20000,
    },
    (proxyRes) => {
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
        proxyRes.resume();
        try {
          const next = new URL(proxyRes.headers.location, parsed.href);
          if (isPrivateOrLoopbackHost(next.hostname)) {
            return sendErrorPage(res, 403, next.hostname, 'Redirect to private address blocked.');
          }
          res.writeHead(302, { Location: buildGatewayUrl(next.href, prefix), 'Access-Control-Allow-Origin': '*' });
          return res.end();
        } catch (e) {}
      }

      const drop = new Set([
        'x-frame-options',
        'content-security-policy',
        'content-security-policy-report-only',
        'cross-origin-opener-policy',
        'cross-origin-embedder-policy',
        'cross-origin-resource-policy',
        'strict-transport-security',
        'connection',
        'transfer-encoding',
        'keep-alive',
        'set-cookie',
      ]);
      const outHeaders = { 'Access-Control-Allow-Origin': '*' };
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (!drop.has(k.toLowerCase())) outHeaders[k] = v;
      }

      const ct = String(outHeaders['content-type'] || '').toLowerCase();
      const isHtml = ct.includes('text/html');
      const isCss = ct.includes('text/css');

      proxyRes.on('error', () => {
        if (!res.headersSent) sendErrorPage(res, 502, parsed.hostname, 'Upstream connection interrupted');
        else if (!res.writableEnded) res.end();
      });

      if ((isHtml || isCss) && req.method !== 'HEAD') {
        delete outHeaders['content-encoding'];
        delete outHeaders['content-length'];
        const chunks = [];
        let total = 0;
        let overflowed = false;
        proxyRes.on('data', (c) => {
          total += c.length;
          if (!overflowed && total > MAX_REWRITE_BYTES) {
            overflowed = true;
            res.writeHead(proxyRes.statusCode || 200, outHeaders);
            for (const prev of chunks) res.write(prev);
            chunks.length = 0;
          }
          if (overflowed) res.write(c);
          else chunks.push(c);
        });
        proxyRes.on('end', () => {
          if (overflowed) return res.end();
          try {
            const raw = decompress(Buffer.concat(chunks), proxyRes.headers['content-encoding']).toString('utf8');
            const rewritten = isHtml ? rewriteHtml(raw, parsed.href, prefix) : rewriteCssUrls(raw, parsed.href, prefix);
            const buf = Buffer.from(rewritten, 'utf8');
            const acceptEnc = String(req.headers['accept-encoding'] || '').toLowerCase();
            if (buf.length >= 1024 && acceptEnc.includes('gzip')) {
              const gz = zlib.gzipSync(buf, { level: 4 });
              outHeaders['content-encoding'] = 'gzip';
              outHeaders['content-length'] = gz.length;
              res.writeHead(proxyRes.statusCode || 200, outHeaders);
              return res.end(gz);
            }
            outHeaders['content-length'] = buf.length;
            res.writeHead(proxyRes.statusCode || 200, outHeaders);
            res.end(buf);
          } catch (err) {
            const rawBuf = Buffer.concat(chunks);
            outHeaders['content-length'] = rawBuf.length;
            res.writeHead(proxyRes.statusCode || 200, outHeaders);
            res.end(rawBuf);
          }
        });
      } else {
        res.writeHead(proxyRes.statusCode || 200, outHeaders);
        proxyRes.pipe(res);
      }
    }
  );

  proxyReq.on('timeout', () => {
    proxyReq.destroy(new Error('Upstream timed out after 20s'));
  });
  proxyReq.on('error', (err) => {
    sendErrorPage(res, 502, parsed.hostname, err.message);
  });
  res.on('close', () => {
    if (!res.writableEnded) proxyReq.destroy();
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
}

module.exports = {
  handleProxyRequest,
  isPrivateOrLoopbackHost,
};
