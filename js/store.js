import { DEFAULT_PROFILE, THEMES, themeById, seedByUsername, FONT_STACKS, freshProfile } from './data.js';

const MINE_KEY = 'aura.profile.v2';
const VIEWS_KEY = 'aura.views.v1';
const SESSION_KEY = 'aura.seen.v1';

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, extra) {
  if (!isObject(extra)) return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isObject(value) && isObject(base?.[key])) out[key] = deepMerge(base[key], value);
    else if (value !== undefined) out[key] = value;
  }
  return out;
}

export function normalizeProfile(raw) {
  const base = structuredClone(DEFAULT_PROFILE);
  const merged = deepMerge(base, isObject(raw) ? raw : {});
  const theme = themeById(merged.theme);
  if (!merged.accent) merged.accent = theme.accent;
  if (!merged.accent2) merged.accent2 = theme.accent2;
  if (!Array.isArray(merged.links)) merged.links = [];
  if (!Array.isArray(merged.badges)) merged.badges = [];
  if (!Array.isArray(merged.bg.colors) || merged.bg.colors.length < 3) merged.bg.colors = [...theme.colors];
  merged.bg.dim = clamp(Number(merged.bg.dim) || 0, 0, 90);
  merged.bg.blur = clamp(Number(merged.bg.blur) || 0, 0, 30);
  merged.audio.volume = clamp(Number(merged.audio.volume) || 0, 0, 100);
  merged.views = Math.max(0, Number(merged.views) || 0);
  return merged;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 24);
}

export function loadMine() {
  try {
    const raw = localStorage.getItem(MINE_KEY);
    if (!raw) return freshProfile();
    const parsed = safeParse(raw, null);
    if (!parsed) return freshProfile();
    return normalizeProfile(parsed);
  } catch {
    return freshProfile();
  }
}

export function saveMine(profile) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function resetMine() {
  try {
    localStorage.removeItem(MINE_KEY);
  } catch {}
  return freshProfile();
}

export function themeDefaults(themeId) {
  return themeById(themeId);
}

export function applyTheme(profile, themeId) {
  const theme = themeById(themeId);
  profile.theme = theme.id;
  profile.accent = theme.accent;
  profile.accent2 = theme.accent2;
  profile.font = theme.font;
  profile.bg.colors = [...theme.colors];
  return profile;
}

export function resolveProfile(username, encoded) {
  if (encoded) {
    const decoded = decodeProfile(encoded);
    if (decoded) return { profile: decoded, shared: true };
  }
  const clean = slugify(username);
  const mine = loadMine();
  if (clean && mine.username === clean) return { profile: mine, shared: false };
  const seed = seedByUsername(clean);
  if (seed) return { profile: normalizeProfile(seed), shared: false };
  if (clean) {
    return {
      profile: normalizeProfile({
        ...structuredClone(DEFAULT_PROFILE),
        username: clean,
        name: clean.charAt(0).toUpperCase() + clean.slice(1),
        bio: '',
        links: [],
        badges: [],
        views: 0,
        intro: false
      }),
      shared: false,
      claimed: true
    };
  }
  return { profile: normalizeProfile(structuredClone(DEFAULT_PROFILE)), shared: false };
}

export function encodeProfile(profile) {
  try {
    const json = JSON.stringify(profile);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function decodeProfile(encoded) {
  try {
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = safeParse(json, null);
    if (!isObject(parsed)) return null;
    const profile = normalizeProfile(parsed);
    if (!profile.username) return null;
    return profile;
  } catch {
    return null;
  }
}

export function shareLink(profile) {
  const encoded = encodeProfile(profile);
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/u/${encodeURIComponent(profile.username)}?d=${encoded}`;
}

export function registerView(username, baseViews) {
  let stored = {};
  try {
    stored = safeParse(localStorage.getItem(VIEWS_KEY), {}) || {};
  } catch {}
  const key = slugify(username) || 'anonymous';
  let seen = [];
  try {
    seen = safeParse(sessionStorage.getItem(SESSION_KEY), []) || [];
  } catch {}
  if (!seen.includes(key)) {
    const next = (Number(stored[key]) || 0) + 1;
    stored[key] = next;
    seen = [...seen, key];
    try {
      localStorage.setItem(VIEWS_KEY, JSON.stringify(stored));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(seen));
    } catch {}
    return baseViews + next;
  }
  return baseViews + (Number(stored[key]) || 0);
}

export function formatNumber(n) {
  const num = Number(n) || 0;
  if (num < 1000) return String(num);
  if (num < 1000000) {
    const value = num / 1000;
    return `${value >= 100 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}k`;
  }
  const value = num / 1000000;
  return `${value.toFixed(1).replace(/\.0$/, '')}m`;
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '2026';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function localTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function fontStack(fontId) {
  return FONT_STACKS[fontId] || FONT_STACKS['Space Grotesk'];
}

export function backgroundCss(bg, accent, accent2) {
  const [a, b, c] = bg.colors && bg.colors.length >= 3 ? bg.colors : ['#0b0618', '#160b38', '#04121c'];
  const layers = [];
  if (accent) {
    layers.push(`radial-gradient(90% 65% at 18% -4%, ${hexA(accent, 0.55)} 0%, transparent 62%)`);
    layers.push(`radial-gradient(80% 55% at 88% 12%, ${hexA(accent2 || accent, 0.4)} 0%, transparent 64%)`);
  }
  layers.push(`radial-gradient(100% 70% at 18% 0%, ${hexA(a, 1)} 0%, transparent 62%)`);
  layers.push(`radial-gradient(110% 80% at 88% 14%, ${hexA(b, 1)} 0%, transparent 66%)`);
  layers.push(`radial-gradient(90% 70% at 50% 108%, ${hexA(c, 1)} 0%, transparent 70%)`);
  layers.push(`linear-gradient(170deg, ${a}, ${shade(a, -22)} 55%, #040409 100%)`);
  return layers.join(', ');
}

export function hexA(hex, alpha) {
  const clean = String(hex || '#000000').replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(value.slice(0, 2), 16) || 0;
  const g = parseInt(value.slice(2, 4), 16) || 0;
  const b = parseInt(value.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function shade(hex, amount) {
  const clean = String(hex || '#000000').replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
  const nums = [0, 2, 4].map((i) => clamp(parseInt(value.slice(i, i + 2), 16) + amount, 0, 255));
  return `rgb(${nums.join(', ')})`;
}

export function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase() || '?';
}

export function getThemeList() {
  return THEMES;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export { DEFAULT_PROFILE, freshProfile, seedByUsername };
