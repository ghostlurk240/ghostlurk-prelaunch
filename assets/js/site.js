// Ghostlurk teaser: veil, reveal, countdown, whispers, lantern and ghost smoke.
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
  var counting = false;
  document.querySelectorAll('[data-unit]').forEach(function (el) { units[el.dataset.unit] = el; });
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // Smoldering digits: the old one burns out while the new one ignites.
  function swapDigit(slot, ch, animate) {
    var cur = slot.querySelector('.d:not(.is-out)');
    if (cur && cur.textContent === ch) return;
    slot.querySelectorAll('.d.is-out').forEach(function (old) { old.remove(); });
    var next = document.createElement('span');
    next.className = animate ? 'd is-in' : 'd';
    next.textContent = ch;
    if (cur && animate) {
      cur.className = 'd is-out';
      cur.addEventListener('animationend', function () { cur.remove(); }, { once: true });
    } else if (cur) {
      cur.remove();
    }
    slot.appendChild(next);
  }

  function set(unit, value) {
    var el = units[unit];
    if (!el) return;
    if (el.children.length !== value.length) {
      el.textContent = '';
      for (var i = 0; i < value.length; i += 1) {
        var slot = document.createElement('span');
        slot.className = 'digit';
        el.appendChild(slot);
      }
    }
    var animate = counting && motionAllowed() && !document.hidden;
    for (var j = 0; j < value.length; j += 1) swapDigit(el.children[j], value[j], animate);
  }

  function tick() {
    var left = Math.max(0, launch - Date.now());
    var s = Math.floor(left / 1000);
    set('days', pad(Math.floor(s / 86400)));
    set('hours', pad(Math.floor(s / 3600) % 24));
    set('minutes', pad(Math.floor(s / 60) % 60));
    set('seconds', pad(s % 60));
    counting = true;
    if (left === 0) { root.dataset.countdown = 'done'; return; }
    setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
  }
  tick();

  /* Smoke letters: each whisper gathers out of drifting smoke, holds, then exhales away sideways.
     Letters are split so they can drift on their own; screen readers get the plain line. */
  function smokeLetters(p) {
    var text = p.textContent;
    var shown = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    var i = 0;
    text.split(' ').forEach(function (word, w) {
      if (w) shown.appendChild(document.createTextNode(' '));
      var wordEl = document.createElement('span');
      wordEl.className = 'w';
      for (var c = 0; c < word.length; c += 1) {
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = word[c];
        ch.style.cssText = '--i:' + i + ';--dx:' + (Math.random() * 14).toFixed(1) + 'px;--dy:' + (Math.random() * 12 - 6).toFixed(1) + 'px';
        wordEl.appendChild(ch);
        i += 1;
      }
      shown.appendChild(wordEl);
    });
    var plain = document.createElement('span');
    plain.className = 'sr-only';
    plain.textContent = text;
    p.textContent = '';
    p.appendChild(plain);
    p.appendChild(shown);
  }

  var EXHALE = 2600;
  function exhale(line) {
    if (!line.classList.contains('is-on')) return;
    line.classList.remove('is-on');
    line.classList.add('is-gone');
    setTimeout(function () { line.classList.remove('is-gone'); }, EXHALE);
  }

  // Keep a placed whisper fully on screen.
  function keepOnScreen(line) {
    var box = line.getBoundingClientRect();
    var pad = 12;
    var dx = Math.max(0, pad - box.left) - Math.max(0, box.right - (window.innerWidth - pad));
    if (dx) line.style.left = (parseFloat(line.style.left) / 100 * window.innerWidth + dx) + 'px';
  }

  /* Spots around the ghost, as % of the screen, clear of the headline and the eyes */
  var phone = window.matchMedia('(max-width: 860px)');
  var SPOTS_WIDE = [[19, 20], [23, 36], [15, 29], [81, 20], [77, 36], [85, 29], [50, 9]];
  var SPOTS_PHONE = [[50, 10.5], [40, 14], [60, 14], [50, 43], [50, 47]];
  var lastSpot = -1;
  function place(line) {
    var spots = phone.matches ? SPOTS_PHONE : SPOTS_WIDE;
    var n;
    do { n = Math.floor(Math.random() * spots.length); } while (n === lastSpot && spots.length > 1);
    lastSpot = n;
    line.style.left = spots[n][0] + (Math.random() * 4 - 2) + '%';
    line.style.top = spots[n][1] + (Math.random() * 3 - 1.5) + '%';
    keepOnScreen(line);
  }

  var all = Array.prototype.slice.call(document.querySelectorAll('.whisper'));
  all.forEach(smokeLetters);
  var blink = document.querySelector('.blink-whisper');
  var whispers = all.filter(function (p) { return p !== blink; });

  if (whispers.length && !motionAllowed()) {
    // Reduced motion: one still line, picked at random.
    whispers[0].classList.remove('is-on');
    var still = whispers[Math.floor(Math.random() * whispers.length)];
    place(still);
    still.classList.add('is-on');
  } else if (whispers.length > 1) {
    var HOLD = 4600;     // from forming to the start of the exhale
    var OVERLAP = 1100;  // next line starts gathering while the last one drifts off
    var current = Math.floor(Math.random() * whispers.length);
    whispers[0].classList.remove('is-on');
    root.dataset.whispers = 'on';
    var showLine = function () {
      var line = whispers[current];
      line.classList.remove('is-gone');
      place(line);
      void line.offsetWidth;
      line.classList.add('is-on');
      setTimeout(function () {
        exhale(line);
        current = (current + 1) % whispers.length;
        setTimeout(showLine, OVERLAP);
      }, HOLD);
    };
    // Begin once the veil has lifted.
    setTimeout(showLine, 1600);
  }

  /* "you blinked. it didn't." forms near the ghost's eyes after 5 seconds of stillness
     (no mouse, scroll, key or touch), and drifts away as soon as they move again. */
  var ghostBox = document.querySelector('.ghost-box');
  if (blink && ghostBox) {
    var IDLE_MS = 5000;
    var idleTimer = 0;
    var showBlink = function () {
      var g = ghostBox.getBoundingClientRect();
      // Just under the eyes (eyes sit 38% across, 30% down the art).
      blink.style.left = (g.left + g.width * 0.383) + 'px';
      blink.style.top = (g.top + g.height * 0.405) + 'px';
      keepOnScreen(blink);
      blink.classList.remove('is-gone');
      void blink.offsetWidth;
      blink.classList.add('is-on');
    };
    var stir = function () {
      exhale(blink);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(showBlink, IDLE_MS);
    };
    ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart'].forEach(function (type) {
      window.addEventListener(type, stir, { passive: true });
    });
    // The page counts as still from the moment the veil lifts.
    idleTimer = setTimeout(showBlink, IDLE_MS + 1000);
  }

  /* Dying neon: the tagline flickers once every 15 to 25 seconds */
  var neon = document.querySelector('.neon');
  if (neon && motionAllowed()) {
    var flickerLater = function () {
      setTimeout(function () {
        neon.classList.add('is-flicker');
        setTimeout(function () { neon.classList.remove('is-flicker'); }, 950);
        flickerLater();
      }, 15000 + Math.random() * 10000);
    };
    flickerLater();
  }

  /* Lantern: a soft light rides with the cursor, sharpens the ghost where it falls and shows
     the lines hidden in the fog. On touch screens it appears where you tap, then fades. */
  var drawLantern = null;
  var lantern = document.querySelector('.lantern');
  var secrets = document.querySelector('.secrets');
  var lit = document.querySelector('.ghost-lit');
  if (lantern && secrets) {
    var lx = 0, ly = 0, lanternFrame = 0, tapTimer = 0;
    drawLantern = function () {
      lanternFrame = 0;
      lantern.style.transform = 'translate3d(' + lx + 'px,' + ly + 'px,0)';
      secrets.style.setProperty('--lx', lx + 'px');
      secrets.style.setProperty('--ly', ly + 'px');
      if (lit && ghostBox) {
        var g = ghostBox.getBoundingClientRect();
        // The sharp layer's light is measured in the ghost's own (unscaled) size.
        var scale = g.width / ghostBox.offsetWidth || 1;
        lit.style.setProperty('--gx', (lx - g.left) / scale + 'px');
        lit.style.setProperty('--gy', (ly - g.top) / scale + 'px');
      }
    };
    var moveLantern = function (e) {
      lx = e.clientX;
      ly = e.clientY;
      if (!lanternFrame) lanternFrame = requestAnimationFrame(drawLantern);
    };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      moveLantern(e);
      root.dataset.lantern = 'on';
    }, { passive: true });
    root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && root.dataset.lantern) delete root.dataset.lantern; });
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      // Place the light before fading it in, so it never slides across the screen.
      var fading = [lantern, secrets, lit].filter(Boolean);
      fading.forEach(function (el) { el.style.transition = 'none'; });
      lx = e.clientX;
      ly = e.clientY;
      drawLantern();
      void lantern.offsetWidth;
      fading.forEach(function (el) { el.style.transition = ''; });
      root.dataset.lantern = 'on';
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { delete root.dataset.lantern; }, 1600);
    }, { passive: true });
  }

  /* Depth: the ghost and the fog drift at different depths as the cursor moves, the ghost's
     eyes follow it, and the button leans toward it when it comes close. On phones the eyes
     look toward the last tap. All of it eases, and none of it runs with reduced motion. */
  var apparition = document.querySelector('.apparition');
  var fog = document.querySelector('.fog-bank');
  var eyes = document.querySelector('.ghost-eyes');
  var buttonEl = document.querySelector('.button-ghost');
  var magnet = buttonEl ? buttonEl.parentElement : null;
  var fineMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (apparition && motionAllowed()) {
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, depthFrame = 0;
    var cur = { ax: 0, ay: 0, fx: 0, fy: 0, ex: 0, ey: 0, bx: 0, by: 0 };
    var depthTargets = function () {
      var nx = mx / window.innerWidth - 0.5, ny = my / window.innerHeight - 0.5;
      var t = { ax: nx * -18, ay: ny * -12, fx: nx * -40, fy: ny * -8, ex: 0, ey: 0, bx: 0, by: 0 };
      if (eyes && ghostBox) {
        var g = ghostBox.getBoundingClientRect();
        var dx = mx - (g.left + g.width * 0.383), dy = my - (g.top + g.height * 0.30);
        var d = Math.hypot(dx, dy) || 1;
        var reach = Math.min(1, d / 420) * g.width * 0.012;
        t.ex = dx / d * reach;
        t.ey = dy / d * reach;
      }
      if (magnet && fineMouse.matches) {
        var b = magnet.getBoundingClientRect();
        var bx = mx - (b.left - cur.bx + b.width / 2), by = my - (b.top - cur.by + b.height / 2);
        if (Math.hypot(bx, by) < 110) { t.bx = bx * 0.16; t.by = by * 0.22; }
      }
      return t;
    };
    var stepDepth = function () {
      depthFrame = 0;
      var t = depthTargets(), moving = false;
      for (var k in cur) {
        var diff = t[k] - cur[k];
        if (Math.abs(diff) > 0.05) { cur[k] += diff * 0.08; moving = true; } else { cur[k] = t[k]; }
      }
      apparition.style.translate = cur.ax.toFixed(2) + 'px ' + cur.ay.toFixed(2) + 'px';
      if (fog) fog.style.translate = cur.fx.toFixed(2) + 'px ' + cur.fy.toFixed(2) + 'px';
      if (eyes) eyes.style.translate = cur.ex.toFixed(2) + 'px ' + cur.ey.toFixed(2) + 'px';
      if (magnet) magnet.style.translate = cur.bx.toFixed(2) + 'px ' + cur.by.toFixed(2) + 'px';
      // Keep the lantern's sharp spot lined up while the ghost settles.
      if (root.dataset.lantern && drawLantern) drawLantern();
      if (moving) depthFrame = requestAnimationFrame(stepDepth);
    };
    var aim = function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!depthFrame) depthFrame = requestAnimationFrame(stepDepth);
    };
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') aim(e); }, { passive: true });
    window.addEventListener('pointerdown', aim, { passive: true });
  }

  /* Decoding text: "10.31" and the date line resolve out of scrambled code as they appear,
     and again on hover or tap. Uses mono glyphs only, so the width never jumps. */
  var GLYPHS = '0123456789ABCDEF#%&*+=/<>';
  var KEEP = ' ·.:';
  function decode(el) {
    if (!motionAllowed() || el.dataset.decoding) return;
    var text = el.dataset.text || (el.dataset.text = el.textContent);
    el.dataset.decoding = 'on';
    var start = performance.now(), DUR = 1000;
    var frame = function (now) {
      var k = Math.min(1, (now - start) / DUR), out = '';
      for (var i = 0; i < text.length; i += 1) {
        var c = text[i];
        out += KEEP.indexOf(c) > -1 || i / text.length < k ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(frame); else delete el.dataset.decoding;
    };
    requestAnimationFrame(frame);
  }
  [[document.querySelector('.top-date'), document.querySelector('.top-date'), 650],
   [document.querySelector('.count-label time'), document.querySelector('.count-label'), 900]].forEach(function (pair) {
    var el = pair[0], hit = pair[1];
    if (!el) return;
    el.setAttribute('aria-label', el.textContent);
    setTimeout(function () { decode(el); }, pair[2]);
    hit.addEventListener('pointerenter', function () { decode(el); });
    hit.addEventListener('click', function () { decode(el); });
  });

  /* Ghost smoke: soft smoke off the button on hover, a burst on click.
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

  function tone(el) { return el.matches('.button-ghost') ? 'amber' : 'ice'; }

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
