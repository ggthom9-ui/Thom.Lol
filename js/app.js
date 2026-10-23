import { renderLanding, renderDiscover } from './landing.js';
import { renderEditor } from './editor.js';
import { createProfile } from './profile.js';
import { resolveProfile, registerView, loadMine, saveMine, shareLink, slugify } from './store.js';
import { initCursor } from './fx.js';
import { icon } from './icons.js';
import { toast, escapeHtml, closeAllModals } from './ui.js';

const app = document.getElementById('app');
let activeRoute = null;
let currentCleanup = null;

function cleanupActive() {
  closeAllModals();
  if (currentCleanup) {
    try { currentCleanup(); } catch {}
    currentCleanup = null;
  }
  if (activeRoute && activeRoute.__cleanup) {
    try { activeRoute.__cleanup(); } catch {}
  }
  activeRoute = null;
}

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean).map((part) => {
    try { return decodeURIComponent(part); } catch { return part; }
  });
  const params = new URLSearchParams(queryPart);
  if (!segments.length) return { name: 'landing' };
  if (segments[0] === 'discover') return { name: 'discover' };
  if (segments[0] === 'editor') return { name: 'editor' };
  if (segments[0] === 'u' && segments[1]) return { name: 'profile', username: segments[1], encoded: params.get('d') || '' };
  return { name: 'notfound' };
}

function notFound() {
  const root = document.createElement('div');
  root.className = 'site';
  root.innerHTML = `
    <div class="notfound">
      <div class="code">404</div>
      <h1 style="font-family:var(--font-display);font-size:28px;letter-spacing:-.03em">essa aura não existe</h1>
      <p>O link pode ter sido digitado errado — ou essa aura ainda está esperando alguém.</p>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;justify-content:center">
        <a class="btn btn-primary" href="#/editor">${icon('sparkles')} criar a minha</a>
        <a class="btn btn-ghost" href="#/discover">explorar perfis</a>
      </div>
    </div>`;
  return root;
}

function buildProfileRoute(username, encoded) {
  const resolved = resolveProfile(username, encoded);
  const profile = resolved.profile;
  const isOwn = !resolved.shared && loadMine().username === profile.username;
  const views = registerView(profile.username, profile.views);
  const shareUrl = isOwn ? shareLink(profile) : `${location.origin}${location.pathname}#/u/${encodeURIComponent(profile.username)}`;
  const view = createProfile(profile, { views, shareUrl, isOwn, preview: false });

  const shell = document.createElement('div');
  shell.className = 'profile-shell';
  shell.appendChild(view.el);

  const back = document.createElement('a');
  back.className = 'pf-back';
  back.href = isOwn ? '#/editor' : '#/discover';
  back.innerHTML = `${icon('chevron-left')} ${isOwn ? 'editor' : 'descobrir'}`;
  shell.appendChild(back);

  if (!isOwn && !resolved.claimed) {
    const cta = document.createElement('a');
    cta.className = 'pf-back pf-cta';
    cta.href = '#/editor';
    cta.innerHTML = `${icon('sparkles')} crie a sua`;
    shell.appendChild(cta);
  }

  let claimCleanup = null;
  if (resolved.claimed) {
    const claim = document.createElement('button');
    claim.type = 'button';
    claim.className = 'pf-back pf-claim';
    claim.innerHTML = `${icon('sparkles')} aura.lol/${escapeHtml(profile.username)} está livre — reivindicar`;
    claim.addEventListener('click', () => {
      const mine = loadMine();
      mine.username = profile.username;
      if (mine.name === 'Your Name' || !mine.name) {
        mine.name = profile.name;
      }
      saveMine(mine);
      toast(`aura.lol/${profile.username} agora é seu`, 'success');
      location.hash = '#/editor';
    });
    shell.appendChild(claim);
    claimCleanup = () => claim.remove();
  }

  app.appendChild(shell);
  view.mount();
  currentCleanup = () => {
    view.destroy();
    claimCleanup?.();
  };
  document.title = `${profile.name} · aura.lol/${profile.username}`;
  activeRoute = shell;
  return shell;
}

function render() {
  const route = parseRoute();
  cleanupActive();
  app.innerHTML = '';
  app.scrollTop = 0;

  if (route.name === 'profile') {
    window.scrollTo(0, 0);
    buildProfileRoute(route.username, route.encoded);
    return;
  }

  window.scrollTo(0, 0);
  let node;
  if (route.name === 'landing') {
    node = renderLanding();
    document.title = 'AURA — toda a sua internet, em um único link';
  } else if (route.name === 'discover') {
    node = renderDiscover();
    document.title = 'Descobrir auras · AURA';
  } else if (route.name === 'editor') {
    node = renderEditor();
    document.title = 'Editor · AURA';
  } else {
    node = notFound();
    document.title = '404 · AURA';
  }
  app.appendChild(node);
  activeRoute = node;
  if (node.__cleanup) currentCleanup = node.__cleanup;
}

window.addEventListener('hashchange', render);
window.addEventListener('aura:rerender', render);
window.addEventListener('beforeunload', () => {
  if (activeRoute && activeRoute.__cleanup) {
    try { activeRoute.__cleanup(); } catch {}
  }
});

initCursor();
render();
