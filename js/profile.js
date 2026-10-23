import { icon, platformList } from './icons.js';
import { BADGES, presetById } from './data.js';
import {
  backgroundCss, fontStack, initials, formatNumber, formatDate, localTime,
  copyText, shareLink
} from './store.js';
import { audio } from './audio.js';
import { mountProfileEffects, typewriter } from './fx.js';
import { toast, safeUrl, escapeHtml } from './ui.js';

const STATUS_LABEL = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline' };

function avatarMarkup(profile) {
  const src = profile.avatar || '';
  const valid = /^(https?:\/\/|data:image\/)/i.test(src);
  if (valid) return `<img src="${escapeHtml(src)}" alt="${escapeHtml(profile.name)}" loading="lazy" />`;
  return escapeHtml(initials(profile.name));
}

function linkMarkup(link) {
  const platform = platformList.find((p) => p.id === link.platform) || platformList[platformList.length - 1];
  const href = safeUrl(link.url);
  const inner = `${icon(platform.id)}<span class="sr-only">${escapeHtml(platform.label)}</span>`;
  if (!href) {
    return `<span class="pf-social" data-label="${escapeHtml(platform.label)}" style="opacity:.45">${inner}</span>`;
  }
  return `<a class="pf-social" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" data-label="${escapeHtml(platform.label)}" aria-label="${escapeHtml(platform.label)}">${inner}</a>`;
}

function badgeInline(profile) {
  return profile.badges
    .map((id) => BADGES.find((b) => b.id === id))
    .filter((b) => b && (b.id === 'verified' || b.id === 'crown'))
    .map((b) => `<span class="badge-svg ${b.id}">${icon(b.icon)}</span>`)
    .join('');
}

function badgePills(profile) {
  return profile.badges
    .map((id) => BADGES.find((b) => b.id === id))
    .filter((b) => b && b.id !== 'verified' && b.id !== 'crown')
    .map((b) => `<span class="pf-badge ${b.cls}">${icon(b.icon)}${escapeHtml(b.label)}</span>`)
    .join('');
}

export function createProfile(profile, options = {}) {
  const { preview = false, views = profile.views, shareUrl = '', isOwn = false } = options;
  const el = document.createElement('div');
  const hasPlayer = profile.audio.showPlayer && (profile.audio.preset || profile.audio.url);
  const status = profile.discord.status || 'online';
  const effect = ['shimmer', 'neon', 'glitch', 'typewriter'].includes(profile.nameEffect) ? profile.nameEffect : 'static';
  const avatarShape = ['squircle', 'hexagon'].includes(profile.avatarShape) ? profile.avatarShape : 'circle';
  const card = ['glass', 'solid', 'none'].includes(profile.card) ? profile.card : 'none';

  el.className = `pf card-${card}${hasPlayer ? ' has-player' : ''}`;
  el.style.setProperty('--pf-a', profile.accent);
  el.style.setProperty('--pf-a2', profile.accent2);
  el.style.setProperty('--pf-font', fontStack(profile.font));
  el.style.fontFamily = fontStack(profile.font);

  const bg = profile.bg || {};
  const gradient = backgroundCss(bg, profile.accent, profile.accent2);
  let bgMarkup = '';
  if (bg.type === 'video' && bg.video) {
    bgMarkup = `<video src="${escapeHtml(bg.video)}" autoplay muted loop playsinline></video>`;
  } else if (bg.type === 'image' && bg.image) {
    bgMarkup = `<img src="${escapeHtml(bg.image)}" alt="" />`;
  }
  const bgStyle = bg.type === 'gradient' || !bgMarkup ? `background:${gradient};` : 'background:#05050a;';
  const blur = Number(bg.blur) || 0;
  const dim = Number(bg.dim) || 0;

  const socials = (profile.links || []).slice(0, 12).map(linkMarkup).join('');
  const pills = badgePills(profile);
  const preset = presetById(profile.audio.preset);
  const trackTitle = profile.audio.url ? 'Custom track' : preset.label;
  const joined = formatDate(profile.created);
  const nameHtml = `<span class="name-text">${escapeHtml(profile.name)}</span>${badgeInline(profile)}`;

  el.innerHTML = `
    <div class="pf-bg" style="${bgStyle}${blur ? `filter:blur(${blur}px);transform:scale(${1 + blur / 100});` : ''}">
      ${bgMarkup}
    </div>
    <div class="pf-veil" style="background:linear-gradient(180deg, rgba(4,4,9,0.32), rgba(4,4,9,0.02) 30%, rgba(4,4,9,0.62)), rgba(0,0,0,${(dim / 100).toFixed(2)});"></div>
    <div class="pf-vignette"></div>
    <canvas class="pf-canvas" aria-hidden="true"></canvas>
    ${profile.effects.grain ? '<div class="pf-noise" aria-hidden="true"></div>' : ''}
    ${profile.effects.cursor ? '<div class="pf-trail" aria-hidden="true"></div>' : ''}

    <div class="pf-top">
      <div class="pf-pill" title="Profile views">${icon('eye')}<span>${formatNumber(views)}</span></div>
      <div class="pf-tools">
        <button class="pf-pill" type="button" data-act="share" title="Copy profile link" aria-label="Copy profile link">${icon('share')}</button>
      </div>
    </div>

    <main class="pf-main">
      <div class="pf-avatar-wrap">
        <div class="pf-av-ring ${avatarShape === 'squircle' ? 'squircle' : ''}"></div>
        <div class="pf-avatar shape-${avatarShape}">${avatarMarkup(profile)}</div>
        <div class="pf-status ${status}"></div>
      </div>
      <h1 class="pf-name effect-${effect}" data-text="${escapeHtml(profile.name)}">${nameHtml}</h1>
      ${pills ? `<div class="pf-badges">${pills}</div>` : ''}
      ${profile.bio ? `<p class="pf-bio">${escapeHtml(profile.bio)}</p>` : ''}
      <div class="pf-meta">
        ${profile.location ? `<span>${icon('pin')}${escapeHtml(profile.location)}</span>` : ''}
        ${profile.pronouns ? `<span>${escapeHtml(profile.pronouns)}</span>` : ''}
        <span>${icon('clock')}${localTime()} local</span>
        <span>joined ${escapeHtml(joined)}</span>
      </div>
      ${socials ? `<div class="pf-socials">${socials}</div>` : ''}
      ${profile.discord.show ? `
        <div class="pf-discord ${status}">
          <div class="pf-d-av">${profile.avatar && /^(https?:\/\/|data:image\/)/i.test(profile.avatar) ? `<img src="${escapeHtml(profile.avatar)}" alt="" />` : escapeHtml(initials(profile.discord.username || profile.name))}</div>
          <div class="pf-d-info">
            <b>${escapeHtml(profile.discord.username || profile.name)}</b>
            <span>${profile.discord.activity ? escapeHtml(profile.discord.activity) : STATUS_LABEL[status]}</span>
          </div>
          <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </div>` : ''}
      ${hasPlayer ? `
        <div class="pf-player" data-player>
          <button class="pf-play" type="button" data-act="play" aria-label="Play music">${icon('play')}</button>
          <div class="pf-wave"><canvas aria-hidden="true"></canvas></div>
          <div class="pf-track">
            <b>${escapeHtml(trackTitle)}</b>
            <span>${profile.audio.url ? 'external source' : 'aura.fm'}</span>
          </div>
          <div class="pf-vol">
            <input type="range" min="0" max="100" value="${Number(profile.audio.volume) || 0}" aria-label="Volume" data-act="volume" />
          </div>
        </div>` : ''}
    </main>

    <div class="pf-foot">
      <button type="button" data-act="handle" style="font:inherit;color:inherit;letter-spacing:inherit">aura.lol/${escapeHtml(profile.username)}</button>
      <span class="built">${icon('sparkles')} built on aura</span>
    </div>

    ${profile.intro && !preview ? `
      <div class="pf-intro" data-intro>
        <div class="intro-av">${avatarMarkup(profile)}</div>
        <div class="intro-name">${escapeHtml(profile.name)}</div>
        <div class="intro-sub">${escapeHtml(profile.username)} · aura.lol</div>
        <div class="intro-cta">${icon('headphones')} click to enter</div>
        <button class="intro-mute" type="button" data-act="mute-enter">enter without sound</button>
      </div>` : ''}
  `;

  let cleanups = [];
  let mounted = false;
  let playing = false;
  let destroyed = false;

  const playButton = el.querySelector('[data-act="play"]');
  const volumeInput = el.querySelector('[data-act="volume"]');

  function setPlaying(next) {
    playing = next;
    if (playButton) playButton.innerHTML = icon(playing ? 'pause' : 'play');
    if (playButton) playButton.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  async function toggleAudio() {
    if (preview) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    const ok = await audio.play({
      preset: profile.audio.preset,
      url: profile.audio.url,
      volume: profile.audio.volume
    });
    setPlaying(ok);
    if (!ok) toast('Audio could not start. Try a different source.', 'error');
  }

  function enter(silent) {
    const intro = el.querySelector('[data-intro]');
    if (!intro) return;
    intro.classList.add('hide');
    setTimeout(() => intro.remove(), 700);
    if (!silent && profile.audio.autoplay) toggleAudio();
  }

  const onClick = async (event) => {
    const intro = event.target.closest('[data-intro]');
    if (intro) {
      if (event.target.closest('[data-act="mute-enter"]')) {
        event.stopPropagation();
        enter(true);
      } else {
        enter(false);
      }
      return;
    }
    const action = event.target.closest('[data-act]');
    if (!action) return;
    const act = action.dataset.act;
    if (act === 'play') toggleAudio();
    if (act === 'mute-enter') enter(true);
    if (act === 'handle') {
      const link = `${location.origin}${location.pathname}#/u/${encodeURIComponent(profile.username)}`;
      const ok = await copyText(link);
      toast(ok ? 'Profile link copied' : 'Could not copy link', ok ? 'success' : 'error');
    }
    if (act === 'share') {
      const target = shareUrl || `${location.origin}${location.pathname}#/u/${encodeURIComponent(profile.username)}`;
      const ok = await copyText(target);
      toast(ok ? (isOwn ? 'Shareable link copied — send it anywhere' : 'Profile link copied') : 'Could not copy link', ok ? 'success' : 'error');
    }
  };

  const onVolume = (event) => {
    const value = Number(event.target.value);
    profile.audio.volume = value;
    audio.setVolume(value);
    paintVolume(event.target);
  };

  function paintVolume(input) {
    const value = Number(input.value);
    input.style.background = `linear-gradient(90deg, ${profile.accent2} ${value}%, rgba(255,255,255,0.2) ${value}%)`;
  }

  el.addEventListener('click', onClick);
  if (volumeInput) {
    volumeInput.addEventListener('input', onVolume);
    paintVolume(volumeInput);
  }

  return {
    el,
    profile,
    mount() {
      if (mounted) return;
      mounted = true;
      cleanups = [];
      cleanups.push(mountProfileEffects(el, profile, { preview }));
      if (profile.nameEffect === 'typewriter') {
        cleanups.push(typewriter(el.querySelector('.pf-name'), profile.name, { speed: preview ? 34 : 52 }));
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanups.forEach((fn) => { try { fn(); } catch {} });
      cleanups = [];
      el.removeEventListener('click', onClick);
      if (volumeInput) volumeInput.removeEventListener('input', onVolume);
      if (!preview) audio.pause();
    },
    isPlaying: () => playing
  };
}

export function shareProfile(profile) {
  return shareLink(profile);
}

export { shareLink };
