/**
 * GAMES V7 — CORE APPLICATION SCRIPT
 * Retro-Futuristic Skeletal Flowers Suite
 */

(function () {
  'use strict';

  // State Management
  function loadFavorites() {
    try {
      const s = localStorage.getItem('gamesv7_favorites');
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
  }

  function loadRecentlyPlayed() {
    try {
      const s = localStorage.getItem('gamesv7_recently_played');
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
  }

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
    crtEnabled: true,
    favorites: loadFavorites(),
    recentlyPlayed: loadRecentlyPlayed()
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
    } else if (tabName === 'movies') {
      if (typeof loadMoviesList === 'function') {
        loadMoviesList();
      }
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
    if (raw.startsWith('movies') || ['home', 'games', 'proxy', 'editor', 'settings', 'movies'].includes(hash)) {
      if (raw.startsWith('movies')) {
        switchTab('movies');
        if (typeof handleMovieHashRoute === 'function') {
          handleMovieHashRoute();
        }
      } else {
        switchTab(hash);
      }
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

  function saveFavorites() {
    try {
      localStorage.setItem('gamesv7_favorites', JSON.stringify(state.favorites));
    } catch (e) {}
    updateFilterCounts();
  }

  function saveRecentlyPlayed() {
    try {
      localStorage.setItem('gamesv7_recently_played', JSON.stringify(state.recentlyPlayed));
    } catch (e) {}
    updateFilterCounts();
  }

  window.recordRecentlyPlayed = function (gameId) {
    if (!gameId) return;
    const gid = String(gameId);
    state.recentlyPlayed = [gid, ...state.recentlyPlayed.filter(id => id !== gid)].slice(0, 50);
    saveRecentlyPlayed();
    if (state.activeFilter === 'recent') {
      filterAndRenderGames();
    }
  };

  window.toggleFavorite = function (gameId) {
    if (!gameId) return;
    const gid = String(gameId);
    const idx = state.favorites.indexOf(gid);
    const isNowFav = (idx === -1);
    if (isNowFav) {
      state.favorites.push(gid);
      try { playRetroBeep(880, 'sine', 0.1); } catch (e) {}
      showToastNotification(`⭐ Added to Favorites!`);
    } else {
      state.favorites.splice(idx, 1);
      try { playRetroBeep(440, 'triangle', 0.08); } catch (e) {}
      showToastNotification(`Removed from Favorites.`);
    }
    saveFavorites();
    updateModalFavButton();

    if (state.activeFilter === 'favorites') {
      filterAndRenderGames();
    } else {
      const cardBtns = document.querySelectorAll(`.game-card-fav-btn[data-gid="${gid}"]`);
      cardBtns.forEach(btn => {
        btn.classList.toggle('active', isNowFav);
        btn.title = isNowFav ? 'Remove from favorites' : 'Add to favorites';
        const icon = btn.querySelector('.fav-icon');
        if (icon) icon.textContent = isNowFav ? '★' : '☆';
      });
    }
  };

  window.toggleCurrentGameFavorite = function () {
    if (state.currentGame) {
      toggleFavorite(state.currentGame.id || state.currentGame.folder);
    }
  };

  function updateModalFavButton() {
    const btn = document.getElementById('modal-fav-btn');
    if (!btn || !state.currentGame) return;
    const gid = state.currentGame.id || state.currentGame.folder;
    const isFav = state.favorites.includes(gid);
    btn.classList.toggle('active', isFav);
    btn.innerHTML = isFav ? '★ FAVORITED' : '☆ FAVORITE';
  }

  function updateFilterCounts() {
    const favCountEl = document.getElementById('fav-count');
    if (favCountEl) favCountEl.textContent = state.favorites.length;
    const recentCountEl = document.getElementById('recent-count');
    if (recentCountEl) recentCountEl.textContent = state.recentlyPlayed.length;
  }

  window.switchFilter = function (filterName) {
    const container = document.getElementById('system-filter-chips');
    if (container) {
      container.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-filter') === filterName);
      });
    }
    state.activeFilter = filterName || 'all';
    filterAndRenderGames();
  };

  function filterAndRenderGames() {
    const query = state.searchQuery.toLowerCase().trim();
    const filter = state.activeFilter;

    let baseList = [];
    if (filter === 'recent') {
      baseList = state.recentlyPlayed
        .map(id => state.games.find(g => (g.id || g.folder) === id))
        .filter(Boolean);
    } else if (filter === 'favorites') {
      baseList = state.games.filter(g => state.favorites.includes(g.id || g.folder));
    } else {
      baseList = state.games.filter(g => {
        if (filter === 'all' || !filter) return true;
        if (filter === 'nes') return (g.system === 'NES' || g.core === 'nes' || (g.id && g.id.startsWith('nes-')));
        if (filter === 'snes') return (g.system === 'SNES' || g.core === 'snes' || (g.id && g.id.startsWith('snes-')));
        if (filter === 'n64') return (g.system === 'N64' || g.core === 'n64' || (g.id && g.id.startsWith('n64-')));
        if (filter === 'nds') return (g.system === 'Nintendo DS' || g.core === 'nds' || (g.id && g.id.startsWith('nds-')));
        if (filter === 'ps1') return (g.system === 'PlayStation' || g.core === 'psx' || (g.id && g.id.startsWith('ps1-')));
        if (filter === 'gb') return (g.system === 'Game Boy' || g.system === 'Game Boy Color' || g.core === 'gb' || (g.id && g.id.startsWith('gb-')));
        if (filter === 'atari') return (g.system === 'Atari 2600' || g.core === 'atari2600' || (g.id && g.id.startsWith('atari-')));
        if (filter === 'html5') return (!g.isEmulator && !g.isFlash);
        if (filter === 'flash') return (g.isFlash || (g.category && g.category.includes('Flash')));
        return true;
      });
    }

    state.filteredGames = baseList.filter(g => {
      if (!query) return true;
      const title = (g.title || g.name || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      const sys = (g.system || g.type || '').toLowerCase();
      return title.includes(query) || desc.includes(query) || sys.includes(query);
    });

    renderGamesGrid();
    updateFilterCounts();
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
      if (state.activeFilter === 'favorites') {
        grid.innerHTML = `
          <div class="empty-filter-state">
            <div class="empty-filter-icon">⭐</div>
            <h3>NO FAVORITES YET</h3>
            <p>Click the <strong>★</strong> on any game card or inside the player header to save your top games here!</p>
            <button class="btn-empty-reset" onclick="switchFilter('all')">EXPLORE ALL GAMES</button>
          </div>
        `;
        return;
      }
      if (state.activeFilter === 'recent') {
        grid.innerHTML = `
          <div class="empty-filter-state">
            <div class="empty-filter-icon">🕒</div>
            <h3>NO RECENTLY PLAYED GAMES</h3>
            <p>Launch any arcade classic or web game and it will automatically be tracked here for quick access!</p>
            <button class="btn-empty-reset" onclick="switchFilter('all')">EXPLORE ALL GAMES</button>
          </div>
        `;
        return;
      }
      grid.innerHTML = `
        <div class="empty-filter-state">
          <div class="empty-filter-icon">👾</div>
          <h3>NO GAMES FOUND</h3>
          <p>Try adjusting your search query or switching filters.</p>
          <button class="btn-empty-reset" onclick="switchFilter('all')">VIEW ALL GAMES</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = state.filteredGames.map(game => {
      const gid = game.id || game.folder || '';
      const title = escapeHtml(game.title || game.name || gid);
      const sub = escapeHtml(game.system || game.type || 'Retro Classic');
      const isFav = state.favorites.includes(gid);
      
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
            <button class="game-card-fav-btn ${isFav ? 'active' : ''}" data-gid="${gid}" onclick="event.stopPropagation(); toggleFavorite('${gid}')" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
              <span class="fav-icon">${isFav ? '★' : '☆'}</span>
            </button>
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

    const game = state.games.find(g => (g.id || g.folder) === gameId);
    if (!game) return;

    state.currentGame = game;
    recordRecentlyPlayed(game.id || game.folder || gameId);
    updateModalFavButton();
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
    let inlineBase64 = '';
    if (inlineHtml) {
      try { inlineBase64 = btoa(unescape(encodeURIComponent(inlineHtml))); }
      catch(e) { try { inlineBase64 = btoa(inlineHtml); } catch(e2) {} }
    }

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
    const INLINE_B64 = \${JSON.stringify(inlineBase64)};

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

    function makeShim(tb) {
      return '<script>' +
        '(function(){' +
        'var tb=' + JSON.stringify(tb) + ';' +
        'if(!tb.endsWith("/"))tb+="/";' +
        'var OrigImage=window.Image;' +
        'window.Image=function(w,h){var img=new OrigImage(w,h);img.crossOrigin="anonymous";return img;};' +
        'var origCE=document.createElement.bind(document);' +
        'document.createElement=function(t,o){var el=origCE(t,o);if(t&&t.toLowerCase()==="img"){try{el.crossOrigin="anonymous";}catch(e){}}return el;};' +
        'var OrigAudio=window.Audio;' +
        'if(OrigAudio){window.Audio=function(s){var a=new OrigAudio();try{a.crossOrigin="anonymous";}catch(e){}if(s){if(typeof s==="string"&&!/^(https?:|data:|blob:)/i.test(s)){s=new URL(s,tb).href;}a.src=s;}return a;};}' +
        'class PatchedURL extends URL{constructor(u,b){var bStr="";if(b){bStr=(typeof b==="object"&&b.href)?b.href:String(b);}if(!bStr||bStr.indexOf("blob:")===0||bStr.indexOf("about:")===0||bStr.indexOf("file:")===0){bStr=tb;}try{super(u,bStr);}catch(e){super(u,tb);}}}' +
        'window.URL=PatchedURL;' +
        'var origFetch=window.fetch;' +
        'if(origFetch){window.fetch=function(inp,init){if(typeof inp==="string"){if(!/^(https?:|data:|blob:)/i.test(inp)){inp=new URL(inp,tb).href;}}else if(inp&&typeof inp==="object"&&inp.url){if(!/^(https?:|data:|blob:)/i.test(inp.url)){inp=new Request(new URL(inp.url,tb).href,inp);}}return origFetch.call(this,inp,init);};}' +
        'var origXhrOpen=XMLHttpRequest.prototype.open;' +
        'XMLHttpRequest.prototype.open=function(m,u){var args=Array.prototype.slice.call(arguments);if(typeof u==="string"&&!/^(https?:|data:|blob:)/i.test(u)){args[1]=new URL(u,tb).href;}return origXhrOpen.apply(this,args);};' +
        'var pageLoaded=(document.readyState==="complete");' +
        'window.addEventListener("load",function(){pageLoaded=true;},{capture:true});' +
        'var origWinAEL=window.addEventListener.bind(window);' +
        'window.addEventListener=function(t,l,o){if(t==="load"&&(pageLoaded||document.readyState==="complete")){setTimeout(function(){try{if(typeof l==="function")l.call(window,new Event("load"));else if(l&&typeof l.handleEvent==="function")l.handleEvent(new Event("load"));}catch(e){}},15);}return origWinAEL(t,l,o);};' +
        'var origOnload=null;' +
        'Object.defineProperty(window,"onload",{get:function(){return origOnload;},set:function(fn){origOnload=fn;if(pageLoaded||document.readyState==="complete"){setTimeout(function(){try{if(typeof fn==="function")fn.call(window,new Event("load"));}catch(e){}},15);}},configurable:true});' +
        'var domReady=(document.readyState==="interactive"||document.readyState==="complete");' +
        'document.addEventListener("DOMContentLoaded",function(){domReady=true;},{capture:true});' +
        'var origDocAEL=document.addEventListener.bind(document);' +
        'document.addEventListener=function(t,l,o){if(t==="DOMContentLoaded"&&(domReady||document.readyState!=="loading")){setTimeout(function(){try{if(typeof l==="function")l.call(document,new Event("DOMContentLoaded"));else if(l&&typeof l.handleEvent==="function")l.handleEvent(new Event("DOMContentLoaded"));}catch(e){}},15);}return origDocAEL(t,l,o);};' +
        '})();<' + '/script>';
    }

    async function resolveAndLoadGame() {
      const enc = encodeURIComponent(GAME_FOLDER);
      const isFile = window.location.protocol === 'file:' || (document.baseURI && document.baseURI.startsWith('file:'));

      if (IS_EMULATOR) {
        const playerCandidates = [];
        if (!isFile) {
          const base = document.baseURI || window.location.href;
          playerCandidates.push(new URL('emulator/player.html', base).href);
          playerCandidates.push(new URL('../emulator/player.html', base).href);
        }
        playerCandidates.push('http://localhost:8080/emulator/player.html');
        playerCandidates.push('http://127.0.0.1:8080/emulator/player.html');
        playerCandidates.push('https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/emulator/player.html');
        playerCandidates.push('https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/emulator/player.html');
        playerCandidates.push(TAILSCALE_ORIGIN + '/emulator/player.html');

        for (const p of playerCandidates) {
          try {
            const c = new AbortController();
            const t = setTimeout(() => c.abort(), 1200);
            const r = await fetch(p, { signal: c.signal });
            clearTimeout(t);
            if (r.ok) {
              const html = await r.text();
              effectiveGameUrl = p;
              const targetBase = new URL('./', p).href;
              const baseTag = '<base href="' + targetBase + '">';
              const shim = makeShim(targetBase);
              const injectScript = '<script>window.__INJECTED_QUERY__ = ' + JSON.stringify(QUERY_STR) + ';<' + '/script>';
              const full = html.includes('<head>')
                ? html.replace('<head>', '<head>' + baseTag + shim + injectScript)
                : (baseTag + shim + injectScript + html);
              frame.src = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
              return;
            }
          } catch(e) {}
        }
        frame.src = 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/emulator/player.svg?' + QUERY_STR;
        return;
      }

      let inlineHtml = '';
      if (INLINE_B64) {
        try { inlineHtml = decodeURIComponent(escape(atob(INLINE_B64))); }
        catch(e) { try { inlineHtml = atob(INLINE_B64); } catch(e2) {} }
      }

      // Check if inlineHtml already has a hardcoded http/https <base href="...">
      let preExistingBase = '';
      if (inlineHtml) {
        const baseTagIdx = inlineHtml.toLowerCase().indexOf('<base');
        if (baseTagIdx !== -1) {
          const snippet = inlineHtml.slice(baseTagIdx, baseTagIdx + 400);
          const hrefIdx = snippet.toLowerCase().indexOf('href=');
          if (hrefIdx !== -1) {
            const q = snippet[hrefIdx + 5];
            if (q === '"' || q === "'") {
              const endQ = snippet.indexOf(q, hrefIdx + 6);
              if (endQ !== -1) {
                const val = snippet.slice(hrefIdx + 6, endQ);
                if (val.startsWith('http://') || val.startsWith('https://')) {
                  preExistingBase = val;
                }
              }
            }
          }
        }
      }

      let activeBase = '';
      let fetchedHtml = '';

      if (preExistingBase) {
        activeBase = preExistingBase;
      } else {
        const baseCandidates = [];
        if (!isFile) {
          const base = document.baseURI || window.location.href;
          baseCandidates.push(new URL('games/' + enc + '/', base).href);
          baseCandidates.push(new URL('../games/' + enc + '/', base).href);
        }
        baseCandidates.push('http://localhost:8080/games/' + enc + '/');
        baseCandidates.push('http://127.0.0.1:8080/games/' + enc + '/');
        baseCandidates.push('https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/games/' + enc + '/');
        baseCandidates.push('https://cdn.jsdelivr.net/gh/bokit-bip/gamesssv7@main/games/' + enc + '/');
        baseCandidates.push(TAILSCALE_ORIGIN + '/games/' + enc + '/');

        for (const b of baseCandidates) {
          try {
            const probe = b.endsWith('/') ? b + 'index.html' : b + '/index.html';
            const c = new AbortController();
            const t = setTimeout(() => c.abort(), 1200);
            const res = await fetch(probe, { signal: c.signal });
            clearTimeout(t);
            if (res.ok) {
              const txt = await res.text();
              if (txt.includes('Package size exceeded') || txt.includes('Cannot find "') || txt.trim().startsWith('404')) continue;
              activeBase = b;
              fetchedHtml = txt;
              break;
            }
          } catch(e) {}
        }
        if (!activeBase) {
          activeBase = 'https://cdn.jsdelivr.net/gh/bokit-bip/gamesv7iskewl@main/games/' + enc + '/';
        }
      }

      let rawHtml = (inlineHtml && inlineHtml.length > 50) ? inlineHtml : fetchedHtml;

      if (!rawHtml) {
        try {
          const probe = activeBase.endsWith('/') ? activeBase + 'index.html' : activeBase + '/index.html';
          const c = new AbortController();
          const t = setTimeout(() => c.abort(), 2500);
          const res = await fetch(probe, { signal: c.signal });
          clearTimeout(t);
          if (res.ok) rawHtml = await res.text();
        } catch(e) {}
      }

      if (rawHtml) {
        effectiveGameUrl = activeBase;
        const shim = makeShim(activeBase);
        let full = rawHtml;
        if (!preExistingBase) {
          const baseTag = '<base href="' + activeBase + '">';
          full = full.includes('<head>')
            ? full.replace('<head>', '<head>' + baseTag + shim)
            : (baseTag + shim + full);
        } else {
          full = full.includes('<head>')
            ? full.replace('<head>', '<head>' + shim)
            : (shim + full);
        }
        frame.src = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
        return;
      }

      effectiveGameUrl = activeBase.endsWith('/') ? activeBase + 'index.html' : activeBase + '/index.html';
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

    updateFilterCounts();
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
    if (typeof setupMoviesListeners === 'function') {
      setupMoviesListeners();
    }
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

  // ============================================================================
  // MOVIES THEATER & STREAMING SYSTEM (AllFlix-style Engine)
  // ============================================================================
// Safe Storage polyfill for Blob / SVG / opaque / sandbox iframe origins
  const safeStorage = (function() {
    function getStorages() {
      const storages = [];
      const candidates = [];
      try { if (typeof window !== "undefined" && window.localStorage) candidates.push(window.localStorage); } catch (e) {}
      try { if (typeof window !== "undefined" && window.parent && window.parent.localStorage) candidates.push(window.parent.localStorage); } catch (e) {}
      try { if (typeof window !== "undefined" && window.parent && window.parent.__bokit_parent_storage__) candidates.push(window.parent.__bokit_parent_storage__); } catch (e) {}
      try { if (typeof window !== "undefined" && window.top && window.top.localStorage) candidates.push(window.top.localStorage); } catch (e) {}
      try { if (typeof window !== "undefined" && window.top && window.top.__bokit_parent_storage__) candidates.push(window.top.__bokit_parent_storage__); } catch (e) {}
      for (let i = 0; i < candidates.length; i++) {
        const s = candidates[i];
        if (s && !storages.includes(s)) {
          try {
            const testK = "__bokit_storage_test__";
            s.setItem(testK, "1");
            s.removeItem(testK);
            storages.push(s);
          } catch (e) {}
        }
      }
      return storages;
    }

    function getNameStore() {
      try {
        const topWin = (typeof window !== "undefined" && (window.top || window.parent || window));
        if (topWin && typeof topWin.name === "string" && topWin.name.startsWith("{") && topWin.name.endsWith("}")) {
          const parsed = JSON.parse(topWin.name);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch (e) {}
      return {};
    }

    function saveNameStore(obj) {
      try {
        const topWin = (typeof window !== "undefined" && (window.top || window.parent || window));
        if (topWin) {
          topWin.name = JSON.stringify(obj);
        }
      } catch (e) {}
    }

    const mem = getNameStore();

    return {
      getItem: function(k) {
        // 1. Try available localStorage backends
        const storages = getStorages();
        for (let i = 0; i < storages.length; i++) {
          try {
            const val = storages[i].getItem(k);
            if (val !== null && val !== undefined) return val;
          } catch (e) {}
        }
        // 2. Try window.top.name / in-memory store
        const nameData = getNameStore();
        if (Object.prototype.hasOwnProperty.call(nameData, k)) {
          return nameData[k];
        }
        return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
      },
      setItem: function(k, v) {
        const valStr = String(v);
        mem[k] = valStr;
        const nameData = getNameStore();
        nameData[k] = valStr;
        saveNameStore(nameData);

        const storages = getStorages();
        for (let i = 0; i < storages.length; i++) {
          try {
            storages[i].setItem(k, valStr);
          } catch (e) {}
        }
      },
      removeItem: function(k) {
        delete mem[k];
        const nameData = getNameStore();
        delete nameData[k];
        saveNameStore(nameData);

        const storages = getStorages();
        for (let i = 0; i < storages.length; i++) {
          try {
            storages[i].removeItem(k);
          } catch (e) {}
        }
      },
      clear: function() {
        for (const k in mem) delete mem[k];
        saveNameStore({});
        const storages = getStorages();
        for (let i = 0; i < storages.length; i++) {
          try {
            storages[i].clear();
          } catch (e) {}
        }
      }
    };
  })();
  const el = {
    get btnBackToRows() { return document.getElementById('btn-back-to-rows'); },
    get btnClearContinueWatching() { return document.getElementById('btn-clear-continue-watching'); },
    get btnClearMoviesSearch() { return document.getElementById('btn-clear-movies-search'); },
    get btnCloseMovieModal() { return document.getElementById('btn-close-movie-modal'); },
    get btnCloseMovieStatusModal() { return document.getElementById('btn-close-movie-status-modal'); },
    get btnCloseTrailerModal() { return document.getElementById('btn-close-trailer-modal'); },
    get btnCtrlForward10() { return document.getElementById('btn-ctrl-forward10'); },
    get btnCtrlFullscreen() { return document.getElementById('btn-ctrl-fullscreen'); },
    get btnCtrlPip() { return document.getElementById('btn-ctrl-pip'); },
    get btnCtrlPlay() { return document.getElementById('btn-ctrl-play'); },
    get btnCtrlRewind10() { return document.getElementById('btn-ctrl-rewind10'); },
    get btnCtrlVolume() { return document.getElementById('btn-ctrl-volume'); },
    get btnHeroDetails() { return document.getElementById('btn-hero-details'); },
    get btnHeroNext() { return document.getElementById('btn-hero-next'); },
    get btnHeroPrev() { return document.getElementById('btn-hero-prev'); },
    get btnHeroTrailer() { return document.getElementById('btn-hero-trailer'); },
    get btnHeroWatch() { return document.getElementById('btn-hero-watch'); },
    get btnHeroWatchlist() { return document.getElementById('btn-hero-watchlist'); },
    get btnModalDownload() { return document.getElementById('btn-modal-download'); },
    get btnModalTrailer() { return document.getElementById('btn-modal-trailer'); },
    get btnModalWatchNow() { return document.getElementById('btn-modal-watch-now'); },
    get btnModalWatchlist() { return document.getElementById('btn-modal-watchlist'); },
    get btnMovieBack() { return document.getElementById('btn-movie-back'); },
    get btnMovieErrorDownload() { return document.getElementById('btn-movie-error-download'); },
    get btnMovieErrorSwitch() { return document.getElementById('btn-movie-error-switch'); },
    get btnMovieErrorTrailer() { return document.getElementById('btn-movie-error-trailer'); },
    get btnMovieFullscreen() { return document.getElementById('btn-movie-fullscreen'); },
    get btnMoviePip() { return document.getElementById('btn-movie-pip'); },
    get btnMoviePlayerDiagnostics() { return document.getElementById('btn-movie-player-diagnostics'); },
    get btnMovieProvidersDebug() { return document.getElementById('btn-movie-providers-debug'); },
    get btnMoviesLoadMore() { return document.getElementById('btn-movies-load-more'); },
    get btnMoviesSearchSubmit() { return document.getElementById('btn-movies-search-submit'); },
    get btnPlayerCenterPlay() { return document.getElementById('btn-player-center-play'); },
    get btnPlayerDownload() { return document.getElementById('btn-player-download'); },
    get btnPlayerNextEp() { return document.getElementById('btn-player-next-ep'); },
    get btnPlayerPrevEp() { return document.getElementById('btn-player-prev-ep'); },
    get btnRefreshMovies() { return document.getElementById('btn-refresh-movies'); },
    get btnRescanEmpty() { return document.getElementById('btn-rescan-empty'); },
    get btnRetestProviders() { return document.getElementById('btn-retest-providers'); },
    get btnRunDiag() { return document.getElementById('btn-run-diag'); },
    get ctrlCurrentTime() { return document.getElementById('ctrl-current-time'); },
    get ctrlDurationTime() { return document.getElementById('ctrl-duration-time'); },
    get ctrlQualityBadge() { return document.getElementById('ctrl-quality-badge'); },
    get ctrlVolumeSlider() { return document.getElementById('ctrl-volume-slider'); },
    get diagInputId() { return document.getElementById('diag-input-id'); },
    get diagSelectProvider() { return document.getElementById('diag-select-provider'); },
    get heroWatchlistText() { return document.getElementById('hero-watchlist-text'); },
    get metricAvgLatency() { return document.getElementById('metric-avg-latency'); },
    get metricHealthyCount() { return document.getElementById('metric-healthy-count'); },
    get metricLocalBytes() { return document.getElementById('metric-local-bytes'); },
    get metricLocalCount() { return document.getElementById('metric-local-count'); },
    get metricTotalCount() { return document.getElementById('metric-total-count'); },
    get modalDownloadLabel() { return document.getElementById('modal-download-label'); },
    get modalDownloadNotice() { return document.getElementById('modal-download-notice'); },
    get modalWatchLabel() { return document.getElementById('modal-watch-label'); },
    get modalWatchlistText() { return document.getElementById('modal-watchlist-text'); },
    get movieCustomControls() { return document.getElementById('movie-custom-controls'); },
    get movieDetailsModal() { return document.getElementById('movie-details-modal'); },
    get movieErrorDesc() { return document.getElementById('movie-error-desc'); },
    get movieErrorTitle() { return document.getElementById('movie-error-title'); },
    get movieModalActors() { return document.getElementById('movie-modal-actors'); },
    get movieModalBackdropImg() { return document.getElementById('movie-modal-backdrop-img'); },
    get movieModalDirector() { return document.getElementById('movie-modal-director'); },
    get movieModalEpisodesList() { return document.getElementById('movie-modal-episodes-list'); },
    get movieModalGenres() { return document.getElementById('movie-modal-genres'); },
    get movieModalPlot() { return document.getElementById('movie-modal-plot'); },
    get movieModalPosterImg() { return document.getElementById('movie-modal-poster-img'); },
    get movieModalRated() { return document.getElementById('movie-modal-rated'); },
    get movieModalRatingBadge() { return document.getElementById('movie-modal-rating-badge'); },
    get movieModalRuntime() { return document.getElementById('movie-modal-runtime'); },
    get movieModalSeasonSelect() { return document.getElementById('movie-modal-season-select'); },
    get movieModalServersList() { return document.getElementById('movie-modal-servers-list'); },
    get movieModalSimilarList() { return document.getElementById('movie-modal-similar-list'); },
    get movieModalSimilarSection() { return document.getElementById('movie-modal-similar-section'); },
    get movieModalTitle() { return document.getElementById('movie-modal-title'); },
    get movieModalTvSection() { return document.getElementById('movie-modal-tv-section'); },
    get movieModalYear() { return document.getElementById('movie-modal-year'); },
    get moviePlayerBadge() { return document.getElementById('movie-player-badge'); },
    get moviePlayerEpSelect() { return document.getElementById('movie-player-ep-select'); },
    get moviePlayerErrorOverlay() { return document.getElementById('movie-player-error-overlay'); },
    get moviePlayerQualitySelect() { return document.getElementById('movie-player-quality-select'); },
    get moviePlayerResumeToast() { return document.getElementById('movie-player-resume-toast'); },
    get moviePlayerServerDot() { return document.getElementById('movie-player-server-dot'); },
    get moviePlayerServerSelect() { return document.getElementById('movie-player-server-select'); },
    get moviePlayerSize() { return document.getElementById('movie-player-size'); },
    get moviePlayerSourcesList() { return document.getElementById('movie-player-sources-list'); },
    get moviePlayerSpeedSelect() { return document.getElementById('movie-player-speed-select'); },
    get moviePlayerStage() { return document.getElementById('movie-player-stage'); },
    get moviePlayerSubtitleSelect() { return document.getElementById('movie-player-subtitle-select'); },
    get moviePlayerTitle() { return document.getElementById('movie-player-title'); },
    get moviePlayerTvControls() { return document.getElementById('movie-player-tv-controls'); },
    get moviePlayerView() { return document.getElementById('movie-player-view'); },
    get moviePlayerYear() { return document.getElementById('movie-player-year'); },
    get movieResumeToastText() { return document.getElementById('movie-resume-toast-text'); },
    get movieStatusModal() { return document.getElementById('movie-status-modal'); },
    get movieTrailerFrame() { return document.getElementById('movie-trailer-frame'); },
    get movieTrailerModal() { return document.getElementById('movie-trailer-modal'); },
    get movieTrailerTitle() { return document.getElementById('movie-trailer-title'); },
    get movieVideoElement() { return document.getElementById('bokit-movie-player') || document.getElementById('movie-video-element'); },
    get moviesCatalogCount() { return document.getElementById('movies-catalog-count'); },
    get moviesCatalogEndHint() { return document.getElementById('movies-catalog-end-hint'); },
    get moviesCatalogTitle() { return document.getElementById('movies-catalog-title'); },
    get moviesContinueWatchingCount() { return document.getElementById('movies-continue-watching-count'); },
    get moviesContinueWatchingGrid() { return document.getElementById('movies-continue-watching-grid'); },
    get moviesContinueWatchingSection() { return document.getElementById('movies-continue-watching-section'); },
    get moviesEmptyState() { return document.getElementById('movies-empty-state'); },
    get moviesGenrePills() { return document.getElementById('movies-genre-pills'); },
    get moviesGrid() { return document.getElementById('movies-grid'); },
    get moviesGridSection() { return document.getElementById('movies-grid-section'); },
    get moviesHeroBackdrop() { return document.getElementById('movies-hero-backdrop'); },
    get moviesHeroBanner() { return document.getElementById('movies-hero-banner'); },
    get moviesHeroDesc() { return document.getElementById('movies-hero-desc'); },
    get moviesHeroDots() { return document.getElementById('movies-hero-dots'); },
    get moviesHeroGenre() { return document.getElementById('movies-hero-genre'); },
    get moviesHeroPosterImg() { return document.getElementById('movies-hero-poster-img'); },
    get moviesHeroRating() { return document.getElementById('movies-hero-rating'); },
    get moviesHeroRuntime() { return document.getElementById('movies-hero-runtime'); },
    get moviesHeroTitle() { return document.getElementById('movies-hero-title'); },
    get moviesHeroYear() { return document.getElementById('movies-hero-year'); },
    get moviesHomeRows() { return document.getElementById('movies-home-rows'); },
    get moviesInfiniteAnchor() { return document.getElementById('movies-infinite-anchor'); },
    get moviesListView() { return document.getElementById('movies-list-view'); },
    get moviesSearchInput() { return document.getElementById('movies-search-input'); },
    get moviesTypeFilter() { return document.getElementById('movies-type-filter'); },
    get moviesView() { return document.getElementById('movies-view'); },
    get moviesYearFilter() { return document.getElementById('movies-year-filter'); },
    get playerBufferingSpinner() { return document.getElementById('player-buffering-spinner'); },
    get playerIframe() { return document.getElementById('movie-player-frame'); },
    get playerScrubberBuffer() { return document.getElementById('player-scrubber-buffer'); },
    get playerScrubberContainer() { return document.getElementById('player-scrubber-container'); },
    get playerScrubberHandle() { return document.getElementById('player-scrubber-handle'); },
    get playerScrubberProgress() { return document.getElementById('player-scrubber-progress'); },
    get playerScrubberTooltip() { return document.getElementById('player-scrubber-tooltip'); },
    get playerScrubberTrack() { return document.getElementById('player-scrubber-track'); },
    get playerSubtitlePill() { return document.getElementById('player-subtitle-pill'); },
    get statusMetadataTbody() { return document.getElementById('status-metadata-tbody'); },
    get statusPlaybackTbody() { return document.getElementById('status-playback-tbody'); },
    get statusTelemetryTbody() { return document.getElementById('status-telemetry-tbody'); },
  };


  // Movie module helper functions
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getServerOrigin() {
    if (typeof window !== 'undefined' && window.location) {
      if ((window.location.protocol === 'http:' || window.location.protocol === 'https:') &&
          window.location.origin && window.location.origin !== 'null' && 
          !window.location.origin.includes('jsdelivr.net') && 
          !window.location.origin.includes('github.io')) {
        return window.location.origin;
      }
    }
    return '';
  }

  function isServerHosted() {
    try {
      const origin = window.location.origin;
      const base = document.baseURI || '';
      if (origin && origin !== 'null' && !origin.startsWith('file:') && !origin.includes('jsdelivr.net') && !origin.includes('github.io')) {
        return true;
      }
      if (base && !base.startsWith('file:') && !base.includes('jsdelivr.net') && !base.includes('github.io') && (base.startsWith('http://') || base.startsWith('https://'))) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  const switchAppTab = (t) => { if (typeof window.switchTab === 'function') window.switchTab(t); };

// MOVIES STREAMING LIBRARY, SEARCH & THEATER PLAYER (AllFlix-style Experience)
  // ============================================================================
  let allCatalogMovies = [];
  let allLocalMovies = [];
  let activeGenreFilter = 'all';
  let activeTypeFilter = 'all';
  let activeYearFilter = 'all';
  let activeFeaturedMovie = null;
  let activeDetailMovie = null;
  let activeDetailSeason = 1;
  let activeDetailEpisode = 1;
  let currentDetailSources = [];
  let selectedDetailSourceIndex = 0;
  let currentPlaybackMovie = null;
  let currentPlaybackSources = [];
  let currentPlaybackSourceIndex = 0;
  let currentPlaybackSeason = null;
  let currentPlaybackEpisode = null;
  let movieSearchDebounceTimer = null;

  const MOVIES_PAGE_SIZE = 12;
  let moviesDisplayedLimit = MOVIES_PAGE_SIZE;
  let currentFilteredMovies = [];
  let moviesInfiniteObserver = null;
  let resumeToastTimer = null;
  let catalogCurrentPage = 1;
  let catalogTotalPages = 1;
  let catalogLoadingMore = false;
  let isCatalogSearching = false;

  const MOVIES_WATCHLIST_KEY = 'bokit_movies_watchlist';
  const MOVIES_HISTORY_KEY = 'bokit_movies_history';

  let movieWatchlist = [];
  try {
    const rawW = safeStorage.getItem(MOVIES_WATCHLIST_KEY);
    movieWatchlist = rawW ? JSON.parse(rawW) : [];
  } catch (e) {
    movieWatchlist = [];
  }

  let movieHistory = [];
  try {
    const rawH = safeStorage.getItem(MOVIES_HISTORY_KEY);
    movieHistory = rawH ? JSON.parse(rawH) : [];
  } catch (e) {
    movieHistory = [];
  }

  function formatTimeHMS(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function showResumeToast(msg) {
    if (!el.moviePlayerResumeToast) return;
    if (el.movieResumeToastText) el.movieResumeToastText.textContent = msg;
    el.moviePlayerResumeToast.classList.remove('hidden');
    clearTimeout(resumeToastTimer);
    resumeToastTimer = setTimeout(() => {
      if (el.moviePlayerResumeToast) el.moviePlayerResumeToast.classList.add('hidden');
    }, 4500);
  }

  function isMovieInWatchlist(id) {
    if (!id) return false;
    return movieWatchlist.some(m => String(m.id) === String(id));
  }

  function saveMovieWatchlist() {
    try {
      safeStorage.setItem(MOVIES_WATCHLIST_KEY, JSON.stringify(movieWatchlist));
    } catch (e) {}
    updateModalWatchlistButton();
    updateWatchlistPillCount();
    if (activeGenreFilter === 'watchlist') {
      applyMoviesFilter();
    }
  }

  function updateWatchlistPillCount() {
    const pill = el.moviesGenrePills?.querySelector('[data-category="watchlist"]');
    if (pill) {
      pill.textContent = `⭐ Watchlist (${movieWatchlist.length})`;
    }
  }

  function toggleMovieWatchlist(movie) {
    if (!movie || !movie.id) return;
    const idx = movieWatchlist.findIndex(m => String(m.id) === String(movie.id));
    if (idx >= 0) {
      movieWatchlist.splice(idx, 1);
    } else {
      movieWatchlist.unshift({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        posterUrl: movie.posterUrl || movie.backdropUrl,
        rating: movie.rating || '8.5',
        genre: movie.genre || 'Cinema',
        format: movie.format || (movie.isLocal ? 'LOCAL' : 'HD'),
        type: movie.type || (movie.isSeries ? 'series' : 'movie'),
        isLocal: movie.isLocal || false,
        canDownload: movie.canDownload || false,
        downloadUrl: movie.downloadUrl || null
      });
    }
    saveMovieWatchlist();

    // Update bookmark icon state on cards in DOM
    document.querySelectorAll(`.movie-card-watchlist-btn[data-id="${movie.id}"]`).forEach(btn => {
      const active = isMovieInWatchlist(movie.id);
      btn.classList.toggle('active', active);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
    });
  }

  function updateModalWatchlistButton() {
    if (!el.btnModalWatchlist || !activeDetailMovie) return;
    const inWatchlist = isMovieInWatchlist(activeDetailMovie.id);
    el.btnModalWatchlist.classList.toggle('active', inWatchlist);
    if (el.modalWatchlistText) {
      el.modalWatchlistText.textContent = inWatchlist ? 'In Watchlist' : 'Watchlist';
    }
  }

  function saveMovieHistoryItem(movie, season = null, episode = null, progressPercent = 20, currentTime = 0, duration = 0) {
    if (!movie || !movie.id) return;
    const existingIdx = movieHistory.findIndex(h => String(h.id) === String(movie.id));
    const prev = existingIdx >= 0 ? movieHistory[existingIdx] : null;

    const item = {
      id: movie.id,
      title: movie.title || prev?.title || 'Movie',
      year: movie.year || prev?.year || '',
      posterUrl: movie.posterUrl || movie.backdropUrl || prev?.posterUrl,
      format: movie.format || prev?.format || (movie.isLocal ? 'LOCAL' : 'HD'),
      type: movie.type || prev?.type || (season ? 'series' : 'movie'),
      season: season !== null ? season : (prev?.season || null),
      episode: episode !== null ? episode : (prev?.episode || null),
      isLocal: movie.isLocal !== undefined ? movie.isLocal : (prev?.isLocal || false),
      timestamp: Date.now(),
      progressPercent: progressPercent !== undefined ? progressPercent : (prev?.progressPercent || 15),
      currentTime: currentTime || prev?.currentTime || 0,
      duration: duration || prev?.duration || 0
    };
    if (existingIdx >= 0) {
      movieHistory.splice(existingIdx, 1);
    }
    movieHistory.unshift(item);
    if (movieHistory.length > 20) movieHistory.pop();
    try {
      safeStorage.setItem(MOVIES_HISTORY_KEY, JSON.stringify(movieHistory));
    } catch (e) {}
    renderContinueWatchingShelf();
  }

  function removeMovieHistoryItem(id, e) {
    if (e) e.stopPropagation();
    movieHistory = movieHistory.filter(h => String(h.id) !== String(id));
    try {
      safeStorage.setItem(MOVIES_HISTORY_KEY, JSON.stringify(movieHistory));
    } catch (e) {}
    renderContinueWatchingShelf();
  }

  function clearAllMovieHistory() {
    movieHistory = [];
    try {
      safeStorage.removeItem(MOVIES_HISTORY_KEY);
    } catch (e) {}
    renderContinueWatchingShelf();
  }

  function renderContinueWatchingShelf() {
    if (!el.moviesContinueWatchingSection || !el.moviesContinueWatchingGrid) return;
    if (movieHistory.length === 0 || activeGenreFilter === 'watchlist') {
      el.moviesContinueWatchingSection.classList.add('hidden');
      return;
    }

    el.moviesContinueWatchingSection.classList.remove('hidden');
    if (el.moviesContinueWatchingCount) {
      el.moviesContinueWatchingCount.textContent = movieHistory.length;
    }

    el.moviesContinueWatchingGrid.innerHTML = '';
    movieHistory.slice(0, 8).forEach(item => {
      const card = document.createElement('div');
      card.className = 'continue-card';
      let epText = item.season ? `S${item.season}:E${item.episode || 1}` : (item.year ? `${item.year}` : 'Movie');
      if (item.duration && item.currentTime) {
        const remainingMin = Math.max(1, Math.round((item.duration - item.currentTime) / 60));
        epText += ` • ${remainingMin}m left`;
      } else if (item.progressPercent) {
        epText += ` • ${item.progressPercent}%`;
      }
      const thumb = item.posterUrl || '';

      card.innerHTML = `
        <div class="continue-card-thumb-wrap">
          ${thumb ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.title)}" class="continue-card-thumb" loading="lazy" />` : `<div class="movie-card-placeholder"><span class="movie-card-placeholder-icon">🎬</span></div>`}
          <button type="button" class="continue-card-remove" title="Remove from Continue Watching">&times;</button>
          <div class="continue-card-progress-bar" style="width: ${Math.max(8, Math.min(100, item.progressPercent || 25))}%;"></div>
          <div class="movie-card-hover-overlay">
            <div class="movie-play-btn-circle" style="width: 42px; height: 42px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
        </div>
        <div class="continue-card-info">
          <h4 class="continue-card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h4>
          <span class="continue-card-sub">${escapeHtml(epText)}</span>
        </div>
      `;

      const removeBtn = card.querySelector('.continue-card-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          removeMovieHistoryItem(item.id, e);
        });
      }

      card.addEventListener('click', () => {
        const found = allCatalogMovies.find(m => String(m.id) === String(item.id)) ||
                      allLocalMovies.find(m => String(m.id) === String(item.id)) ||
                      { id: item.id, title: item.title, year: item.year, posterUrl: item.posterUrl, isLocal: item.isLocal };
        launchMovie(found, 0, item.season, item.episode);
      });

      el.moviesContinueWatchingGrid.appendChild(card);
    });
  }

  const VERIFIED_TRAILERS = {
    'tt1375666': 'YoHD9XEInc0',
    'tt0816692': 'zSWdZVtXT7E',
    'tt0468569': 'EXeTwQWrcwY',
    'tt0133093': 'vKQi3bBA1y8',
    'tt15239678': 'Way9Dexny3w',
    'tt15398776': 'uYPbbksJxIg',
    'tt9362722': 'cqGjhVJWtEg',
    'tt0175142': '_dxqSg_iV70',
    'tt0903747': 'HhesaQXLuRY',
    'tt4574334': 'b9EkMc79ZSU'
  };

  function openTrailerModal(title, year, id = null, trailerId = null) {
    if (!el.movieTrailerModal || !el.movieTrailerFrame) return;
    const cleanTitle = (title || 'Movie').replace(/[\(\)]/g, '');
    const cleanYear = year || '';
    if (el.movieTrailerTitle) {
      el.movieTrailerTitle.textContent = `${cleanTitle} (${cleanYear}) — Official Trailer`;
    }

    const tId = trailerId || activeDetailMovie?.trailerKey || activeFeaturedMovie?.trailerKey || (id && VERIFIED_TRAILERS[id]) || (activeDetailMovie?.id && VERIFIED_TRAILERS[activeDetailMovie.id]) || (activeFeaturedMovie?.id && VERIFIED_TRAILERS[activeFeaturedMovie.id]);

    if (tId) {
      el.movieTrailerFrame.src = `https://www.youtube-nocookie.com/embed/${tId}?autoplay=1&rel=0`;
    } else {
      const query = encodeURIComponent(`${cleanTitle} ${cleanYear} official trailer`);
      el.movieTrailerFrame.src = `https://www.youtube-nocookie.com/embed?listType=search&list=${query}&autoplay=1`;
    }
    el.movieTrailerModal.classList.remove('hidden');
  }

  function closeTrailerModal() {
    if (!el.movieTrailerModal || !el.movieTrailerFrame) return;
    el.movieTrailerFrame.removeAttribute('src');
    el.movieTrailerModal.classList.add('hidden');
  }

  async function loadTvSeasonsAndEpisodes(id, totalSeasons = 1, currentSeason = 1) {
    if (!el.movieModalTvSection || !el.movieModalSeasonSelect || !el.movieModalEpisodesList) return;
    el.movieModalTvSection.classList.remove('hidden');

    el.movieModalSeasonSelect.innerHTML = '';
    const seasonsCount = Math.max(1, parseInt(totalSeasons, 10) || 1);
    for (let s = 1; s <= seasonsCount; s++) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `Season ${s}`;
      if (s === currentSeason) opt.selected = true;
      el.movieModalSeasonSelect.appendChild(opt);
    }

    activeDetailSeason = currentSeason;
    await fetchAndRenderEpisodes(id, currentSeason);
  }

  async function fetchAndRenderEpisodes(id, season) {
    if (!el.movieModalEpisodesList) return;
    el.movieModalEpisodesList.innerHTML = `<div style="grid-column: 1/-1; padding: 12px; color: #949ba4; font-size: 13px;">Loading Season ${season} episodes...</div>`;

    try {
      const res = await fetch(`/api/movies/episodes?id=${encodeURIComponent(id)}&season=${season}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const episodes = Array.isArray(data.episodes) && data.episodes.length > 0 ? data.episodes : [];

      el.movieModalEpisodesList.innerHTML = '';
      if (episodes.length === 0) {
        el.movieModalEpisodesList.innerHTML = `<div style="grid-column: 1/-1; padding: 12px; color: #949ba4; font-size: 13px;">No episode details listed for this season. Standard streaming remains available.</div>`;
        return;
      }

      episodes.forEach(ep => {
        const item = document.createElement('div');
        item.className = `movie-episode-item ${ep.episode === activeDetailEpisode ? 'active' : ''}`;
        const stillHtml = ep.stillUrl
          ? `<img src="${escapeHtml(ep.stillUrl)}" class="episode-still-img" alt="Episode ${ep.episode}" loading="lazy" />`
          : '';
        const overviewHtml = ep.overview
          ? `<p class="episode-item-overview" title="${escapeHtml(ep.overview)}">${escapeHtml(ep.overview)}</p>`
          : '';

        item.innerHTML = `
          ${stillHtml}
          <span class="episode-num-badge">EPISODE ${ep.episode}</span>
          <span class="episode-item-title" title="${escapeHtml(ep.title)}">${escapeHtml(ep.title)}</span>
          <div class="episode-item-meta">
            <span>⭐ ${escapeHtml(ep.rating || '8.0')}</span>
            ${ep.released ? `<span>•</span><span>${escapeHtml(ep.released)}</span>` : ''}
          </div>
          ${overviewHtml}
        `;

        item.addEventListener('click', () => {
          activeDetailEpisode = ep.episode;
          const allItems = el.movieModalEpisodesList.querySelectorAll('.movie-episode-item');
          allItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');

          if (el.modalWatchLabel) {
            el.modalWatchLabel.textContent = `Stream S${activeDetailSeason}:E${activeDetailEpisode}`;
          }

          if (activeDetailMovie) {
            launchMovie(activeDetailMovie, selectedDetailSourceIndex, activeDetailSeason, activeDetailEpisode);
          }
        });

        el.movieModalEpisodesList.appendChild(item);
      });
    } catch (err) {
      console.error('[Movies] Error fetching episodes:', err);
      el.movieModalEpisodesList.innerHTML = `<div style="grid-column: 1/-1; padding: 12px; color: #f04747; font-size: 13px;">Failed to load episode list. You can still stream directly using the stream button.</div>`;
    }
  }

  function renderMoviesSkeleton(container, count = 12) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skel = document.createElement('div');
      skel.className = 'movie-skeleton-card';
      skel.innerHTML = `
        <div class="movie-skeleton-poster"></div>
        <div class="movie-skeleton-info">
          <div class="movie-skeleton-title"></div>
          <div class="movie-skeleton-meta"></div>
        </div>
      `;
      container.appendChild(skel);
    }
  }

  // Continue Watching Storage System
  let continueWatchingList = [];
  function loadContinueWatchingFromStorage() {
    try {
      const raw = safeStorage.getItem('bokit_movies_continue_watching');
      continueWatchingList = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(continueWatchingList)) continueWatchingList = [];
    } catch (e) {
      continueWatchingList = [];
    }
  }

  function saveContinueWatchingToStorage() {
    try {
      safeStorage.setItem('bokit_movies_continue_watching', JSON.stringify(continueWatchingList));
    } catch (e) {}
  }

  function updateContinueWatching(progressData) {
    if (!progressData || !progressData.id) return;
    const sId = String(progressData.id);

    // If near the end (>95% duration), remove from continue watching
    if (progressData.duration > 0 && (progressData.currentTime / progressData.duration) > 0.95) {
      continueWatchingList = continueWatchingList.filter(item => String(item.id) !== sId);
      saveContinueWatchingToStorage();
      renderContinueWatchingRow();
      return;
    }

    if (progressData.currentTime < 1) return;

    const existingIdx = continueWatchingList.findIndex(item => String(item.id) === sId);
    const itemData = {
      id: sId,
      title: progressData.title || (currentPlaybackMovie ? currentPlaybackMovie.title : 'Movie'),
      isTv: Boolean(progressData.isTv),
      season: progressData.season || null,
      episode: progressData.episode || null,
      posterUrl: (currentPlaybackMovie ? (currentPlaybackMovie.posterUrl || currentPlaybackMovie.poster) : null),
      backdropUrl: (currentPlaybackMovie ? (currentPlaybackMovie.backdropUrl || currentPlaybackMovie.backdrop) : null),
      progress: {
        currentTime: progressData.currentTime,
        duration: progressData.duration,
        timestamp: progressData.timestamp || Date.now()
      }
    };

    if (existingIdx !== -1) {
      continueWatchingList[existingIdx] = itemData;
    } else {
      continueWatchingList.unshift(itemData);
    }

    if (continueWatchingList.length > 20) {
      continueWatchingList = continueWatchingList.slice(0, 20);
    }

    saveContinueWatchingToStorage();
    renderContinueWatchingRow();
  }

  // Hero Spotlight Carousel State
  let heroFeaturedRotation = [];
  let heroFeaturedIndex = 0;
  let heroAutoRotateTimer = null;

  function createMovieCardElement(movie, index) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-id', movie.id);
    card.setAttribute('data-movie-id', movie.id);
    card.style.animationDelay = `${index * 20}ms`;

    const posterSrc = movie.posterUrl || movie.poster;
    const format = movie.quality || (movie.isLocal ? 'LOCAL' : (movie.type === 'series' ? 'TV HD' : 'HD'));
    const year = movie.year ? `${movie.year}` : '';
    const rating = movie.rating ? movie.rating : '8.0';
    const inWl = isMovieInWatchlist(movie.id);

    // Continue Watching Progress Bar & Resume Badge
    let progressHtml = '';
    let resumeBadge = '';
    if (movie.progress && movie.progress.duration > 0) {
      const pct = Math.min(100, Math.max(5, Math.round((movie.progress.currentTime / movie.progress.duration) * 100)));
      progressHtml = `
        <div class="movie-card-progress-bar">
          <div class="movie-card-progress-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      resumeBadge = `<span class="movie-card-resume-badge">▶ RESUME</span>`;
    }

    const posterContent = posterSrc
      ? `<img src="${escapeHtml(posterSrc)}" alt="${escapeHtml(movie.title)}" loading="lazy" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';" />
         <div class="movie-card-placeholder" style="display:none;">
           <span class="movie-card-placeholder-icon">🎬</span>
           <span class="movie-card-placeholder-title">${escapeHtml(movie.title)}</span>
         </div>`
      : `<div class="movie-card-placeholder">
           <span class="movie-card-placeholder-icon">🎬</span>
           <span class="movie-card-placeholder-title">${escapeHtml(movie.title)}</span>
         </div>`;

    card.innerHTML = `
      <div class="movie-card-poster">
        ${posterContent}
        <div class="movie-card-rating">
          <span>⭐</span>
          <span>${escapeHtml(String(rating).replace('⭐', '').trim())}</span>
        </div>
        ${resumeBadge}
        <span class="movie-card-badge">${escapeHtml(format)}</span>
        ${movie.canDownload ? `<span class="movie-card-downloadable-badge" title="Permits direct download">⬇ MP4</span>` : ''}
        ${progressHtml}
        <div class="movie-card-hover-overlay">
          <button type="button" class="btn-card-hover-play" title="Play Movie">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>${movie.progress ? 'RESUME' : 'PLAY'}</span>
          </button>
          <button type="button" class="btn-card-hover-info" title="Movie Details">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>MORE INFO</span>
          </button>
          <button type="button" class="btn-card-hover-list ${inWl ? 'active' : ''}" title="${inWl ? 'Remove from My List' : 'Add to My List'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="${inWl ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${inWl ? '✓ IN LIST' : '+ MY LIST'}</span>
          </button>
        </div>
      </div>
      <div class="movie-card-info">
        <h3 class="movie-card-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3>
        <div class="movie-card-meta">
          ${year ? `<span>${escapeHtml(year)}</span>` : ''}
          ${movie.genre ? `<span>•</span><span>${escapeHtml(movie.genre.split(',')[0])}</span>` : ''}
        </div>
      </div>
    `;

    // Wire Hover buttons
    const playBtn = card.querySelector('.btn-card-hover-play');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const startPos = (movie.progress && movie.progress.currentTime) ? movie.progress.currentTime : 0;
        launchMovie(movie, 0, movie.season || 1, movie.episode || 1, startPos);
      });
    }

    const infoBtn = card.querySelector('.btn-card-hover-info');
    if (infoBtn) {
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMovieDetailsModal(movie);
      });
    }

    const listBtn = card.querySelector('.btn-card-hover-list');
    if (listBtn) {
      listBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMovieWatchlist(movie);
        const nowInWl = isMovieInWatchlist(movie.id);
        listBtn.classList.toggle('active', nowInWl);
        listBtn.querySelector('span').textContent = nowInWl ? '✓ IN LIST' : '+ MY LIST';
      });
    }

    card.addEventListener('click', () => {
      openMovieDetailsModal(movie);
    });

    return card;
  }

  function appendMoviesToGrid(movies, container) {
    if (!container || !Array.isArray(movies)) return;
    movies.forEach((m, idx) => {
      container.appendChild(createMovieCardElement(m, idx));
    });
  }

  function renderMoviesGrid(movies, container) {
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(movies) || movies.length === 0) {
      if (el.moviesEmptyState && activeGenreFilter !== 'watchlist') {
        el.moviesEmptyState.classList.remove('hidden');
      }
      return;
    }

    if (el.moviesEmptyState) {
      el.moviesEmptyState.classList.add('hidden');
    }

    movies.forEach((movie, index) => {
      container.appendChild(createMovieCardElement(movie, index));
    });
  }

  function renderPaginatedGrid(moviesList, resetPaging = true) {
    if (resetPaging) {
      moviesDisplayedLimit = MOVIES_PAGE_SIZE;
    }
    currentFilteredMovies = Array.isArray(moviesList) ? moviesList : [];

    if (currentFilteredMovies.length === 0) {
      if (el.moviesGrid) el.moviesGrid.innerHTML = '';
      if (el.moviesEmptyState && activeGenreFilter !== 'watchlist') {
        el.moviesEmptyState.classList.remove('hidden');
      }
      if (el.btnMoviesLoadMore) el.btnMoviesLoadMore.classList.add('hidden');
      if (el.moviesCatalogEndHint) el.moviesCatalogEndHint.classList.add('hidden');
      return;
    }

    if (el.moviesEmptyState) {
      el.moviesEmptyState.classList.add('hidden');
    }

    const initialSlice = currentFilteredMovies.slice(0, moviesDisplayedLimit);
    renderMoviesGrid(initialSlice, el.moviesGrid);

    updatePaginationControls();
  }

  function updatePaginationControls() {
    if (!el.btnMoviesLoadMore) return;
    let hasMore = false;

    if (isCatalogSearching || activeGenreFilter === 'watchlist' || activeGenreFilter === 'local') {
      hasMore = currentFilteredMovies.length > moviesDisplayedLimit;
    } else {
      hasMore = catalogCurrentPage < catalogTotalPages;
    }

    el.btnMoviesLoadMore.classList.toggle('hidden', !hasMore);

    if (el.moviesCatalogEndHint) {
      const showEndHint = !hasMore && currentFilteredMovies.length >= 10;
      el.moviesCatalogEndHint.classList.toggle('hidden', !showEndHint);
    }
  }

  async function loadMoreMovies() {
    if (isCatalogSearching || activeGenreFilter === 'watchlist' || activeGenreFilter === 'local') {
      if (moviesDisplayedLimit >= currentFilteredMovies.length) return;
      const prevLimit = moviesDisplayedLimit;
      moviesDisplayedLimit = Math.min(currentFilteredMovies.length, moviesDisplayedLimit + MOVIES_PAGE_SIZE);
      const nextBatch = currentFilteredMovies.slice(prevLimit, moviesDisplayedLimit);
      appendMoviesToGrid(nextBatch, el.moviesGrid);
      updatePaginationControls();
      return;
    }

    if (catalogLoadingMore || catalogCurrentPage >= catalogTotalPages) return;
    catalogLoadingMore = true;

    if (el.btnMoviesLoadMore) {
      el.btnMoviesLoadMore.innerHTML = `<span>Loading More Titles...</span>`;
    }

    try {
      const nextPage = catalogCurrentPage + 1;
      const typeParam = activeTypeFilter !== 'all' ? `&type=${encodeURIComponent(activeTypeFilter)}` : '';
      const yearParam = (activeYearFilter && activeYearFilter !== 'all') ? `&year=${encodeURIComponent(activeYearFilter)}` : '';
      const res = await fetch(`/api/movies/catalog?page=${nextPage}&category=${encodeURIComponent(activeGenreFilter)}&limit=20${typeParam}${yearParam}`);

      if (res.ok) {
        const data = await res.json();
        const nextItems = Array.isArray(data.items) ? data.items : (Array.isArray(data.results) ? data.results : []);
        if (nextItems.length > 0) {
          catalogCurrentPage = nextPage;
          catalogTotalPages = data.totalPages || data.total_pages || catalogTotalPages;
          currentFilteredMovies = currentFilteredMovies.concat(nextItems);
          appendMoviesToGrid(nextItems, el.moviesGrid);
        } else {
          catalogTotalPages = catalogCurrentPage;
        }
      }
    } catch (e) {
      console.warn('[Movies] Failed loading more catalog titles:', e);
    } finally {
      catalogLoadingMore = false;
      if (el.btnMoviesLoadMore) {
        el.btnMoviesLoadMore.innerHTML = `
          <span>Load More Titles</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        `;
      }
      updatePaginationControls();
    }
  }

  // AllFlix Homepage Loader
  let homepageDataCache = null;

  async function loadMoviesList() {
    loadContinueWatchingFromStorage();
    if (el.moviesGrid) renderMoviesSkeleton(el.moviesGrid, 12);

    let data = window.__EMBEDDED_MOVIES__ || null;

    if (!data) {
      try {
        const res = await fetch('/api/movies/homepage');
        if (res.ok) data = await res.json();
      } catch (e) {}
    }

    if (!data) {
      try {
        const res = await fetch('./movies_homepage.json');
        if (res.ok) data = await res.json();
      } catch (e) {}
    }

    if (!data) {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/gh/bokit-bip/bokitcord@main/movies_homepage.json');
        if (res.ok) data = await res.json();
      } catch (e) {}
    }

    if (data) {
      homepageDataCache = data;

      // Extract rotation list and active hero movie
      heroFeaturedRotation = (data.featuredRotation && data.featuredRotation.length > 0)
        ? data.featuredRotation
        : (data.hero ? [data.hero] : []);
      activeFeaturedMovie = heroFeaturedRotation[0] || data.hero || null;

      // Setup Hero Spotlight Carousel
      setupHeroCarousel(heroFeaturedRotation);

      // Render AllFlix Horizontal Rows
      renderAllFlixRows(data);

      // Render Category Navigation Pills
      const categories = [
        { id: 'all', label: 'All Cinema' },
        { id: 'trending-movies', label: '🔥 Trending' },
        { id: 'popular-movies', label: '🌟 Popular' },
        { id: 'top-rated-movies', label: '🏆 Top Rated' },
        { id: 'now-playing', label: '🍿 In Theaters' },
        { id: 'upcoming', label: '📅 Upcoming' },
        { id: 'my-list', label: `⭐ My List (${movieWatchlist.length})` },
        { id: 'continue-watching', label: `🕒 Continue Watching (${continueWatchingList.length})` },
        { id: 'genre-action', label: '💥 Action' },
        { id: 'genre-adventure', label: '🗺️ Adventure' },
        { id: 'genre-comedy', label: '😂 Comedy' },
        { id: 'genre-horror', label: '😱 Horror' },
        { id: 'genre-scifi', label: '🚀 Sci-Fi' },
        { id: 'trending-tv', label: '📺 TV Shows' }
      ];
      renderGenrePills(categories);

      // Check URL route
      handleMovieHashRoute();
    } else {
      console.error('[Movies] Error loading AllFlix homepage: all sources unreachable');
    }
  }

  function setupHeroCarousel(rotationList) {
    if (!rotationList || rotationList.length === 0) return;
    heroFeaturedIndex = 0;
    renderHeroBanner(rotationList[0], 0);

    // Setup dots
    if (el.moviesHeroDots) {
      el.moviesHeroDots.innerHTML = '';
      rotationList.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `hero-carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => {
          heroFeaturedIndex = idx;
          renderHeroBanner(rotationList[idx], idx);
          restartHeroAutoRotate();
        });
        el.moviesHeroDots.appendChild(dot);
      });
    }

    // Prev / Next button listeners
    if (el.btnHeroPrev) {
      el.btnHeroPrev.onclick = () => {
        heroFeaturedIndex = (heroFeaturedIndex - 1 + rotationList.length) % rotationList.length;
        renderHeroBanner(rotationList[heroFeaturedIndex], heroFeaturedIndex);
        restartHeroAutoRotate();
      };
    }

    if (el.btnHeroNext) {
      el.btnHeroNext.onclick = () => {
        heroFeaturedIndex = (heroFeaturedIndex + 1) % rotationList.length;
        renderHeroBanner(rotationList[heroFeaturedIndex], heroFeaturedIndex);
        restartHeroAutoRotate();
      };
    }

    restartHeroAutoRotate();
  }

  function restartHeroAutoRotate() {
    if (heroAutoRotateTimer) clearInterval(heroAutoRotateTimer);
    if (heroFeaturedRotation.length <= 1) return;

    heroAutoRotateTimer = setInterval(() => {
      heroFeaturedIndex = (heroFeaturedIndex + 1) % heroFeaturedRotation.length;
      renderHeroBanner(heroFeaturedRotation[heroFeaturedIndex], heroFeaturedIndex);
    }, 9000); // Rotate every 9 seconds
  }

  function renderHeroBanner(movie, index = 0) {
    if (!el.moviesHeroBanner || !movie) return;
    activeFeaturedMovie = movie;

    if (el.moviesHeroBackdrop) {
      const bg = movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster || '';
      el.moviesHeroBackdrop.style.backgroundImage = bg ? `url('${bg}')` : 'none';
    }

    if (el.moviesHeroPosterImg) {
      const poster = movie.posterUrl || movie.poster || '';
      el.moviesHeroPosterImg.src = poster;
      el.moviesHeroPosterImg.style.display = poster ? 'block' : 'none';
    }

    if (el.moviesHeroTitle) {
      el.moviesHeroTitle.textContent = movie.title || 'Featured Blockbuster';
    }
    if (el.moviesHeroYear) {
      el.moviesHeroYear.textContent = movie.year || '';
    }
    if (el.moviesHeroRating) {
      el.moviesHeroRating.textContent = `⭐ ${movie.rating || '8.5'}`;
    }
    if (el.moviesHeroRuntime) {
      el.moviesHeroRuntime.textContent = movie.runtime || 'HD';
    }
    if (el.moviesHeroGenre) {
      el.moviesHeroGenre.textContent = movie.genre || 'Cinema';
    }
    if (el.moviesHeroDesc) {
      el.moviesHeroDesc.textContent = movie.plot || movie.overview || movie.description || 'Watch now in high definition.';
    }

    // Update dots indicator
    if (el.moviesHeroDots) {
      const dots = el.moviesHeroDots.querySelectorAll('.hero-carousel-dot');
      dots.forEach((d, idx) => d.classList.toggle('active', idx === index));
    }

    // Hero Action Buttons
    if (el.btnHeroWatch) {
      el.btnHeroWatch.onclick = () => {
        launchMovie(movie);
      };
    }
    if (el.btnHeroDetails) {
      el.btnHeroDetails.onclick = () => {
        openMovieDetailsModal(movie);
      };
    }
    if (el.btnHeroWatchlist) {
      const inWl = isMovieInWatchlist(movie.id);
      if (el.heroWatchlistText) el.heroWatchlistText.textContent = inWl ? '✓ IN LIST' : '+ MY LIST';
      el.btnHeroWatchlist.onclick = () => {
        toggleMovieWatchlist(movie);
        const nowInWl = isMovieInWatchlist(movie.id);
        if (el.heroWatchlistText) el.heroWatchlistText.textContent = nowInWl ? '✓ IN LIST' : '+ MY LIST';
      };
    }
    if (el.btnHeroTrailer) {
      el.btnHeroTrailer.onclick = () => {
        openTrailerModal(movie.title, movie.year, movie.id, movie.trailerKey);
      };
    }
  }

  // Render AllFlix Horizontal Rows
  function renderAllFlixRows(homepageData) {
    if (!el.moviesHomeRows) return;
    el.moviesHomeRows.innerHTML = '';

    // Switch to rows view
    if (el.moviesGridSection) el.moviesGridSection.classList.add('hidden');
    el.moviesHomeRows.classList.remove('hidden');

    // 1. Continue Watching Row (if exists)
    renderContinueWatchingRow();

    // 2. My List Row (if exists)
    renderMyListRow();

    // 3. Catalog Rows from API
    if (homepageData && Array.isArray(homepageData.rows)) {
      homepageData.rows.forEach(row => {
        if (!row.items || row.items.length === 0) return;
        const rowEl = createMovieRowElement(row);
        el.moviesHomeRows.appendChild(rowEl);
      });
    }
  }

  function renderContinueWatchingRow() {
    if (!el.moviesHomeRows) return;
    const existingRow = document.getElementById('row-continue-watching');
    if (existingRow) existingRow.remove();

    if (!continueWatchingList || continueWatchingList.length === 0) return;

    const rowObj = {
      id: 'continue-watching',
      title: 'Continue Watching',
      icon: '🕒',
      items: continueWatchingList
    };

    const rowEl = createMovieRowElement(rowObj, true);
    el.moviesHomeRows.prepend(rowEl);
  }

  function renderMyListRow() {
    if (!el.moviesHomeRows) return;
    const existingRow = document.getElementById('row-my-list');
    if (existingRow) existingRow.remove();

    if (!movieWatchlist || movieWatchlist.length === 0) return;

    const rowObj = {
      id: 'my-list',
      title: 'My Saved List',
      icon: '⭐',
      items: movieWatchlist
    };

    const rowEl = createMovieRowElement(rowObj);
    // Insert after continue watching or at top
    const cwRow = document.getElementById('row-continue-watching');
    if (cwRow && cwRow.nextSibling) {
      el.moviesHomeRows.insertBefore(rowEl, cwRow.nextSibling);
    } else {
      el.moviesHomeRows.prepend(rowEl);
    }
  }

  function createMovieRowElement(row, isContinueWatching = false) {
    const rowEl = document.createElement('div');
    rowEl.className = 'movies-row';
    rowEl.id = `row-${row.id}`;

    rowEl.innerHTML = `
      <div class="movies-row-header">
        <div class="movies-row-title-wrap">
          <span class="movies-row-icon">${row.icon || '🎬'}</span>
          <h3 class="movies-row-title">${escapeHtml(row.title)}</h3>
          <span class="movies-row-count">${row.items.length} Titles</span>
        </div>
        <div class="movies-row-actions">
          <button type="button" class="btn-row-nav prev" title="Scroll Left">&lsaquo;</button>
          <button type="button" class="btn-row-nav next" title="Scroll Right">&rsaquo;</button>
          <button type="button" class="btn-row-view-all" title="View All in Grid">VIEW ALL</button>
        </div>
      </div>
      <div class="movies-row-track custom-scrollbar"></div>
    `;

    const track = rowEl.querySelector('.movies-row-track');
    row.items.forEach((movie, idx) => {
      track.appendChild(createMovieCardElement(movie, idx));
    });

    const prevBtn = rowEl.querySelector('.btn-row-nav.prev');
    const nextBtn = rowEl.querySelector('.btn-row-nav.next');
    const viewAllBtn = rowEl.querySelector('.btn-row-view-all');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -600, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: 600, behavior: 'smooth' });
      });
    }

    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        showGridViewForCategory(row.title, row.items, row.id);
      });
    }

    return rowEl;
  }

  function showGridViewForCategory(title, items, categoryId = '') {
    if (!el.moviesHomeRows || !el.moviesGridSection) return;

    el.moviesHomeRows.classList.add('hidden');
    el.moviesGridSection.classList.remove('hidden');

    if (el.moviesCatalogTitle) {
      el.moviesCatalogTitle.textContent = title;
    }
    if (el.moviesCatalogCount) {
      el.moviesCatalogCount.textContent = `${items.length} Titles`;
    }

    renderPaginatedGrid(items, true);

    if (el.btnBackToRows) {
      el.btnBackToRows.onclick = () => {
        el.moviesGridSection.classList.add('hidden');
        el.moviesHomeRows.classList.remove('hidden');
        if (el.moviesHeroBanner) el.moviesHeroBanner.classList.remove('hidden');
      };
    }
  }

  function renderGenrePills(categories) {
    if (!el.moviesGenrePills) return;
    el.moviesGenrePills.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `movies-genre-pill ${activeGenreFilter === cat.id ? 'active' : ''}`;
      btn.setAttribute('data-category', cat.id);
      btn.textContent = cat.label;

      btn.addEventListener('click', () => {
        activeGenreFilter = cat.id;
        const allPills = el.moviesGenrePills.querySelectorAll('.movies-genre-pill');
        allPills.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');

        if (el.moviesSearchInput && el.moviesSearchInput.value.trim()) {
          el.moviesSearchInput.value = '';
          if (el.btnClearMoviesSearch) el.btnClearMoviesSearch.classList.add('hidden');
        }

        if (cat.id === 'all') {
          if (el.moviesGridSection) el.moviesGridSection.classList.add('hidden');
          if (el.moviesHomeRows) el.moviesHomeRows.classList.remove('hidden');
          if (el.moviesHeroBanner) el.moviesHeroBanner.classList.remove('hidden');
        } else if (cat.id === 'my-list') {
          showGridViewForCategory('⭐ My Saved List', movieWatchlist, 'my-list');
        } else if (cat.id === 'continue-watching') {
          showGridViewForCategory('🕒 Continue Watching', continueWatchingList, 'continue-watching');
        } else if (homepageDataCache && Array.isArray(homepageDataCache.rows)) {
          const matchedRow = homepageDataCache.rows.find(r => r.id === cat.id);
          if (matchedRow) {
            showGridViewForCategory(matchedRow.title, matchedRow.items, matchedRow.id);
          } else {
            fetchCatalogCategory(cat.id, 1);
          }
        }
      });

      el.moviesGenrePills.appendChild(btn);
    });
  }

  function renderContinueWatchingShelf() {
    renderContinueWatchingRow();
  }

  function renderLocalShelf() {
    // Handled seamlessly by AllFlix rows
  }

  async function fetchCatalogCategory(category = 'all', page = 1) {
    if (!el.moviesGrid) return;
    isCatalogSearching = false;
    catalogCurrentPage = page;

    if (el.moviesHomeRows) el.moviesHomeRows.classList.add('hidden');
    if (el.moviesGridSection) el.moviesGridSection.classList.remove('hidden');

    renderMoviesSkeleton(el.moviesGrid, 12);

    try {
      const typeParam = activeTypeFilter !== 'all' ? `&type=${encodeURIComponent(activeTypeFilter)}` : '';
      const yearParam = (activeYearFilter && activeYearFilter !== 'all') ? `&year=${encodeURIComponent(activeYearFilter)}` : '';
      let items = [];

      try {
        const res = await fetch(`/api/movies/catalog?page=${page}&category=${encodeURIComponent(category)}&limit=20${typeParam}${yearParam}`);
        if (res.ok) {
          const data = await res.json();
          catalogTotalPages = data.totalPages || data.total_pages || 1;
          items = Array.isArray(data.items) ? data.items : (Array.isArray(data.movies) ? data.movies : []);
        }
      } catch (e) {}

      // Fallback from homepageDataCache
      if (items.length === 0 && homepageDataCache && Array.isArray(homepageDataCache.rows)) {
        if (category === 'all') {
          const seen = new Set();
          homepageDataCache.rows.forEach(r => (r.items || []).forEach(m => {
            if (!seen.has(m.id)) { seen.add(m.id); items.push(m); }
          }));
        } else {
          const cleanCat = category.replace('genre-', '').replace('-movies', '').replace('-tv', '').toLowerCase();
          const matchedRow = homepageDataCache.rows.find(r =>
            (r.title || '').toLowerCase().includes(cleanCat) || (r.id || '').toLowerCase().includes(cleanCat)
          );
          if (matchedRow && matchedRow.items) {
            items = matchedRow.items;
          }
        }
      }

      currentFilteredMovies = items;
      if (el.moviesCatalogCount) {
        el.moviesCatalogCount.textContent = `${items.length} Titles`;
      }
      renderPaginatedGrid(items, true);
    } catch (err) {
      console.error('[Movies] Error fetching catalog category:', err);
    }
  }

  function applyMoviesFilter() {
    const query = el.moviesSearchInput ? el.moviesSearchInput.value.trim() : '';
    if (query) {
      performMovieSearch(query);
      return;
    }

    if (el.moviesGridSection) el.moviesGridSection.classList.add('hidden');
    if (el.moviesHomeRows) el.moviesHomeRows.classList.remove('hidden');
    if (el.moviesHeroBanner) el.moviesHeroBanner.classList.remove('hidden');
  }

  async function performMovieSearch(query) {
    if (!el.moviesGrid) return;
    isCatalogSearching = true;

    if (el.moviesHeroBanner) el.moviesHeroBanner.classList.add('hidden');
    if (el.moviesHomeRows) el.moviesHomeRows.classList.add('hidden');
    if (el.moviesGridSection) el.moviesGridSection.classList.remove('hidden');

    renderMoviesSkeleton(el.moviesGrid, 8);

    if (el.moviesCatalogTitle) {
      el.moviesCatalogTitle.textContent = `Search results for "${query}"`;
    }
    if (el.moviesCatalogCount) {
      el.moviesCatalogCount.textContent = 'Searching...';
    }

    try {
      const typeParam = activeTypeFilter !== 'all' ? `&type=${encodeURIComponent(activeTypeFilter)}` : '';
      const yearParam = (activeYearFilter && activeYearFilter !== 'all') ? `&year=${encodeURIComponent(activeYearFilter)}` : '';
      let list = [];

      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}${typeParam}${yearParam}`);
        if (res.ok) {
          const data = await res.json();
          list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
        }
      } catch (e) {}

      // Try TMDB multi-search API if list is empty
      if (list.length === 0) {
        try {
          const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=3fd2be6f0c70a2a598f084ddfb75487c&query=${encodeURIComponent(query)}&include_adult=false`);
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            if (tmdbData && Array.isArray(tmdbData.results)) {
              list = tmdbData.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').map(r => ({
                id: String(r.id),
                tmdbId: String(r.id),
                title: r.title || r.name || 'Untitled',
                year: (r.release_date || r.first_air_date || '').substring(0, 4) || 'N/A',
                type: r.media_type === 'tv' ? 'series' : 'movie',
                category: r.media_type === 'tv' ? 'series' : 'movie',
                rating: r.vote_average ? r.vote_average.toFixed(1) : '8.0',
                plot: r.overview || 'No synopsis available.',
                posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : '',
                backdropUrl: r.backdrop_path ? `https://image.tmdb.org/t/p/w1280${r.backdrop_path}` : '',
                genre: r.media_type === 'tv' ? 'TV Series' : 'Cinema'
              }));
            }
          }
        } catch (e) {}
      }

      // Fallback search in homepageDataCache
      if (list.length === 0 && homepageDataCache && Array.isArray(homepageDataCache.rows)) {
        const q = query.toLowerCase();
        const seen = new Set();
        homepageDataCache.rows.forEach(r => (r.items || []).forEach(m => {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            if ((m.title || '').toLowerCase().includes(q) || (m.genre || '').toLowerCase().includes(q) || (m.plot || '').toLowerCase().includes(q)) {
              list.push(m);
            }
          }
        }));
      }

      if (el.moviesCatalogCount) {
        el.moviesCatalogCount.textContent = `${list.length} Found`;
      }

      renderPaginatedGrid(list, true);
    } catch (err) {
      console.error('[Movies] Search failed:', err);
    }
  }

  async function openMovieDetailsModal(movie) {
    if (!el.movieDetailsModal || !movie) return;
    activeDetailMovie = movie;
    selectedDetailSourceIndex = 0;
    const isInitialSeries = (movie.type === 'series' || movie.category === 'series' || Boolean(movie.totalSeasons && movie.totalSeasons > 0)) && !movie.isLocal && !String(movie.id).startsWith('local-');
    activeDetailSeason = isInitialSeries ? 1 : null;
    activeDetailEpisode = isInitialSeries ? 1 : null;

    // Reset modal fields with initial data
    if (el.movieModalTitle) el.movieModalTitle.textContent = movie.title || 'Movie';
    if (el.movieModalYear) el.movieModalYear.textContent = movie.year || '';
    if (el.movieModalRated) el.movieModalRated.textContent = movie.rated || 'HD';
    if (el.movieModalRuntime) el.movieModalRuntime.textContent = movie.runtime || movie.size || 'HD Stream';
    if (el.movieModalGenres) el.movieModalGenres.textContent = movie.genre || 'Cinema';
    if (el.movieModalRatingBadge) el.movieModalRatingBadge.textContent = `⭐ ${movie.rating || '8.5'}`;
    if (el.movieModalPlot) el.movieModalPlot.textContent = movie.plot || movie.description || 'Loading movie details...';
    if (el.movieModalDirector) el.movieModalDirector.textContent = movie.director || 'N/A';
    if (el.movieModalActors) el.movieModalActors.textContent = movie.actors || 'N/A';
    if (el.modalWatchLabel) el.modalWatchLabel.textContent = isInitialSeries ? 'Stream S1:E1' : 'Stream Movie';

    updateModalWatchlistButton();

    if (el.movieModalPosterImg) {
      el.movieModalPosterImg.src = movie.posterUrl || '';
      el.movieModalPosterImg.style.display = movie.posterUrl ? 'block' : 'none';
    }
    if (el.movieModalBackdropImg) {
      const bg = movie.backdropUrl || movie.posterUrl || '';
      el.movieModalBackdropImg.style.backgroundImage = bg ? `url('${bg}')` : 'none';
    }

    // Hide TV section initially until details confirmed
    if (el.movieModalTvSection) el.movieModalTvSection.classList.add('hidden');

    el.movieDetailsModal.classList.remove('hidden');

    // Update URL hash for clean navigation
    if (window.location.hash !== `#movies/detail/${movie.id}`) {
      history.pushState({ view: 'movie-detail', id: movie.id }, '', `#movies/detail/${movie.id}`);
    }

    // Fetch full details and sources
    try {
      const typeParam = (movie.type || movie.category) ? `&type=${encodeURIComponent(movie.type || movie.category)}` : '';
      const seasonParam = isInitialSeries ? '&s=1&e=1' : '';
      const res = await fetch(`/api/movies/detail?id=${encodeURIComponent(movie.id)}${typeParam}${seasonParam}`);
      if (res.ok) {
        const detail = await res.json();
        if (isInitialSeries && detail.type !== 'series') {
          detail.type = 'series';
          detail.category = 'series';
        }
        activeDetailMovie = { ...movie, ...detail };

        if (el.movieModalTitle) el.movieModalTitle.textContent = detail.title || movie.title;
        if (el.movieModalYear) el.movieModalYear.textContent = detail.year || movie.year;
        if (el.movieModalRated) el.movieModalRated.textContent = detail.rated || 'PG-13';
        if (el.movieModalRuntime) el.movieModalRuntime.textContent = detail.runtime || '120 min';
        if (el.movieModalGenres) el.movieModalGenres.textContent = detail.genre || movie.genre;
        if (el.movieModalPlot) el.movieModalPlot.textContent = detail.plot || 'No synopsis available.';
        if (el.movieModalDirector) el.movieModalDirector.textContent = detail.director || 'N/A';
        if (el.movieModalActors) el.movieModalActors.textContent = detail.actors || 'N/A';
        if (detail.posterUrl && el.movieModalPosterImg) {
          el.movieModalPosterImg.src = detail.posterUrl;
          el.movieModalPosterImg.style.display = 'block';
        }
        if (detail.backdropUrl && el.movieModalBackdropImg) {
          el.movieModalBackdropImg.style.backgroundImage = `url('${detail.backdropUrl}')`;
        }

        // TV series seasons check - strictly for genuine TV shows, never for movies or local files
        const isSeries = (detail.type === 'series' || movie.type === 'series' || Boolean(detail.totalSeasons && detail.totalSeasons > 0)) && !detail.isLocal && !movie.isLocal && !String(detail.id).startsWith('local-');
        if (isSeries && el.movieModalTvSection) {
          activeDetailSeason = 1;
          activeDetailEpisode = 1;
          loadTvSeasonsAndEpisodes(detail.id, detail.totalSeasons || 1, 1);
          if (el.modalWatchLabel) el.modalWatchLabel.textContent = 'Stream S1:E1';
        } else {
          activeDetailSeason = null;
          activeDetailEpisode = null;
          if (el.movieModalTvSection) el.movieModalTvSection.classList.add('hidden');
          if (el.modalWatchLabel) el.modalWatchLabel.textContent = 'Stream Movie';
        }

        // Populate server list for modal
        try {
          const provRes = await fetch(`/api/movies/sources?id=${encodeURIComponent(detail.id)}`);
          if (provRes.ok) {
            const provData = await provRes.json();
            currentDetailSources = provData.availableServers || provData.sources || [];
          } else {
            currentDetailSources = [];
          }
        } catch (e) {
          currentDetailSources = [];
        }

        // Populate Similar Movies Carousel
        if (el.movieModalSimilarSection && el.movieModalSimilarList) {
          if (Array.isArray(detail.similar) && detail.similar.length > 0) {
            el.movieModalSimilarList.innerHTML = '';
            detail.similar.forEach((sim, idx) => {
              const card = createMovieCardElement(sim, idx);
              el.movieModalSimilarList.appendChild(card);
            });
            el.movieModalSimilarSection.classList.remove('hidden');
          } else {
            el.movieModalSimilarSection.classList.add('hidden');
          }
        }

        renderModalServerPills(currentDetailSources);
        updateModalDownloadButton();
      }
    } catch (err) {
      console.error('[Movies] Detail fetch error:', err);
    }
  }

  function renderModalServerPills(sources) {
    if (!el.movieModalServersList) return;
    el.movieModalServersList.innerHTML = '';

    if (!Array.isArray(sources) || sources.length === 0) {
      el.movieModalServersList.innerHTML = `<span style="font-size:12px;color:#ed4245;background:rgba(237,66,69,0.12);padding:4px 8px;border-radius:4px;border:1px solid rgba(237,66,69,0.3);">⚠️ Native Stream Unavailable (Watch Trailer)</span>`;
      return;
    }

    sources.forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `movie-server-btn ${idx === selectedDetailSourceIndex ? 'active' : ''}`;
      const label = src.serverLabel || src.friendlyName || src.name || `Server ${idx + 1}`;
      btn.innerHTML = `
        <span>${escapeHtml(label)}</span>
        <span class="movie-server-badge">${escapeHtml(src.badge || src.quality || (src.canDownload ? 'Direct' : 'HLS'))}</span>
      `;

      btn.addEventListener('click', () => {
        selectedDetailSourceIndex = idx;
        const allBtns = el.movieModalServersList.querySelectorAll('.movie-server-btn');
        allBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateModalDownloadButton();
      });

      el.movieModalServersList.appendChild(btn);
    });
  }

  function updateModalDownloadButton() {
    const activeSource = currentDetailSources[selectedDetailSourceIndex];

    // Download button ONLY visible/active when the selected source explicitly permits downloading!
    if (activeSource && activeSource.canDownload && activeSource.downloadUrl) {
      if (el.btnModalDownload) {
        el.btnModalDownload.classList.remove('hidden');
        el.btnModalDownload.href = activeSource.downloadUrl;
        el.btnModalDownload.setAttribute('download', `${activeDetailMovie?.title || 'Movie'}.mp4`);
      }
      if (el.modalDownloadLabel) {
        el.modalDownloadLabel.textContent = `Download Movie (${activeSource.badge || 'Direct'})`;
      }
      if (el.modalDownloadNotice) {
        el.modalDownloadNotice.classList.add('hidden');
      }
    } else {
      if (el.btnModalDownload) {
        el.btnModalDownload.classList.add('hidden');
        el.btnModalDownload.removeAttribute('href');
      }
      if (el.modalDownloadNotice) {
        el.modalDownloadNotice.classList.remove('hidden');
      }
    }
  }

  function closeMovieDetailsModal() {
    if (el.movieDetailsModal) {
      el.movieDetailsModal.classList.add('hidden');
    }
    if (el.movieModalSimilarSection) {
      el.movieModalSimilarSection.classList.add('hidden');
    }
    if (el.movieModalSimilarList) {
      el.movieModalSimilarList.innerHTML = '';
    }
    activeDetailMovie = null;

    if (window.location.hash.startsWith('#movies/detail')) {
      history.pushState({ view: 'movies-library' }, '', '#movies');
    }
  }

  function showUnsupportedMovieOverlay(movie, fetchedData = null, season = null, isTvShow = false, episode = null) {
    currentPlaybackSources = [];
    closeMovieDetailsModal();
    if (el.moviesListView) el.moviesListView.classList.add('hidden');
    if (el.moviePlayerView) el.moviePlayerView.classList.remove('hidden');
    if (el.movieVideoElement) {
      el.movieVideoElement.pause();
      el.movieVideoElement.removeAttribute('src');
      el.movieVideoElement.load();
    }

    const resolvedTitle = (movie && movie.title && movie.title !== 'Streaming Title' && movie.title !== 'Movie')
      ? movie.title
      : (fetchedData?.title || 'This Title');
    const resolvedYear = (movie && movie.year) ? movie.year : (fetchedData?.year || '');
    const trailerKey = fetchedData?.trailerKey || movie?.trailerKey || movie?.trailerId || null;

    if (el.moviePlayerTitle) {
      let titleText = resolvedTitle;
      if (season && isTvShow) titleText += ` — S${season}:E${episode || 1}`;
      el.moviePlayerTitle.textContent = titleText;
    }
    if (el.moviePlayerYear) {
      el.moviePlayerYear.textContent = resolvedYear ? `(${resolvedYear})` : '';
    }
    if (el.moviePlayerBadge) {
      el.moviePlayerBadge.textContent = 'UNAVAILABLE';
    }
    if (el.moviePlayerSize) {
      el.moviePlayerSize.textContent = 'No Stream';
    }
    if (el.moviePlayerTvControls) {
      el.moviePlayerTvControls.classList.add('hidden');
    }
    if (el.moviePlayerServerSelect) {
      el.moviePlayerServerSelect.innerHTML = '<option value="">No Servers Available</option>';
    }
    if (el.moviePlayerSourcesList) {
      el.moviePlayerSourcesList.innerHTML = '<div class="movie-no-sources-notice" style="color:#94a3b8; font-size:13px; padding:6px 0;">⚠️ No authorized browser-playable stream is available for this title.</div>';
    }

    if (el.moviePlayerErrorOverlay) {
      el.moviePlayerErrorOverlay.classList.remove('hidden');
      if (el.movieErrorTitle) el.movieErrorTitle.textContent = 'Stream Unavailable for this Title';
      if (el.movieErrorDesc) {
        el.movieErrorDesc.textContent = `No authorized browser-playable stream is available for "${resolvedTitle}". Third-party embed webpages have been disabled to ensure native, ad-free HTML5 playback.`;
      }
      if (el.btnMovieErrorSwitch) {
        el.btnMovieErrorSwitch.innerHTML = '<span>← Browse Playable Titles</span>';
        el.btnMovieErrorSwitch.classList.remove('hidden');
        el.btnMovieErrorSwitch.onclick = () => {
          closeMoviePlayer();
          fetchCatalogCategory('local', 1);
        };
      }
      if (el.btnMovieErrorTrailer) {
        if (trailerKey || resolvedTitle) {
          el.btnMovieErrorTrailer.classList.remove('hidden');
          el.btnMovieErrorTrailer.onclick = () => {
            openTrailerModal(resolvedTitle, resolvedYear, movie?.id, trailerKey);
          };
        } else {
          el.btnMovieErrorTrailer.classList.add('hidden');
        }
      }
      if (el.btnMovieErrorDownload) {
        el.btnMovieErrorDownload.classList.add('hidden');
      }
    }
  }

  async function launchMovie(movie, sourceIndex = 0, season = null, episode = null) {
    if (!movie) return;

    // Strict detection: ONLY genuine TV series can have seasons and episodes
    const isTvShow = (movie.type === 'series' || movie.category === 'series' || Boolean(movie.totalSeasons && movie.totalSeasons > 0)) && !movie.isLocal && !String(movie.id).startsWith('local-');
    if (isTvShow) {
      season = Math.max(1, parseInt(season, 10) || 1);
      episode = Math.max(1, parseInt(episode, 10) || 1);
    } else {
      season = null;
      episode = null;
    }

    currentPlaybackMovie = movie;
    currentPlaybackSeason = season;
    currentPlaybackEpisode = episode;

    // Save to Continue Watching history
    saveMovieHistoryItem(movie, season, episode, 15);

    // Update Player View Header
    if (el.moviePlayerTitle) {
      let titleText = movie.title || 'Movie';
      if (season && isTvShow) titleText += ` — S${season}:E${episode || 1}`;
      el.moviePlayerTitle.textContent = titleText;
    }
    if (el.moviePlayerYear) {
      el.moviePlayerYear.textContent = movie.year ? `(${movie.year})` : '';
    }
    if (el.moviePlayerBadge) {
      el.moviePlayerBadge.textContent = movie.format || (isTvShow ? 'TV HD' : 'HD');
    }
    if (el.moviePlayerSize) {
      el.moviePlayerSize.textContent = movie.size || (movie.isLocal ? 'Local Stream' : 'BokitCord Stream');
    }

    // Update URL hash cleanly (strip any ?s=...&e=... for movies)
    const watchHash = (season && isTvShow) ? `#movies/watch/${movie.id}?s=${season}&e=${episode || 1}` : `#movies/watch/${movie.id}`;
    if (window.location.hash !== watchHash) {
      history.replaceState({ view: 'movie-player', id: movie.id, s: season, e: episode }, '', watchHash);
    }

    // Close details modal if open
    closeMovieDetailsModal();

    // Switch views
    if (el.moviesListView) el.moviesListView.classList.add('hidden');
    if (el.moviePlayerView) el.moviePlayerView.classList.remove('hidden');

    const topbar = document.getElementById('movie-player-topbar');
    if (topbar) topbar.classList.remove('hidden');

    const serverOrigin = getServerOrigin();
    const tmdbId = movie.tmdbId || movie.id;

    if (serverOrigin && window.__USE_SERVER_PLAYER__) {
      const playerUrl = (isTvShow && season)
        ? `${serverOrigin}/embed/player/tv/${encodeURIComponent(movie.id)}/${season || 1}/${episode || 1}`
        : `${serverOrigin}/embed/player/movie/${encodeURIComponent(movie.id)}`;

      if (el.playerIframe) {
        el.playerIframe.src = playerUrl;
      }
    } else {
      // Standalone / CDN mode: Multi-server direct embed player
      const standaloneProviders = [
        {
          name: 'VidLink HD',
          url: isTvShow
            ? `https://vidlink.pro/tv/${encodeURIComponent(tmdbId)}/${season || 1}/${episode || 1}`
            : `https://vidlink.pro/movie/${encodeURIComponent(tmdbId)}`
        },
        {
          name: 'VidSrc HD',
          url: isTvShow
            ? `https://vidsrc.me/embed/tv?id=${encodeURIComponent(tmdbId)}&s=${season || 1}&e=${episode || 1}`
            : `https://vidsrc.me/embed/movie?id=${encodeURIComponent(tmdbId)}`
        },
        {
          name: 'AutoEmbed 4K',
          url: isTvShow
            ? `https://autoembed.co/tv/tmdb/${encodeURIComponent(tmdbId)}/${season || 1}/${episode || 1}`
            : `https://autoembed.co/movie/tmdb/${encodeURIComponent(tmdbId)}`
        },
        {
          name: 'Videasy Pro',
          url: isTvShow
            ? `https://player.videasy.net/tv/${encodeURIComponent(tmdbId)}/${season || 1}/${episode || 1}`
            : `https://player.videasy.net/movie/${encodeURIComponent(tmdbId)}`
        },
        {
          name: 'SmashyStream',
          url: isTvShow
            ? `https://embed.smashystream.com/playere.php?tmdb=${encodeURIComponent(tmdbId)}&season=${season || 1}&episode=${episode || 1}`
            : `https://embed.smashystream.com/playere.php?tmdb=${encodeURIComponent(tmdbId)}`
        },
        {
          name: '2Embed',
          url: isTvShow
            ? `https://www.2embed.cc/embedtv/${encodeURIComponent(tmdbId)}&s=${season || 1}&e=${episode || 1}`
            : `https://www.2embed.cc/embed/${encodeURIComponent(tmdbId)}`
        }
      ];

      // Populate Server Select in player topbar
      if (el.moviePlayerServerSelect) {
        el.moviePlayerServerSelect.innerHTML = '';
        standaloneProviders.forEach((sp, idx) => {
          const opt = document.createElement('option');
          opt.value = String(idx);
          opt.textContent = `Server ${idx + 1} — ${sp.name}`;
          el.moviePlayerServerSelect.appendChild(opt);
        });
        el.moviePlayerServerSelect.onchange = () => {
          const chosenIdx = parseInt(el.moviePlayerServerSelect.value, 10) || 0;
          if (el.playerIframe && standaloneProviders[chosenIdx]) {
            el.playerIframe.src = standaloneProviders[chosenIdx].url;
          }
        };
      }

      if (el.playerIframe) {
        el.playerIframe.src = standaloneProviders[0].url;
      }
      updateServerStatusDot('healthy');
    }
  }

  function updateServerStatusDot(status = 'healthy') {
    if (!el.moviePlayerServerDot) return;
    el.moviePlayerServerDot.className = `server-status-dot ${status}`;
    if (status === 'healthy') {
      el.moviePlayerServerDot.title = 'Server status: Online';
    } else if (status === 'testing') {
      el.moviePlayerServerDot.title = 'Testing server availability...';
    } else if (status === 'offline') {
      el.moviePlayerServerDot.title = 'Server status: Blocked / Offline';
    }
  }

  function updateMovieServerSelect() {
    if (!el.moviePlayerServerSelect) return;
    el.moviePlayerServerSelect.innerHTML = '';

    currentPlaybackSources.forEach((src, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);

      const isUnavailable = src.status === 'unavailable' || Boolean(src.unavailable);
      const label = src.serverLabel || `Server ${idx + 1} — ${src.friendlyName || src.name}`;
      opt.textContent = isUnavailable ? `${label} [Offline / Blocked]` : label;

      if (isUnavailable) {
        opt.disabled = true;
      }
      if (idx === currentPlaybackSourceIndex) {
        opt.selected = true;
      }
      el.moviePlayerServerSelect.appendChild(opt);
    });
  }

  function renderPlayerSourcesBar() {
    if (!el.moviePlayerSourcesList) return;
    el.moviePlayerSourcesList.innerHTML = '';

    currentPlaybackSources.forEach((src, idx) => {
      const isUnavailable = src.status === 'unavailable' || Boolean(src.unavailable);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `source-pill-btn ${idx === currentPlaybackSourceIndex ? 'active' : ''} ${isUnavailable ? 'unavailable' : ''}`;

      const badgeText = isUnavailable ? 'Blocked' : (src.qualityLabel || src.badge || (src.canDownload ? 'Direct' : 'HD'));
      btn.innerHTML = `
        <span>${escapeHtml(src.friendlyName || src.name)}</span>
        <span class="source-pill-badge">${escapeHtml(badgeText)}</span>
      `;

      if (isUnavailable) {
        btn.title = `${src.friendlyName || src.name} is unavailable or blocked on this network`;
      } else {
        btn.title = `Switch to ${src.serverLabel || src.name}`;
      }

      btn.addEventListener('click', () => {
        if (isUnavailable) {
          showResumeToast(`⚠️ ${src.friendlyName || src.name} was blocked or unavailable on this network.`);
          return;
        }
        switchMovieSource(idx, true);
      });
      el.moviePlayerSourcesList.appendChild(btn);
    });
  }

  let movieAutoSwitchTimer = null;
  let movieFallbackTimer = null;

  async function testClientReachability(url, timeoutMs = 2500) {
    if (!url) return false;
    if (url.startsWith('/') || url.includes('/api/movies/media-server')) {
      try {
        const probe = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        return probe.ok || probe.status === 206 || probe.status === 200;
      } catch (e) {
        return false;
      }
    }
    try {
      // Standard browser fetch in mode: 'no-cors'
      // Succeeds (opaque response) if domain resolves and connects.
      // Rejects with TypeError if connection refused, DNS fails, or Securly / firewall drops it.
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs)
      });
      return true;
    } catch (err) {
      console.warn('[Movies] Network reachability test failed for:', url, err.message);
      return false;
    }
  }

  function handleSourceFailure(failedIndex, reason = 'Unavailable') {
    if (failedIndex < 0 || failedIndex >= currentPlaybackSources.length) return;
    const failedSource = currentPlaybackSources[failedIndex];
    failedSource.status = 'unavailable';
    failedSource.unavailable = true;
    failedSource.unavailableReason = reason;

    console.warn(`[Movies] Provider ${failedSource.serverLabel || failedSource.name} marked unavailable:`, reason);

    updateMovieServerSelect();
    renderPlayerSourcesBar();
    updateServerStatusDot('offline');

    // Auto-fallback: Find next configured provider that is not marked unavailable
    const nextIndex = currentPlaybackSources.findIndex((s, idx) => idx !== failedIndex && s.status !== 'unavailable' && !s.unavailable);

    if (nextIndex !== -1) {
      const nextSource = currentPlaybackSources[nextIndex];
      const failedName = failedSource.friendlyName || failedSource.name || `Server ${failedIndex + 1}`;
      const nextName = nextSource.friendlyName || nextSource.name || `Server ${nextIndex + 1}`;
      showResumeToast(`⚠️ ${failedName} is unavailable on this network. Switching to Server ${nextIndex + 1} (${nextName})...`);

      if (movieFallbackTimer) clearTimeout(movieFallbackTimer);
      movieFallbackTimer = setTimeout(() => {
        switchMovieSource(nextIndex, false);
      }, 1200);
    } else {
      // All configured servers are unavailable
      if (el.moviePlayerErrorOverlay) {
        el.moviePlayerErrorOverlay.classList.remove('hidden');
        if (el.movieErrorTitle) el.movieErrorTitle.textContent = 'All Streaming Servers Unavailable';
        if (el.movieErrorDesc) el.movieErrorDesc.textContent = 'All configured streaming servers are currently unreachable on this network. Please verify your connection or try again later.';
        if (el.btnMovieErrorSwitch) el.btnMovieErrorSwitch.classList.add('hidden');
      }
    }
  }

  // Expose on window for diagnostics and external control
  window.handleMovieSourceFailure = handleSourceFailure;
  window.switchMovieSource = switchMovieSource;
  window.launchMovie = launchMovie;
  window.openMovieDetailsModal = openMovieDetailsModal;
  window.openMovieWatchView = (movie, s = null, e = null) => launchMovie(movie, 0, s, e);
  window.switchAppTab = switchAppTab;
  window.showDiscordView = showDiscordView;

  let currentHlsInstance = null;
  let playerControlsHideTimer = null;
  let isScrubberDragging = false;

  async function switchMovieSource(newIndex, savePreference = true) {
    if (movieAutoSwitchTimer) {
      clearTimeout(movieAutoSwitchTimer);
      movieAutoSwitchTimer = null;
    }
    if (movieFallbackTimer) {
      clearTimeout(movieFallbackTimer);
      movieFallbackTimer = null;
    }
    if (newIndex < 0 || newIndex >= currentPlaybackSources.length) return;
    currentPlaybackSourceIndex = newIndex;

    const chosen = currentPlaybackSources[newIndex];
    if (savePreference && chosen && chosen.id) {
      try {
        safeStorage.setItem('bokit_movies_preferred_provider', chosen.id);
      } catch (e) {}
    }

    updateMovieServerSelect();
    renderPlayerSourcesBar();

    if (el.moviePlayerErrorOverlay) {
      el.moviePlayerErrorOverlay.classList.add('hidden');
    }
    if (el.btnMovieErrorTrailer) {
      el.btnMovieErrorTrailer.classList.add('hidden');
    }

    // Fetch the new server's direct stream without leaving the watch view
    if (currentPlaybackMovie) {
      updateServerStatusDot('testing');
      try {
        let srcUrl = `/api/movies/sources?id=${encodeURIComponent(currentPlaybackMovie.id)}&server=${encodeURIComponent(chosen.id)}`;
        if (currentPlaybackSeason) {
          srcUrl += `&s=${currentPlaybackSeason}&e=${currentPlaybackEpisode || 1}&type=series`;
        }
        const res = await fetch(srcUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.stream) {
            chosen.streamUrl = data.stream.streamUrl;
            chosen.streamType = data.stream.streamType;
            chosen.subtitles = data.stream.subtitles;
            chosen.qualities = data.stream.qualities;
            chosen.quality = data.stream.quality;
          }
        }
      } catch (e) {
        console.warn('[Movies] Stream refresh warning:', e);
      }
    }

    playActiveSource();
  }

  function setupHlsQualitySelector(hls) {
    if (!el.moviePlayerQualitySelect || !hls || !hls.levels) return;
    el.moviePlayerQualitySelect.innerHTML = '';

    const autoOpt = document.createElement('option');
    autoOpt.value = '-1';
    autoOpt.textContent = 'Auto HD';
    el.moviePlayerQualitySelect.appendChild(autoOpt);

    hls.levels.forEach((lvl, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = lvl.height ? `${lvl.height}p` : `Level ${idx + 1}`;
      el.moviePlayerQualitySelect.appendChild(opt);
    });

    el.moviePlayerQualitySelect.onchange = () => {
      const val = parseInt(el.moviePlayerQualitySelect.value, 10);
      hls.currentLevel = val;
      if (val === -1) {
        if (el.ctrlQualityBadge) el.ctrlQualityBadge.textContent = 'Auto';
      } else {
        const lvl = hls.levels[val];
        if (lvl && el.ctrlQualityBadge) el.ctrlQualityBadge.textContent = `${lvl.height}p`;
      }
    };
  }

  function playActiveSource() {
    if (movieAutoSwitchTimer) {
      clearTimeout(movieAutoSwitchTimer);
      movieAutoSwitchTimer = null;
    }
    if (el.moviePlayerErrorOverlay) {
      el.moviePlayerErrorOverlay.classList.add('hidden');
    }
    if (el.btnMovieErrorTrailer) {
      el.btnMovieErrorTrailer.classList.add('hidden');
    }

    const source = currentPlaybackSources[currentPlaybackSourceIndex];
    if (!source) return;

    if (source.status === 'unavailable' || source.unavailable) {
      handleSourceFailure(currentPlaybackSourceIndex, 'Provider marked unavailable');
      return;
    }

    updateServerStatusDot('testing');

    // Update conditional download button in player topbar
    if (el.btnPlayerDownload) {
      if (source.canDownload && (source.downloadUrl || source.streamUrl || source.url)) {
        el.btnPlayerDownload.classList.remove('hidden');
        el.btnPlayerDownload.href = source.downloadUrl || source.streamUrl || source.url;
        el.btnPlayerDownload.setAttribute('download', `${currentPlaybackMovie?.title || 'Movie'}.mp4`);
      } else {
        el.btnPlayerDownload.classList.add('hidden');
        el.btnPlayerDownload.removeAttribute('href');
      }
    }

    const streamUrl = source.streamUrl || source.url;

    // Reject any provider that only offers embedded webpages or lacks direct streams
    const isEmbedOnly = source.streamType === 'embed' || source.type === 'embed' || Boolean(source.isEmbed) || Boolean(source.unsupported);
    if (isEmbedOnly || !streamUrl) {
      console.warn(`[Movies] Provider "${source.friendlyName || source.name}" requires an embedded webpage or has no stream URL. Skipping.`);
      handleSourceFailure(currentPlaybackSourceIndex, `Provider "${source.friendlyName || source.name}" requires an embedded webpage (unsupported — native player only).`);
      return;
    }

    // Direct Video Playback in Native Video Player
    if (el.movieVideoElement) {
      el.movieVideoElement.classList.remove('hidden');
    }
    if (el.movieCustomControls) {
      el.movieCustomControls.classList.remove('hidden');
    }

    // Clean up previous Hls instance
    if (currentHlsInstance) {
      try {
        currentHlsInstance.destroy();
      } catch (e) {}
      currentHlsInstance = null;
    }

    const videoEl = el.movieVideoElement;
    if (!videoEl) return;

    const isHls = source.streamType === 'hls' || source.type === 'hls' || (streamUrl && streamUrl.includes('.m3u8'));

    // Remove existing track elements
    while (videoEl.firstChild) {
      videoEl.removeChild(videoEl.firstChild);
    }

    // Setup Subtitles
    let subsList = [];
    if (source.subtitles && Array.isArray(source.subtitles) && source.subtitles.length > 0) {
      subsList = source.subtitles;
    } else if (currentPlaybackMovie?.subtitleUrl) {
      subsList = [{
        label: 'English',
        srclang: 'en',
        src: currentPlaybackMovie.subtitleUrl,
        default: true
      }];
    }

    if (subsList.length > 0) {
      subsList.forEach((sub, i) => {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = sub.language || sub.label || `Track ${i + 1}`;
        track.srclang = sub.id || sub.srclang || 'en';
        track.src = sub.url || sub.src;
        if (sub.default || i === 0) track.default = true;
        videoEl.appendChild(track);
      });
    }
    updateSubtitleDropdown(subsList);

    // Resume saved playback progress
    const savedHistory = movieHistory.find(h => String(h.id) === String(currentPlaybackMovie?.id));
    const resumePos = (savedHistory && savedHistory.currentTime >= 2 && (!savedHistory.duration || savedHistory.currentTime < savedHistory.duration - 1))
      ? savedHistory.currentTime
      : 0;

    let hasResumed = false;
    const doResume = () => {
      if (hasResumed) return;
      if (resumePos > 0 && videoEl) {
        try {
          videoEl.currentTime = resumePos;
          showResumeToast(`Resumed from ${formatTimeHMS(resumePos)}`);
          hasResumed = true;
        } catch (e) {}
      }
    };

    if (isHls && window.Hls && Hls.isSupported()) {
      // Native HLS.js streaming
      const hls = new Hls({
        autoStartLoad: true,
        maxBufferLength: 60,
        enableWorker: true
      });
      currentHlsInstance = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
        updateServerStatusDot('healthy');
        setupHlsQualitySelector(hls);
        doResume();
        videoEl.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
        const lvl = hls.levels[data.level];
        if (lvl && el.ctrlQualityBadge) {
          el.ctrlQualityBadge.textContent = lvl.height ? `${lvl.height}p` : 'HD';
        }
      });

      hls.on(Hls.Events.ERROR, (e, data) => {
        console.warn('[Movies] HLS streaming event:', data.type, data.details);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              handleSourceFailure(currentPlaybackSourceIndex, `HLS error: ${data.details}`);
              break;
          }
        }
      });
    } else if (isHls && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      videoEl.src = streamUrl;
      videoEl.oncanplay = () => {
        updateServerStatusDot('healthy');
        doResume();
      };
      videoEl.onerror = () => handleSourceFailure(currentPlaybackSourceIndex, 'HTML5 Safari HLS error');
      videoEl.load();
      videoEl.play().catch(() => {});
    } else {
      // Native Direct MP4 / WebM playback
      videoEl.src = streamUrl;
      videoEl.oncanplay = () => {
        updateServerStatusDot('healthy');
        doResume();
      };
      videoEl.onerror = () => handleSourceFailure(currentPlaybackSourceIndex, 'HTML5 direct stream error');
      videoEl.load();
      videoEl.play().catch(() => {});

      if (el.ctrlQualityBadge) {
        el.ctrlQualityBadge.textContent = source.quality || '1080p';
      }
    }

    // Attach custom video control event hooks
    initCustomVideoControls(videoEl);
  }

  function initCustomVideoControls(video) {
    if (!video) return;

    const playIcons = () => {
      if (el.btnCtrlPlay) {
        const iconPlay = el.btnCtrlPlay.querySelector('.icon-play');
        const iconPause = el.btnCtrlPlay.querySelector('.icon-pause');
        if (iconPlay && iconPause) {
          iconPlay.classList.toggle('hidden', !video.paused);
          iconPause.classList.toggle('hidden', video.paused);
        }
      }
      if (el.btnPlayerCenterPlay) {
        el.btnPlayerCenterPlay.classList.toggle('playing', !video.paused);
        const iconPlay = el.btnPlayerCenterPlay.querySelector('.play-icon');
        const iconPause = el.btnPlayerCenterPlay.querySelector('.pause-icon');
        if (iconPlay && iconPause) {
          iconPlay.classList.toggle('hidden', !video.paused);
          iconPause.classList.toggle('hidden', video.paused);
        }
      }
    };

    video.onplay = () => {
      playIcons();
      scheduleControlsHide();
    };

    video.onpause = () => {
      playIcons();
      showControls();
    };

    video.onwaiting = () => {
      if (el.playerBufferingSpinner) el.playerBufferingSpinner.classList.remove('hidden');
    };

    video.onplaying = () => {
      if (el.playerBufferingSpinner) el.playerBufferingSpinner.classList.add('hidden');
      playIcons();
    };

    video.ontimeupdate = () => {
      if (isScrubberDragging || !video.duration) return;
      const progress = (video.currentTime / video.duration) * 100;
      if (el.playerScrubberProgress) el.playerScrubberProgress.style.width = `${progress}%`;
      if (el.playerScrubberHandle) el.playerScrubberHandle.style.left = `${progress}%`;
      if (el.ctrlCurrentTime) el.ctrlCurrentTime.textContent = formatTimeHMS(video.currentTime);
      if (el.ctrlDurationTime) el.ctrlDurationTime.textContent = formatTimeHMS(video.duration);
    };

    video.onprogress = () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufPct = (bufferedEnd / video.duration) * 100;
        if (el.playerScrubberBuffer) el.playerScrubberBuffer.style.width = `${bufPct}%`;
      }
    };

    video.onloadedmetadata = () => {
      if (el.ctrlDurationTime) el.ctrlDurationTime.textContent = formatTimeHMS(video.duration);
    };

    // Center play toggle
    if (el.btnPlayerCenterPlay) {
      el.btnPlayerCenterPlay.onclick = () => {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      };
    }

    // Bottom play button
    if (el.btnCtrlPlay) {
      el.btnCtrlPlay.onclick = () => {
        if (video.paused) video.play().catch(() => {});
        else video.pause();
      };
    }

    // 10s Rewind / Forward
    if (el.btnCtrlRewind10) {
      el.btnCtrlRewind10.onclick = () => {
        video.currentTime = Math.max(0, video.currentTime - 10);
      };
    }
    if (el.btnCtrlForward10) {
      el.btnCtrlForward10.onclick = () => {
        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
      };
    }

    // Volume Slider & Mute
    if (el.ctrlVolumeSlider) {
      el.ctrlVolumeSlider.value = String(video.volume);
      el.ctrlVolumeSlider.oninput = () => {
        video.volume = parseFloat(el.ctrlVolumeSlider.value);
        video.muted = video.volume === 0;
        updateVolumeIcons(video.muted);
      };
    }

    if (el.btnCtrlVolume) {
      el.btnCtrlVolume.onclick = () => {
        video.muted = !video.muted;
        updateVolumeIcons(video.muted);
      };
    }

    function updateVolumeIcons(isMuted) {
      if (!el.btnCtrlVolume) return;
      const volHigh = el.btnCtrlVolume.querySelector('.icon-vol-high');
      const volMuted = el.btnCtrlVolume.querySelector('.icon-vol-muted');
      if (volHigh && volMuted) {
        volHigh.classList.toggle('hidden', isMuted);
        volMuted.classList.toggle('hidden', !isMuted);
      }
    }

    // Playback Speed Selector
    if (el.moviePlayerSpeedSelect) {
      el.moviePlayerSpeedSelect.onchange = () => {
        video.playbackRate = parseFloat(el.moviePlayerSpeedSelect.value || '1');
      };
    }

    // Fullscreen Toggle
    if (el.btnCtrlFullscreen) {
      el.btnCtrlFullscreen.onclick = () => {
        const stage = el.moviePlayerStage || el.moviePlayerView;
        if (!document.fullscreenElement) {
          stage.requestFullscreen().catch(() => {});
          stage.classList.add('is-fullscreen');
        } else {
          document.exitFullscreen().catch(() => {});
          stage.classList.remove('is-fullscreen');
        }
      };
    }

    // PiP Button
    if (el.btnCtrlPip) {
      el.btnCtrlPip.onclick = async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (document.pictureInPictureEnabled) {
            await video.requestPictureInPicture();
          }
        } catch (e) {}
      };
    }

    // Scrubber interaction
    if (el.playerScrubberContainer) {
      const handleScrub = (e) => {
        const rect = el.playerScrubberTrack.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        if (video.duration) {
          video.currentTime = pos * video.duration;
          if (el.playerScrubberProgress) el.playerScrubberProgress.style.width = `${pos * 100}%`;
          if (el.playerScrubberHandle) el.playerScrubberHandle.style.left = `${pos * 100}%`;
          if (el.ctrlCurrentTime) el.ctrlCurrentTime.textContent = formatTimeHMS(video.currentTime);
        }
      };

      el.playerScrubberContainer.onmousedown = (e) => {
        isScrubberDragging = true;
        handleScrub(e);
        const onMouseMove = (ev) => {
          if (isScrubberDragging) handleScrub(ev);
        };
        const onMouseUp = () => {
          isScrubberDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

      // Hover Tooltip
      el.playerScrubberContainer.onmousemove = (e) => {
        if (!el.playerScrubberTooltip || !video.duration) return;
        const rect = el.playerScrubberTrack.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const hoverTime = pos * video.duration;
        el.playerScrubberTooltip.textContent = formatTimeHMS(hoverTime);
        el.playerScrubberTooltip.style.left = `${pos * 100}%`;
        el.playerScrubberTooltip.style.opacity = '1';
      };

      el.playerScrubberContainer.onmouseleave = () => {
        if (el.playerScrubberTooltip) el.playerScrubberTooltip.style.opacity = '0';
      };
    }

    // Auto-hide controls when idle
    const stage = el.moviePlayerStage;
    if (stage) {
      stage.onmousemove = () => {
        showControls();
        scheduleControlsHide();
      };
      stage.onmouseleave = () => {
        if (!video.paused) stage.classList.add('idle-hide');
      };
    }

    function showControls() {
      if (stage) stage.classList.remove('idle-hide');
    }

    function scheduleControlsHide() {
      if (playerControlsHideTimer) clearTimeout(playerControlsHideTimer);
      playerControlsHideTimer = setTimeout(() => {
        if (stage && !video.paused) {
          stage.classList.add('idle-hide');
        }
      }, 3500);
    }
  }

  function closeMoviePlayer() {
    if (movieAutoSwitchTimer) {
      clearTimeout(movieAutoSwitchTimer);
      movieAutoSwitchTimer = null;
    }
    if (movieFallbackTimer) {
      clearTimeout(movieFallbackTimer);
      movieFallbackTimer = null;
    }
    if (currentHlsInstance) {
      try {
        currentHlsInstance.destroy();
      } catch (e) {}
      currentHlsInstance = null;
    }
    if (el.moviePlayerErrorOverlay) {
      el.moviePlayerErrorOverlay.classList.add('hidden');
    }
    if (el.btnMovieErrorTrailer) {
      el.btnMovieErrorTrailer.classList.add('hidden');
    }
    if (el.playerIframe) {
      el.playerIframe.src = 'about:blank';
    }
    currentPlaybackMovie = null;
    currentPlaybackSeason = null;
    currentPlaybackEpisode = null;

    if (el.movieVideoElement) {
      el.movieVideoElement.pause();
      el.movieVideoElement.removeAttribute('src');
      el.movieVideoElement.load();
    }

    if (el.moviePlayerStage) {
      el.moviePlayerStage.classList.remove('is-fullscreen');
    }

    if (el.moviePlayerView) el.moviePlayerView.classList.add('hidden');
    if (el.moviesListView) el.moviesListView.classList.remove('hidden');
    updateSubtitleDropdown([]);

    if (window.location.hash.startsWith('#movies/watch')) {
      history.pushState({ view: 'movies-library' }, '', '#movies');
    }
  }

  // Listen for messages from the internal embedded player
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'close-player' || event.data.type === 'BOKIT_CLOSE_PLAYER') {
      closeMoviePlayer();
    } else if (event.data.type === 'BOKIT_VIDEO_PROGRESS') {
      updateContinueWatching(event.data);
    } else if (event.data.type === 'BOKIT_EPISODE_CHANGED') {
      const s = parseInt(event.data.season, 10) || 1;
      const e = parseInt(event.data.episode, 10) || 1;
      currentPlaybackSeason = s;
      currentPlaybackEpisode = e;
      if (el.moviePlayerTitle) {
        const baseTitle = (currentPlaybackMovie && currentPlaybackMovie.title) || event.data.title || 'TV Series';
        el.moviePlayerTitle.textContent = `${baseTitle} — S${s}:E${e}`;
      }
      const id = (currentPlaybackMovie && currentPlaybackMovie.id) || event.data.id;
      if (id) {
        const watchHash = `#movies/watch/${id}?s=${s}&e=${e}`;
        if (window.location.hash !== watchHash) {
          history.replaceState({ view: 'movie-player', id, s, e }, '', watchHash);
        }
      }
      if (currentPlaybackMovie) {
        saveMovieHistoryItem(currentPlaybackMovie, s, e, 15);
      }
    } else if (event.data.type === 'BOKIT_OPEN_DIAGNOSTICS') {
      openProviderStatusModal(event.data.provider, event.data.id);
    }
  });

  function updateSubtitleDropdown(subsList) {
    if (!el.playerSubtitlePill || !el.moviePlayerSubtitleSelect) return;
    if (!subsList || subsList.length === 0) {
      el.playerSubtitlePill.classList.add('hidden');
      return;
    }
    el.playerSubtitlePill.classList.remove('hidden');
    el.moviePlayerSubtitleSelect.innerHTML = '<option value="off">Off</option>';
    subsList.forEach((sub, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = sub.label || `Subtitle ${idx + 1}`;
      if (sub.default || idx === 0) opt.selected = true;
      el.moviePlayerSubtitleSelect.appendChild(opt);
    });

    el.moviePlayerSubtitleSelect.onchange = () => {
      const val = el.moviePlayerSubtitleSelect.value;
      if (!el.movieVideoElement || !el.movieVideoElement.textTracks) return;
      for (let i = 0; i < el.movieVideoElement.textTracks.length; i++) {
        if (val === 'off') {
          el.movieVideoElement.textTracks[i].mode = 'disabled';
        } else if (parseInt(val, 10) === i) {
          el.movieVideoElement.textTracks[i].mode = 'showing';
        } else {
          el.movieVideoElement.textTracks[i].mode = 'disabled';
        }
      }
    };
  }

  // ============================================================================
  // PROVIDER DIAGNOSTICS & STATUS MODAL (P-Stream Health Architecture)
  // ============================================================================
  let isTestingProviders = false;

  async function openProviderStatusModal(provider = null, id = null) {
    if (!el.movieStatusModal) return;
    el.movieStatusModal.classList.remove('hidden');
    await loadProviderStatusData();
    if (provider && id) {
      if (el.diagSelectProvider) el.diagSelectProvider.value = provider;
      if (el.diagInputId) el.diagInputId.value = id;
      await loadTelemetryDiagnostics(provider, id);
    }
  }

  function closeProviderStatusModal() {
    if (el.movieStatusModal) {
      el.movieStatusModal.classList.add('hidden');
    }
  }

  async function loadTelemetryDiagnostics(provider = 'vidrift', id = '4247') {
    if (!el.statusTelemetryTbody) return;
    el.statusTelemetryTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:12px;color:#94a3b8;">Inspecting provider "${escapeHtml(provider)}" with ID ${escapeHtml(id)}...</td></tr>`;

    try {
      const res = await fetch(`/api/movies/diagnostics/${encodeURIComponent(provider)}/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();

      const metrics = [
        { num: 1, label: '1. Provider Name', val: d.providerName, badge: 'badge-tag-purple' },
        { num: 2, label: '2. Original Provider URL', val: d.originalUrl || 'N/A', code: true },
        { num: 3, label: '3. BokitCord Proxied URL', val: d.proxiedUrl || 'N/A', code: true },
        { num: 4, label: '4. HTTP Status Code', val: d.httpStatus || 200, badge: (d.httpStatus === 200 ? 'badge-tag-green' : 'badge-tag-red') },
        { num: 5, label: '5. Redirect Chain', val: Array.isArray(d.redirectChain) && d.redirectChain.length > 0 ? d.redirectChain.join(' → ') : 'Direct (0 redirects)' },
        { num: 6, label: '6. Content-Type Header', val: d.contentType || 'video/mp4', badge: 'badge-tag-cyan' },
        { num: 7, label: '7. Proxy Validation Status', val: d.proxyStatus || 'Allowed', badge: (d.proxyStatus === 'Allowed' ? 'badge-tag-green' : 'badge-tag-purple') },
        { num: 8, label: '8. Blocked Dangerous Resources', val: Array.isArray(d.blockedResources) && d.blockedResources.length > 0 ? d.blockedResources.join(', ') : '0 (Safe & Sandboxed)' },
        { num: 9, label: '9. Media Requests Streamed', val: `${d.mediaRequests || 1} requests`, badge: 'badge-tag-blue' },
        { num: 10, label: '10. Range / 206 Partial Content', val: d.rangeStatus || 'Supported', badge: 'badge-tag-green' },
        { num: 11, label: '11. Frame / Sandbox Errors', val: d.frameErrors || 'None (Clean in-app embed)' },
        { num: 12, label: '12. JavaScript / Console Errors', val: d.jsErrors || 'None (Clean execution)' }
      ];

      el.statusTelemetryTbody.innerHTML = '';
      metrics.forEach(m => {
        const tr = document.createElement('tr');
        let valHtml = '';
        if (m.badge) {
          valHtml = `<span class="${m.badge}">${escapeHtml(String(m.val))}</span>`;
        } else if (m.code) {
          valHtml = `<code style="font-size:11px;word-break:break-all;color:#e2e8f0;background:rgba(0,0,0,0.4);padding:2px 6px;border-radius:4px;">${escapeHtml(String(m.val))}</code>`;
        } else {
          valHtml = `<span style="color:#cbd5e1;font-size:12px;">${escapeHtml(String(m.val))}</span>`;
        }

        tr.innerHTML = `
          <td><span style="font-family:monospace;color:#94a3b8;font-weight:600;">#${m.num}</span></td>
          <td><strong>${escapeHtml(m.label)}</strong></td>
          <td>${valHtml}</td>
        `;
        el.statusTelemetryTbody.appendChild(tr);
      });
    } catch (err) {
      el.statusTelemetryTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:12px;color:#ed4245;">Failed to fetch telemetry: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function loadProviderStatusData() {
    try {
      const res = await fetch('/api/movies/debug');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderProviderStatusData(data);
    } catch (e) {
      console.error('[Movies] Failed to load provider debug status:', e);
    }
    const prov = (el.diagSelectProvider && el.diagSelectProvider.value) || 'vidrift';
    const id = (el.diagInputId && el.diagInputId.value) || '4247';
    loadTelemetryDiagnostics(prov, id);
  }

  async function triggerLiveProviderRetest() {
    if (isTestingProviders) return;
    isTestingProviders = true;
    if (el.btnRetestProviders) {
      el.btnRetestProviders.disabled = true;
      el.btnRetestProviders.innerHTML = '<span class="status-pulse-indicator" style="width:10px;height:10px"></span> Probing Adapters...';
    }

    try {
      const res = await fetch('/api/movies/providers/health', { method: 'POST' });
      const healthList = await res.json();
      await loadProviderStatusData();
    } catch (e) {
      console.error('[Movies] Retest error:', e);
    } finally {
      isTestingProviders = false;
      if (el.btnRetestProviders) {
        el.btnRetestProviders.disabled = false;
        el.btnRetestProviders.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Run Live Health Test</span>
        `;
      }
    }
  }

  function renderProviderStatusData(data) {
    if (!data) return;

    const allHealth = data.health || [];
    const healthyCount = allHealth.filter(h => h.status === 'healthy').length;
    const totalCount = allHealth.length;

    let totalLat = 0;
    let latCount = 0;
    allHealth.forEach(h => {
      if (typeof h.latencyMs === 'number' && h.latencyMs > 0 && h.latencyMs < 5000) {
        totalLat += h.latencyMs;
        latCount++;
      }
    });
    const avgLat = latCount > 0 ? Math.round(totalLat / latCount) : 0;

    if (el.metricHealthyCount) el.metricHealthyCount.textContent = healthyCount;
    if (el.metricTotalCount) el.metricTotalCount.textContent = `${totalCount} configured`;
    if (el.metricAvgLatency) el.metricAvgLatency.textContent = `${avgLat} ms`;
    if (el.metricLocalCount) el.metricLocalCount.textContent = `${data.localMedia?.itemsCount || 0} items`;
    if (el.metricLocalBytes) {
      const mb = Math.round((data.localMedia?.totalBytes || 0) / (1024 * 1024));
      el.metricLocalBytes.textContent = `${mb} MB on disk`;
    }

    // Render Playback table
    if (el.statusPlaybackTbody && data.providers?.playback) {
      el.statusPlaybackTbody.innerHTML = '';
      data.providers.playback.forEach((p, idx) => {
        const h = allHealth.find(item => item.id === p.id) || {};
        const status = h.status || p.status || 'unknown';
        const latency = typeof h.latencyMs === 'number' ? h.latencyMs : p.latencyMs || 0;
        const latencyClass = latency < 250 ? 'fast' : latency < 900 ? 'medium' : 'slow';
        const statusClass = status === 'healthy' ? 'online' : status === 'degraded' ? 'degraded' : 'offline';
        const statusLabel = status === 'healthy' ? 'Online' : status === 'degraded' ? 'Degraded' : 'Offline';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>Server ${idx + 1} — ${escapeHtml(p.name)}</strong>
            <div style="font-size:11px;color:#949ba4;">${escapeHtml(p.id)}</div>
          </td>
          <td><span class="badge-tag-cyan">${escapeHtml(p.playbackType || p.type || 'stream')}</span></td>
          <td><span style="font-weight:600;color:#dbdee1;">${escapeHtml(p.badge || 'HD')}</span></td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td><span class="status-latency-badge ${latencyClass}">${latency} ms</span></td>
          <td>${p.canDownload ? '<span class="badge-tag-green">Allowed</span>' : '<span style="color:#72767d">Disabled</span>'}</td>
          <td><span style="font-family:monospace;color:${(h.errorCount || 0) > 0 ? '#f0b232' : '#23a55a'}">${h.errorCount || 0}</span></td>
        `;
        el.statusPlaybackTbody.appendChild(tr);
      });
    }

    // Render Metadata table
    if (el.statusMetadataTbody && data.providers?.metadata) {
      el.statusMetadataTbody.innerHTML = '';
      data.providers.metadata.forEach(p => {
        const h = allHealth.find(item => item.id === p.id) || {};
        const status = h.status || p.status || 'unknown';
        const latency = typeof h.latencyMs === 'number' ? h.latencyMs : p.latencyMs || 0;
        const latencyClass = latency < 250 ? 'fast' : latency < 900 ? 'medium' : 'slow';
        const statusClass = status === 'healthy' ? 'online' : status === 'degraded' ? 'degraded' : 'offline';
        const statusLabel = status === 'healthy' ? 'Active' : status === 'degraded' ? 'Degraded' : 'Offline';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td><span class="badge-tag-purple">Metadata / Search</span></td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td><span class="status-latency-badge ${latencyClass}">${latency} ms</span></td>
          <td><span class="badge-tag-green">Configured</span></td>
          <td><span style="font-family:monospace;color:${(h.errorCount || 0) > 0 ? '#f0b232' : '#23a55a'}">${h.errorCount || 0}</span></td>
        `;
        el.statusMetadataTbody.appendChild(tr);
      });
    }
  }

  window.openProviderStatusModal = openProviderStatusModal;
  window.closeProviderStatusModal = closeProviderStatusModal;

  async function handleMovieHashRoute() {
    const hash = window.location.hash;
    if (!hash.startsWith('#movies')) return;

    if (el.moviesView && el.moviesView.classList.contains('hidden')) {
      switchAppTab('movies');
    }

    if (hash.startsWith('#movies/watch/')) {
      const match = hash.match(/#movies\/watch\/([^?&]+)(?:\?s=(\d+)&e=(\d+))?/);
      if (match) {
        const id = match[1];
        let s = match[2] ? parseInt(match[2], 10) : null;
        let e = match[3] ? parseInt(match[3], 10) : null;
        if (!currentPlaybackMovie || currentPlaybackMovie.id !== id) {
          const isExplicitLocal = String(id).startsWith('local-');
          let found = allCatalogMovies.find(m => String(m.id) === String(id)) ||
                      allLocalMovies.find(m => String(m.id) === String(id));
          if (!found) {
            if (isExplicitLocal) {
              found = { id: id, title: decodeURIComponent(id.replace(/^local-/, '').replace(/-/g, ' ')), isLocal: true, canDownload: true };
            } else {
              try {
                const detRes = await fetch(`/api/movies/detail?id=${encodeURIComponent(id)}${s ? `&s=${s}&e=${e || 1}` : ''}`);
                if (detRes.ok) {
                  found = await detRes.json();
                }
              } catch (err) {}
              if (!found) {
                found = { id: id, title: 'Streaming Title' };
              }
            }
          }
          const isTvShow = (found.type === 'series' || found.category === 'series' || Boolean(found.totalSeasons && found.totalSeasons > 0) || s !== null) && !found.isLocal && !String(found.id).startsWith('local-');
          if (isTvShow && (!s || !e)) {
            s = s || 1;
            e = e || 1;
          } else if (!isTvShow) {
            s = null;
            e = null;
          }
          launchMovie(found, 0, s, e);
        }
      }
    } else if (hash.startsWith('#movies/detail/')) {
      const id = hash.replace('#movies/detail/', '').trim();
      let found = allCatalogMovies.find(m => String(m.id) === String(id)) ||
                  allLocalMovies.find(m => String(m.id) === String(id));
      if (!found) {
        try {
          const detRes = await fetch(`/api/movies/detail?id=${encodeURIComponent(id)}`);
          if (detRes.ok) {
            found = await detRes.json();
          }
        } catch (err) {}
        if (!found) {
          found = { id: id, title: 'Movie Details' };
        }
      }
      openMovieDetailsModal(found);
    } else if (hash === '#movies' || hash === '#movies/') {
      if (el.moviePlayerView && !el.moviePlayerView.classList.contains('hidden')) {
        closeMoviePlayer();
      }
      if (el.movieDetailsModal && !el.movieDetailsModal.classList.contains('hidden')) {
        closeMovieDetailsModal();
      }
      if (el.movieTrailerModal && !el.movieTrailerModal.classList.contains('hidden')) {
        closeTrailerModal();
      }
    }
  }

  function setupMoviesListeners() {
    if (el.btnMovieBack) {
      el.btnMovieBack.addEventListener('click', closeMoviePlayer);
    }

    if (el.btnCloseMovieModal) {
      el.btnCloseMovieModal.addEventListener('click', closeMovieDetailsModal);
    }

    if (el.btnModalWatchNow) {
      el.btnModalWatchNow.addEventListener('click', () => {
        if (activeDetailMovie) {
          const isTvShow = (activeDetailMovie.type === 'series' || activeDetailMovie.category === 'series' || Boolean(activeDetailMovie.totalSeasons && activeDetailMovie.totalSeasons > 0)) && !activeDetailMovie.isLocal && !String(activeDetailMovie.id).startsWith('local-');
          launchMovie(
            activeDetailMovie,
            selectedDetailSourceIndex,
            isTvShow ? (activeDetailSeason || 1) : null,
            isTvShow ? (activeDetailEpisode || 1) : null
          );
        }
      });
    }

    if (el.btnModalTrailer) {
      el.btnModalTrailer.addEventListener('click', () => {
        if (activeDetailMovie) {
          openTrailerModal(activeDetailMovie.title, activeDetailMovie.year);
        }
      });
    }

    if (el.btnModalWatchlist) {
      el.btnModalWatchlist.addEventListener('click', () => {
        if (activeDetailMovie) {
          toggleMovieWatchlist(activeDetailMovie);
        }
      });
    }

    if (el.btnCloseTrailerModal) {
      el.btnCloseTrailerModal.addEventListener('click', closeTrailerModal);
    }

    if (el.movieTrailerModal) {
      el.movieTrailerModal.addEventListener('click', (e) => {
        if (e.target === el.movieTrailerModal) closeTrailerModal();
      });
    }

    if (el.btnClearContinueWatching) {
      el.btnClearContinueWatching.addEventListener('click', clearAllMovieHistory);
    }

    if (el.moviesTypeFilter) {
      el.moviesTypeFilter.addEventListener('change', (e) => {
        activeTypeFilter = e.target.value;
        applyMoviesFilter();
      });
    }

    if (el.moviesYearFilter) {
      el.moviesYearFilter.addEventListener('change', (e) => {
        activeYearFilter = e.target.value;
        applyMoviesFilter();
      });
    }

    if (el.movieModalSeasonSelect) {
      el.movieModalSeasonSelect.addEventListener('change', (e) => {
        const s = parseInt(e.target.value, 10) || 1;
        activeDetailSeason = s;
        activeDetailEpisode = 1;
        if (activeDetailMovie) {
          fetchAndRenderEpisodes(activeDetailMovie.id, s);
        }
      });
    }

    if (el.moviePlayerServerSelect) {
      el.moviePlayerServerSelect.addEventListener('change', (e) => {
        const newIndex = parseInt(e.target.value, 10) || 0;
        switchMovieSource(newIndex, true);
      });
    }

    if (el.btnPlayerPrevEp) {
      el.btnPlayerPrevEp.addEventListener('click', () => {
        if (currentPlaybackMovie && currentPlaybackEpisode && currentPlaybackEpisode > 1) {
          launchMovie(currentPlaybackMovie, currentPlaybackSourceIndex, currentPlaybackSeason, currentPlaybackEpisode - 1);
        }
      });
    }

    if (el.btnPlayerNextEp) {
      el.btnPlayerNextEp.addEventListener('click', () => {
        if (currentPlaybackMovie && currentPlaybackSeason) {
          const nextEp = (currentPlaybackEpisode || 1) + 1;
          launchMovie(currentPlaybackMovie, currentPlaybackSourceIndex, currentPlaybackSeason, nextEp);
        }
      });
    }

    if (el.moviePlayerEpSelect) {
      el.moviePlayerEpSelect.addEventListener('change', (e) => {
        const ep = parseInt(e.target.value, 10) || 1;
        if (currentPlaybackMovie && currentPlaybackSeason) {
          launchMovie(currentPlaybackMovie, currentPlaybackSourceIndex, currentPlaybackSeason, ep);
        }
      });
    }

    if (el.btnMovieProvidersDebug) {
      el.btnMovieProvidersDebug.addEventListener('click', () => {
        openProviderStatusModal();
      });
    }

    if (el.btnMoviePlayerDiagnostics) {
      el.btnMoviePlayerDiagnostics.addEventListener('click', () => {
        openProviderStatusModal();
      });
    }

    if (el.btnCloseMovieStatusModal) {
      el.btnCloseMovieStatusModal.addEventListener('click', () => {
        closeProviderStatusModal();
      });
    }

    if (el.btnRetestProviders) {
      el.btnRetestProviders.addEventListener('click', () => {
        triggerLiveProviderRetest();
      });
    }

    if (el.btnRunDiag) {
      el.btnRunDiag.addEventListener('click', () => {
        const prov = (el.diagSelectProvider && el.diagSelectProvider.value) || 'vidrift';
        const id = (el.diagInputId && el.diagInputId.value) || '4247';
        loadTelemetryDiagnostics(prov, id);
      });
    }

    if (el.movieStatusModal) {
      el.movieStatusModal.addEventListener('click', (e) => {
        if (e.target === el.movieStatusModal) {
          closeProviderStatusModal();
        }
      });
    }

    if (el.btnRefreshMovies) {
      el.btnRefreshMovies.addEventListener('click', () => {
        loadMoviesList();
      });
    }

    if (el.btnRescanEmpty) {
      el.btnRescanEmpty.addEventListener('click', () => {
        if (el.moviesSearchInput) el.moviesSearchInput.value = '';
        activeGenreFilter = 'all';
        activeTypeFilter = 'all';
        activeYearFilter = 'all';
        if (el.moviesTypeFilter) el.moviesTypeFilter.value = 'all';
        if (el.moviesYearFilter) el.moviesYearFilter.value = 'all';
        loadMoviesList();
      });
    }

    if (el.moviesSearchInput) {
      el.moviesSearchInput.addEventListener('input', () => {
        const val = el.moviesSearchInput.value.trim();
        if (el.btnClearMoviesSearch) {
          el.btnClearMoviesSearch.classList.toggle('hidden', !val);
        }

        clearTimeout(movieSearchDebounceTimer);
        movieSearchDebounceTimer = setTimeout(() => {
          applyMoviesFilter();
        }, 300);
      });

      el.moviesSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(movieSearchDebounceTimer);
          applyMoviesFilter();
        }
      });
    }

    if (el.btnMoviesSearchSubmit) {
      el.btnMoviesSearchSubmit.addEventListener('click', () => {
        clearTimeout(movieSearchDebounceTimer);
        applyMoviesFilter();
      });
    }

    if (el.btnClearMoviesSearch) {
      el.btnClearMoviesSearch.addEventListener('click', () => {
        if (el.moviesSearchInput) {
          el.moviesSearchInput.value = '';
          el.btnClearMoviesSearch.classList.add('hidden');
          applyMoviesFilter();
          el.moviesSearchInput.focus();
        }
      });
    }

    if (el.btnMovieFullscreen) {
      el.btnMovieFullscreen.addEventListener('click', () => {
        if (!el.moviePlayerView) return;
        if (!document.fullscreenElement) {
          el.moviePlayerView.requestFullscreen().catch(e => console.error(e));
        } else {
          document.exitFullscreen().catch(e => console.error(e));
        }
      });
    }

    if (el.btnMoviePip) {
      el.btnMoviePip.addEventListener('click', async () => {
        if (!el.movieVideoElement || el.movieVideoElement.classList.contains('hidden')) return;
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else if (document.pictureInPictureEnabled) {
            await el.movieVideoElement.requestPictureInPicture();
          }
        } catch (e) {
          console.error('[Movies] PiP error:', e);
        }
      });
    }

    // Video Playback Progress Saving
    if (el.movieVideoElement) {
      let lastSaveTs = 0;
      el.movieVideoElement.addEventListener('timeupdate', () => {
        const v = el.movieVideoElement;
        if (!v || !currentPlaybackMovie || !v.duration) return;
        const now = Date.now();
        if (now - lastSaveTs > 2500) {
          lastSaveTs = now;
          const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
          saveMovieHistoryItem(
            currentPlaybackMovie,
            currentPlaybackSeason,
            currentPlaybackEpisode,
            pct,
            v.currentTime,
            v.duration
          );
        }
      });

      el.movieVideoElement.addEventListener('pause', () => {
        const v = el.movieVideoElement;
        if (!v || !currentPlaybackMovie || !v.duration) return;
        const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
        saveMovieHistoryItem(
          currentPlaybackMovie,
          currentPlaybackSeason,
          currentPlaybackEpisode,
          pct,
          v.currentTime,
          v.duration
        );
      });

      el.movieVideoElement.addEventListener('ended', () => {
        if (currentPlaybackMovie) {
          saveMovieHistoryItem(
            currentPlaybackMovie,
            currentPlaybackSeason,
            currentPlaybackEpisode,
            100,
            0,
            0
          );
        }
      });
    }

    // Pagination & Infinite Scroll Listeners
    if (el.btnMoviesLoadMore) {
      el.btnMoviesLoadMore.addEventListener('click', () => {
        loadMoreMovies();
      });
    }

    if (window.IntersectionObserver && el.moviesInfiniteAnchor) {
      moviesInfiniteObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const hasMore = (isCatalogSearching || activeGenreFilter === 'watchlist' || activeGenreFilter === 'local')
              ? (currentFilteredMovies.length > moviesDisplayedLimit)
              : (catalogCurrentPage < catalogTotalPages);
            if (hasMore) {
              loadMoreMovies();
            }
          }
        });
      }, { rootMargin: '300px' });
      moviesInfiniteObserver.observe(el.moviesInfiniteAnchor);
    }

    // Close details modal on clicking outside card
    if (el.movieDetailsModal) {
      el.movieDetailsModal.addEventListener('click', (e) => {
        if (e.target === el.movieDetailsModal) {
          closeMovieDetailsModal();
        }
      });
    }

    // Clean hash routing back/forward browser button navigation
    window.addEventListener('hashchange', handleMovieHashRoute);
    window.addEventListener('popstate', handleMovieHashRoute);

    // Process initial hash route if already present on page load
    if (window.location.hash && window.location.hash.startsWith('#movies/')) {
      setTimeout(handleMovieHashRoute, 250);
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Escape closes trailer or details modal first if open
      if (e.code === 'Escape') {
        if (el.movieTrailerModal && !el.movieTrailerModal.classList.contains('hidden')) {
          closeTrailerModal();
          return;
        }
        if (el.movieDetailsModal && !el.movieDetailsModal.classList.contains('hidden')) {
          closeMovieDetailsModal();
          return;
        }
      }

      if (!el.moviePlayerView || el.moviePlayerView.classList.contains('hidden')) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const v = el.movieVideoElement;
      if (!v || v.classList.contains('hidden')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (v.paused) v.play();
        else v.pause();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        if (!document.fullscreenElement) el.moviePlayerView.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        v.muted = !v.muted;
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - 10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        v.volume = Math.min(1, v.volume + 0.1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        v.volume = Math.max(0, v.volume - 0.1);
      } else if (e.code === 'Escape') {
        if (!document.fullscreenElement) {
          closeMoviePlayer();
        }
      }
    });
  }

  window.addEventListener('hashchange', checkHashRouting);

})();
