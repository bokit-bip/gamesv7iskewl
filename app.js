/**
 * GAMES V7 — CORE APPLICATION SCRIPT
 * Retro-Futuristic Skeletal Flowers Suite
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentTab: 'home',
    games: [],
    filteredGames: [],
    activeFilter: 'all',
    searchQuery: '',
    currentGame: null,
    cloakKey: 'drive',
    panicUrl: 'https://classroom.google.com',
    soundEnabled: true,
    crtEnabled: true
  };

  // Cloaking Presets (Title + Vector Favicons)
  const CLOAK_PRESETS = {
    drive: {
      title: 'My Drive - Google Drive',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.3 78'%3E%3Cpath fill='%230066da' d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z'/%3E%3Cpath fill='%2300ac47' d='M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z'/%3E%3Cpath fill='%23ea4335' d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z'/%3E%3Cpath fill='%2300832d' d='M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z'/%3E%3Cpath fill='%232684fc' d='M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z'/%3E%3Cpath fill='%23ffba00' d='m73.55 76.8-13.75-23.8H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h23.3c1.6 0 3.15-.4 4.5-1.2z'/%3E%3C/svg%3E"
    },
    classroom: {
      title: 'Classes - Google Classroom',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%231e8e3e' d='M22 6.5C22 5.12 20.88 4 19.5 4h-15C3.12 4 2 5.12 2 6.5v11C2 18.88 3.12 20 4.5 20h15c1.38 0 2.5-1.12 2.5-2.5v-11z'/%3E%3Cpath fill='%23f9ab00' d='M20.5 5.5h-17c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-11c0-.55-.45-1-1-1z'/%3E%3Ccircle cx='12' cy='10' r='2.2' fill='%23fff'/%3E%3Cpath fill='%23fff' d='M12 13.2c-2.4 0-4.5 1.2-4.5 2.5V17h9v-1.3c0-1.3-2.1-2.5-4.5-2.5z'/%3E%3Ccircle cx='7' cy='11' r='1.6' fill='%23fff' opacity='.8'/%3E%3Cpath fill='%23fff' opacity='.8' d='M7 13.5c-1.8 0-3.2.9-3.2 2V16h2.2v-.8c0-.6.4-1.2 1-1.7z'/%3E%3Ccircle cx='17' cy='11' r='1.6' fill='%23fff' opacity='.8'/%3E%3Cpath fill='%23fff' opacity='.8' d='M17 13.5c1.8 0 3.2.9 3.2 2V16H18v-.8c0-.6-.4-1.2-1-1.7z'/%3E%3C/svg%3E"
    },
    docs: {
      title: 'Untitled document - Google Docs',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z'/%3E%3Cpath fill='%23A1C2FA' d='M14 2v6h6'/%3E%3Cpath fill='%23FFF' d='M8 12h8v1.5H8zm0 3h8v1.5H8zm0 3h5v1.5H8z'/%3E%3C/svg%3E"
    },
    canvas: {
      title: 'Canvas LMS - Dashboard',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23E02424' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z'/%3E%3C/svg%3E"
    },
    desmos: {
      title: 'Desmos | Graphing Calculator',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%232F7B18' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E"
    },
    default: {
      title: 'Games V7 — Skeletal Flowers Retro Arcade',
      icon: 'assets/skull-logo.svg'
    }
  };

  // Web Audio Synth for Retro Clicks
  let audioCtx = null;
  function playRetroBeep(freq = 440, type = 'square', duration = 0.06) {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // ========================================================================
  // 1. TAB ROUTING
  // ========================================================================

  window.switchTab = function (tabName) {
    playRetroBeep(520, 'triangle', 0.05);
    state.currentTab = tabName;

    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(`${tabName}-view`);
    const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);

    if (targetView) targetView.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    try {
      history.replaceState(null, '', `#${tabName}`);
    } catch (e) {}

    // Initializations when entering tabs
    if (tabName === 'games' && state.games.length === 0) {
      loadGamesCatalog();
    } else if (tabName === 'editor' && !document.getElementById('code-textarea').value) {
      loadEditorTemplate('pong');
    }
  };

  function checkHashRouting() {
    const raw = window.location.hash.replace(/^#/, '');
    const hash = raw.toLowerCase();
    if (raw.startsWith('play-') || raw.startsWith('game-')) {
      const targetGid = raw.replace(/^(?:play|game)-/, '');
      switchTab('games');
      setTimeout(() => playGame(targetGid), 250);
      return;
    }
    if (['home', 'games', 'proxy', 'editor', 'settings'].includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('home');
    }
  }

  // ========================================================================
  // 2. CLOAKING & PANIC BUTTON
  // ========================================================================

  window.applyTabCloak = function (key) {
    state.cloakKey = key;
    const preset = CLOAK_PRESETS[key] || CLOAK_PRESETS.default;
    document.title = preset.title;

    let favicon = document.getElementById('site-favicon');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.id = 'site-favicon';
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = preset.icon;

    const select = document.getElementById('settings-cloak-select');
    if (select && select.value !== key) select.value = key;

    try {
      localStorage.setItem('games_v7_cloak', key);
    } catch (e) {}
  };

  window.triggerPanic = function () {
    playRetroBeep(880, 'sawtooth', 0.1);
    const target = state.panicUrl || 'https://classroom.google.com';
    window.location.replace(target);
  };

  window.openAboutBlankCloak = function () {
    playRetroBeep(600, 'sine', 0.08);
    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert('Popup blocked. Please allow popups to open stealth tab.');
      return;
    }
    const preset = CLOAK_PRESETS[state.cloakKey] || CLOAK_PRESETS.drive;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${preset.title}</title>
  <link rel="icon" type="image/svg+xml" href="${preset.icon}">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #050609; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe src="${window.location.href}" allow="fullscreen; autoplay; gamepad; encrypted-media"></iframe>
</body>
</html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  // ========================================================================
  // 3. GAMES ARCADE & IN-PAGE PLAYER
  // ========================================================================

  async function loadGamesCatalog() {
    try {
      let data = [];
      const paths = ['assets/games.json?v=7.3', 'games.json?v=7.3', '../games.json?v=7.3', '/api/games'];
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            data = await res.json();
            if (Array.isArray(data) && data.length > 0) break;
          }
        } catch (err) {}
      }
      state.games = Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Local games.json fetch failed:', e);
    }

    const countElem = document.getElementById('stat-games-count');
    if (countElem && state.games.length > 0) {
      countElem.textContent = `${state.games.length}+`;
    }

    filterAndRenderGames();

    const raw = window.location.hash.replace(/^#/, '');
    if (raw.startsWith('play-') || raw.startsWith('game-')) {
      const targetGid = raw.replace(/^(?:play|game)-/, '');
      playGame(targetGid);
    }
  }

  function filterAndRenderGames() {
    const query = state.searchQuery.toLowerCase().trim();
    const filter = state.activeFilter;

    state.filteredGames = state.games.filter(g => {
      // Filter category/system
      let matchesFilter = true;
      if (filter === 'nes') matchesFilter = (g.system === 'NES' || g.core === 'nes' || (g.id && g.id.startsWith('nes-')));
      else if (filter === 'snes') matchesFilter = (g.system === 'SNES' || g.core === 'snes' || (g.id && g.id.startsWith('snes-')));
      else if (filter === 'n64') matchesFilter = (g.system === 'N64' || g.core === 'n64' || (g.id && g.id.startsWith('n64-')));
      else if (filter === 'nds') matchesFilter = (g.system === 'Nintendo DS' || g.core === 'nds' || (g.id && g.id.startsWith('nds-')));
      else if (filter === 'ps1') matchesFilter = (g.system === 'PlayStation' || g.core === 'psx' || (g.id && g.id.startsWith('ps1-')));
      else if (filter === 'gb') matchesFilter = (g.system === 'Game Boy' || g.system === 'Game Boy Color' || g.core === 'gb' || (g.id && g.id.startsWith('gb-')));
      else if (filter === 'atari') matchesFilter = (g.system === 'Atari 2600' || g.core === 'atari2600' || (g.id && g.id.startsWith('atari-')));
      else if (filter === 'html5') matchesFilter = (!g.isEmulator && !g.isFlash);
      else if (filter === 'flash') matchesFilter = (g.isFlash || (g.category && g.category.includes('Flash')));

      if (!matchesFilter) return false;

      // Filter search text
      if (!query) return true;
      const title = (g.title || g.name || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      const sys = (g.system || g.type || '').toLowerCase();
      return title.includes(query) || desc.includes(query) || sys.includes(query);
    });

    renderGamesGrid();
  }

  function generateRetroCoverDataUri(title, badgeText) {
    const safeTitle = (title || 'Arcade Game').slice(0, 22).replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="188" viewBox="0 0 300 188">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0b0e17"/>
          <stop offset="50%" stop-color="#141926"/>
          <stop offset="100%" stop-color="#06070a"/>
        </linearGradient>
      </defs>
      <rect width="300" height="188" fill="url(#bg)"/>
      <circle cx="150" cy="75" r="38" fill="#ff2a4b" opacity="0.15"/>
      <text x="150" y="85" fill="#ff2a4b" font-family="monospace" font-size="32" font-weight="900" text-anchor="middle">☠</text>
      <text x="150" y="140" fill="#ffffff" font-family="'Orbitron', sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1">${safeTitle}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  window.handleCoverError = function(img, cleanCover, title, badgeText) {
    const step = parseInt(img.dataset.failStep || '0', 10);
    img.dataset.failStep = step + 1;

    if (step === 0) {
      // Step 1: Try relative root covers/
      img.src = `covers/${cleanCover.replace(/^covers\//, '')}`;
    } else if (step === 1) {
      // Step 2: Try jsDelivr CDN from gamesssv7
      img.src = `https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/${cleanCover}`;
    } else if (step === 2) {
      // Step 3: Try jsDelivr CDN from somuuuu (for HTML5/Flash covers)
      const fname = cleanCover.split('/').pop();
      img.src = `https://cdn.jsdelivr.net/gh/bokit-bip/somuuuu@main/covers/${fname}`;
    } else if (step === 3) {
      // Step 4: Try Tailscale public proxy
      img.src = `https://pop-leave.tailcb4af7.ts.net/${cleanCover}`;
    } else {
      // Step 5: High-tech retro SVG canvas tile (100% immune to network failure)
      img.onerror = null;
      img.src = generateRetroCoverDataUri(title, badgeText);
    }
  };

  function renderGamesGrid() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    if (state.filteredGames.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #94a3b8; font-family: var(--font-retro-title);">
          <div style="font-size: 32px; margin-bottom: 12px;">👾</div>
          <h3>NO GAMES FOUND</h3>
          <p style="font-size: 13px; margin-top: 6px;">Try adjusting your search query or switching filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.filteredGames.map(game => {
      const gid = game.id || game.folder || '';
      const title = escapeHtml(game.title || game.name || gid);
      const sub = escapeHtml(game.system || game.type || 'Retro Classic');
      
      // Determine Badge
      let badgeClass = 'badge-html5';
      let badgeText = 'HTML5';
      if (game.core === 'nes' || gid.startsWith('nes-')) { badgeClass = 'badge-nes'; badgeText = 'NES'; }
      else if (game.core === 'snes' || gid.startsWith('snes-')) { badgeClass = 'badge-snes'; badgeText = 'SNES'; }
      else if (game.core === 'n64' || gid.startsWith('n64-')) { badgeClass = 'badge-n64'; badgeText = 'N64'; }
      else if (game.core === 'nds' || gid.startsWith('nds-')) { badgeClass = 'badge-nds'; badgeText = 'NDS'; }
      else if (game.core === 'psx' || gid.startsWith('ps1-')) { badgeClass = 'badge-ps1'; badgeText = 'PS1'; }
      else if (game.isFlash) { badgeClass = 'badge-flash'; badgeText = 'FLASH'; }

      // Relative cover path
      let rawCover = game.cover || game.coverUrl || (game.core ? `covers/retro/${game.core}/${gid}.png` : `covers/${gid}.png`);
      let cleanCover = rawCover.replace(/^\/+/, '');
      let initialCover = `./${cleanCover}`;
      const safeEscapedTitle = title.replace(/'/g, "\\'");

      return `
        <div class="game-card" onclick="playGame('${gid}')">
          <div class="game-card-thumb-wrap">
            <span class="game-card-badge ${badgeClass}">${badgeText}</span>
            <img class="game-card-thumb" src="${initialCover}" alt="${title}" loading="lazy" onerror="handleCoverError(this, '${cleanCover}', '${safeEscapedTitle}', '${badgeText}')" />
          </div>
          <div class="game-card-content">
            <div>
              <div class="game-card-title">${title}</div>
              <div class="game-card-sub">${sub}</div>
            </div>
            <div class="game-card-btn-row">
              <button class="btn-play-card" onclick="event.stopPropagation(); playGame('${gid}')">PLAY ▶</button>
              <button class="btn-dl-card" onclick="event.stopPropagation(); downloadGameHtml('${gid}')" title="Download standalone single HTML file">💾 HTML</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.playGame = async function (gameId) {
    playRetroBeep(640, 'triangle', 0.08);

    // Direct link ad trigger on game play
    try {
      window.open('https://uplcm.com/4/11930399', '_blank', 'noopener,noreferrer');
    } catch (e) {}
    const game = state.games.find(g => (g.id || g.folder) === gameId);
    if (!game) return;

    state.currentGame = game;
    const modal = document.getElementById('game-player-modal');
    const iframe = document.getElementById('game-iframe');
    const titleEl = document.getElementById('player-modal-title');

    if (titleEl) titleEl.textContent = game.title || game.name || 'Retro Game';
    if (modal) modal.classList.remove('hidden');

    let base = document.baseURI || window.location.href;
    if (!base || base.startsWith('blob:') || base.startsWith('about:')) {
      try {
        const clean = (base || '').replace(/^blob:/, '');
        if (clean.startsWith('http')) {
          const u = new URL(clean);
          base = u.origin + u.pathname;
          if (!base.endsWith('/')) base = base.substring(0, base.lastIndexOf('/') + 1);
        } else {
          base = 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/';
        }
      } catch (e) {
        base = 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/';
      }
    }
    const isEmulator = game.isEmulator || (game.url && (game.url.includes('/emulator/') || game.url.includes('player.')));

    if (isEmulator) {
      // Execute Emulator via Blob URL to bypass CDN text/plain restrictions
      const queryIdx = (game.url || '').indexOf('?');
      const queryStr = queryIdx !== -1 ? game.url.slice(queryIdx + 1) : '';
      const playerCandidates = [
        new URL('emulator/player.html', base).href,
        new URL('../emulator/player.html', base).href,
        'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/emulator/player.html',
        'https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/emulator/player.html'
      ];

      let playerHtml = null;
      let targetPlayerUrl = playerCandidates[0];

      for (const p of playerCandidates) {
        try {
          const r = await fetch(p);
          if (r.ok) {
            playerHtml = await r.text();
            targetPlayerUrl = p;
            break;
          }
        } catch (e) {}
      }

      if (playerHtml) {
        const baseTag = '<base href="' + new URL('./', targetPlayerUrl).href + '">';
        const injectScript = '<script>window.__INJECTED_QUERY__ = ' + JSON.stringify(queryStr) + ';<' + '/script>';
        const fullHtml = playerHtml.includes('<head>')
          ? playerHtml.replace('<head>', '<head>' + baseTag + injectScript)
          : (baseTag + injectScript + playerHtml);
        const blob = new Blob([fullHtml], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
        iframe.srcdoc = fullHtml;
      } else {
        iframe.src = new URL('emulator/player.svg?' + queryStr, base).href;
      }
    } else {
      // Standalone HTML5 / Flash Game — Always load via Blob URL with Multi-Tier Fallback
      const folder = game.folder || game.id || gameId;
      const enc = encodeURIComponent(folder);
      const gid = game.id || gameId;

      let explicitUrl = game.url;
      if (explicitUrl && !explicitUrl.startsWith('http')) {
        try {
          explicitUrl = new URL(explicitUrl.replace(/^\//, ''), base).href;
        } catch (e) {
          explicitUrl = null;
        }
      }

      const candidates = [];
      if (explicitUrl) candidates.push(explicitUrl);
      try { candidates.push(new URL(`games/${enc}/index.html`, base).href); } catch (e) {}
      try { candidates.push(new URL(`../games/${enc}/index.html`, base).href); } catch (e) {}
      candidates.push(
        `https://raw.githubusercontent.com/bokit-bip/gamesv7iskewl/main/games/${enc}/index.html`,
        `https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/games/${enc}/index.html`,
        `https://raw.githubusercontent.com/bokit-bip/gamesssv7/main/games/${enc}/index.html`,
        `https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/games/${enc}/index.html`,
        `https://raw.githubusercontent.com/bokit-bip/gamesssv7/main/${encodeURIComponent(gid)}.html`,
        `http://localhost:8080/games/${enc}/index.html`,
        `http://localhost:3000/games/${enc}/index.html`,
        `https://pop-leave.tailcb4af7.ts.net/games/${enc}/index.html`
      );

      let loaded = false;
      for (const candUrl of candidates) {
        try {
          let currentUrl = candUrl;
          let r = await fetch(currentUrl);
          if (r.ok) {
            let html = await r.text();
            // Validate response isn't a CDN package limit error or 404 message
            if (html.includes('Package size exceeded') || html.includes('Cannot find "') || html.trim().startsWith('404')) {
              continue;
            }

            // Follow client-side redirect chains (meta refresh or location.replace)
            for (let hop = 0; hop < 5; hop++) {
              const metaMatch = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?[^"'>]*url=([^"'>\s]+)/i);
              const jsMatch = html.match(/(?:window\.)?location(?:\.replace|\.href\s*=)?\s*\(\s*["']([^"']+)["']\s*\)/i) ||
                              html.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i);
              const targetRel = (metaMatch && metaMatch[1]) || (jsMatch && jsMatch[1]);
              if (!targetRel || targetRel.startsWith('blob:') || targetRel.startsWith('javascript:')) break;

              try {
                const nextUrl = new URL(targetRel, currentUrl).href;
                console.log(`Unwrapping game redirect hop #${hop + 1} to ${nextUrl}`);
                const nextRes = await fetch(nextUrl);
                if (nextRes.ok) {
                  const nextHtml = await nextRes.text();
                  if (!nextHtml.includes('Package size exceeded') && !nextHtml.trim().startsWith('404')) {
                    html = nextHtml;
                    currentUrl = nextUrl;
                    continue;
                  }
                }
              } catch (e) {}
              break;
            }

            // Neutralize any residual meta refresh or location redirect code
            html = html.replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
            html = html.replace(/(?:window\.)?location\.replace\s*\([^)]*\);?/gi, '// redirected');
            html = html.replace(/(?:window\.)?location(?:\.href)?\s*=\s*["'][^"']+["'];?/gi, '// redirected');

            const targetBase = new URL('./', currentUrl).href;
            const baseTag = '<base href="' + targetBase + '">';
            const shimScript = '<script>(function(){var tb=' + JSON.stringify(targetBase) + ';class PatchedURL extends URL{constructor(u,b){var bStr="";if(b){bStr=(typeof b==="object"&&b.href)?b.href:String(b);}if(!bStr||bStr.indexOf("blob:")===0||bStr.indexOf("about:")===0){bStr=tb;}super(u,bStr);}}window.URL=PatchedURL;})();<' + '/script>';
            const fullHtml = html.includes('<head>')
              ? html.replace('<head>', '<head>' + baseTag + shimScript)
              : (baseTag + shimScript + html);
            const blob = new Blob([fullHtml], { type: 'text/html' });
            iframe.src = URL.createObjectURL(blob);
            iframe.srcdoc = fullHtml;
            loaded = true;
            break;
          }
        } catch (err) {}
      }

      if (!loaded) {
        console.warn('All game fetch candidates failed for', gid, '— generating fallback Blob player');
        const fallbackTarget = candidates[0] || ('games/' + enc + '/index.html');
        let resolvedBase = 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/';
        try { resolvedBase = new URL('./', fallbackTarget).href; } catch (e) {}
        const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base href="${resolvedBase}">
  <style>
    body { margin:0; padding:20px; background:#07090e; color:#f1f5f9; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; box-sizing:border-box; text-align:center; }
    .card { background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:24px; max-width:440px; box-shadow:0 12px 30px rgba(0,0,0,0.6); }
    h3 { color:#38bdf8; margin:0 0 10px; font-size:18px; }
    p { color:#94a3b8; font-size:13px; line-height:1.5; margin:0 0 16px; }
    .btn { display:inline-block; padding:8px 16px; background:#38bdf8; color:#0b0e14; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-family:inherit; text-decoration:none; margin:4px; font-size:13px; }
    .btn-outline { background:transparent; border:1px solid #38bdf8; color:#38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <h3>${escapeHtml(game.title || gid)}</h3>
    <p>Could not load files from any mirror. If you are offline, check your connection or launch from localhost.</p>
    <button class="btn" onclick="location.reload()">Retry</button>
    <a class="btn btn-outline" href="http://localhost:8080/games/${enc}/index.html" target="_blank">Try Localhost</a>
  </div>
</body>
</html>`;
        const blob = new Blob([fallbackHtml], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
        iframe.srcdoc = fallbackHtml;
      }
    }
  };

  window.closeGamePlayer = function () {
    playRetroBeep(440, 'square', 0.05);
    const modal = document.getElementById('game-player-modal');
    const iframe = document.getElementById('game-iframe');
    if (modal) modal.classList.add('hidden');
    if (iframe) {
      iframe.src = 'about:blank';
      iframe.removeAttribute('srcdoc');
    }
    state.currentGame = null;
  };

  window.reloadCurrentGame = function () {
    if (state.currentGame) {
      playGame(state.currentGame.id || state.currentGame.folder);
    }
  };

  window.togglePlayerFullscreen = function () {
    const modal = document.getElementById('game-player-modal');
    if (!document.fullscreenElement) {
      if (modal.requestFullscreen) modal.requestFullscreen();
      else if (modal.webkitRequestFullscreen) modal.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  window.popoutCurrentGame = function () {
    if (!state.currentGame) return;
    const iframe = document.getElementById('game-iframe');
    if (iframe && iframe.src && iframe.src.startsWith('blob:')) {
      window.open(iframe.src, '_blank');
      return;
    }
    const game = state.currentGame;
    const base = document.baseURI || window.location.href;
    const folder = game.folder || game.id;
    let popoutUrl = game.url || ('games/' + encodeURIComponent(folder) + '/index.html');

    if (game.isEmulator || (popoutUrl && popoutUrl.includes('/emulator/'))) {
      const queryIdx = (popoutUrl || '').indexOf('?');
      const queryStr = queryIdx !== -1 ? popoutUrl.slice(queryIdx) : '';
      popoutUrl = new URL('emulator/player.svg' + queryStr, base).href;
    }
    window.open(popoutUrl, '_blank');
  };

  window.downloadCurrentGameHtml = function () {
    if (state.currentGame) {
      downloadGameHtml(state.currentGame.id || state.currentGame.folder);
    }
  };

  window.openDirectLink = function () {
    window.open('https://uplcm.com/4/11930399', '_blank', 'noopener,noreferrer');
  };

  window.showToastNotification = function (msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'retro-toast';
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  };

  function buildStandaloneGameHtmlDocument(params) {
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
    const GAME_FOLDER = \${JSON.stringify(folder)};
    const IS_EMULATOR = \${JSON.stringify(isEmulator)};
    const QUERY_STR = \${JSON.stringify(queryStr)};
    const INLINE_SRC = \${JSON.stringify(safeInlineSrc)};

    const CLOAK_PRESETS = {
      drive: { title: "My Drive - Google Drive", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.3 78'%3E%3Cpath fill='%230066da' d='m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z'/%3E%3Cpath fill='%2300ac47' d='M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z'/%3E%3Cpath fill='%23ea4335' d='m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z'/%3E%3Cpath fill='%2300832d' d='M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z'/%3E%3Cpath fill='%232684fc' d='M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5L72.35 24.7c-.8-1.4-1.95-2.5-3.3-3.3L55.3 45.2z'/%3E%3Cpath fill='%23ffba00' d='m73.55 76.8-13.75-23.8H27.5l13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h23.3c1.6 0 3.15-.4 4.5-1.2z'/%3E%3C/svg%3E" },
      classroom: { title: "Classes", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%231e8e3e' d='M22 6.5C22 5.12 20.88 4 19.5 4h-15C3.12 4 2 5.12 2 6.5v11C2 18.88 3.12 20 4.5 20h15c1.38 0 2.5-1.12 2.5-2.5v-11z'/%3E%3Cpath fill='%23f9ab00' d='M20.5 5.5h-17c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h17c.55 0 1-.45 1-1v-11c0-.55-.45-1-1-1z'/%3E%3Ccircle cx='12' cy='10' r='2.2' fill='%23fff'/%3E%3Cpath fill='%23fff' d='M12 13.2c-2.4 0-4.5 1.2-4.5 2.5V17h9v-1.3c0-1.3-2.1-2.5-4.5-2.5z'/%3E%3Ccircle cx='7' cy='11' r='1.6' fill='%23fff' opacity='.8'/%3E%3Cpath fill='%23fff' opacity='.8' d='M7 13.5c-1.8 0-3.2.9-3.2 2V16h2.2v-.8c0-.6.4-1.2 1-1.7z'/%3E%3Ccircle cx='17' cy='11' r='1.6' fill='%23fff' opacity='.8'/%3E%3Cpath fill='%23fff' opacity='.8' d='M17 13.5c1.8 0 3.2.9 3.2 2V16H18v-.8c0-.6-.4-1.2-1-1.7z'/%3E%3C/svg%3E" },
      docs: { title: "Untitled document - Google Docs", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z'/%3E%3Cpath fill='%23A1C2FA' d='M14 2v6h6'/%3E%3Cpath fill='%23FFF' d='M8 12h8v1.5H8zm0 3h8v1.5H8zm0 3h5v1.5H8z'/%3E%3C/svg%3E" },
      canvas: { title: "Dashboard", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23E02424' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z'/%3E%3C/svg%3E" },
      desmos: { title: "Desmos | Graphing Calculator", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%232F7B18' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E" },
      default: { title: \${JSON.stringify(safeTitle)}, icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff2a4b'%3E%3Cpath d='M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E" }
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
      <div style="font-family:monospace;letter-spacing:1px;">LOADING \${safeTitle.toUpperCase()}...</div>
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

      // If inline HTML source is embedded inside this single file
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
        'https://raw.githubusercontent.com/bokit-bip/gamesv7iskewl/main/games/' + enc + '/index.html',
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

  window.downloadGameHtml = async function (gameId) {
    try { playRetroBeep(720, 'sine', 0.08); } catch (e) {}

    const game = (state.games && state.games.find(g => (g.id || g.folder) === gameId)) || state.currentGame;
    if (!game) {
      alert('Game not found.');
      return;
    }

    const gid = game.id || game.folder || gameId;
    const folder = game.folder || game.id || gid;
    const title = game.title || game.name || gid;
    const cleanFileName = gid.replace(/[^a-zA-Z0-9_-]/g, '_') + '.html';

    showToastNotification(`💾 Downloading "${title}" as standalone HTML...`);

    const isHttp = window.location.protocol.startsWith('http');
    const isGitHub = window.location.hostname.endsWith('github.io');

    // Strategy 1: Live server attachment download (Tunnl.gg / Localhost / Node Server)
    // Directly triggers the browser's native download manager via Content-Disposition: attachment
    if (isHttp && !isGitHub) {
      let apiBase = window.location.pathname.replace(/\/index\.html.*$/, '').replace(/\/$/, '');
      const downloadEndpoint = `${apiBase}/api/download-game?id=${encodeURIComponent(gid)}`;

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadEndpoint;
      a.setAttribute('download', cleanFileName);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 2000);
      showToastNotification(`💾 Download started: "${cleanFileName}"! Check Downloads.`);
      return;
    }

    // Strategy 2: Pre-compiled static HTML file or Blob download (GitHub Pages / Offline)
    let fullHtml = '';
    const staticCandidates = [
      `html-games/${cleanFileName}`,
      cleanFileName
    ];
    for (const u of staticCandidates) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          const txt = await res.text();
          if (txt.includes('<!DOCTYPE html>') || txt.includes('<html')) {
            fullHtml = txt;
            break;
          }
        }
      } catch (e) {}
    }

    // Fallback: build standalone game in-memory synchronously
    if (!fullHtml) {
      const isEmulator = Boolean(
        game.isEmulator ||
        (game.url && (game.url.includes('/emulator/') || game.url.includes('player.'))) ||
        ['nes', 'snes', 'n64', 'nds', 'psx', 'gba', 'gb', 'atari'].includes(game.core)
      );
      const core = game.core || '';
      const gameUrl = game.url || '';
      const queryIdx = gameUrl.indexOf('?');
      const queryStr = queryIdx !== -1 ? gameUrl.slice(queryIdx + 1) : (core ? `core=${core}&rom=${encodeURIComponent(game.rom || '')}` : '');
      fullHtml = buildStandaloneGameHtmlDocument({
        id: gid,
        folder: folder,
        title: title,
        isEmulator: isEmulator,
        queryStr: queryStr,
        inlineHtml: ''
      });
    }

    // Deliver file to browser
    try {
      const blob = new Blob([fullHtml], { type: 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = cleanFileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 5000);
      showToastNotification(`💾 Downloaded "${cleanFileName}"!`);
    } catch (err) {
      console.error('Blob download error, trying direct static link:', err);
      const link = document.createElement('a');
      link.href = `html-games/${cleanFileName}?download=1`;
      link.setAttribute('download', cleanFileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 1000);
    }
  };

  window.clearGamesSearch = function () {
    const input = document.getElementById('games-search-input');
    const btn = document.getElementById('btn-clear-search');
    if (input) input.value = '';
    if (btn) btn.style.display = 'none';
    state.searchQuery = '';
    filterAndRenderGames();

    const raw = window.location.hash.replace(/^#/, '');
    if (raw.startsWith('play-') || raw.startsWith('game-')) {
      const targetGid = raw.replace(/^(?:play|game)-/, '');
      playGame(targetGid);
    }
  };

  // Setup Filter Chips
  function setupFilterChips() {
    const container = document.getElementById('system-filter-chips');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.getAttribute('data-filter') || 'all';
      filterAndRenderGames();
    });

    const searchInput = document.getElementById('games-search-input');
    const clearBtn = document.getElementById('btn-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (clearBtn) clearBtn.style.display = state.searchQuery ? 'block' : 'none';
        filterAndRenderGames();
      });
    }
  }

  // ========================================================================
  // 4. STEALTH PROXY BROWSER, WISP DIAGNOSTICS & FULLSCREEN
  // ========================================================================

  function getProxyServerOrigin() {
    try {
      const origin = window.location.origin;
      if (origin && origin !== 'null' && !origin.includes('jsdelivr.net') && !origin.includes('github.io')) {
        return origin;
      }
    } catch (e) {}
    return 'https://pop-leave.tailcb4af7.ts.net';
  }

  // Wisp Multi-Server Registry
  const DEFAULT_WISP_SERVERS = [
    { id: 'local', name: 'Tailscale / Bokit Relay', url: 'wss://pop-leave.tailcb4af7.ts.net/wisp/', pingUrl: '/wisp/ping', tag: 'OFFICIAL' },
    { id: 'mercury', name: 'Mercury Workshop', url: 'wss://wisp.mercurywork.shop/', tag: 'COMMUNITY' },
    { id: 'ruby', name: 'Ruby Network', url: 'wss://ruby.rubynetwork.co/wisp/', tag: 'MIRROR' },
    { id: 'tomp', name: 'Tomp Edge Network', url: 'wss://tomp.app/wisp/', tag: 'MIRROR' },
    { id: 'coastal', name: 'Coastal Cloud', url: 'wss://wisp.coastal.fun/wisp/', tag: 'FAST' }
  ];

  let wispServersList = (function() {
    try {
      const stored = localStorage.getItem('gamesv7_custom_wisp_servers');
      if (stored) {
        const custom = JSON.parse(stored);
        return [...DEFAULT_WISP_SERVERS, ...custom];
      }
    } catch (e) {}
    return [...DEFAULT_WISP_SERVERS];
  })();

  let activeWispServerUrl = (function() {
    try {
      return localStorage.getItem('gamesv7_active_wisp_url') || DEFAULT_WISP_SERVERS[0].url;
    } catch (e) {
      return DEFAULT_WISP_SERVERS[0].url;
    }
  })();

  window.launchProxyUrl = function (overrideUrl) {
    playRetroBeep(680, 'sine', 0.06);
    const input = document.getElementById('proxy-url-input');
    const container = document.getElementById('proxy-viewport-container');
    const frame = document.getElementById('proxy-frame');
    const activeUrlLabel = document.getElementById('proxy-vp-active-url');
    let target = (overrideUrl || (input ? input.value : '')).trim();

    if (!target) return;

    // Handle TikTok Explore direct route
    if (/^https?:\/\/(?:www\.)?tiktok\.com(?:\/|\/\?.*)?$/i.test(target) || target === 'tiktok.com' || target === 'www.tiktok.com') {
      target = 'https://www.tiktok.com/explore';
    }

    // Auto-embed Spotify tracks/playlists for native playback
    if (target.includes('open.spotify.com') && !target.includes('/embed')) {
      target = target.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = 'https://www.google.com/search?q=' + encodeURIComponent(target);
      }
    }

    if (input) input.value = target;
    if (activeUrlLabel) activeUrlLabel.textContent = target;

    if (container) {
      container.classList.add('visible');
      container.style.display = 'flex';
    }
    if (frame) {
      frame.style.display = 'block';
      const serverOrigin = getProxyServerOrigin();
      frame.src = `${serverOrigin}/browser/gateway?url=${encodeURIComponent(target)}`;
    }
  };

  window.openPresetProxy = function (url) {
    launchProxyUrl(url);
  };

  window.launchDaydream = function () {
    const container = document.getElementById('proxy-viewport-container');
    const frame = document.getElementById('proxy-frame');
    const activeUrlLabel = document.getElementById('proxy-vp-active-url');
    if (activeUrlLabel) activeUrlLabel.textContent = 'DayDream X Stealth Sandbox';
    if (container) {
      container.classList.add('visible');
      container.style.display = 'flex';
    }
    if (frame) {
      frame.style.display = 'block';
      const serverOrigin = getProxyServerOrigin();
      frame.src = `${serverOrigin}/apps/`;
    }
  };

  // Proxy Viewport Header Actions
  window.toggleProxyFullscreen = function () {
    playRetroBeep(520, 'sine', 0.05);
    const container = document.getElementById('proxy-viewport-container');
    if (!container) return;

    const isFull = document.fullscreenElement === container || container.classList.contains('fullscreen');

    if (isFull) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      container.classList.remove('fullscreen');
    } else {
      container.classList.add('fullscreen');
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      }
    }
  };

  window.proxyFrameReload = function () {
    playRetroBeep(440, 'triangle', 0.05);
    const frame = document.getElementById('proxy-frame');
    if (frame && frame.src) {
      const src = frame.src;
      frame.src = 'about:blank';
      setTimeout(() => { frame.src = src; }, 50);
    }
  };

  window.proxyFramePopout = function () {
    playRetroBeep(600, 'sine', 0.05);
    const frame = document.getElementById('proxy-frame');
    if (frame && frame.src && frame.src !== 'about:blank') {
      window.open(frame.src, '_blank');
    } else {
      const input = document.getElementById('proxy-url-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        const serverOrigin = getProxyServerOrigin();
        window.open(`${serverOrigin}/browser/gateway?url=${encodeURIComponent(val)}`, '_blank');
      }
    }
  };

  window.closeProxyFrame = function () {
    playRetroBeep(330, 'square', 0.05);
    const container = document.getElementById('proxy-viewport-container');
    const frame = document.getElementById('proxy-frame');
    if (container) {
      container.classList.remove('visible', 'fullscreen');
      container.style.display = 'none';
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (frame) {
      frame.src = 'about:blank';
      frame.style.display = 'none';
    }
  };

  // Wisp Diagnostics & Ping Engine
  window.openWispPingModal = function () {
    playRetroBeep(550, 'sine', 0.05);
    const modal = document.getElementById('wisp-modal');
    if (modal) {
      modal.classList.remove('hidden');
      renderWispServers();
      pingAllWispServers();
    }
  };

  window.closeWispPingModal = function () {
    playRetroBeep(380, 'sine', 0.04);
    const modal = document.getElementById('wisp-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.renderWispServers = function () {
    const listEl = document.getElementById('wisp-servers-container');
    const activeLabel = document.getElementById('wisp-active-server-name');
    if (!listEl) return;

    const activeObj = wispServersList.find(s => s.url === activeWispServerUrl) || wispServersList[0];
    if (activeLabel) activeLabel.textContent = activeObj ? activeObj.name : 'Custom Server';

    listEl.innerHTML = wispServersList.map((server) => {
      const isActive = server.url === activeWispServerUrl;
      const tagHtml = server.tag ? `<span class="wisp-server-tag ${server.tag === 'FAST' ? 'fastest' : ''}">${server.tag}</span>` : '';
      return `
        <div class="wisp-server-card ${isActive ? 'active-server' : ''}" id="wisp-card-${server.id}">
          <div class="wisp-server-meta">
            <div class="wisp-server-name-row">
              <span class="wisp-server-name">${escapeHtml(server.name)}</span>
              ${tagHtml}
            </div>
            <span class="wisp-server-url" title="${escapeHtml(server.url)}">${escapeHtml(server.url)}</span>
          </div>
          <div class="wisp-server-actions">
            <span class="wisp-latency-pill testing" id="latency-${server.id}">-- ms</span>
            <button type="button" class="btn-wisp-select ${isActive ? 'selected' : ''}" onclick="selectWispServer('${server.url}', '${escapeHtml(server.name)}')">
              ${isActive ? '✓ ACTIVE' : 'USE'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.pingSingleWisp = function (server) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let finished = false;

      const finish = (ok, val) => {
        if (finished) return;
        finished = true;
        const duration = Math.round(performance.now() - startTime);
        resolve({ ok, latency: ok ? duration : null, message: val });
      };

      const timer = setTimeout(() => {
        finish(false, 'Timeout');
      }, 3500);

      // Prefer fast HTTP ping endpoint if same origin / local
      if (server.pingUrl && (window.location.origin.includes('localhost') || window.location.origin.includes('pop-leave'))) {
        fetch(server.pingUrl, { method: 'GET', cache: 'no-store' })
          .then(res => {
            clearTimeout(timer);
            if (res.ok) finish(true, 'OK');
            else finish(false, `HTTP ${res.status}`);
          })
          .catch(() => {
            testViaWebSocket();
          });
        return;
      }

      function testViaWebSocket() {
        try {
          const ws = new WebSocket(server.url);
          ws.onopen = () => {
            clearTimeout(timer);
            try { ws.close(); } catch (e) {}
            finish(true, 'Connected');
          };
          ws.onerror = () => {
            clearTimeout(timer);
            finish(false, 'Failed');
          };
        } catch (err) {
          clearTimeout(timer);
          finish(false, err.message);
        }
      }

      testViaWebSocket();
    });
  };

  window.pingAllWispServers = async function () {
    const pill = document.getElementById('wisp-ping-val');
    const dot = document.querySelector('#wisp-status-pill .wisp-indicator-dot');
    if (dot) dot.className = 'wisp-indicator-dot testing';
    if (pill) pill.textContent = '...';

    wispServersList.forEach((s) => {
      const latEl = document.getElementById(`latency-${s.id}`);
      if (latEl) {
        latEl.className = 'wisp-latency-pill testing';
        latEl.textContent = 'testing...';
      }
    });

    let bestLatency = Infinity;
    let bestServer = null;

    const promises = wispServersList.map(async (server) => {
      const res = await pingSingleWisp(server);
      const latEl = document.getElementById(`latency-${server.id}`);
      if (latEl) {
        if (res.ok) {
          latEl.textContent = `${res.latency} ms`;
          if (res.latency < 120) latEl.className = 'wisp-latency-pill good';
          else if (res.latency < 280) latEl.className = 'wisp-latency-pill medium';
          else latEl.className = 'wisp-latency-pill bad';

          if (res.latency < bestLatency) {
            bestLatency = res.latency;
            bestServer = server;
          }
        } else {
          latEl.textContent = 'OFFLINE';
          latEl.className = 'wisp-latency-pill bad';
        }
      }
      return { server, ...res };
    });

    const results = await Promise.all(promises);

    // Update omnibar status
    if (pill) {
      if (bestLatency < Infinity) {
        pill.textContent = `${bestLatency}ms`;
        if (dot) dot.className = 'wisp-indicator-dot online';
      } else {
        pill.textContent = 'ERR';
        if (dot) dot.className = 'wisp-indicator-dot offline';
      }
    }

    // Mark fastest server
    if (bestServer) {
      results.forEach(r => {
        const card = document.getElementById(`wisp-card-${r.server.id}`);
        if (card) {
          const tag = card.querySelector('.wisp-server-tag');
          if (r.server.id === bestServer.id && !tag) {
            const nameRow = card.querySelector('.wisp-server-name-row');
            if (nameRow) {
              const fTag = document.createElement('span');
              fTag.className = 'wisp-server-tag fastest';
              fTag.textContent = '⚡ FASTEST';
              nameRow.appendChild(fTag);
            }
          }
        }
      });
    }
  };

  window.selectWispServer = function (url, name) {
    playRetroBeep(700, 'sine', 0.06);
    activeWispServerUrl = url;
    try {
      localStorage.setItem('gamesv7_active_wisp_url', url);
    } catch (e) {}
    renderWispServers();
  };

  window.addCustomWispServer = function () {
    const input = document.getElementById('custom-wisp-url');
    if (!input) return;
    const val = input.value.trim();
    if (!val || (!val.startsWith('wss://') && !val.startsWith('ws://'))) {
      alert('Please enter a valid WebSocket URL starting with wss:// or ws://');
      return;
    }

    const id = 'custom-' + Date.now().toString(36);
    const newServer = {
      id,
      name: 'Custom Wisp Edge',
      url: val,
      tag: 'USER'
    };

    wispServersList.push(newServer);
    try {
      const stored = localStorage.getItem('gamesv7_custom_wisp_servers');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newServer);
      localStorage.setItem('gamesv7_custom_wisp_servers', JSON.stringify(list));
    } catch (e) {}

    input.value = '';
    renderWispServers();
    pingAllWispServers();
  };

  // ========================================================================
  // 5. IN-BROWSER CODE EDITOR & RUNNER
  // ========================================================================

  const CODE_TEMPLATES = {
    pong: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #050608; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; color: #ff2a4b; }
    canvas { border: 2px solid #ff2a4b; box-shadow: 0 0 20px rgba(255,42,75,0.4); background: #000; }
    #score { font-size: 20px; margin-bottom: 10px; letter-spacing: 3px; }
    p { font-size: 12px; color: #94a3b8; margin-top: 8px; }
  </style>
</head>
<body>
  <div id="score">00 : 00</div>
  <canvas id="c" width="600" height="400"></canvas>
  <p>USE W/S OR ARROW KEYS TO MOVE PADDLE</p>
  <script>
    console.log("🎮 Retro Pong Arcade Loaded!");
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    let p1 = 160, p2 = 160, bX = 300, bY = 200, dX = 4, dY = 3, s1 = 0, s2 = 0;
    const keys = {};
    window.onkeydown = e => keys[e.key.toLowerCase()] = true;
    window.onkeyup = e => keys[e.key.toLowerCase()] = false;

    function loop() {
      if (keys['w'] || keys['arrowup']) p1 = Math.max(0, p1 - 5);
      if (keys['s'] || keys['arrowdown']) p1 = Math.min(320, p1 + 5);
      
      // Simple AI
      if (bY > p2 + 40) p2 = Math.min(320, p2 + 3.5);
      else if (bY < p2 + 40) p2 = Math.max(0, p2 - 3.5);

      bX += dX; bY += dY;
      if (bY <= 5 || bY >= 395) dY = -dY;

      // Paddle collision
      if (bX <= 25 && bY >= p1 && bY <= p1 + 80) { dX = Math.abs(dX) + 0.2; console.log("Player hit ball!"); }
      if (bX >= 575 && bY >= p2 && bY <= p2 + 80) { dX = -(Math.abs(dX) + 0.2); }

      // Score
      if (bX < 0) { s2++; reset(); console.log("Score update: CPU won round"); }
      if (bX > 600) { s1++; reset(); console.log("Score update: Player won round!"); }

      ctx.fillStyle = '#050608'; ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#4f46e5'; ctx.fillRect(15, p1, 10, 80);
      ctx.fillStyle = '#ff2a4b'; ctx.fillRect(575, p2, 10, 80);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bX, bY, 6, 0, 6.28); ctx.fill();
      
      document.getElementById('score').innerText = (s1 < 10 ? '0' + s1 : s1) + ' : ' + (s2 < 10 ? '0' + s2 : s2);
      requestAnimationFrame(loop);
    }
    function reset() { bX = 300; bY = 200; dX = -dX; }
    loop();
  <\/script>
</body>
</html>`,
    matrix: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    console.log("💻 Initializing Matrix Digital Rain...");
    const c = document.getElementById('c'), ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const chars = '0123456789ABCDEF!@#$%&*';
    const cols = Math.floor(c.width / 18);
    const drops = Array(cols).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#ff2a4b';
      ctx.font = '14px monospace';
      drops.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 18, y * 18);
        if (y * 18 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }
    setInterval(draw, 35);
  <\/script>
</body>
</html>`,
    glitch: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #07090e; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: monospace; }
    .glitch { font-size: 54px; font-weight: 900; color: #fff; position: relative; letter-spacing: 6px; text-shadow: 2px 2px #ff2a4b, -2px -2px #4f46e5; animation: shake 0.4s infinite; }
    @keyframes shake {
      0% { transform: translate(0) }
      20% { transform: translate(-2px, 2px) }
      40% { transform: translate(-2px, -2px) }
      60% { transform: translate(2px, 2px) }
      80% { transform: translate(2px, -2px) }
      100% { transform: translate(0) }
    }
  </style>
</head>
<body>
  <div class="glitch">GAMES V7</div>
  <script>
    console.log("✨ Cyberpunk glitch visual loaded!");
  <\/script>
</body>
</html>`,
    synth: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #050609; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; color: #fff; }
    .btn { background: rgba(255,42,75,0.2); border: 2px solid #ff2a4b; color: #fff; padding: 14px 28px; margin: 6px; font-family: inherit; font-size: 16px; font-weight: bold; cursor: pointer; border-radius: 4px; }
    .btn:hover { background: #ff2a4b; box-shadow: 0 0 16px rgba(255,42,75,0.6); }
  </style>
</head>
<body>
  <h2>8-BIT WEB AUDIO SYNTHESIZER</h2>
  <div>
    <button class="btn" onclick="beep(261.63)">C4</button>
    <button class="btn" onclick="beep(293.66)">D4</button>
    <button class="btn" onclick="beep(329.63)">E4</button>
    <button class="btn" onclick="beep(349.23)">F4</button>
    <button class="btn" onclick="beep(392.00)">G4</button>
    <button class="btn" onclick="beep(440.00)">A4</button>
    <button class="btn" onclick="beep(493.88)">B4</button>
  </div>
  <script>
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function beep(f) {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
      console.log("Synth note triggered:", f.toFixed(2), "Hz");
    }
  <\/script>
</body>
</html>`,
    blank: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New App</title>
  <style>
    body { margin: 0; background: #050609; color: #fff; font-family: monospace; padding: 24px; }
  </style>
</head>
<body>
  <h1>Hello from Games V7!</h1>
  <p>Start writing your code in the left pane.</p>
  <script>
    console.log("Ready to create!");
  <\/script>
</body>
</html>`
  };

  window.loadEditorTemplate = function (key) {
    const code = CODE_TEMPLATES[key] || CODE_TEMPLATES.blank;
    const textarea = document.getElementById('code-textarea');
    if (textarea) {
      textarea.value = code;
      updateCharCount();
      runEditorCode();
    }
  };

  window.runEditorCode = function () {
    playRetroBeep(700, 'sine', 0.05);
    const textarea = document.getElementById('code-textarea');
    const frame = document.getElementById('editor-preview-frame');
    if (!textarea || !frame) return;

    let source = textarea.value;

    // Inject console.log interceptor
    const consoleBridge = `
<script>
  (function(){
    const origLog = console.log;
    console.log = function(...args) {
      origLog.apply(console, args);
      try {
        window.parent.postMessage({ type: 'editor_console', text: args.join(' ') }, '*');
      } catch(e) {}
    };
  })();
<\\/script>`;

    source = source.includes('<head>')
      ? source.replace('<head>', '<head>' + consoleBridge)
      : (consoleBridge + source);

    const blob = new Blob([source], { type: 'text/html' });
    frame.src = URL.createObjectURL(blob);
  };

  window.resetEditorCode = function () {
    const sel = document.getElementById('editor-template-select');
    loadEditorTemplate(sel ? sel.value : 'pong');
  };

  window.downloadEditorHtml = function () {
    playRetroBeep(520, 'square', 0.06);
    const textarea = document.getElementById('code-textarea');
    if (!textarea) return;

    const blob = new Blob([textarea.value], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'games-v7-project.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  window.popoutEditorPreview = function () {
    const textarea = document.getElementById('code-textarea');
    if (!textarea) return;
    const win = window.open('about:blank', '_blank');
    if (win) {
      win.document.open();
      win.document.write(textarea.value);
      win.document.close();
    }
  };

  window.clearConsole = function () {
    const out = document.getElementById('console-output');
    if (out) out.innerHTML = '<span style="color:#64748b;">// Console cleared.</span>';
  };

  function updateCharCount() {
    const textarea = document.getElementById('code-textarea');
    const counter = document.getElementById('editor-char-count');
    if (textarea && counter) {
      counter.textContent = `${textarea.value.length} chars`;
    }
  }

  // Receive console output from preview frame
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'editor_console') {
      const out = document.getElementById('console-output');
      if (out) {
        const time = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.innerHTML = `<span style="color:#64748b;">[${time}]</span> <span style="color:#38bdf8;">${escapeHtml(e.data.text)}</span>`;
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
      }
    }
  });

  // ========================================================================
  // 6. SETTINGS & TOGGLES
  // ========================================================================

  window.toggleCrtEffect = function (enabled) {
    state.crtEnabled = enabled;
    const crt = document.getElementById('crt-overlay');
    if (crt) {
      if (enabled) crt.classList.remove('disabled');
      else crt.classList.add('disabled');
    }
  };

  window.toggleAudioBeeps = function (enabled) {
    state.soundEnabled = enabled;
  };

  // Keyboard Shortcuts (Panic ~, R for Reload, F for Fullscreen, Esc for Exit, etc.)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      triggerPanic();
    } else if (state.currentGame && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      reloadCurrentGame();
    } else if (state.currentGame && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      togglePlayerFullscreen();
    } else if (e.key === 'f' || e.key === 'F') {
      const vp = document.getElementById('proxy-viewport-container');
      if (vp && (vp.classList.contains('visible') || vp.style.display === 'flex' || state.activeTab === 'proxy')) {
        e.preventDefault();
        toggleProxyFullscreen();
      }
    } else if (e.key === 'Escape') {
      const wModal = document.getElementById('wisp-modal');
      if (wModal && !wModal.classList.contains('hidden')) {
        closeWispPingModal();
      } else {
        const vp = document.getElementById('proxy-viewport-container');
        if (vp && vp.classList.contains('fullscreen')) {
          toggleProxyFullscreen();
        }
      }
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ========================================================================
  // 7. INITIALIZATION
  // ========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    // Restore Saved Cloak
    try {
      const savedCloak = localStorage.getItem('games_v7_cloak') || 'drive';
      applyTabCloak(savedCloak);
    } catch (e) {}

    setupFilterChips();
    loadGamesCatalog();
    checkHashRouting();

    const textarea = document.getElementById('code-textarea');
    if (textarea) {
      textarea.addEventListener('input', updateCharCount);
      textarea.addEventListener('keydown', (e) => {
        // Tab indent support
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
          updateCharCount();
        }
      });
    }

    const panicInput = document.getElementById('panic-url-input');
    if (panicInput) {
      panicInput.addEventListener('change', (e) => {
        state.panicUrl = e.target.value.trim() || 'https://classroom.google.com';
      });
    }

    // Auto-ping active Wisp server for omnibar latency badge
    setTimeout(() => {
      pingSingleWisp({ url: activeWispServerUrl, pingUrl: '/wisp/ping' }).then((res) => {
        const pill = document.getElementById('wisp-ping-val');
        const dot = document.querySelector('#wisp-status-pill .wisp-indicator-dot');
        if (pill) {
          if (res.ok) {
            pill.textContent = `${res.latency}ms`;
            if (dot) dot.className = 'wisp-indicator-dot online';
          } else {
            pill.textContent = 'ERR';
            if (dot) dot.className = 'wisp-indicator-dot offline';
          }
        }
      });
    }, 400);
  });

  window.addEventListener('hashchange', checkHashRouting);

})();
