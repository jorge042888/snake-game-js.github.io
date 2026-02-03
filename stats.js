/**
 * Menú de estadísticas — Snake Game
 * Lee historial de partidas desde localStorage y muestra KPIs + gráficas.
 */

(function () {
  'use strict';

  const GAME_STATS_KEY = 'snake-game-stats';
  const CHART_SCORES_ID = 'chart-scores';
  const CHART_DURATION_ID = 'chart-duration';
  const LAST_N_SCORES = 20;

  const COLORS = {
    bg: '#0f1419',
    grid: 'rgba(46, 213, 115, 0.08)',
    accent: '#2ed573',
    accentDim: '#1e9e4a',
    accentGlow: 'rgba(46, 213, 115, 0.5)',
    danger: '#ff6b6b',
    text: '#e6edf3',
    textMuted: 'rgba(139, 148, 158, 0.9)',
  };

  const overlay = document.getElementById('stats-overlay');
  const statsBtn = document.getElementById('stats-btn');
  const statsClose = document.getElementById('stats-close');
  const statTotalGames = document.getElementById('stat-total-games');
  const statBestScore = document.getElementById('stat-best-score');
  const statAvgScore = document.getElementById('stat-avg-score');
  const statTotalPoints = document.getElementById('stat-total-points');
  const statsEmpty = document.getElementById('stats-empty');
  const statsCharts = document.querySelector('.stats-charts');

  function getStats() {
    try {
      const raw = localStorage.getItem(GAME_STATS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function openStats() {
    overlay.classList.add('visible');
    overlay.setAttribute('aria-hidden', 'false');
    renderStats();
  }

  function closeStats() {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderStats() {
    const games = getStats();

    if (games.length === 0) {
      statsEmpty.classList.remove('hidden');
      if (statsCharts) statsCharts.classList.add('hidden');
      statTotalGames.textContent = '0';
      statBestScore.textContent = '0';
      statAvgScore.textContent = '0';
      statTotalPoints.textContent = '0';
      return;
    }

    statsEmpty.classList.add('hidden');
    if (statsCharts) statsCharts.classList.remove('hidden');

    const totalGames = games.length;
    const bestScore = Math.max(...games.map((g) => g.score));
    const totalPoints = games.reduce((sum, g) => sum + g.score, 0);
    const avgScore = Math.round(totalPoints / totalGames);

    statTotalGames.textContent = totalGames.toLocaleString('es');
    statBestScore.textContent = bestScore.toLocaleString('es');
    statAvgScore.textContent = avgScore.toLocaleString('es');
    statTotalPoints.textContent = totalPoints.toLocaleString('es');

    const lastScores = games.slice(0, LAST_N_SCORES).map((g) => g.score);
    const lastDurations = games.slice(0, LAST_N_SCORES).map((g) => (g.duration || 0) / 60);

    drawScoresChart(lastScores, bestScore);
    drawDurationChart(lastDurations);
  }

  const CHART_SCORES_W = 480;
  const CHART_SCORES_H = 200;
  const CHART_DURATION_W = 480;
  const CHART_DURATION_H = 160;

  /** Regresión lineal: devuelve { m, b } para y = m*x + b */
  function linearRegression(xs, ys) {
    const n = xs.length;
    if (n < 2) return { m: 0, b: ys[0] ?? 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += xs[i];
      sumY += ys[i];
      sumXY += xs[i] * ys[i];
      sumX2 += xs[i] * xs[i];
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const b = (sumY - m * sumX) / n;
    return { m, b };
  }

  function drawScoresChart(scores, maxScoreRef) {
    const canvas = document.getElementById(CHART_SCORES_ID);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = CHART_SCORES_W;
    const h = CHART_SCORES_H;
    const padding = { top: 20, right: 20, bottom: 32, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const n = Math.max(scores.length, 1);
    const maxVal = Math.max(maxScoreRef || 10, ...scores, 10);
    const barW = Math.max(4, (chartW / n) * 0.7);
    const gap = (chartW / n) * 0.3;
    const zeroY = padding.top + chartH;

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padding.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Bars
    scores.forEach((score, i) => {
      const x = padding.left + i * (chartW / n) + gap / 2;
      const barH = maxVal > 0 ? (score / maxVal) * chartH : 0;
      const y = zeroY - barH;

      const gradient = ctx.createLinearGradient(x, zeroY, x, y);
      gradient.addColorStop(0, COLORS.accentDim);
      gradient.addColorStop(0.5, COLORS.accent);
      gradient.addColorStop(1, COLORS.accent);

      ctx.fillStyle = gradient;
      ctx.shadowColor = COLORS.accentGlow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.rect(x, y, barW, barH);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Número sobre la barra
      ctx.fillStyle = COLORS.text;
      ctx.font = '11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const labelY = barH >= 18 ? y + 12 : y - 4;
      ctx.fillText(String(score), x + barW / 2, labelY);
    });

    // Línea de tendencia (regresión lineal)
    if (scores.length >= 2) {
      const xs = scores.map((_, i) => i);
      const { m, b } = linearRegression(xs, scores);
      const x0 = padding.left + 0 * (chartW / n) + gap / 2 + barW / 2;
      const x1 = padding.left + (n - 1) * (chartW / n) + gap / 2 + barW / 2;
      const y0Val = m * 0 + b;
      const y1Val = m * (n - 1) + b;
      const y0 = zeroY - (maxVal > 0 ? (y0Val / maxVal) * chartH : 0);
      const y1 = zeroY - (maxVal > 0 ? (y1Val / maxVal) * chartH : 0);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, Math.max(padding.top, Math.min(zeroY, y0)));
      ctx.lineTo(x1, Math.max(padding.top, Math.min(zeroY, y1)));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Labels eje Y (escala)
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal * (4 - i)) / 4);
      const y = padding.top + (chartH * i) / 4;
      ctx.fillText(String(val), padding.left - 8, y + 4);
    }
    ctx.textAlign = 'left';
  }

  function drawDurationChart(durationsMin) {
    const canvas = document.getElementById(CHART_DURATION_ID);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = CHART_DURATION_W;
    const h = CHART_DURATION_H;
    const padding = { top: 16, right: 20, bottom: 28, left: 44 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const n = Math.max(durationsMin.length, 1);
    const maxMin = Math.max(1, ...durationsMin);
    const barW = Math.max(3, (chartW / n) * 0.65);
    const gap = (chartW / n) * 0.35;
    const zeroY = padding.top + chartH;

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = padding.top + (chartH * i) / 3;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Bars (duración en minutos — tono más suave)
    durationsMin.forEach((mins, i) => {
      const x = padding.left + i * (chartW / n) + gap / 2;
      const barH = maxMin > 0 ? (mins / maxMin) * chartH : 0;
      const y = zeroY - barH;

      ctx.fillStyle = mins >= maxMin * 0.7 ? COLORS.accent : COLORS.accentDim;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.rect(x, y, barW, barH);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Número sobre la barra
      ctx.fillStyle = COLORS.text;
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const labelY = barH >= 14 ? y + 10 : y - 3;
      ctx.fillText(mins.toFixed(1), x + barW / 2, labelY);
    });

    // Línea de tendencia (duración)
    if (durationsMin.length >= 2) {
      const xs = durationsMin.map((_, i) => i);
      const { m, b } = linearRegression(xs, durationsMin);
      const x0 = padding.left + 0 * (chartW / n) + gap / 2 + barW / 2;
      const x1 = padding.left + (n - 1) * (chartW / n) + gap / 2 + barW / 2;
      const y0Val = m * 0 + b;
      const y1Val = m * (n - 1) + b;
      const y0 = zeroY - (maxMin > 0 ? (y0Val / maxMin) * chartH : 0);
      const y1 = zeroY - (maxMin > 0 ? (y1Val / maxMin) * chartH : 0);
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, Math.max(padding.top, Math.min(zeroY, y0)));
      ctx.lineTo(x1, Math.max(padding.top, Math.min(zeroY, y1)));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Eje Y
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px Outfit, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 3; i++) {
      const val = (maxMin * (3 - i) / 3).toFixed(1);
      const y = padding.top + (chartH * i) / 3;
      ctx.fillText(val + ' min', padding.left - 6, y + 3);
    }
    ctx.textAlign = 'left';
  }

  statsBtn.addEventListener('click', openStats);
  statsClose.addEventListener('click', closeStats);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeStats();
  });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Escape' && overlay.classList.contains('visible')) closeStats();
  });
})();
