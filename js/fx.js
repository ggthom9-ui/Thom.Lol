import { audio } from './audio.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function heartPath(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.32);
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.32);
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size, x, y + size * 1.18);
  ctx.bezierCurveTo(x, y + size, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.32);
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.32);
  ctx.closePath();
}

export function createParticles(canvas, type, options = {}) {
  if (!canvas || !type || type === 'none') return { stop() {} };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop() {} };
  if (reducedMotion()) {
    const rect = canvas.parentElement?.getBoundingClientRect() || { width: 400, height: 700 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    for (let i = 0; i < 28; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.random() * rect.width, Math.random() * rect.height, Math.random() * 1.4 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    return { stop() {} };
  }

  const accent = options.accent || '#8b5cf6';
  const accent2 = options.accent2 || '#22d3ee';
  const density = options.density || 1;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let parts = [];
  let raf = 0;
  let last = performance.now();
  let running = true;
  let time = 0;

  function spawn(initial = false) {
    const base = {
      x: Math.random() * width,
      y: initial ? Math.random() * height : (type === 'rain' || type === 'snow' ? -12 : height + 12),
      r: 0,
      vx: 0,
      vy: 0,
      a: 0,
      phase: Math.random() * Math.PI * 2,
      spin: Math.random() * Math.PI * 2,
      life: 0
    };
    if (type === 'stars') {
      base.x = Math.random() * width;
      base.y = Math.random() * height;
      base.r = Math.random() * 1.5 + 0.35;
      base.a = Math.random() * 0.6 + 0.15;
      base.vy = -(Math.random() * 0.08 + 0.02);
      base.twinkle = Math.random() * 0.02 + 0.004;
    } else if (type === 'snow') {
      base.r = Math.random() * 2.2 + 0.6;
      base.vy = Math.random() * 0.5 + 0.18;
      base.vx = Math.random() * 0.3 - 0.15;
      base.a = Math.random() * 0.5 + 0.3;
    } else if (type === 'rain') {
      base.r = Math.random() * 1.2 + 0.5;
      base.vy = Math.random() * 7 + 5;
      base.vx = 0.9;
      base.len = Math.random() * 14 + 8;
      base.a = Math.random() * 0.28 + 0.12;
    } else if (type === 'bubbles') {
      base.r = Math.random() * 6 + 1.5;
      base.vy = -(Math.random() * 0.5 + 0.15);
      base.vx = Math.random() * 0.24 - 0.12;
      base.a = Math.random() * 0.3 + 0.1;
    } else if (type === 'hearts') {
      base.r = Math.random() * 7 + 3;
      base.vy = -(Math.random() * 0.45 + 0.16);
      base.vx = Math.random() * 0.3 - 0.15;
      base.a = Math.random() * 0.35 + 0.16;
    } else if (type === 'sparks') {
      base.r = Math.random() * 1.8 + 0.5;
      base.vy = -(Math.random() * 0.9 + 0.25);
      base.vx = Math.random() * 0.5 - 0.25;
      base.a = Math.random() * 0.7 + 0.25;
    }
    return base;
  }

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect() || { width: 0, height: 0 };
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(Math.min(120, Math.max(18, (width * height) / 14000)) * density);
    if (parts.length > target) parts = parts.slice(0, target);
    while (parts.length < target) parts.push(spawn(true));
  }

  function draw(dt) {
    ctx.clearRect(0, 0, width, height);
    time += dt;
    const speed = Math.min(dt / 16.67, 2.4);
    for (const p of parts) {
      if (type === 'stars') {
        p.y += p.vy * speed;
        p.x += Math.sin(time * 0.0003 + p.phase) * 0.05;
        p.life += p.twinkle * speed;
        const twinkle = 0.55 + Math.sin(p.life * 2.4) * 0.45;
        ctx.globalAlpha = p.a * twinkle;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.r > 1.35) {
          ctx.globalAlpha = p.a * twinkle * 0.28;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p.y < -6) { p.y = height + 6; p.x = Math.random() * width; }
      } else if (type === 'snow') {
        p.phase += 0.012 * speed;
        p.x += (p.vx + Math.sin(p.phase) * 0.28) * speed;
        p.y += p.vy * speed;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.y > height + 8) { p.y = -8; p.x = Math.random() * width; }
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;
      } else if (type === 'rain') {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        ctx.globalAlpha = p.a;
        ctx.strokeStyle = '#cfe9ff';
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.6, p.y - p.len);
        ctx.stroke();
        if (p.y > height + 20) { p.y = -20; p.x = Math.random() * width; }
      } else if (type === 'bubbles') {
        p.phase += 0.02 * speed;
        p.x += (p.vx + Math.sin(p.phase) * 0.2) * speed;
        p.y += p.vy * speed;
        ctx.globalAlpha = p.a;
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = p.a * 0.35;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x - p.r * 0.28, p.y - p.r * 0.28, p.r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        if (p.y < -14) { p.y = height + 14; p.x = Math.random() * width; }
      } else if (type === 'hearts') {
        p.phase += 0.018 * speed;
        p.x += (p.vx + Math.sin(p.phase) * 0.22) * speed;
        p.y += p.vy * speed;
        p.spin += 0.004 * speed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.spin) * 0.24);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = accent;
        heartPath(ctx, 0, 0, p.r);
        ctx.fill();
        ctx.restore();
        if (p.y < -24) { p.y = height + 24; p.x = Math.random() * width; }
      } else if (type === 'sparks') {
        p.phase += 0.03 * speed;
        p.x += (p.vx + Math.sin(p.phase) * 0.34) * speed;
        p.y += p.vy * speed;
        p.life += 0.018 * speed;
        const flicker = 0.5 + Math.sin(p.life * 6 + p.phase) * 0.5;
        ctx.globalAlpha = p.a * flicker;
        ctx.fillStyle = p.r > 1.4 ? accent2 : accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = p.a * flicker * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2);
        ctx.fill();
        if (p.y < -12 || p.life > 9) {
          p.y = height + 12;
          p.x = Math.random() * width;
          p.life = 0;
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(48, now - last || 16);
    last = now;
    draw(dt);
    raf = requestAnimationFrame(loop);
  }

  resize();
  const observer = new ResizeObserver(resize);
  if (canvas.parentElement) observer.observe(canvas.parentElement);
  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(loop);
  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

export function paintWave(canvas, getBands, getColors) {
  if (!canvas) return { stop() {} };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop() {} };
  let raf = 0;
  let running = true;
  let dpr = 1;
  let width = 0;
  let height = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || 120;
    height = rect.height || 24;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame() {
    if (!running) return;
    const bands = getBands(28);
    const colors = getColors ? getColors() : ['#22d3ee', '#8b5cf6'];
    ctx.clearRect(0, 0, width, height);
    const count = bands.length;
    const gap = 1.5;
    const barW = Math.max(1.2, (width - gap * (count - 1)) / count);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    for (let i = 0; i < count; i += 1) {
      const value = bands[i];
      const h = Math.max(1.5, value * height);
      const x = i * (barW + gap);
      const y = (height - h) / 2;
      const r = Math.min(barW / 2, 2);
      ctx.globalAlpha = 0.35 + value * 0.65;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, h, r);
      else ctx.rect(x, y, barW, h);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  raf = requestAnimationFrame(frame);
  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
    }
  };
}

export function typewriter(element, text, options = {}) {
  if (!element) return () => {};
  const speed = options.speed || 52;
  const startDelay = options.delay ?? 260;
  const target = element.querySelector('.name-text') || element;
  target.textContent = '';
  if (reducedMotion()) {
    target.textContent = text;
    return () => {};
  }
  let index = 0;
  let timer = 0;
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  const start = () => {
    timer = window.setInterval(() => {
      index += 1;
      target.textContent = text.slice(0, index);
      if (index >= text.length) {
        clearInterval(timer);
        setTimeout(() => caret.remove(), 1600);
      }
    }, speed);
  };
  timer = window.setTimeout(start, startDelay);
  target.appendChild(caret);
  return () => {
    clearTimeout(timer);
    clearInterval(timer);
    caret.remove();
  };
}

export function initCursor() {
  if (!finePointer() || reducedMotion()) return;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  document.body.classList.add('custom-cursor');
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  let raf = 0;
  let seen = false;

  const move = (event) => {
    mx = event.clientX;
    my = event.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    if (!seen) {
      seen = true;
      document.body.classList.add('cursor-ready');
    }
  };

  const tick = () => {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    raf = requestAnimationFrame(tick);
  };

  const over = (event) => {
    const target = event.target;
    ring.classList.toggle('hovering', !!(target.closest && target.closest('a, button, .chip, .p-card, .theme-card, .tile-btn, [role="button"], label.switch')));
  };

  const leave = () => ring.classList.add('hidden');
  const enter = () => ring.classList.remove('hidden');

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerover', over, { passive: true });
  document.addEventListener('mouseleave', leave);
  document.addEventListener('mouseenter', enter);
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerover', over);
    document.removeEventListener('mouseleave', leave);
    document.removeEventListener('mouseenter', enter);
    document.body.classList.remove('custom-cursor', 'cursor-ready');
  };
}

export function initTilt(element, max = 7) {
  if (!element || !finePointer() || reducedMotion()) return () => {};
  const wrap = element;
  let raf = 0;
  const onMove = (event) => {
    const rect = wrap.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      wrap.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
    });
  };
  const reset = () => {
    cancelAnimationFrame(raf);
    wrap.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };
  wrap.addEventListener('pointermove', onMove);
  wrap.addEventListener('pointerleave', reset);
  return () => {
    cancelAnimationFrame(raf);
    wrap.removeEventListener('pointermove', onMove);
    wrap.removeEventListener('pointerleave', reset);
  };
}

export function initReveal(root = document) {
  if (reducedMotion()) {
    root.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    return;
  }
  const items = root.querySelectorAll('.reveal');
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => observer.observe(el));
}

export function createCursorTrail(root, colors) {
  if (!root || !finePointer() || reducedMotion()) return { stop() {} };
  let last = 0;
  let count = 0;
  const onMove = (event) => {
    const now = performance.now();
    if (now - last < 26 || count > 34) return;
    last = now;
    const rect = root.getBoundingClientRect();
    const dot = document.createElement('i');
    const size = 3 + Math.random() * 5;
    dot.style.left = `${event.clientX - rect.left}px`;
    dot.style.top = `${event.clientY - rect.top}px`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.background = Math.random() > 0.5 ? colors[0] : colors[1];
    dot.style.setProperty('--dx', `${(Math.random() - 0.5) * 18}px`);
    dot.style.setProperty('--dy', `${Math.random() * 14 + 4}px`);
    root.appendChild(dot);
    count += 1;
    setTimeout(() => {
      dot.remove();
      count -= 1;
    }, 720);
  };
  root.addEventListener('pointermove', onMove, { passive: true });
  return {
    stop() {
      root.removeEventListener('pointermove', onMove);
      root.querySelectorAll('i').forEach((dot) => dot.remove());
    }
  };
}

export function mountProfileEffects(pf, profile, { preview = false } = {}) {
  const cleanups = [];
  const canvas = pf.querySelector('.pf-canvas');
  if (canvas) {
    const fx = createParticles(canvas, profile.effects.particles, {
      accent: profile.accent,
      accent2: profile.accent2,
      density: preview ? 0.5 : 1
    });
    cleanups.push(() => fx.stop());
  }
  const trailRoot = pf.querySelector('.pf-trail');
  if (trailRoot && profile.effects.cursor) {
    const trail = createCursorTrail(trailRoot, [profile.accent, profile.accent2]);
    cleanups.push(() => trail.stop());
  }
  const wave = pf.querySelector('.pf-wave canvas');
  if (wave) {
    const painter = paintWave(wave, (count) => audio.bands(count), () => [profile.accent2, profile.accent]);
    cleanups.push(() => painter.stop());
  }
  const applyParallax = (event) => {
    if (preview) return;
    const bg = pf.querySelector('.pf-bg');
    if (!bg) return;
    const px = event.clientX / window.innerWidth - 0.5;
    const py = event.clientY / window.innerHeight - 0.5;
    bg.style.transform = `translate3d(${(-px * 16).toFixed(1)}px, ${(-py * 16).toFixed(1)}px, 0) scale(1.06)`;
  };
  if (profile.effects.parallax && !preview) {
    window.addEventListener('pointermove', applyParallax, { passive: true });
    cleanups.push(() => window.removeEventListener('pointermove', applyParallax));
  }
  return () => cleanups.forEach((fn) => fn());
}
