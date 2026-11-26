/**
 * GAMES V7 — PLATFORM SUITE (v9.0)
 * Handles:
 *  - Modern Taskbar Positioning (bottom / left / right) with persistent storage
 *  - First-Time Visitor Welcome Screen (optional account creation)
 *  - Optional Games V7 Account System & Cloud Sync (with localStorage fallback)
 *  - Real Backend Online Visitor Counter (never faked)
 *  - Featured Games Showcase (backed by existing catalog + Mod Menu config)
 *  - Redesigned Multi-Tab Proxy Browser & Customizable Bookmarks
 *  - Independent Integrations Settings (decoupled from BokitCord)
 *  - Private Bug Report & Contact Form (Owner-only inbox)
 *  - Role-Gated Games V7 Mod Menu (Moderator / Co-Owner / Owner)
 */
(function () {
  'use strict';

  const KEYS = {
    TOKEN: 'gamesv7_auth_token',
    TASKBAR_POS: 'gamesv7_taskbar_pos',
    WELCOME_DONE: 'gamesv7_welcome_done',
    BOOKMARKS: 'gamesv7_proxy_bookmarks',
    SESSION_ID: 'gamesv7_presence_sid',
    DISMISSED_ANN: 'gamesv7_dismissed_ann',
  };

  const DEFAULT_BOOKMARKS = [
    { id: 'bm-wiki', name: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚', desc: 'Encyclopedia' },
    { id: 'bm-example', name: 'Example', url: 'https://example.com', icon: '🌐', desc: 'Quick Test' },
    { id: 'bm-google', name: 'Google', url: 'https://www.google.com', icon: '🔍', desc: 'Search' },
    { id: 'bm-yt', name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️', desc: 'Videos' },
    { id: 'bm-github', name: 'GitHub', url: 'https://github.com', icon: '🐙', desc: 'Code' },
    { id: 'bm-chess', name: 'Chess', url: 'https://www.chess.com', icon: '♟️', desc: 'Board Game' },
    { id: 'bm-poki', name: 'Poki', url: 'https://poki.com', icon: '🎮', desc: 'Web Games' },
    { id: 'bm-ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆', desc: 'Private Search' },
  ];

  const platformState = {
    user: null,
    token: '',
    siteState: null,
    bookmarks: [],
    proxyTabs: [],
    activeProxyTabId: null,
    activeModTab: 'overview',
    syncTimer: null,
    presenceTimer: null,
    presenceSid: '',
  };

  function apiBase() {
    if (typeof window.getGamesV7ApiOrigin === 'function') {
      return window.getGamesV7ApiOrigin();
    }
    try {
      const custom = (localStorage.getItem('gamesv7_api_origin') || '').trim().replace(/\/+$/, '');
      if (custom) return custom;
    } catch (e) {}
    if (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
      return window.location.origin;
    }
    return '';
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function notify(msg) {
    if (typeof window.showToastNotification === 'function') {
      window.showToastNotification(msg);
      return;
    }
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'retro-toast';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  async function apiFetch(path, options = {}) {
    const base = apiBase();
    const headers = { ...(options.headers || {}) };
    if (platformState.token && !headers.Authorization) {
      headers.Authorization = `Bearer ${platformState.token}`;
    }
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options = { ...options, body: JSON.stringify(options.body) };
    }
    const res = await fetch(`${base}${path}`, { ...options, headers });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {}
    return { ok: res.ok, status: res.status, data };
  }

  // =========================================================================
  // 1. TASKBAR POSITIONING (bottom | left | right)
  // =========================================================================
  function getTaskbarPosition() {
    try {
      const saved = localStorage.getItem(KEYS.TASKBAR_POS);
      if (saved === 'bottom' || saved === 'left' || saved === 'right') return saved;
    } catch (e) {}
    return 'bottom';
  }

  function applyTaskbarPosition(pos, persist = true) {
    const clean = pos === 'left' || pos === 'right' ? pos : 'bottom';
    document.body.setAttribute('data-taskbar-pos', clean);
    document.querySelectorAll('#gv7-taskbar-pos-selector .gv7-pos-option').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pos') === clean);
    });
    if (persist) {
      try { localStorage.setItem(KEYS.TASKBAR_POS, clean); } catch (e) {}
      scheduleAccountSync();
    }
  }

  function initTaskbar() {
    applyTaskbarPosition(getTaskbarPosition(), false);
    const selector = document.getElementById('gv7-taskbar-pos-selector');
    if (selector) {
      selector.addEventListener('click', (e) => {
        const btn = e.target.closest('.gv7-pos-option');
        if (!btn) return;
        const pos = btn.getAttribute('data-pos');
        applyTaskbarPosition(pos, true);
        notify(`🧭 Taskbar moved to ${pos === 'bottom' ? 'Bottom' : pos === 'left' ? 'Left Side' : 'Right Side'}`);
      });
    }
  }

  // =========================================================================
  // 2. REAL ONLINE VISITOR COUNTER (Never Faked)
  // =========================================================================
  function getPresenceSid() {
    try {
      let sid = sessionStorage.getItem(KEYS.SESSION_ID);
      if (!sid) {
        const rand = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        sid = `gv7_${rand}`;
        sessionStorage.setItem(KEYS.SESSION_ID, sid);
      }
      return sid;
    } catch (e) {
      return `gv7_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function renderOnlineStatus(onlineCount, available) {
    const countEl = document.getElementById('gv7-online-count');
    const dotEl = document.getElementById('gv7-online-dot');
    const pillEl = document.getElementById('gv7-online-pill');
    if (!countEl) return;
    if (!available || typeof onlineCount !== 'number') {
      countEl.textContent = 'Online count unavailable';
      if (dotEl) dotEl.className = 'gv7-online-dot offline';
      if (pillEl) pillEl.title = 'Games V7 presence backend is currently unreachable';
      return;
    }
    countEl.textContent = `${onlineCount} ${onlineCount === 1 ? 'online' : 'online'}`;
    if (dotEl) dotEl.className = 'gv7-online-dot live';
    if (pillEl) pillEl.title = `${onlineCount} active ${onlineCount === 1 ? 'visitor' : 'visitors'} on Games V7 right now`;
  }

  async function sendPresenceHeartbeat() {
    if (!platformState.presenceSid) platformState.presenceSid = getPresenceSid();
    try {
      const r = await apiFetch('/api/presence/heartbeat', {
        method: 'POST',
        body: { sessionId: platformState.presenceSid },
      });
      if (r.ok && r.data && typeof r.data.online === 'number') {
        renderOnlineStatus(r.data.online, true);
      } else {
        renderOnlineStatus(null, false);
      }
    } catch (e) {
      renderOnlineStatus(null, false);
    }
  }

  function initPresence() {
    platformState.presenceSid = getPresenceSid();
    sendPresenceHeartbeat();
    platformState.presenceTimer = setInterval(() => {
      if (!document.hidden) sendPresenceHeartbeat();
    }, 25000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) sendPresenceHeartbeat();
    });
    window.addEventListener('pagehide', () => {
      try {
        const url = `${apiBase()}/api/presence/leave`;
        const payload = JSON.stringify({ sessionId: platformState.presenceSid });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        } else {
          fetch(url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
        }
      } catch (e) {}
    });
  }

  // =========================================================================
  // 3. FIRST-TIME VISITOR WELCOME SCREEN
  // =========================================================================
  function markWelcomeDone() {
    try { localStorage.setItem(KEYS.WELCOME_DONE, '1'); } catch (e) {}
    const el = document.getElementById('gv7-welcome-overlay');
    if (el) el.classList.add('hidden');
  }

  function initWelcomeScreen() {
    const overlay = document.getElementById('gv7-welcome-overlay');
    if (!overlay) return;
    let done = false;
    try { done = localStorage.getItem(KEYS.WELCOME_DONE) === '1'; } catch (e) {}

    const btnReg = document.getElementById('gv7-welcome-register');
    const btnLogin = document.getElementById('gv7-welcome-login');
    const btnGuest = document.getElementById('gv7-welcome-guest');

    if (btnReg) {
      btnReg.addEventListener('click', () => {
        markWelcomeDone();
        openAuthModal('register');
      });
    }
    if (btnLogin) {
      btnLogin.addEventListener('click', () => {
        markWelcomeDone();
        openAuthModal('login');
      });
    }
    if (btnGuest) {
      btnGuest.addEventListener('click', () => {
        markWelcomeDone();
        notify('Welcome to Games V7! Playing in Guest Mode.');
      });
    }

    if (!done && !platformState.token) {
      overlay.classList.remove('hidden');
    }
  }

  // =========================================================================
  // 4. OPTIONAL ACCOUNT SYSTEM & CLOUD DATA SYNC
  // =========================================================================
  function collectLocalUserData() {
    const appBridge = window.__GV7_APP__;
    const state = appBridge ? appBridge.getState() : {};
    let musicLikes = [];
    let musicPlaylists = [];
    try { musicLikes = JSON.parse(localStorage.getItem('gamesv7_music_likes') || '[]'); } catch (e) {}
    try { musicPlaylists = JSON.parse(localStorage.getItem('gamesv7_music_playlists') || '[]'); } catch (e) {}
    return {
      favorites: appBridge ? appBridge.getFavorites() : JSON.parse(localStorage.getItem('gamesv7_favorites') || '[]'),
      recentlyPlayed: appBridge ? appBridge.getRecentlyPlayed() : JSON.parse(localStorage.getItem('gamesv7_recently_played') || '[]'),
      bookmarks: platformState.bookmarks,
      settings: {
        taskbarPosition: getTaskbarPosition(),
        cloakKey: state.cloakKey || localStorage.getItem('games_v7_cloak') || 'default',
        panicUrl: state.panicUrl || 'https://classroom.google.com',
        crtEnabled: typeof state.crtEnabled === 'boolean' ? state.crtEnabled : true,
        soundEnabled: typeof state.soundEnabled === 'boolean' ? state.soundEnabled : true,
        aiEndpoint: localStorage.getItem('gamesv7_ai_endpoint') || '',
        musicProvider: localStorage.getItem('gamesv7_music_provider') || '',
      },
      musicLikes,
      musicPlaylists,
    };
  }

  function applyAccountDataToLocal(data) {
    if (!data || typeof data !== 'object') return;
    if (window.__GV7_APP__ && typeof window.__GV7_APP__.applySyncedData === 'function') {
      window.__GV7_APP__.applySyncedData(data);
    }
    if (Array.isArray(data.bookmarks) && data.bookmarks.length > 0) {
      platformState.bookmarks = data.bookmarks;
      saveBookmarksLocal();
      renderProxyBookmarks();
    }
    if (data.settings && typeof data.settings === 'object') {
      if (data.settings.taskbarPosition) {
        applyTaskbarPosition(data.settings.taskbarPosition, false);
        try { localStorage.setItem(KEYS.TASKBAR_POS, data.settings.taskbarPosition); } catch (e) {}
      }
      if (typeof data.settings.aiEndpoint === 'string') {
        try { localStorage.setItem('gamesv7_ai_endpoint', data.settings.aiEndpoint); } catch (e) {}
      }
      if (typeof data.settings.musicProvider === 'string') {
        try { localStorage.setItem('gamesv7_music_provider', data.settings.musicProvider); } catch (e) {}
      }
      populateIntegrationInputs();
    }
    renderFeaturedGames();
  }

  function scheduleAccountSync() {
    if (!platformState.user || !platformState.token) return;
    clearTimeout(platformState.syncTimer);
    platformState.syncTimer = setTimeout(() => {
      syncAccountNow(true);
    }, 1200);
  }

  async function syncAccountNow(silent = false) {
    if (!platformState.user || !platformState.token) return;
    try {
      const r = await apiFetch('/api/account/data', {
        method: 'PUT',
        body: { data: collectLocalUserData() },
      });
      if (r.ok && !silent) notify('☁️ Account data synced to Games V7.');
    } catch (e) {
      if (!silent) notify('⚠️ Could not sync right now — saved locally.');
    }
  }

  async function importLocalToAccount() {
    if (!platformState.user || !platformState.token) return;
    try {
      const r = await apiFetch('/api/account/data', {
        method: 'PUT',
        body: { merge: true, data: collectLocalUserData() },
      });
      if (r.ok && r.data && r.data.data) {
        applyAccountDataToLocal(r.data.data);
        notify('📥 Local data imported and merged into your Games V7 account!');
      } else {
        notify('⚠️ Import failed: ' + ((r.data && r.data.error) || 'Unknown error'));
      }
    } catch (e) {
      notify('⚠️ Server unreachable — local data remains intact.');
    }
  }

  function isStaffRole(role) {
    return role === 'owner' || role === 'co-owner' || role === 'moderator';
  }

  function updateAccountUI() {
    const user = platformState.user;
    const isStaff = user && isStaffRole(user.role);

    // Top Nav & Taskbar buttons
    const navAccLabel = document.getElementById('gv7-account-btn-label');
    const tbAccLabel = document.getElementById('gv7-tb-account-label');
    const navModBtn = document.getElementById('gv7-mod-btn');
    const tbModBtn = document.getElementById('gv7-tb-mod-btn');

    if (user) {
      const roleEmoji = user.role === 'owner' ? '👑' : user.role === 'co-owner' ? '🛡️' : user.role === 'moderator' ? '🔧' : '👤';
      if (navAccLabel) navAccLabel.textContent = `${roleEmoji} ${user.displayName || user.username}`;
      if (tbAccLabel) tbAccLabel.textContent = (user.displayName || user.username).slice(0, 10);
    } else {
      if (navAccLabel) navAccLabel.textContent = '👤 SIGN IN';
      if (tbAccLabel) tbAccLabel.textContent = 'Account';
    }

    if (navModBtn) navModBtn.classList.toggle('hidden', !isStaff);
    if (tbModBtn) tbModBtn.classList.toggle('hidden', !isStaff);

    // Settings Account Card
    const setTitle = document.getElementById('gv7-settings-account-title');
    const setSub = document.getElementById('gv7-settings-account-sub');
    const btnLogin = document.getElementById('gv7-settings-btn-login');
    const btnImport = document.getElementById('gv7-settings-btn-import');
    const btnSync = document.getElementById('gv7-settings-btn-sync');
    const btnLogout = document.getElementById('gv7-settings-btn-logout');

    if (user) {
      if (setTitle) setTitle.textContent = `${user.displayName || user.username} (@${user.username}) — ${user.role.toUpperCase()}`;
      if (setSub) setSub.textContent = 'Signed in. Your favorites, bookmarks, taskbar position, and settings sync automatically.';
    } else {
      if (setTitle) setTitle.textContent = 'Guest Mode (Local Storage)';
      if (setSub) setSub.textContent = 'Create an optional free account to sync favorites, bookmarks, taskbar position, and settings across devices.';
    }
    if (btnLogin) btnLogin.classList.toggle('hidden', Boolean(user));
    if (btnImport) btnImport.classList.toggle('hidden', !user);
    if (btnSync) btnSync.classList.toggle('hidden', !user);
    if (btnLogout) btnLogout.classList.toggle('hidden', !user);

    // Auth Modal Profile View vs Forms View
    const profView = document.getElementById('gv7-auth-profile-view');
    const formsView = document.getElementById('gv7-auth-forms-view');
    if (profView && formsView) {
      profView.classList.toggle('hidden', !user);
      formsView.classList.toggle('hidden', Boolean(user));
      if (user) {
        const av = document.getElementById('gv7-profile-avatar');
        const disp = document.getElementById('gv7-profile-display');
        const handle = document.getElementById('gv7-profile-username');
        const badge = document.getElementById('gv7-profile-role-badge');
        const pModBtn = document.getElementById('gv7-profile-mod-btn');
        if (av) av.textContent = (user.displayName || user.username || 'U')[0].toUpperCase();
        if (disp) disp.textContent = user.displayName || user.username;
        if (handle) handle.textContent = `@${user.username}`;
        if (badge) {
          badge.textContent = user.role.toUpperCase();
          badge.className = `gv7-role-badge role-${user.role}`;
        }
        if (pModBtn) pModBtn.classList.toggle('hidden', !isStaff);
      }
    }
  }

  function switchAuthTab(tab) {
    document.querySelectorAll('.gv7-auth-tab').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-auth-tab') === tab);
    });
    const forms = {
      login: document.getElementById('gv7-form-login'),
      register: document.getElementById('gv7-form-register'),
      owner: document.getElementById('gv7-form-owner'),
    };
    Object.entries(forms).forEach(([k, el]) => {
      if (el) el.classList.toggle('hidden', k !== tab);
    });
    const errEl = document.getElementById('gv7-auth-error');
    if (errEl) errEl.classList.add('hidden');
  }

  function showAuthError(msg) {
    const errEl = document.getElementById('gv7-auth-error');
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  }

  function openAuthModal(defaultTab = 'login') {
    const modal = document.getElementById('gv7-auth-modal');
    if (!modal) return;
    updateAccountUI();
    if (!platformState.user) switchAuthTab(defaultTab);
    modal.classList.remove('hidden');
  }

  function closeAuthModal() {
    const modal = document.getElementById('gv7-auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function restoreSession() {
    try { platformState.token = localStorage.getItem(KEYS.TOKEN) || ''; } catch (e) {}
    if (!platformState.token) {
      updateAccountUI();
      return;
    }
    try {
      const r = await apiFetch('/api/auth/me');
      if (r.ok && r.data && r.data.authenticated && r.data.user) {
        platformState.user = r.data.user;
        if (r.data.data) applyAccountDataToLocal(r.data.data);
      } else {
        platformState.token = '';
        platformState.user = null;
        try { localStorage.removeItem(KEYS.TOKEN); } catch (e) {}
      }
    } catch (e) {
      // Backend offline — fall back cleanly to local storage without deleting data
      platformState.user = null;
    }
    updateAccountUI();
  }

  async function logout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    platformState.token = '';
    platformState.user = null;
    try { localStorage.removeItem(KEYS.TOKEN); } catch (e) {}
    updateAccountUI();
    closeModMenu();
    closeAuthModal();
    notify('Signed out of Games V7. Local data remains saved.');
  }

  function initAuthModal() {
    const modal = document.getElementById('gv7-auth-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAuthModal();
      });
    }
    document.querySelectorAll('.gv7-auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchAuthTab(btn.getAttribute('data-auth-tab')));
    });

    const formLogin = document.getElementById('gv7-form-login');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('gv7-login-user').value.trim();
        const password = document.getElementById('gv7-login-pass').value;
        try {
          const r = await apiFetch('/api/auth/login', { method: 'POST', body: { username, password } });
          if (!r.ok || !r.data || !r.data.ok) {
            return showAuthError((r.data && r.data.error) || 'Login failed.');
          }
          platformState.token = r.data.token;
          platformState.user = r.data.user;
          try { localStorage.setItem(KEYS.TOKEN, r.data.token); } catch (err) {}
          if (r.data.data) applyAccountDataToLocal(r.data.data);
          updateAccountUI();
          closeAuthModal();
          notify(`Welcome back, ${platformState.user.displayName || platformState.user.username}!`);
        } catch (err) {
          showAuthError('Cannot reach Games V7 backend server.');
        }
      });
    }

    const formReg = document.getElementById('gv7-form-register');
    if (formReg) {
      formReg.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('gv7-reg-user').value.trim();
        const displayName = document.getElementById('gv7-reg-display').value.trim();
        const password = document.getElementById('gv7-reg-pass').value;
        const shouldImport = document.getElementById('gv7-reg-import').checked;
        try {
          const r = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: {
              username,
              displayName,
              password,
              importData: shouldImport ? collectLocalUserData() : undefined,
            },
          });
          if (!r.ok || !r.data || !r.data.ok) {
            return showAuthError((r.data && r.data.error) || 'Could not create account.');
          }
          platformState.token = r.data.token;
          platformState.user = r.data.user;
          try { localStorage.setItem(KEYS.TOKEN, r.data.token); } catch (err) {}
          updateAccountUI();
          closeAuthModal();
          notify(`Account created! Welcome to Games V7, ${platformState.user.displayName}!`);
        } catch (err) {
          showAuthError('Cannot reach Games V7 backend server.');
        }
      });
    }

    const formOwner = document.getElementById('gv7-form-owner');
    if (formOwner) {
      formOwner.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bokitCordToken = document.getElementById('gv7-owner-bc-token').value.trim();
        try {
          const r = await apiFetch('/api/auth/bokitcord-verify', {
            method: 'POST',
            body: { bokitCordToken },
          });
          if (!r.ok || !r.data || !r.data.ok) {
            return showAuthError((r.data && r.data.error) || 'Owner verification failed.');
          }
          platformState.token = r.data.token;
          platformState.user = r.data.user;
          try { localStorage.setItem(KEYS.TOKEN, r.data.token); } catch (err) {}
          document.getElementById('gv7-owner-bc-token').value = '';
          updateAccountUI();
          closeAuthModal();
          notify('👑 Official Bokit Owner verified! Games V7 Mod Menu unlocked.');
        } catch (err) {
          showAuthError('Cannot reach Games V7 verification bridge.');
        }
      });
    }
  }

  // =========================================================================
  // 5. PUBLIC SITE STATE, ANNOUNCEMENTS & FEATURED GAMES PAGE
  // =========================================================================
  async function loadSiteState() {
    try {
      const r = await apiFetch('/api/site/state');
      if (r.ok && r.data && r.data.ok) {
        platformState.siteState = r.data;
        applySiteStateToUI();
      }
    } catch (e) {}
  }

  function applySiteStateToUI() {
    const st = platformState.siteState;
    if (!st) return;

    const brandTitle = document.getElementById('gv7-brand-title');
    const brandSub = document.getElementById('gv7-brand-sub');
    if (brandTitle && st.siteName) brandTitle.textContent = st.siteName.toUpperCase();
    if (brandSub && st.tagline) brandSub.textContent = st.tagline.toUpperCase();

    // Render live announcements banner
    const bar = document.getElementById('gv7-announcements-bar');
    if (bar) {
      let dismissed = [];
      try { dismissed = JSON.parse(sessionStorage.getItem(KEYS.DISMISSED_ANN) || '[]'); } catch (e) {}
      const items = (st.announcements || []).filter((a) => !dismissed.includes(a.id));
      const extraBanner = st.bannerText ? [{ id: 'site-banner', title: 'Notice', message: st.bannerText, tone: 'info' }] : [];
      const maintBanner = st.maintenanceNotice ? [{ id: 'site-maint', title: 'Status', message: st.maintenanceNotice, tone: 'warning' }] : [];
      const allNotices = [...maintBanner, ...extraBanner, ...items];

      if (allNotices.length === 0) {
        bar.classList.add('hidden');
        bar.innerHTML = '';
      } else {
        bar.classList.remove('hidden');
        bar.innerHTML = allNotices
          .slice(0, 3)
          .map(
            (a) => `
          <div class="gv7-ann-item tone-${esc(a.tone || 'info')}">
            <div class="gv7-ann-content">
              <strong>${esc(a.title || 'Announcement')}:</strong>
              <span>${esc(a.message || '')}</span>
            </div>
            <button type="button" class="gv7-ann-dismiss" data-ann-id="${esc(a.id)}" aria-label="Dismiss">&times;</button>
          </div>`
          )
          .join('');
        bar.querySelectorAll('.gv7-ann-dismiss').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-ann-id');
            dismissed.push(id);
            try { sessionStorage.setItem(KEYS.DISMISSED_ANN, JSON.stringify(dismissed)); } catch (e) {}
            applySiteStateToUI();
          });
        });
      }
    }

    renderFeaturedGames();
  }

  function resolveGameById(games, id) {
    const clean = String(id || '').toLowerCase();
    return games.find(
      (g) =>
        String(g.id || '').toLowerCase() === clean ||
        String(g.folder || '').toLowerCase() === clean ||
        String(g.title || g.name || '').toLowerCase() === clean
    );
  }

  function renderFeaturedGames() {
    const container = document.getElementById('gv7-featured-container');
    const pillsWrap = document.getElementById('gv7-featured-cat-pills');
    if (!container) return;

    const games = window.__GV7_APP__ ? window.__GV7_APP__.getGames() : [];
    const favorites = window.__GV7_APP__ ? window.__GV7_APP__.getFavorites() : [];
    if (!games.length) {
      container.innerHTML = '<div class="gv7-loading-inline">Loading Games V7 catalog…</div>';
      return;
    }

    const categories =
      platformState.siteState &&
      platformState.siteState.featured &&
      Array.isArray(platformState.siteState.featured.categories) &&
      platformState.siteState.featured.categories.length > 0
        ? platformState.siteState.featured.categories
        : [
            { id: 'editors-picks', title: "Editor's Picks", subtitle: 'Top playable picks on Games V7', gameIds: games.slice(0, 6).map((g) => g.id || g.folder) },
            { id: 'retro-legends', title: 'Retro Console Legends', subtitle: 'Classic console favorites', gameIds: games.filter((g) => g.isEmulator).slice(0, 6).map((g) => g.id || g.folder) },
          ];

    if (pillsWrap) {
      pillsWrap.innerHTML = categories
        .map((c) => `<a class="gv7-featured-pill" href="#featured-cat-${esc(c.id)}" onclick="event.preventDefault();const el=document.getElementById('featured-cat-${esc(c.id)}');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});">${esc(c.title)}</a>`)
        .join('');
    }

    container.innerHTML = categories
      .map((cat) => {
        let resolved = (cat.gameIds || []).map((id) => resolveGameById(games, id)).filter(Boolean);
        if (!resolved.length) resolved = games.slice(0, 6);

        const cardsHtml = resolved
          .map((game) => {
            const gid = game.id || game.folder || '';
            const title = esc(game.title || game.name || gid);
            const sys = esc(game.system || game.type || 'HTML5 Web');
            const desc = esc(game.description || `Play ${game.title || game.name || gid} instantly on Games V7.`);
            const isFav = favorites.includes(gid);
            const rawCover = game.cover || game.coverUrl || (game.core ? `covers/retro/${game.core}/${gid}.png` : `covers/${gid}.png`);
            const cleanCover = rawCover.replace(/^\/+/, '');
            const safeTitleJs = title.replace(/'/g, "\\'");

            return `
            <article class="gv7-featured-card" onclick="playGame('${esc(gid)}')">
              <div class="gv7-featured-thumb-wrap">
                <span class="gv7-featured-sys-badge">${sys}</span>
                <button type="button" class="game-card-fav-btn ${isFav ? 'active' : ''}" data-gid="${esc(gid)}" onclick="event.stopPropagation(); toggleFavorite('${esc(gid)}')" title="Favorite">
                  <span class="fav-icon">${isFav ? '★' : '☆'}</span>
                </button>
                <img class="gv7-featured-thumb" src="./${esc(cleanCover)}" alt="${title}" loading="lazy" decoding="async" onerror="handleCoverError(this, '${esc(cleanCover)}', '${safeTitleJs}', '${sys}')" />
              </div>
              <div class="gv7-featured-card-body">
                <h4 class="gv7-featured-card-title">${title}</h4>
                <p class="gv7-featured-card-desc">${desc}</p>
                <div class="gv7-featured-card-foot">
                  <button type="button" class="btn-play-card" onclick="event.stopPropagation(); playGame('${esc(gid)}')">PLAY NOW ▶</button>
                </div>
              </div>
            </article>`;
          })
          .join('');

        return `
        <section class="gv7-featured-section" id="featured-cat-${esc(cat.id)}">
          <div class="gv7-featured-section-head">
            <div>
              <h3>${esc(cat.title)}</h3>
              ${cat.subtitle ? `<p>${esc(cat.subtitle)}</p>` : ''}
            </div>
            <span class="gv7-featured-count">${resolved.length} games</span>
          </div>
          <div class="gv7-featured-grid">${cardsHtml}</div>
        </section>`;
      })
      .join('');
  }

  function playRandomFeatured() {
    const games = window.__GV7_APP__ ? window.__GV7_APP__.getGames() : [];
    if (!games.length) return;
    const cats = (platformState.siteState && platformState.siteState.featured && platformState.siteState.featured.categories) || [];
    const pool = [];
    cats.forEach((c) => (c.gameIds || []).forEach((id) => {
      const g = resolveGameById(games, id);
      if (g) pool.push(g);
    }));
    const list = pool.length ? pool : games;
    const pick = list[Math.floor(Math.random() * list.length)];
    if (pick && typeof window.playGame === 'function') {
      window.playGame(pick.id || pick.folder);
    }
  }

  // =========================================================================
  // 6. REDESIGNED MULTI-TAB PROXY BROWSER & CUSTOMIZABLE BOOKMARKS
  // =========================================================================
  function loadBookmarksLocal() {
    try {
      const raw = localStorage.getItem(KEYS.BOOKMARKS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [...DEFAULT_BOOKMARKS];
  }

  function saveBookmarksLocal() {
    try { localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(platformState.bookmarks)); } catch (e) {}
  }

  function renderProxyBookmarks() {
    const grid = document.getElementById('gv7-proxy-bookmarks-grid');
    if (!grid) return;
    grid.innerHTML = platformState.bookmarks
      .map(
        (bm) => `
      <div class="proxy-bookmark-card gv7-bm-card" data-url="${esc(bm.url)}">
        <button type="button" class="gv7-bm-remove" data-bm-id="${esc(bm.id)}" title="Remove bookmark">&times;</button>
        <span class="bookmark-icon">${esc(bm.icon || '🌐')}</span>
        <span class="bookmark-name">${esc(bm.name)}</span>
        <span class="bookmark-desc">${esc(bm.desc || bm.url.replace(/^https?:\/\//, '').split('/')[0])}</span>
      </div>`
      )
      .join('');

    grid.querySelectorAll('.gv7-bm-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.gv7-bm-remove')) return;
        const url = card.getAttribute('data-url');
        if (url && typeof window.launchProxyUrl === 'function') window.launchProxyUrl(url);
      });
    });

    grid.querySelectorAll('.gv7-bm-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-bm-id');
        platformState.bookmarks = platformState.bookmarks.filter((b) => b.id !== id);
        saveBookmarksLocal();
        renderProxyBookmarks();
        scheduleAccountSync();
      });
    });
  }

  function getActiveProxyTab() {
    return platformState.proxyTabs.find((t) => t.id === platformState.activeProxyTabId) || null;
  }

  function setProxyLoading(loading) {
    const bar = document.getElementById('gv7-proxy-progress');
    if (bar) bar.classList.toggle('loading', Boolean(loading));
  }

  function createProxyTab(title = 'New Tab', url = '', proxyUrl = '') {
    const id = 'ptab_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const tab = {
      id,
      title,
      url,
      proxyUrl,
      history: url ? [{ url, proxyUrl, title }] : [],
      historyIdx: url ? 0 : -1,
    };
    platformState.proxyTabs.push(tab);
    switchProxyTab(id);
    return tab;
  }

  function closeProxyTab(tabId) {
    const idx = platformState.proxyTabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;
    platformState.proxyTabs.splice(idx, 1);
    if (platformState.proxyTabs.length === 0) {
      createProxyTab('New Tab');
      return;
    }
    if (platformState.activeProxyTabId === tabId) {
      const next = platformState.proxyTabs[Math.max(0, idx - 1)];
      switchProxyTab(next.id);
    } else {
      renderProxyTabs();
    }
  }

  function renderProxyTabs() {
    const wrap = document.getElementById('gv7-proxy-tabs');
    if (!wrap) return;
    wrap.innerHTML = platformState.proxyTabs
      .map(
        (t) => `
      <div class="gv7-proxy-tab ${t.id === platformState.activeProxyTabId ? 'active' : ''}" data-tab-id="${esc(t.id)}" role="tab">
        <span class="gv7-proxy-tab-icon">${t.url ? '🌐' : '✨'}</span>
        <span class="gv7-proxy-tab-title">${esc(t.title || 'New Tab')}</span>
        <button type="button" class="gv7-proxy-tab-close" data-close-id="${esc(t.id)}" aria-label="Close tab">&times;</button>
      </div>`
      )
      .join('');

    wrap.querySelectorAll('.gv7-proxy-tab').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.gv7-proxy-tab-close')) return;
        switchProxyTab(el.getAttribute('data-tab-id'));
      });
    });
    wrap.querySelectorAll('.gv7-proxy-tab-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeProxyTab(btn.getAttribute('data-close-id'));
      });
    });

    const active = getActiveProxyTab();
    const btnBack = document.getElementById('gv7-proxy-back');
    const btnFwd = document.getElementById('gv7-proxy-fwd');
    if (btnBack) btnBack.disabled = !(active && active.historyIdx > 0);
    if (btnFwd) btnFwd.disabled = !(active && active.historyIdx >= 0 && active.historyIdx < active.history.length - 1);
  }

  function switchProxyTab(tabId) {
    platformState.activeProxyTabId = tabId;
    const tab = getActiveProxyTab();
    const input = document.getElementById('proxy-url-input');
    const speedDial = document.getElementById('gv7-proxy-speeddial');
    const vp = document.getElementById('proxy-viewport-container');
    const frame = document.getElementById('proxy-frame');
    const label = document.getElementById('proxy-vp-active-url');

    if (tab && tab.url && tab.proxyUrl) {
      if (input) input.value = tab.url;
      if (label) label.textContent = tab.url;
      if (speedDial) speedDial.classList.add('hidden');
      if (vp) {
        vp.classList.add('visible');
        vp.style.display = 'flex';
      }
      if (frame && frame.src !== tab.proxyUrl) {
        setProxyLoading(true);
        frame.src = tab.proxyUrl;
      }
    } else {
      if (input) input.value = '';
      if (speedDial) speedDial.classList.remove('hidden');
      if (vp) {
        vp.classList.remove('visible');
        vp.style.display = 'none';
      }
      if (frame) frame.src = 'about:blank';
      setProxyLoading(false);
    }
    renderProxyTabs();
  }

  function openInProxyTab(targetUrl, proxyLaunchUrl) {
    let tab = getActiveProxyTab();
    if (!tab) tab = createProxyTab('Loading…');
    let label = targetUrl;
    try { label = new URL(targetUrl).hostname.replace(/^www\./, ''); } catch (e) {}

    tab.url = targetUrl;
    tab.proxyUrl = proxyLaunchUrl;
    tab.title = label;
    tab.history = tab.history.slice(0, tab.historyIdx + 1);
    tab.history.push({ url: targetUrl, proxyUrl: proxyLaunchUrl, title: label });
    tab.historyIdx = tab.history.length - 1;

    const speedDial = document.getElementById('gv7-proxy-speeddial');
    const vp = document.getElementById('proxy-viewport-container');
    const frame = document.getElementById('proxy-frame');
    const errBox = document.getElementById('gv7-proxy-error');
    if (errBox) errBox.classList.add('hidden');
    if (speedDial) speedDial.classList.add('hidden');
    if (vp) {
      vp.classList.add('visible');
      vp.style.display = 'flex';
    }
    if (frame) {
      setProxyLoading(true);
      frame.src = proxyLaunchUrl;
    }
    renderProxyTabs();
  }

  function initProxyBrowser() {
    platformState.bookmarks = loadBookmarksLocal();
    renderProxyBookmarks();
    createProxyTab('New Tab');

    const newTabBtn = document.getElementById('gv7-proxy-new-tab');
    const backBtn = document.getElementById('gv7-proxy-back');
    const fwdBtn = document.getElementById('gv7-proxy-fwd');
    const reloadBtn = document.getElementById('gv7-proxy-reload');
    const homeBtn = document.getElementById('gv7-proxy-home');
    const starBtn = document.getElementById('gv7-proxy-bookmark-cur');
    const frame = document.getElementById('proxy-frame');

    if (newTabBtn) newTabBtn.addEventListener('click', () => createProxyTab('New Tab'));
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const t = getActiveProxyTab();
        if (!t || t.historyIdx <= 0) return;
        t.historyIdx--;
        const h = t.history[t.historyIdx];
        t.url = h.url;
        t.proxyUrl = h.proxyUrl;
        t.title = h.title;
        switchProxyTab(t.id);
      });
    }
    if (fwdBtn) {
      fwdBtn.addEventListener('click', () => {
        const t = getActiveProxyTab();
        if (!t || t.historyIdx >= t.history.length - 1) return;
        t.historyIdx++;
        const h = t.history[t.historyIdx];
        t.url = h.url;
        t.proxyUrl = h.proxyUrl;
        t.title = h.title;
        switchProxyTab(t.id);
      });
    }
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        if (typeof window.proxyFrameReload === 'function') {
          setProxyLoading(true);
          window.proxyFrameReload();
        }
      });
    }
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        const t = getActiveProxyTab();
        if (t) {
          t.url = '';
          t.proxyUrl = '';
          t.title = 'New Tab';
          switchProxyTab(t.id);
        }
      });
    }
    if (starBtn) {
      starBtn.addEventListener('click', () => {
        const t = getActiveProxyTab();
        const rawUrl = (t && t.url) || (document.getElementById('proxy-url-input') || {}).value || '';
        if (!rawUrl.trim()) return notify('Enter or open a site first to bookmark it.');
        const cleanUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
        let name = cleanUrl;
        try { name = new URL(cleanUrl).hostname.replace(/^www\./, ''); } catch (e) {}
        if (platformState.bookmarks.some((b) => b.url === cleanUrl)) {
          return notify('Already bookmarked!');
        }
        platformState.bookmarks.unshift({
          id: 'bm_' + Date.now().toString(36),
          name,
          url: cleanUrl,
          icon: '⭐',
          desc: 'Saved',
        });
        saveBookmarksLocal();
        renderProxyBookmarks();
        scheduleAccountSync();
        notify(`⭐ Bookmarked ${name}`);
      });
    }

    // Add Bookmark Form
    const btnAddBm = document.getElementById('gv7-btn-add-bookmark');
    const bmForm = document.getElementById('gv7-bookmark-form');
    const bmCancel = document.getElementById('gv7-bm-cancel');
    if (btnAddBm && bmForm) {
      btnAddBm.addEventListener('click', () => bmForm.classList.toggle('hidden'));
      if (bmCancel) bmCancel.addEventListener('click', () => bmForm.classList.add('hidden'));
      bmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('gv7-bm-name').value.trim();
        let url = document.getElementById('gv7-bm-url').value.trim();
        const icon = document.getElementById('gv7-bm-icon').value.trim() || '🌐';
        if (!name || !url) return;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        platformState.bookmarks.unshift({
          id: 'bm_' + Date.now().toString(36),
          name,
          url,
          icon,
          desc: 'Custom',
        });
        saveBookmarksLocal();
        renderProxyBookmarks();
        scheduleAccountSync();
        bmForm.reset();
        bmForm.classList.add('hidden');
        notify(`Added bookmark: ${name}`);
      });
    }

    if (frame) {
      frame.addEventListener('load', () => setProxyLoading(false));
    }

    // Override closeProxyFrame so it returns cleanly to the Speed Dial in the active tab
    window.closeProxyFrame = function () {
      const t = getActiveProxyTab();
      if (t) {
        t.url = '';
        t.proxyUrl = '';
        t.title = 'New Tab';
        switchProxyTab(t.id);
      }
    };

    window.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'GV7_PROXY_LOADED') {
        setProxyLoading(false);
        const t = getActiveProxyTab();
        if (t && ev.data.title) {
          t.title = String(ev.data.title).slice(0, 26);
          renderProxyTabs();
        }
      }
    });
  }

  // =========================================================================
  // 7. INDEPENDENT INTEGRATIONS SETTINGS
  // =========================================================================
  function populateIntegrationInputs() {
    const map = [
      ['gv7-cfg-api-origin', 'gamesv7_api_origin'],
      ['gv7-cfg-ai-endpoint', 'gamesv7_ai_endpoint'],
      ['gv7-cfg-music-provider', 'gamesv7_music_provider'],
      ['gv7-cfg-bokit-relay', 'gamesv7_bokitcord_relay'],
    ];
    map.forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el) {
        try { el.value = localStorage.getItem(key) || ''; } catch (e) {}
      }
    });
  }

  function initIntegrationsSettings() {
    populateIntegrationInputs();
    const saveBtn = document.getElementById('gv7-btn-save-integrations');
    const resetBtn = document.getElementById('gv7-btn-reset-integrations');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const pairs = [
          ['gv7-cfg-api-origin', 'gamesv7_api_origin'],
          ['gv7-cfg-ai-endpoint', 'gamesv7_ai_endpoint'],
          ['gv7-cfg-music-provider', 'gamesv7_music_provider'],
          ['gv7-cfg-bokit-relay', 'gamesv7_bokitcord_relay'],
        ];
        pairs.forEach(([elId, key]) => {
          const el = document.getElementById(elId);
          if (!el) return;
          const val = el.value.trim();
          try {
            if (val) localStorage.setItem(key, val);
            else localStorage.removeItem(key);
          } catch (e) {}
        });
        scheduleAccountSync();
        sendPresenceHeartbeat();
        loadSiteState();
        notify('✓ Independent service settings saved!');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        ['gamesv7_api_origin', 'gamesv7_ai_endpoint', 'gamesv7_music_provider', 'gamesv7_bokitcord_relay'].forEach((k) => {
          try { localStorage.removeItem(k); } catch (e) {}
        });
        populateIntegrationInputs();
        scheduleAccountSync();
        notify('Reset service settings to Games V7 built-in defaults.');
      });
    }
  }

  // =========================================================================
  // 8. PRIVATE BUG REPORT & CONTACT FORM (Owner-Only Inbox)
  // =========================================================================
  function initBugReportForm() {
    const form = document.getElementById('gv7-report-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedback = document.getElementById('gv7-report-feedback');
      const submitBtn = document.getElementById('gv7-report-submit');
      const payload = {
        category: document.getElementById('gv7-report-category').value,
        subject: document.getElementById('gv7-report-subject').value.trim(),
        message: document.getElementById('gv7-report-message').value.trim(),
        contact: document.getElementById('gv7-report-contact').value.trim(),
        _hp: document.getElementById('gv7-report-hp').value,
        pageContext: window.location.hash || '#contact',
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      if (feedback) feedback.classList.add('hidden');

      try {
        const r = await apiFetch('/api/reports', { method: 'POST', body: payload });
        if (r.ok && r.data && r.data.ok) {
          form.reset();
          if (feedback) {
            feedback.className = 'gv7-feedback-box success';
            feedback.textContent = '✓ ' + (r.data.message || 'Private report submitted to the Games V7 owner!');
            feedback.classList.remove('hidden');
          }
          notify('📩 Private report sent to Games V7 Owner.');
        } else {
          if (feedback) {
            feedback.className = 'gv7-feedback-box error';
            feedback.textContent = '⚠️ ' + ((r.data && r.data.error) || 'Could not submit report.');
            feedback.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (feedback) {
          feedback.className = 'gv7-feedback-box error';
          feedback.textContent = '⚠️ Games V7 backend is offline. Please try again later.';
          feedback.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Private Report';
        }
      }
    });
  }

  // =========================================================================
  // 9. GAMES V7 MOD MENU (Role-Gated: Moderator / Co-Owner / Owner)
  // =========================================================================
  function openModMenu() {
    const user = platformState.user;
    if (!user || !isStaffRole(user.role)) {
      notify('⛔ Mod Menu is restricted to authorized Games V7 staff.');
      return;
    }
    const modal = document.getElementById('gv7-mod-modal');
    const rolePill = document.getElementById('gv7-mod-role-pill');
    if (rolePill) {
      rolePill.textContent = user.role.toUpperCase();
      rolePill.className = `gv7-role-badge role-${user.role}`;
    }

    // Enforce client-side visibility of tabs matching server-verified permissions
    const isOwner = user.role === 'owner';
    const perms = user.permissions || {};
    document.querySelectorAll('#gv7-mod-sidebar [data-owner-only="true"]').forEach((el) => {
      el.classList.toggle('hidden', !isOwner);
    });
    document.querySelectorAll('#gv7-mod-sidebar [data-req-perm]').forEach((el) => {
      const p = el.getAttribute('data-req-perm');
      el.classList.toggle('hidden', !perms[p]);
    });

    if (modal) modal.classList.remove('hidden');
    loadModTab('overview');
  }

  function closeModMenu() {
    const modal = document.getElementById('gv7-mod-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function loadModTab(tabName) {
    platformState.activeModTab = tabName;
    document.querySelectorAll('#gv7-mod-sidebar .gv7-mod-nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mod-tab') === tabName);
    });
    const body = document.getElementById('gv7-mod-body');
    if (!body) return;
    body.innerHTML = '<div class="gv7-loading-inline">Loading…</div>';

    try {
      if (tabName === 'overview') return await renderModOverview(body);
      if (tabName === 'announcements') return await renderModAnnouncements(body);
      if (tabName === 'featured') return await renderModFeatured(body);
      if (tabName === 'users') return await renderModUsers(body);
      if (tabName === 'games') return await renderModGames(body);
      if (tabName === 'roles') return await renderModRoles(body);
      if (tabName === 'reports') return await renderModReports(body);
      if (tabName === 'site') return await renderModSiteSettings(body);
    } catch (err) {
      body.innerHTML = `<div class="gv7-feedback-box error">Failed to load section: ${esc(err.message)}</div>`;
    }
  }

  async function renderModOverview(body) {
    const r = await apiFetch('/api/admin/overview');
    if (!r.ok || !r.data) {
      body.innerHTML = `<div class="gv7-feedback-box error">${esc((r.data && r.data.error) || 'Access denied')}</div>`;
      return;
    }
    const s = r.data.stats;
    body.innerHTML = `
      <h4 class="gv7-mod-h4">Games V7 Live Overview</h4>
      <div class="gv7-mod-stat-grid">
        <div class="gv7-mod-stat"><span>${s.online}</span><label>Visitors Online Now</label></div>
        <div class="gv7-mod-stat"><span>${s.totalUsers}</span><label>Registered Accounts</label></div>
        <div class="gv7-mod-stat"><span>${s.coOwners}</span><label>Co-Owners</label></div>
        <div class="gv7-mod-stat"><span>${s.moderators}</span><label>Moderators</label></div>
        <div class="gv7-mod-stat"><span>${s.activeAnnouncements}</span><label>Active Notices</label></div>
        <div class="gv7-mod-stat"><span>${s.hiddenGames}</span><label>Hidden Games</label></div>
        ${s.openReports !== null ? `<div class="gv7-mod-stat highlight"><span>${s.openReports}</span><label>Open Private Reports</label></div>` : ''}
      </div>
      <div class="gv7-mod-note">
        Signed in as <strong>${esc(platformState.user.displayName)}</strong> (<code>${esc(platformState.user.role)}</code>). All actions are validated server-side.
      </div>`;
  }

  async function renderModAnnouncements(body) {
    const r = await apiFetch('/api/admin/overview');
    const list = (r.ok && r.data && r.data.siteConfig && r.data.siteConfig.announcements) || [];
    body.innerHTML = `
      <h4 class="gv7-mod-h4">Manage Site Announcements</h4>
      <form id="gv7-mod-ann-form" class="gv7-mod-form">
        <div class="gv7-form-grid-2">
          <input type="text" id="gv7-mod-ann-title" class="gv7-input" placeholder="Title (e.g. New Games Added)" required maxlength="100" />
          <select id="gv7-mod-ann-tone" class="gv7-input">
            <option value="info">Info (Cyan)</option>
            <option value="success">Success (Green)</option>
            <option value="warning">Warning (Amber)</option>
            <option value="alert">Alert (Crimson)</option>
          </select>
        </div>
        <input type="text" id="gv7-mod-ann-msg" class="gv7-input" placeholder="Announcement message shown across Games V7..." required maxlength="500" />
        <button type="submit" class="gv7-btn gv7-btn-primary">Post Announcement</button>
      </form>
      <div class="gv7-mod-list" id="gv7-mod-ann-list">
        ${
          list.length
            ? list
                .map(
                  (a) => `
          <div class="gv7-mod-row">
            <div>
              <strong>${esc(a.title)}</strong> <span class="gv7-pill-tag">${esc(a.tone)}</span>
              <p>${esc(a.message)}</p>
              <small>By ${esc(a.author || 'Staff')} • ${new Date(a.createdAt).toLocaleString()}</small>
            </div>
            <button type="button" class="gv7-btn gv7-btn-danger gv7-btn-sm" data-del-ann="${esc(a.id)}">Remove</button>
          </div>`
                )
                .join('')
            : '<p class="gv7-muted">No announcements posted yet.</p>'
        }
      </div>`;

    document.getElementById('gv7-mod-ann-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await apiFetch('/api/admin/announcements', {
        method: 'POST',
        body: {
          title: document.getElementById('gv7-mod-ann-title').value.trim(),
          tone: document.getElementById('gv7-mod-ann-tone').value,
          message: document.getElementById('gv7-mod-ann-msg').value.trim(),
        },
      });
      if (res.ok) {
        notify('📢 Announcement published!');
        await loadSiteState();
        renderModAnnouncements(body);
      } else {
        notify('⚠️ ' + ((res.data && res.data.error) || 'Failed'));
      }
    });

    body.querySelectorAll('[data-del-ann]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await apiFetch(`/api/admin/announcements/${btn.getAttribute('data-del-ann')}`, { method: 'DELETE' });
        if (res.ok) {
          notify('Announcement removed.');
          await loadSiteState();
          renderModAnnouncements(body);
        }
      });
    });
  }

  async function renderModFeatured(body) {
    const r = await apiFetch('/api/admin/overview');
    const cats = (r.ok && r.data && r.data.siteConfig && r.data.siteConfig.featured && r.data.siteConfig.featured.categories) || [];
    body.innerHTML = `
      <h4 class="gv7-mod-h4">Featured Games Categories</h4>
      <p class="gv7-muted" style="margin-bottom:12px;">Enter comma-separated game IDs (e.g. <code>slope, retrobowl, minecraft, drift-boss</code>) for each featured shelf.</p>
      <div id="gv7-mod-feat-list" class="gv7-form-stack">
        ${cats
          .map(
            (c, i) => `
          <div class="gv7-mod-box" data-cat-idx="${i}">
            <div class="gv7-form-grid-2">
              <input type="text" class="gv7-input feat-title" value="${esc(c.title)}" placeholder="Category Title" />
              <input type="text" class="gv7-input feat-sub" value="${esc(c.subtitle || '')}" placeholder="Subtitle" />
            </div>
            <input type="text" class="gv7-input feat-ids" value="${esc((c.gameIds || []).join(', '))}" placeholder="Comma-separated game IDs" style="margin-top:8px;" />
          </div>`
          )
          .join('')}
      </div>
      <div class="gv7-form-actions" style="margin-top:14px;">
        <button type="button" id="gv7-mod-feat-save" class="gv7-btn gv7-btn-primary">Save Featured Games</button>
      </div>`;

    document.getElementById('gv7-mod-feat-save').addEventListener('click', async () => {
      const updated = [];
      body.querySelectorAll('.gv7-mod-box').forEach((box, idx) => {
        const title = box.querySelector('.feat-title').value.trim() || `Featured ${idx + 1}`;
        const subtitle = box.querySelector('.feat-sub').value.trim();
        const gameIds = box
          .querySelector('.feat-ids')
          .value.split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        updated.push({ id: (cats[idx] && cats[idx].id) || `cat-${idx + 1}`, title, subtitle, gameIds });
      });
      const res = await apiFetch('/api/admin/featured', { method: 'PUT', body: { categories: updated } });
      if (res.ok) {
        notify('⭐ Featured Games updated!');
        await loadSiteState();
      } else {
        notify('⚠️ ' + ((res.data && res.data.error) || 'Failed'));
      }
    });
  }

  async function renderModUsers(body) {
    const r = await apiFetch('/api/admin/users');
    const users = (r.ok && r.data && r.data.users) || [];
    body.innerHTML = `
      <h4 class="gv7-mod-h4">User Moderation (${users.length})</h4>
      <div class="gv7-mod-list">
        ${users
          .map((u) => {
            const canMod = u.role !== 'owner' && u.id !== platformState.user.id;
            return `
            <div class="gv7-mod-row">
              <div>
                <strong>${esc(u.displayName)}</strong> <span class="gv7-muted">@${esc(u.username)}</span>
                <span class="gv7-role-badge role-${esc(u.role)}">${esc(u.role.toUpperCase())}</span>
                ${u.banned ? '<span class="gv7-pill-tag danger">BANNED</span>' : ''}
              </div>
              <div>
                ${
                  canMod
                    ? `<button type="button" class="gv7-btn ${u.banned ? 'gv7-btn-ghost' : 'gv7-btn-danger'} gv7-btn-sm" data-ban-uid="${esc(u.id)}" data-next-ban="${!u.banned}">${u.banned ? 'Unban' : 'Ban'}</button>`
                    : '<span class="gv7-muted">Protected</span>'
                }
              </div>
            </div>`;
          })
          .join('')}
      </div>`;

    body.querySelectorAll('[data-ban-uid]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const uid = btn.getAttribute('data-ban-uid');
        const banned = btn.getAttribute('data-next-ban') === 'true';
        const res = await apiFetch(`/api/admin/users/${uid}/moderate`, {
          method: 'PATCH',
          body: { banned, reason: banned ? 'Moderated via Games V7 Mod Menu' : '' },
        });
        if (res.ok) {
          notify(banned ? 'User banned.' : 'User unbanned.');
          renderModUsers(body);
        } else {
          notify('⚠️ ' + ((res.data && res.data.error) || 'Action blocked'));
        }
      });
    });
  }

  async function renderModGames(body) {
    const r = await apiFetch('/api/admin/overview');
    const hiddenSet = new Set((r.ok && r.data && r.data.siteConfig && r.data.siteConfig.hiddenGames) || []);
    const allGames = window.__GV7_APP__ ? window.__GV7_APP__.getGames() : [];

    body.innerHTML = `
      <h4 class="gv7-mod-h4">Game Catalog Visibility (Co-Owner / Owner)</h4>
      <div class="gv7-mod-form">
        <div class="gv7-form-grid-2">
          <input type="text" id="gv7-mod-game-search" class="gv7-input" placeholder="Filter games by title or ID..." />
          <input type="text" id="gv7-mod-game-hide-id" class="gv7-input" placeholder="Hide/Unhide game ID directly" />
        </div>
        <button type="button" id="gv7-mod-game-toggle-btn" class="gv7-btn gv7-btn-ghost">Toggle Game Visibility by ID</button>
      </div>
      <div class="gv7-mod-list" id="gv7-mod-games-list"></div>`;

    async function saveHidden() {
      const res = await apiFetch('/api/admin/games', { method: 'PUT', body: { hiddenGames: Array.from(hiddenSet) } });
      if (res.ok) {
        notify('🎮 Catalog visibility saved!');
        if (window.__GV7_APP__) await window.__GV7_APP__.reloadCatalog();
        await loadSiteState();
        renderList();
      }
    }

    function renderList(filter = '') {
      const wrap = document.getElementById('gv7-mod-games-list');
      if (!wrap) return;
      const q = filter.toLowerCase().trim();
      const hiddenItems = Array.from(hiddenSet).map((id) => ({ id, title: id, isHiddenOnly: true }));
      const pool = [...hiddenItems, ...allGames.filter((g) => !hiddenSet.has(g.id || g.folder))];
      const matches = pool
        .filter((g) => !q || `${g.title || ''} ${g.id || ''} ${g.folder || ''}`.toLowerCase().includes(q))
        .slice(0, 35);

      wrap.innerHTML = matches
        .map((g) => {
          const gid = g.id || g.folder;
          const isHidden = hiddenSet.has(gid);
          return `
          <div class="gv7-mod-row">
            <div><strong>${esc(g.title || gid)}</strong> <code class="gv7-muted">${esc(gid)}</code> ${isHidden ? '<span class="gv7-pill-tag danger">HIDDEN</span>' : ''}</div>
            <button type="button" class="gv7-btn ${isHidden ? 'gv7-btn-primary' : 'gv7-btn-ghost'} gv7-btn-sm" data-toggle-gid="${esc(gid)}">${isHidden ? 'Unhide' : 'Hide'}</button>
          </div>`;
        })
        .join('');

      wrap.querySelectorAll('[data-toggle-gid]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const gid = btn.getAttribute('data-toggle-gid');
          if (hiddenSet.has(gid)) hiddenSet.delete(gid);
          else hiddenSet.add(gid);
          saveHidden();
        });
      });
    }

    renderList();
    document.getElementById('gv7-mod-game-search').addEventListener('input', (e) => renderList(e.target.value));
    document.getElementById('gv7-mod-game-toggle-btn').addEventListener('click', () => {
      const gid = document.getElementById('gv7-mod-game-hide-id').value.trim();
      if (!gid) return;
      if (hiddenSet.has(gid)) hiddenSet.delete(gid);
      else hiddenSet.add(gid);
      document.getElementById('gv7-mod-game-hide-id').value = '';
      saveHidden();
    });
  }

  async function renderModRoles(body) {
    const r = await apiFetch('/api/admin/users');
    const users = (r.ok && r.data && r.data.users) || [];
    body.innerHTML = `
      <h4 class="gv7-mod-h4">👑 Owner Role &amp; Co-Owner Manager</h4>
      <p class="gv7-muted" style="margin-bottom:12px;">Only the official <strong>Bokit</strong> Owner account can assign or revoke Co-Owner and Moderator permissions. Private Bug Reports and Role Management always remain Owner-only.</p>
      <div class="gv7-mod-list">
        ${users
          .map((u) => {
            if (u.role === 'owner') {
              return `<div class="gv7-mod-row"><div><strong>${esc(u.displayName)}</strong> (@${esc(u.username)}) <span class="gv7-role-badge role-owner">OWNER</span></div><span class="gv7-muted">Primary Owner</span></div>`;
            }
            const p = u.permissions || {};
            return `
            <div class="gv7-mod-box" data-role-uid="${esc(u.id)}">
              <div class="gv7-mod-row" style="border:none;padding:0;margin-bottom:8px;">
                <div><strong>${esc(u.displayName)}</strong> <span class="gv7-muted">@${esc(u.username)}</span></div>
                <select class="gv7-input gv7-role-select" style="width:auto;min-width:140px;">
                  <option value="user" ${u.role === 'user' ? 'selected' : ''}>User (Standard)</option>
                  <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                  <option value="co-owner" ${u.role === 'co-owner' ? 'selected' : ''}>Co-Owner</option>
                </select>
              </div>
              <div class="gv7-perm-checks">
                <label><input type="checkbox" class="perm-games" ${p.manageGames ? 'checked' : ''} /> Manage Games</label>
                <label><input type="checkbox" class="perm-featured" ${p.manageFeatured ? 'checked' : ''} /> Featured</label>
                <label><input type="checkbox" class="perm-ann" ${p.manageAnnouncements ? 'checked' : ''} /> Announcements</label>
                <label><input type="checkbox" class="perm-mod" ${p.moderateUsers ? 'checked' : ''} /> Moderate Users</label>
              </div>
              <button type="button" class="gv7-btn gv7-btn-primary gv7-btn-sm gv7-save-role-btn" style="margin-top:10px;">Save Role &amp; Permissions</button>
            </div>`;
          })
          .join('')}
      </div>`;

    body.querySelectorAll('.gv7-save-role-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const box = btn.closest('[data-role-uid]');
        const uid = box.getAttribute('data-role-uid');
        const role = box.querySelector('.gv7-role-select').value;
        const permissions = {
          manageGames: box.querySelector('.perm-games').checked,
          manageFeatured: box.querySelector('.perm-featured').checked,
          manageAnnouncements: box.querySelector('.perm-ann').checked,
          moderateUsers: box.querySelector('.perm-mod').checked,
        };
        const res = await apiFetch(`/api/admin/users/${uid}/role`, {
          method: 'PATCH',
          body: { role, permissions },
        });
        if (res.ok) {
          notify(`👑 Updated role to ${role.toUpperCase()}!`);
          renderModRoles(body);
        } else {
          notify('⚠️ ' + ((res.data && res.data.error) || 'Failed'));
        }
      });
    });
  }

  async function renderModReports(body, filterStatus = 'all') {
    const r = await apiFetch(`/api/admin/reports?status=${encodeURIComponent(filterStatus)}`);
    if (!r.ok || !r.data) {
      body.innerHTML = `<div class="gv7-feedback-box error">${esc((r.data && r.data.error) || 'Owner access required')}</div>`;
      return;
    }
    const reports = r.data.reports || [];
    body.innerHTML = `
      <div class="gv7-mod-row" style="border:none;padding:0 0 12px;">
        <h4 class="gv7-mod-h4" style="margin:0;">📩 Private Bug Reports Inbox (${reports.length})</h4>
        <select id="gv7-mod-rep-filter" class="gv7-input" style="width:auto;">
          <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="open" ${filterStatus === 'open' ? 'selected' : ''}>Open</option>
          <option value="reviewed" ${filterStatus === 'reviewed' ? 'selected' : ''}>Reviewed</option>
          <option value="resolved" ${filterStatus === 'resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </div>
      <div class="gv7-mod-list">
        ${
          reports.length
            ? reports
                .map(
                  (rep) => `
          <div class="gv7-mod-box">
            <div class="gv7-mod-row" style="border:none;padding:0 0 6px;">
              <div>
                <span class="gv7-pill-tag">${esc(rep.category.toUpperCase())}</span>
                <span class="gv7-pill-tag status-${esc(rep.status)}">${esc(rep.status.toUpperCase())}</span>
                <strong>${esc(rep.subject)}</strong>
              </div>
              <small class="gv7-muted">${new Date(rep.createdAt).toLocaleString()}</small>
            </div>
            <p style="margin:6px 0;white-space:pre-wrap;">${esc(rep.message)}</p>
            <small class="gv7-muted">From: ${esc(rep.submittedBy || 'guest')}${rep.contact ? ` • Contact: ${esc(rep.contact)}` : ''}</small>
            <div class="gv7-form-actions" style="margin-top:10px;justify-content:flex-start;">
              <button type="button" class="gv7-btn gv7-btn-ghost gv7-btn-sm" data-rep-id="${esc(rep.id)}" data-rep-status="reviewed">Mark Reviewed</button>
              <button type="button" class="gv7-btn gv7-btn-primary gv7-btn-sm" data-rep-id="${esc(rep.id)}" data-rep-status="resolved">Mark Resolved</button>
            </div>
          </div>`
                )
                .join('')
            : '<p class="gv7-muted">No reports in this view.</p>'
        }
      </div>`;

    document.getElementById('gv7-mod-rep-filter').addEventListener('change', (e) => {
      renderModReports(body, e.target.value);
    });
    body.querySelectorAll('[data-rep-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-rep-id');
        const status = btn.getAttribute('data-rep-status');
        const res = await apiFetch(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status } });
        if (res.ok) {
          notify(`Report marked as ${status}.`);
          renderModReports(body, filterStatus);
        }
      });
    });
  }

  async function renderModSiteSettings(body) {
    const r = await apiFetch('/api/admin/overview');
    const cfg = (r.ok && r.data && r.data.siteConfig) || {};
    body.innerHTML = `
      <h4 class="gv7-mod-h4">🎨 Owner Site Customization</h4>
      <form id="gv7-mod-site-form" class="gv7-form-stack">
        <div class="gv7-field"><label>Site Name</label><input type="text" id="gv7-ms-name" class="gv7-input" value="${esc(cfg.siteName || 'Games V7')}" maxlength="48" /></div>
        <div class="gv7-field"><label>Tagline</label><input type="text" id="gv7-ms-tag" class="gv7-input" value="${esc(cfg.tagline || 'Skeletal Flowers Retro Arcade')}" maxlength="80" /></div>
        <div class="gv7-field"><label>Global Top Banner Notice (Optional)</label><input type="text" id="gv7-ms-banner" class="gv7-input" value="${esc(cfg.bannerText || '')}" maxlength="240" placeholder="Leave blank for none" /></div>
        <div class="gv7-field"><label>Maintenance / Status Notice (Optional)</label><input type="text" id="gv7-ms-maint" class="gv7-input" value="${esc(cfg.maintenanceNotice || '')}" maxlength="240" placeholder="Leave blank for none" /></div>
        <button type="submit" class="gv7-btn gv7-btn-primary">Save Site Settings</button>
      </form>`;

    document.getElementById('gv7-mod-site-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: {
          siteName: document.getElementById('gv7-ms-name').value.trim(),
          tagline: document.getElementById('gv7-ms-tag').value.trim(),
          bannerText: document.getElementById('gv7-ms-banner').value.trim(),
          maintenanceNotice: document.getElementById('gv7-ms-maint').value.trim(),
        },
      });
      if (res.ok) {
        notify('🎨 Site settings updated!');
        await loadSiteState();
      } else {
        notify('⚠️ ' + ((res.data && res.data.error) || 'Failed'));
      }
    });
  }

  function initModMenu() {
    const modal = document.getElementById('gv7-mod-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModMenu();
      });
    }
    const sidebar = document.getElementById('gv7-mod-sidebar');
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        const btn = e.target.closest('.gv7-mod-nav-btn');
        if (!btn) return;
        loadModTab(btn.getAttribute('data-mod-tab'));
      });
    }
  }

  // =========================================================================
  // BOOTSTRAP
  // =========================================================================
  window.GV7Platform = {
    openAuthModal,
    closeAuthModal,
    openModMenu,
    closeModMenu,
    logout,
    syncAccountNow,
    importLocalToAccount,
    scheduleAccountSync,
    applyTaskbarPosition,
    playRandomFeatured,
    openInProxyTab,
    refreshSiteState: loadSiteState,
    getUser: () => platformState.user,
  };

  window.addEventListener('gv7:gamesloaded', () => renderFeaturedGames());
  window.addEventListener('gv7:userdata-changed', () => {
    scheduleAccountSync();
    renderFeaturedGames();
  });
  window.addEventListener('gv7:tabchange', (e) => {
    if (e.detail && e.detail.tab === 'featured') {
      renderFeaturedGames();
    }
  });

  function bootstrap() {
    initTaskbar();
    initAuthModal();
    initModMenu();
    initProxyBrowser();
    initIntegrationsSettings();
    initBugReportForm();
    restoreSession().then(() => {
      initWelcomeScreen();
    });
    initPresence();
    loadSiteState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
