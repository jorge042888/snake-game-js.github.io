/**
 * Snake — Juego clásico
 * Canvas 520×520, grid 26×26 celdas de 20px
 */

(function () {
  'use strict';

  const GRID_SIZE = 26;
  const CELL_SIZE = 20;
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

  const Direction = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 },
  };

  const KEY = {
    UP: ['ArrowUp', 'KeyW'],
    DOWN: ['ArrowDown', 'KeyS'],
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    PAUSE: 'Space',
    RESTART: 'Escape',
  };

  const HIGH_SCORE_KEY = 'snake-high-score';
  const GAME_STATS_KEY = 'snake-game-stats';
  const MAX_STORED_GAMES = 100;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  const finalScoreEl = document.getElementById('final-score');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const pauseOverlay = document.getElementById('pause-overlay');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const playerNameInput = document.getElementById('player-name');
  const playerBadge = document.getElementById('player-badge');
  const gameOverPlayerEl = document.getElementById('game-over-player');
  const bestPlayerNameEl = document.getElementById('best-player-name');
  const rulesOverlay = document.getElementById('rules-overlay');
  const rulesBtn = document.getElementById('rules-btn');
  const rulesClose = document.getElementById('rules-close');

  let playerName = '';
  let snake = [];
  let direction = Direction.RIGHT;
  let nextDirection = Direction.RIGHT;
  let food = null;
  let score = 0;
  let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  let gameLoopId = null;
  let isRunning = false;
  let isPaused = false;
  let lastTick = 0;
  let lastDrawTime = 0;
  let gameStartTime = 0;
  const TICK_MS = 120;

  // Gestos táctiles (swipe) en el canvas
  let touchStartX = null;
  let touchStartY = null;
  let touchLastX = null;
  let touchLastY = null;

  /** Efecto luminoso al recoger comida: { x, y (px), startTime } */
  let collectEffects = [];
  const COLLECT_EFFECT_DURATION_MS = 550;
  const PARTICLE_COUNT = 16;

  /** Obstáculos/muros: array de { x, y } en celdas del grid. Tamaño 1×1 por celda. */
  let obstacles = [];
  const OBSTACLE_CELLS_PER_FOOD = 1;

  highScoreEl.textContent = highScore;

  function randomCell() {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }

  function spawnFood() {
    let cell;
    do {
      cell = randomCell();
    } while (
      snake.some((s) => s.x === cell.x && s.y === cell.y) ||
      obstacles.some((o) => o.x === cell.x && o.y === cell.y)
    );
    food = cell;
  }

  function isCellFree(cx, cy) {
    if (snake.some((s) => s.x === cx && s.y === cy)) return false;
    if (food && food.x === cx && food.y === cy) return false;
    if (obstacles.some((o) => o.x === cx && o.y === cy)) return false;
    return true;
  }

  function spawnObstacle() {
    for (let n = 0; n < OBSTACLE_CELLS_PER_FOOD; n++) {
      let attempts = 0;
      const maxAttempts = GRID_SIZE * GRID_SIZE;
      while (attempts < maxAttempts) {
        const cell = randomCell();
        if (isCellFree(cell.x, cell.y)) {
          obstacles.push({ x: cell.x, y: cell.y });
          break;
        }
        attempts++;
      }
    }
  }

  function initGame() {
    collectEffects = [];
    obstacles = [];
    const head = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) };
    snake = [
      { ...head },
      { x: head.x - 1, y: head.y },
      { x: head.x - 2, y: head.y },
    ];
    direction = Direction.RIGHT;
    nextDirection = Direction.RIGHT;
    score = 0;
    scoreEl.textContent = '0';
    spawnFood();
    isRunning = true;
    isPaused = false;
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(56, 205, 235, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const p = i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(CANVAS_SIZE, p);
      ctx.stroke();
    }
  }

  function drawSnake() {
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    gradient.addColorStop(0, '#5dd4f0');
    gradient.addColorStop(0.5, '#38CDEB');
    gradient.addColorStop(1, '#2ab8d4');

    snake.forEach((segment, i) => {
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const isHead = i === 0;
      const radius = isHead ? CELL_SIZE / 2 - 1 : CELL_SIZE / 2 - 2;
      const cx = x + CELL_SIZE / 2;
      const cy = y + CELL_SIZE / 2;

      if (isHead) {
        ctx.shadowColor = 'rgba(56, 205, 235, 0.6)';
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(10, 14, 20, 0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawObstacles() {
    obstacles.forEach((obs) => {
      const x = obs.x * CELL_SIZE;
      const y = obs.y * CELL_SIZE;
      const inset = 2;
      const w = CELL_SIZE - inset * 2;
      const h = CELL_SIZE - inset * 2;

      // Bloque brillante en tonos #EB8DFC
      const grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
      grad.addColorStop(0, '#EB8DFC');
      grad.addColorStop(0.5, '#f4b4ff');
      grad.addColorStop(1, '#c05ae3');

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(235, 141, 252, 0.7)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.rect(x + inset, y + inset, w, h);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(235, 141, 252, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + inset + 0.5, y + inset + 0.5, w - 1, h - 1);
    });
  }

  function drawFood() {
    if (!food) return;
    const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = food.y * CELL_SIZE + CELL_SIZE / 2;

    ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function triggerCollectEffect(centerX, centerY) {
    collectEffects.push({
      x: centerX,
      y: centerY,
      startTime: performance.now(),
    });
  }

  function drawCollectEffects(now) {
    const toRemove = [];
    collectEffects.forEach((eff, i) => {
      const elapsed = now - eff.startTime;
      if (elapsed >= COLLECT_EFFECT_DURATION_MS) {
        toRemove.push(i);
        return;
      }
      const t = elapsed / COLLECT_EFFECT_DURATION_MS; // 0 .. 1

      // Anillo luminoso que se expande y se desvanece
      const ringRadius = 8 + t * 65;
      const ringAlpha = Math.max(0, (1 - t) * 0.9);
      ctx.strokeStyle = `rgba(56, 205, 235, ${ringAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(56, 205, 235, 0.9)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Segundo anillo más suave (blanco/cyan)
      const ring2Radius = 12 + t * 50;
      const ring2Alpha = Math.max(0, (1 - t * 1.2) * 0.5);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ring2Alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, ring2Radius, 0, Math.PI * 2);
      ctx.stroke();

      // Partículas que explotan desde el centro
      for (let p = 0; p < PARTICLE_COUNT; p++) {
        const angle = (p / PARTICLE_COUNT) * Math.PI * 2 + t * 0.5;
        const dist = t * 42;
        const px = eff.x + Math.cos(angle) * dist;
        const py = eff.y + Math.sin(angle) * dist;
        const particleAlpha = Math.max(0, (1 - t * 1.1));
        const size = 2 + (1 - t) * 2;
        ctx.fillStyle = p % 3 === 0
          ? `rgba(255, 255, 255, ${particleAlpha})`
          : `rgba(56, 205, 235, ${particleAlpha})`;
        ctx.shadowColor = 'rgba(56, 205, 235, 0.8)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Flash central breve
      const flashAlpha = Math.max(0, (1 - t * 4) * 0.7);
      if (flashAlpha > 0) {
        const g = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, 25);
        g.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        g.addColorStop(0.4, `rgba(56, 205, 235, ${flashAlpha * 0.5})`);
        g.addColorStop(1, 'rgba(56, 205, 235, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(eff.x - 30, eff.y - 30, 60, 60);
      }
    });
    toRemove.reverse().forEach((i) => collectEffects.splice(i, 1));
  }

  function draw(now) {
    now = now || performance.now();
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid();
    drawObstacles();
    drawFood();
    drawSnake();
    drawCollectEffects(now);
  }

  function tick() {
    if (!isRunning || isPaused) return;

    direction = nextDirection;
    const head = snake[0];
    const newHead = {
      x: (head.x + direction.dx + GRID_SIZE) % GRID_SIZE,
      y: (head.y + direction.dy + GRID_SIZE) % GRID_SIZE,
    };

    if (snake.some((s, i) => i > 0 && s.x === newHead.x && s.y === newHead.y)) {
      gameOver();
      return;
    }
    if (obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (food && newHead.x === food.x && newHead.y === food.y) {
      const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
      triggerCollectEffect(cx, cy);
      score += 10;
      scoreEl.textContent = score;
      spawnObstacle();
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
      }
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function runLoop(timestamp) {
    if (!isRunning) return;
    if (timestamp - lastTick >= TICK_MS) {
      lastTick = timestamp;
      tick();
    }
    draw(timestamp);
    gameLoopId = requestAnimationFrame(runLoop);
  }

  function startGame() {
    const name = (playerNameInput && playerNameInput.value && playerNameInput.value.trim()) || 'Jugador';
    playerName = name.trim().slice(0, 30);
    if (playerNameInput) playerNameInput.value = playerName;
    startScreen.classList.remove('overlay-visible');
    if (playerBadge) {
      playerBadge.textContent = playerName;
      playerBadge.removeAttribute('aria-hidden');
    }
    initGame();
    draw();
    lastTick = performance.now();
    gameStartTime = performance.now();
    gameLoopId = requestAnimationFrame(runLoop);
  }

  function updateBestPlayerFromStats() {
    if (!bestPlayerNameEl) return;
    let stats = [];
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      if (raw) stats = JSON.parse(raw);
    } catch (_) {
      stats = [];
    }
    if (!stats.length) {
      bestPlayerNameEl.textContent = 'Aún sin registros';
      return;
    }
    let best = stats[0];
    for (let i = 1; i < stats.length; i++) {
      if (stats[i].score > best.score) {
        best = stats[i];
      }
    }
    const name = (best.playerName || 'Jugador').toString().slice(0, 30);
    bestPlayerNameEl.textContent = name;
    if (playerNameInput && !playerNameInput.value) {
      playerNameInput.value = name;
    }
  }

  function saveGameStats() {
    const durationSec = Math.round((performance.now() - gameStartTime) / 1000);
    const entry = {
      score,
      playerName: playerName || 'Jugador',
      date: new Date().toISOString(),
      duration: durationSec,
    };
    let stats = [];
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      if (raw) stats = JSON.parse(raw);
    } catch (_) {}
    stats.unshift(entry);
    if (stats.length > MAX_STORED_GAMES) stats = stats.slice(0, MAX_STORED_GAMES);
    try {
      localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
    } catch (_) {}
  }

  function gameOver() {
    isRunning = false;
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }
    saveGameStats();
    finalScoreEl.textContent = score;
    if (gameOverPlayerEl) gameOverPlayerEl.textContent = playerName ? `${playerName}, ` : '';
    gameOverScreen.classList.add('overlay-visible');
  }

  function restart() {
    gameOverScreen.classList.remove('overlay-visible');
    startGame();
  }

  function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    pauseOverlay.classList.toggle('overlay-visible', isPaused);
    if (!isPaused) {
      lastTick = performance.now();
    }
  }

  function handleKeydown(e) {
    if (e.repeat) return;

    if (e.code === KEY.PAUSE) {
      e.preventDefault();
      if (isRunning) togglePause();
      return;
    }

    if (e.code === KEY.RESTART) {
      e.preventDefault();
      if (isRunning && !isPaused) {
        restart();
      }
      return;
    }

    if (isPaused) return;

    if (KEY.UP.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.UP);
    } else if (KEY.DOWN.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.DOWN);
    } else if (KEY.LEFT.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.LEFT);
    } else if (KEY.RIGHT.includes(e.code)) {
      e.preventDefault();
      changeDirection(Direction.RIGHT);
    }
  }

  function changeDirection(newDir) {
    if (!isRunning || isPaused) return;
    if (newDir === Direction.UP && direction !== Direction.DOWN) {
      nextDirection = Direction.UP;
    } else if (newDir === Direction.DOWN && direction !== Direction.UP) {
      nextDirection = Direction.DOWN;
    } else if (newDir === Direction.LEFT && direction !== Direction.RIGHT) {
      nextDirection = Direction.LEFT;
    } else if (newDir === Direction.RIGHT && direction !== Direction.LEFT) {
      nextDirection = Direction.RIGHT;
    }
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchLastX = touchStartX;
    touchLastY = touchStartY;
  }

  function handleTouchMove(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchLastX = t.clientX;
    touchLastY = t.clientY;
    // Evita scroll mientras se hace swipe sobre el canvas
    e.preventDefault();
  }

  function handleTouchEnd() {
    if (touchStartX == null || touchLastX == null) return;
    const dx = touchLastX - touchStartX;
    const dy = touchLastY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24; // píxeles mínimos para considerar swipe

    if (absX < threshold && absY < threshold) {
      touchStartX = touchStartY = touchLastX = touchLastY = null;
      return;
    }

    if (absX > absY) {
      // Swipe horizontal
      if (dx > 0) {
        changeDirection(Direction.RIGHT);
      } else {
        changeDirection(Direction.LEFT);
      }
    } else {
      // Swipe vertical
      if (dy > 0) {
        changeDirection(Direction.DOWN);
      } else {
        changeDirection(Direction.UP);
      }
    }

    touchStartX = touchStartY = touchLastX = touchLastY = null;
  }

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restart);
  document.addEventListener('keydown', handleKeydown);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  function openRules() {
    if (!rulesOverlay) return;
    rulesOverlay.classList.add('visible');
    rulesOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeRules() {
    if (!rulesOverlay) return;
    rulesOverlay.classList.remove('visible');
    rulesOverlay.setAttribute('aria-hidden', 'true');
  }

  if (rulesBtn) {
    rulesBtn.addEventListener('click', openRules);
  }
  if (rulesClose) {
    rulesClose.addEventListener('click', closeRules);
  }
  if (rulesOverlay) {
    rulesOverlay.addEventListener('click', function (e) {
      if (e.target === rulesOverlay) closeRules();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' && rulesOverlay && rulesOverlay.classList.contains('visible')) {
      closeRules();
    }
  });

  updateBestPlayerFromStats();
})();
