// Ghostlurk teaser: veil, reveal, countdown, peek, whispers and ghost smoke.
// Motion follows the website rule: always on, unless the device asks for reduced motion.
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function motionAllowed() { return !reduce.matches; }

  /* Veil lifts on load, then content sharpens from blur (PageVeil + RevealObserver on the website) */
  var COVER_MS = 700;
  var REVEAL_MS = 600;
  var started = performance.now();

  function revealAll() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.dataset.inView = 'true'; });
  }

  function liftVeil() {
    if (root.dataset.veil !== 'load') { revealAll(); return; }
    var wait = Math.max(0, COVER_MS - (performance.now() - started));
    setTimeout(function () {
      root.dataset.veil = 'reveal';
      revealAll();
      setTimeout(function () { if (root.dataset.veil === 'reveal') delete root.dataset.veil; }, REVEAL_MS);
    }, wait);
  }

  // Wait for fonts so the headline lands in Unbounded, but never longer than a moment.
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 900); })]).then(liftVeil);

  /* Countdown to Oct 31, 2026, 9:00 PM in New York. The offset is looked up for that date,
     so daylight saving is handled (it is EDT, UTC-4, until Nov 1). */
  function easternToUtc(y, mo, d, h, mi) {
    var guess = Date.UTC(y, mo - 1, d, h, mi);
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date(guess));
      var get = function (t) { return Number(parts.find(function (p) { return p.type === t; }).value); };
      var wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
      return guess - (wall - guess);
    } catch (e) {
      return Date.parse('2026-10-31T21:00:00-04:00');
    }
  }

  var launch = easternToUtc(2026, 10, 31, 21, 0);
  var units = {};
  document.querySelectorAll('[data-unit]').forEach(function (el) { units[el.dataset.unit] = el; });
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function set(unit, value) { if (units[unit] && units[unit].textContent !== value) units[unit].textContent = value; }

  function tick() {
    var left = Math.max(0, launch - Date.now());
    var s = Math.floor(left / 1000);
    set('days', pad(Math.floor(s / 86400)));
    set('hours', pad(Math.floor(s / 3600) % 24));
    set('minutes', pad(Math.floor(s / 60) % 60));
    set('seconds', pad(s % 60));
    if (left === 0) { root.dataset.countdown = 'done'; return; }
    setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
  }
  tick();

  /* Peek: hover or tap clears the fog a little for a second, then it fogs back up */
  var peek = document.querySelector('.peek');
  if (peek) {
    var fogTimer = 0;
    var clear = function () {
      peek.classList.add('is-clear');
      clearTimeout(fogTimer);
      fogTimer = setTimeout(function () { peek.classList.remove('is-clear'); }, 1100);
    };
    peek.addEventListener('pointerenter', clear);
    peek.addEventListener('click', clear);
  }

  /* Whispers take turns in one spot */
  var whispers = document.querySelectorAll('.whisper');
  if (whispers.length > 1) {
    var current = 0;
    setInterval(function () {
      whispers[current].classList.remove('is-on');
      current = (current + 1) % whispers.length;
      whispers[current].classList.add('is-on');
    }, 4200);
  }

  /* Ghost smoke: soft smoke off links and the peek on hover, a burst on click.
     Ported from the website's GhostSmoke. Mouse and trackpad only. */
  var canvas = document.querySelector('.ghost-smoke');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!canvas || !fine.matches || !motionAllowed()) return;

  var TARGETS = 'a, button';
  var MAX_PARTS = 180;
  var ctx = canvas.getContext('2d');

  function makeSprite(rgb) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(' + rgb + ', .5)');
    grad.addColorStop(0.45, 'rgba(' + rgb + ', .16)');
    grad.addColorStop(1, 'rgba(' + rgb + ', 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  var sprites = { ice: makeSprite('230, 240, 245'), amber: makeSprite('255, 182, 28') };
  var parts = [];
  var w = 0, h = 0, raf = 0, target = null, px = 0, py = 0, lastX = 0, lastY = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tone(el) { return el.matches('.button-accent') ? 'amber' : 'ice'; }

  function spawn(x, y, kind, burst) {
    if (parts.length >= MAX_PARTS) parts.shift();
    var angle = Math.random() * Math.PI * 2;
    var speed = burst ? 0.5 + Math.random() * 1.3 : 0.15 + Math.random() * 0.4;
    parts.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed * 0.7,
      vy: -(0.35 + Math.random() * 0.75) - (burst ? Math.abs(Math.sin(angle)) * speed : 0),
      r: 8 + Math.random() * 14,
      alpha: 0.85,
      grow: 0.3 + Math.random() * 0.45,
      life: 0,
      max: 55 + Math.random() * 55,
      seed: Math.random() * Math.PI * 2,
      sprite: sprites[kind],
    });
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function puffFrom(el) {
    var r = el.getBoundingClientRect();
    var kind = tone(el);
    var count = Math.round(Math.min(28, Math.max(10, r.width / 16)));
    for (var i = 0; i < count; i += 1) {
      spawn(r.left + Math.random() * r.width, r.bottom - Math.random() * Math.min(r.height * 0.4, 36), kind, true);
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    if (target) {
      var moved = Math.hypot(px - lastX, py - lastY);
      if (moved > 2 || Math.random() < 0.3) {
        var kind = tone(target);
        spawn(px + (Math.random() - 0.5) * 10, py + (Math.random() - 0.5) * 6, kind, false);
        if (moved > 8) spawn(px, py, kind, false);
      }
      lastX = px;
      lastY = py;
    }
    for (var i = parts.length - 1; i >= 0; i -= 1) {
      var p = parts[i];
      p.life += 1;
      var k = p.life / p.max;
      if (k >= 1) { parts.splice(i, 1); continue; }
      p.x += p.vx + Math.sin(p.seed + p.life * 0.06) * 0.4;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.99;
      p.r += p.grow;
      ctx.globalAlpha = Math.sin(Math.PI * k) * p.alpha;
      ctx.drawImage(p.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
    raf = parts.length || target ? requestAnimationFrame(frame) : 0;
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (e) {
    px = e.clientX;
    py = e.clientY;
    var el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
    if (el === target) return;
    if (el) puffFrom(el);
    target = el;
    lastX = px;
    lastY = py;
    if (target && !raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    var el = e.target instanceof Element ? e.target.closest(TARGETS) : null;
    if (!el) return;
    for (var i = 0; i < 18; i += 1) spawn(e.clientX, e.clientY, tone(el), true);
  }, { passive: true });
  root.addEventListener('pointerleave', function () { target = null; });
})();
