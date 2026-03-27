/* ============================================================
   game.js — Game detail/play page logic
   ============================================================ */

(function () {
  'use strict';

  // ---- Particles ----
  initParticles();

  // ---- Parse ?game=FolderName ----
  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');

  if (!gameName) {
    showError('No game specified. Go back and choose a game.');
    return;
  }

  // ---- DOM refs ----
  const pageTitle = document.getElementById('page-title');
  const pageMeta = document.getElementById('page-desc');
  const iframeTitleEl = document.getElementById('iframe-game-title');
  const iframeLoading = document.getElementById('iframe-loading');
  const iframeError = document.getElementById('iframe-error');
  const iframeErrorMsg = document.getElementById('iframe-error-msg');
  const gameFrame = document.getElementById('game-frame');
  const iframeContainer = document.getElementById('iframe-container');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnReload = document.getElementById('btn-reload');
  const btnRetry = document.getElementById('btn-retry');
  const sidebarLoading = document.getElementById('sidebar-loading');
  const sidebarContent = document.getElementById('sidebar-content');

  // ---- Load metadata ----
  loadGame();

  async function loadGame() {
    try {
      const res = await fetch(`Games/${gameName}/game.json`);
      if (!res.ok) throw new Error(`game.json not found for "${gameName}"`);
      const game = await res.json();
      game._folder = gameName;

      populateSidebar(game);
      loadIframe(gameName, game);
    } catch (err) {
      console.error('[Psharkcat]', err);
      showError(err.message || 'Could not load game metadata.');
    }
  }

  // ---- Sidebar ----
  function populateSidebar(game) {
    // Page title & meta
    const title = game.title || game._folder;
    pageTitle.textContent = `${title} — PSHARKCAT`;
    pageMeta.setAttribute('content', game.description || `Play ${title} on Psharkcat.`);

    // Iframe toolbar title
    iframeTitleEl.textContent = title;

    // Thumbnail
    const thumbImg = document.getElementById('sidebar-thumb');
    const thumbFallback = document.getElementById('sidebar-thumb-fallback');
    if (game.thumbnail) {
      thumbImg.src = `Games/${game._folder}/${game.thumbnail}`;
      thumbImg.alt = title;
      thumbImg.addEventListener('error', () => {
        thumbImg.classList.add('hidden');
        thumbFallback.classList.remove('hidden');
      });
    } else {
      thumbImg.classList.add('hidden');
      thumbFallback.classList.remove('hidden');
    }

    // Title
    document.getElementById('sidebar-title').textContent = title;

    // Badges
    const versionBadge = document.getElementById('badge-version');
    versionBadge.textContent = game.version ? `v${game.version}` : '';
    if (!game.version) versionBadge.style.display = 'none';

    if (game.featured) {
      document.getElementById('badge-featured').classList.remove('hidden');
    }

    // Description
    document.getElementById('sidebar-desc').textContent = game.description || '';

    // Meta rows
    setMeta('meta-author', 'meta-author-wrap', game.author);
    setMeta('meta-date', 'meta-date-wrap', formatDate(game.releaseDate));
    setMeta('meta-controls', 'meta-controls-wrap', game.controls);

    // Tags
    const tagsEl = document.getElementById('sidebar-tags');
    (game.tags || []).forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = tag;
      tagsEl.appendChild(chip);
    });

    // Show sidebar
    sidebarLoading.style.display = 'none';
    sidebarContent.classList.remove('hidden');
  }

  function setMeta(valId, wrapId, value) {
    const wrap = document.getElementById(wrapId);
    if (!value) { wrap.style.display = 'none'; return; }
    document.getElementById(valId).textContent = value;
  }

  // ---- Iframe ----
  function loadIframe(name) {
    const src = `Games/${name}/index.html`;
    iframeLoading.style.display = 'flex';
    iframeError.classList.add('hidden');
    gameFrame.classList.add('hidden');

    gameFrame.src = src;
    gameFrame.addEventListener('load', onFrameLoad, { once: true });
    gameFrame.addEventListener('error', onFrameError, { once: true });

    // Fallback timeout — Godot loads can be slow
    const timeout = setTimeout(() => {
      // If still loading after 30s, assume it's errored
      if (iframeLoading.style.display !== 'none') {
        onFrameError();
      }
    }, 30000);

    function onFrameLoad() {
      clearTimeout(timeout);
      iframeLoading.style.display = 'none';
      gameFrame.classList.remove('hidden');
      
      // Attempt to focus the iframe immediately for Godot input grabbing
      setTimeout(() => gameFrame.contentWindow?.focus(), 100);

      // Add a fading hint about clicking to start Audio
      const hint = document.createElement('div');
      hint.className = 'audio-hint';
      hint.innerHTML = '<span class="state-icon" style="font-size:1.2rem">🔊</span> Click inside the game to enable Audio';
      iframeContainer.appendChild(hint);
      
      // Fade out after a few seconds or when clicked
      setTimeout(() => hint.classList.add('fade-out'), 4000);
      setTimeout(() => hint.remove(), 5000);
    }

    function onFrameError() {
      clearTimeout(timeout);
      iframeLoading.style.display = 'none';
      iframeError.classList.remove('hidden');
      iframeErrorMsg.textContent = `Could not load "Games/${name}/index.html". Make sure your Godot web export is in this folder.`;
    }
  }

  // Reload
  btnReload.addEventListener('click', () => {
    loadIframe(gameName);
  });
  btnRetry.addEventListener('click', () => {
    loadIframe(gameName);
  });

  // ---- Fullscreen ----
  let isFullscreen = false;
  const expandIcon = document.getElementById('fullscreen-icon-expand');
  const collapseIcon = document.getElementById('fullscreen-icon-collapse');

  btnFullscreen.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncFullscreenIcon);
  document.addEventListener('webkitfullscreenchange', syncFullscreenIcon);

  function toggleFullscreen() {
    const el = iframeContainer;
    if (!isFullscreen) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    } else {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) ex.call(document);
    }
  }

  function syncFullscreenIcon() {
    isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    expandIcon.style.display = isFullscreen ? 'none' : 'block';
    collapseIcon.style.display = isFullscreen ? 'block' : 'none';
  }

  // ---- Error state ----
  function showError(msg) {
    iframeLoading.style.display = 'none';
    iframeError.classList.remove('hidden');
    iframeErrorMsg.textContent = msg;
    sidebarLoading.style.display = 'none';
    sidebarContent.classList.remove('hidden');
    document.getElementById('sidebar-title').textContent = gameName || 'Error';
  }

  // ---- Helpers ----
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return dateStr; }
  }

  // ============================================================
  // Particle Background
  // ============================================================
  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '0,240,255' : '176,96,255',
    }));
    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

})();
