/* ============================================================
   main.js — Homepage: discover games, render cards, filter
   ============================================================ */

(function () {
  'use strict';

  // ---- Particle Background ----
  initParticles();

  // ---- DOM refs ----
  const grid = document.getElementById('games-grid');
  const stateLoading = document.getElementById('state-loading');
  const stateEmpty = document.getElementById('state-empty');
  const searchInput = document.getElementById('search-input');
  const tagFiltersEl = document.getElementById('tag-filters');
  const cardTemplate = document.getElementById('card-template');

  let allGames = [];
  let activeTag = 'all';
  let searchQuery = '';

  // ---- Bootstrap ----
  loadGames();

  async function loadGames() {
    try {
      // 1. Fetch the manifest
      const manifestRes = await fetch('games-list.json');
      if (!manifestRes.ok) throw new Error('Could not load games-list.json');
      const gameNames = await manifestRes.json();

      // 2. Fetch each game's metadata in parallel
      const results = await Promise.allSettled(
        gameNames.map(name => fetchGameMeta(name))
      );

      allGames = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .sort((a, b) => {
          // Featured games first, then by release date descending
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        });

      // 3. Build tag list
      buildTagFilters(allGames);

      // 4. Render
      renderCards(allGames);
    } catch (err) {
      console.error('[Psharkcat]', err);
      stateLoading.style.display = 'none';
      stateEmpty.classList.remove('hidden');
      stateEmpty.querySelector('p').textContent = 'Failed to load games. Check games-list.json.';
    }
  }

  async function fetchGameMeta(name) {
    const res = await fetch(`Games/${name}/game.json`);
    if (!res.ok) throw new Error(`Missing game.json for ${name}`);
    const data = await res.json();
    return { ...data, _folder: name };
  }

  // ---- Tag Filters ----
  function buildTagFilters(games) {
    const tagSet = new Set();
    games.forEach(g => (g.tags || []).forEach(t => tagSet.add(t)));
    tagSet.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.dataset.tag = tag;
      btn.textContent = tag;
      tagFiltersEl.appendChild(btn);
    });
    tagFiltersEl.addEventListener('click', e => {
      const btn = e.target.closest('.tag-btn');
      if (!btn) return;
      activeTag = btn.dataset.tag;
      tagFiltersEl.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCards(filterGames());
    });
  }

  // ---- Search ----
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderCards(filterGames());
  });

  function filterGames() {
    return allGames.filter(g => {
      const matchTag = activeTag === 'all' || (g.tags || []).includes(activeTag);
      const matchSearch =
        !searchQuery ||
        (g.title || '').toLowerCase().includes(searchQuery) ||
        (g.description || '').toLowerCase().includes(searchQuery) ||
        (g.author || '').toLowerCase().includes(searchQuery) ||
        (g.tags || []).some(t => t.toLowerCase().includes(searchQuery));
      return matchTag && matchSearch;
    });
  }

  // ---- Render Cards ----
  function renderCards(games) {
    stateLoading.style.display = 'none';
    grid.innerHTML = '';

    if (games.length === 0) {
      stateEmpty.classList.remove('hidden');
      return;
    }
    stateEmpty.classList.add('hidden');

    games.forEach((game, idx) => {
      const card = buildCard(game, idx);
      grid.appendChild(card);
    });
  }

  function buildCard(game, idx) {
    const clone = cardTemplate.content.cloneNode(true);
    const article = clone.querySelector('.game-card');

    // Stagger animation delay
    article.style.animationDelay = `${idx * 60}ms`;

    // Thumbnail
    const thumb = article.querySelector('.card-thumb');
    const fallback = article.querySelector('.card-thumb-fallback');
    if (game.thumbnail) {
      thumb.src = `Games/${game._folder}/${game.thumbnail}`;
      thumb.alt = game.title || game._folder;
      thumb.addEventListener('load', () => thumb.classList.add('loaded'));
      thumb.addEventListener('error', () => {
        thumb.style.display = 'none';
        fallback.classList.remove('hidden');
      });
    } else {
      thumb.style.display = 'none';
      fallback.classList.remove('hidden');
    }

    // Featured badge
    if (game.featured) {
      article.querySelector('.card-featured-badge').classList.remove('hidden');
    }

    // Text content
    article.querySelector('.card-title').textContent = game.title || game._folder;
    article.querySelector('.card-version').textContent = game.version ? `v${game.version}` : '';
    article.querySelector('.card-desc').textContent = game.description || '';

    // Tags
    const tagsEl = article.querySelector('.card-tags');
    (game.tags || []).slice(0, 4).forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = tag;
      tagsEl.appendChild(chip);
    });

    // Meta
    article.querySelector('.card-author').textContent = game.author ? `👤 ${game.author}` : '';
    article.querySelector('.card-date').textContent = formatDate(game.releaseDate);

    // Click → game page
    const navigate = () => {
      window.location.href = `game.html?game=${encodeURIComponent(game._folder)}`;
    };
    article.addEventListener('click', navigate);
    article.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') navigate();
    });

    return clone;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
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

    let W, H, particles;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '0,240,255' : '176,96,255',
      };
    }

    particles = Array.from({ length: 120 }, makeParticle);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
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
