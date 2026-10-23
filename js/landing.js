import { icon, logoMark, platformList } from './icons.js';
import { THEMES, SEED_PROFILES, themeById } from './data.js';
import { backgroundCss, formatNumber, loadMine, saveMine, applyTheme, slugify } from './store.js';
import { initReveal, initTilt } from './fx.js';
import { toast, escapeHtml } from './ui.js';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'neon', label: 'Neon' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'noir', label: 'Noir' },
  { id: 'retro', label: 'Retrô' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'cyber', label: 'Cyber' }
];

const CATEGORY_BY_USER = {
  nova: 'neon',
  luna: 'pastel',
  vex: 'noir',
  kairo: 'retro',
  mira: 'minimal',
  zero: 'cyber'
};

export function siteHeader(active = 'home') {
  return `
  <header class="site-header" data-header>
    <div class="container nav">
      <a class="brand" href="#/" aria-label="Aura home">
        <span class="brand-mark">${logoMark()}</span>
        <span>AURA<small>your internet</small></span>
      </a>
      <nav class="nav-links" aria-label="Main">
        <a href="#/discover" class="${active === 'discover' ? 'active' : ''}">Descobrir</a>
        <a href="#/" data-scroll="recursos">Recursos</a>
        <a href="#/" data-scroll="temas">Temas</a>
        <a href="#/editor" class="${active === 'editor' ? 'active' : ''}">Editor</a>
      </nav>
      <div class="nav-actions">
        <a class="btn btn-ghost btn-sm" href="#/discover">Explorar</a>
        <a class="btn btn-primary btn-sm" href="#/editor" aria-label="Criar perfil">${icon('sparkles')}<span>Criar perfil</span></a>
      </div>
    </div>
  </header>`;
}

export function siteFooter() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="brand" href="#/">
            <span class="brand-mark">${logoMark()}</span>
            <span>AURA<small>your internet</small></span>
          </a>
          <p>Um link para toda a sua presença digital. Feito para criadores que se importam com os detalhes.</p>
        </div>
        <div class="footer-col">
          <h4>Produto</h4>
          <a href="#/editor">Editor</a>
          <a href="#/discover">Descobrir</a>
          <a href="#/" data-scroll="temas">Temas</a>
          <a href="#/" data-scroll="recursos">Recursos</a>
        </div>
        <div class="footer-col">
          <h4>Recursos</h4>
          <a href="#/" data-scroll="recursos">Player de áudio</a>
          <a href="#/" data-scroll="recursos">Efeitos</a>
          <a href="#/editor">Presença no Discord</a>
          <a href="#/editor">Analytics</a>
        </div>
        <div class="footer-col">
          <h4>Aura</h4>
          <a href="#/u/nova">Perfil de exemplo</a>
          <a href="#/editor">Começar grátis</a>
          <a href="#/">Sem cookies</a>
          <a href="#/">Feito com carinho</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Aura Labs · demo local, seus dados ficam no seu navegador</span>
        <span class="made">${icon('heart')} feito para a internet bonita</span>
      </div>
    </div>
  </footer>`;
}

const SOCIAL_HC = ['discord', 'x', 'instagram', 'spotify'];

function heroCard() {
  return `
  <div class="hero-visual">
    <div class="hero-card-wrap" data-tilt>
      <div class="hero-card">
        <div class="hero-card-inner">
          <div class="hero-card-bg"></div>
          <div class="hero-card-body">
            <div class="hero-card-top">
              <span class="hc-pill">${icon('eye')} 48.2k</span>
              <span class="hc-pill">${icon('volume')} playing</span>
            </div>
            <div class="hc-av">N<span class="hc-status"></span></div>
            <div class="hc-name">nova <span class="verified">${icon('badge-check')}</span><span class="crown">${icon('crown')}</span></div>
            <p class="hc-bio">digital dreamer · building worlds at 3am</p>
            <div class="hc-tags"><span class="hc-tag">late night</span><span class="hc-tag">synthwave</span><span class="hc-tag">design</span></div>
            <div class="hc-socials">
              ${SOCIAL_HC.map((p) => `<span class="hc-social">${icon(p)}</span>`).join('')}
            </div>
            <div class="hc-player">
              <span class="hc-play">${icon('play')}</span>
              <div class="hc-track"><b>Midnight Drive</b><span>aura.fm</span></div>
              <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="float-chip fc-a">
      <span class="fc-icon">${icon('eye')}</span>
      <div><b>+2.4k views</b><span>nos últimos 7 dias</span></div>
    </div>
    <div class="float-chip fc-c">
      <span class="fc-icon">${icon('badge-check')}</span>
      <div><b>perfil verificado</b><span>aura.lol/nova</span></div>
    </div>
  </div>`;
}

function marquee() {
  const items = platformList.concat(platformList);
  return `
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      ${items.map((p) => `<span class="marquee-item">${icon(p.id)}${p.label}</span>`).join('')}
    </div>
  </div>`;
}

function featureCards() {
  return `
  <div class="bento">
    <article class="bento-card span-3 reveal">
      <div class="b-icon">${icon('music')}</div>
      <h3>Áudio que prende</h3>
      <p>Uma trilha generativa exclusiva — ou a sua própria música. O perfil entra tocando, com visualizador reativo de verdade.</p>
      <div class="bento-visual">
        <div class="bv-player">
          <span class="hc-play">${icon('play')}</span>
          <div class="hc-track"><b>Nebula Drift</b><span>aura.fm — generative</span></div>
          <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </article>
    <article class="bento-card span-3 reveal">
      <div class="b-icon">${icon('wand')}</div>
      <h3>Efeitos vivos</h3>
      <p>Estrelas, neve, chuva, brilhos e pétalas em canvas. Movimento real, leve, que respeita quem prefere menos animação.</p>
      <div class="bento-visual">
        <div class="swatches">
          <i style="background:linear-gradient(140deg,#8b5cf6,#22d3ee)"></i>
          <i style="background:linear-gradient(140deg,#ff71ce,#01cdfe)"></i>
          <i style="background:linear-gradient(140deg,#34d399,#22d3ee)"></i>
          <i style="background:linear-gradient(140deg,#fb923c,#f472b6)"></i>
          <i style="background:linear-gradient(140deg,#e5e7eb,#6b7280)"></i>
        </div>
      </div>
    </article>
    <article class="bento-card span-2 reveal">
      <div class="b-icon">${icon('discord')}</div>
      <h3>Presença real</h3>
      <p>Status e o que você está ouvindo, direto no perfil.</p>
      <div class="bento-visual">
        <div class="bv-discord">
          <span class="d-av">N</span>
          <div><b>nova</b><span>Listening to Midnight Drive</span></div>
          <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </article>
    <article class="bento-card span-2 reveal">
      <div class="b-icon">${icon('cursor')}</div>
      <h3>Cursor com aura</h3>
      <p>Um rastro de luz que segue cada movimento.</p>
      <div class="bento-visual">
        <div class="bv-cursor">
          <div class="c-ring"></div>
          <span class="trail" style="width:5px;height:5px;left:42%;top:52%"></span>
          <span class="trail" style="width:3px;height:3px;left:50%;top:60%;animation-delay:.4s"></span>
          <span class="trail" style="width:4px;height:4px;left:58%;top:46%;animation-delay:.9s"></span>
          <span class="trail" style="width:3px;height:3px;left:36%;top:58%;animation-delay:1.3s"></span>
        </div>
      </div>
    </article>
    <article class="bento-card span-2 reveal">
      <div class="b-icon">${icon('chart')}</div>
      <h3>Seu alcance</h3>
      <p>Views reais no seu perfil, sem painel complicado.</p>
      <div class="bento-visual">
        <svg class="sparkline" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".35"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs>
          <path class="area" d="M0 52 L14 44 L28 48 L42 34 L56 38 L70 26 L84 30 L98 20 L112 24 L126 14 L140 20 L154 10 L168 15 L182 6 L200 9 L200 60 L0 60 Z"/>
          <path d="M0 52 L14 44 L28 48 L42 34 L56 38 L70 26 L84 30 L98 20 L112 24 L126 14 L140 20 L154 10 L168 15 L182 6 L200 9"/>
        </svg>
      </div>
    </article>
  </div>`;
}

function themeCards() {
  return `
  <div class="themes-grid">
    ${THEMES.slice(0, 4).map((theme) => `
      <article class="theme-card reveal" data-theme="${theme.id}" role="button" tabindex="0" aria-label="Usar tema ${theme.name}">
        <div class="theme-preview" style="background:${backgroundCss({ colors: theme.colors }, theme.accent, theme.accent2)};color:#fff">
          <div class="theme-av" style="background:linear-gradient(145deg, ${theme.accent}, ${theme.accent2})">${theme.name.charAt(0)}</div>
          <div class="theme-name" style="font-family:${theme.font === 'JetBrains Mono' ? "'JetBrains Mono', monospace" : "'Space Grotesk', sans-serif"}">${theme.name.toLowerCase()}</div>
          <div class="theme-handle">aura.lol/you</div>
          <div class="theme-dots">${['x', 'spotify', 'discord', 'globe'].map((p) => `<i>${icon(p)}</i>`).join('')}</div>
        </div>
        <div class="theme-meta"><b>${theme.name}</b><span>${theme.tag}</span></div>
        <span class="theme-open">${icon('wand')} usar</span>
      </article>`).join('')}
  </div>`;
}

export function renderLanding() {
  const root = document.createElement('div');
  root.className = 'site';
  root.innerHTML = `
    ${siteHeader('home')}
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow reveal"><span class="dot-live"></span> 128.402 auras online agora</span>
          <h1 class="reveal">
            <span class="line">Toda a sua</span>
            <span class="line"><span class="grad-text">internet</span> em um</span>
            <span class="line">único link.</span>
          </h1>
          <p class="hero-sub reveal">Música, redes, presença no Discord e efeitos que respiram. Crie um perfil que parece <strong>você</strong> — em menos de dois minutos.</p>
          <form class="claim reveal" data-claim autocomplete="off">
            <div class="claim-bar">
              <span class="claim-prefix">aura.lol/</span>
              <input type="text" name="username" placeholder="seu-nome" maxlength="24" aria-label="Escolha seu nome de usuário" />
              <button class="btn btn-primary" type="submit">Garantir ${icon('arrow-right')}</button>
            </div>
            <div class="claim-hint">
              <span>${icon('check')} grátis para sempre</span>
              <span>${icon('check')} sem cadastro</span>
              <span>${icon('check')} link instantâneo</span>
            </div>
          </form>
          <div class="hero-social-proof reveal">
            <div class="avatar-stack" aria-hidden="true">
              <span class="mini-av" style="background:linear-gradient(140deg,#8b5cf6,#22d3ee)">N</span>
              <span class="mini-av" style="background:linear-gradient(140deg,#f9a8d4,#c4b5fd)">L</span>
              <span class="mini-av" style="background:linear-gradient(140deg,#e5e7eb,#6b7280)">V</span>
              <span class="mini-av" style="background:linear-gradient(140deg,#ff71ce,#01cdfe)">K</span>
              <span class="mini-av" style="background:linear-gradient(140deg,#34d399,#22d3ee)">M</span>
            </div>
            <p><strong>+42 mil criadores</strong><span class="stars">★★★★★</span> já trocaram o link da bio por uma aura.</p>
          </div>
        </div>
        ${heroCard()}
      </div>
      <div class="container">${marquee()}</div>
    </section>

    <section class="section" id="recursos">
      <div class="container">
        <div class="section-head reveal">
          <span class="section-kicker">Feito para aparecer</span>
          <h2>Não é só um link.<br/>É uma <span class="grad-text">presença</span>.</h2>
          <p>O que era uma lista de botões vira um pequeno universo. Tudo editável, nada complicado.</p>
        </div>
        ${featureCards()}
      </div>
    </section>

    <section class="section" id="temas">
      <div class="container">
        <div class="section-head reveal">
          <span class="section-kicker">Sua assinatura visual</span>
          <h2>Escolha uma <span class="grad-text">aura</span>.</h2>
          <p>Oito direções estéticas prontas. Troque de tema em um clique e ajuste cada detalhe depois.</p>
        </div>
        ${themeCards()}
        <div style="display:flex;justify-content:center;margin-top:30px" class="reveal">
          <a class="btn btn-ghost" href="#/editor">Ver todos os temas ${icon('arrow-right')}</a>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:20px">
      <div class="container">
        <div class="cta-band reveal">
          <span class="eyebrow" style="margin-bottom:20px"><span class="dot-live"></span> aura.lol/voce</span>
          <h2>Sua aura merece mais<br/>que um link na bio.</h2>
          <p>Monte seu perfil em minutos. Sem conta, sem cartão, sem complicação. Só você e a sua internet.</p>
          <a class="btn btn-primary btn-lg" href="#/editor">${icon('sparkles')} Criar meu perfil</a>
          <div class="cta-mini">seus dados ficam no seu navegador · compartilhe com um link</div>
        </div>
      </div>
    </section>
    ${siteFooter()}
  `;

  const disposers = [];
  const tiltWrap = root.querySelector('[data-tilt]');
  if (tiltWrap) disposers.push(initTilt(tiltWrap, 6));
  initReveal(root);
  disposers.push(initHeaderScroll(root));
  root.__cleanup = () => disposers.forEach((fn) => { try { fn(); } catch {} });

  root.querySelector('[data-claim]').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const username = slugify(input.value);
    if (!username) {
      toast('Escolha um nome com letras ou números', 'error');
      input.focus();
      return;
    }
    const profile = loadMine();
    profile.username = username;
    saveMine(profile);
    toast(`aura.lol/${username} é seu — vamos personalizar`, 'success');
    setTimeout(() => { location.hash = '#/editor'; }, 240);
  });

  root.querySelectorAll('[data-theme]').forEach((card) => {
    const apply = () => {
      const profile = loadMine();
      applyTheme(profile, card.dataset.theme);
      saveMine(profile);
      toast(`Tema ${themeById(card.dataset.theme).name} aplicado`, 'success');
      setTimeout(() => { location.hash = '#/editor'; }, 260);
    };
    card.addEventListener('click', apply);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        apply();
      }
    });
  });

  root.querySelectorAll('[data-scroll]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.getElementById(anchor.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  return root;
}

function profileCard(profile) {
  const theme = themeById(profile.theme);
  const category = CATEGORY_BY_USER[profile.username] || 'neon';
  return `
  <article class="p-card reveal" data-username="${escapeHtml(profile.username)}" data-category="${category}" role="button" tabindex="0" aria-label="Abrir perfil de ${escapeHtml(profile.name)}">
    <div class="p-banner" style="background:${backgroundCss(profile.bg, profile.accent, profile.accent2)}">
      <span class="p-orb" style="width:120px;height:120px;background:${theme.accent};left:-20px;top:-30px"></span>
      <span class="p-orb" style="width:90px;height:90px;background:${theme.accent2};right:10px;bottom:-20px"></span>
      <span class="p-card-tag" style="position:absolute;left:12px;top:12px;background:rgba(0,0,0,.4);border-color:rgba(255,255,255,.22);color:rgba(255,255,255,.8);backdrop-filter:blur(8px)">${escapeHtml(theme.name)}</span>
      <span class="theme-open" style="opacity:1;transform:none">${icon('external')} abrir</span>
    </div>
    <div class="p-card-body">
      <div class="p-card-top">
        <div class="p-card-av" style="background:linear-gradient(140deg, ${profile.accent}, ${profile.accent2})">${escapeHtml(profile.name.charAt(0))}</div>
        <span class="p-card-views">${icon('eye')}${formatNumber(profile.views)}</span>
      </div>
      <div class="p-card-name">${escapeHtml(profile.name)} ${profile.badges.includes('verified') ? `<span style="color:#38bdf8">${icon('badge-check')}</span>` : ''}${profile.badges.includes('crown') ? `<span style="color:#fbbf24">${icon('crown')}</span>` : ''}</div>
      <p class="p-card-bio">${escapeHtml(profile.bio || '—')}</p>
      <div class="p-card-foot">
        <span class="p-card-tag">${escapeHtml(profile.location || 'internet')}</span>
        <span class="p-card-tag">${escapeHtml(profile.audio.preset)}</span>
        <span class="p-card-socials">${profile.links.slice(0, 3).map((l) => icon(l.platform)).join('')}</span>
      </div>
    </div>
  </article>`;
}

export function renderDiscover() {
  const root = document.createElement('div');
  root.className = 'site';
  root.innerHTML = `
    ${siteHeader('discover')}
    <section class="discover-hero">
      <div class="container">
        <span class="eyebrow reveal"><span class="dot-live"></span> ${SEED_PROFILES.length} auras em destaque</span>
        <h1 class="reveal">Descubra <span class="grad-text">auras</span>.</h1>
        <p class="reveal">Perfis de exemplo para inspirar a sua próxima identidade digital. Entre, ouça, explore — e depois crie a sua.</p>
        <div class="filter-row reveal">
          ${CATEGORIES.map((c) => `<button class="chip ${c.id === 'all' ? 'active' : ''}" data-filter="${c.id}" type="button">${c.label}</button>`).join('')}
          <a class="btn btn-soft btn-sm" href="#/editor" style="margin-left:auto">${icon('plus')} criar a minha</a>
        </div>
      </div>
    </section>
    <div class="container">
      <div class="profiles-grid" data-grid>
        ${SEED_PROFILES.map(profileCard).join('')}
      </div>
    </div>
    <div class="container">
      <div class="cta-band reveal" style="margin-bottom:80px">
        <h2>A próxima aura é a sua.</h2>
        <p>Escolha um nome, ajuste os detalhes e compartilhe. Leva menos que uma música.</p>
        <a class="btn btn-primary btn-lg" href="#/editor">${icon('sparkles')} Começar agora</a>
      </div>
    </div>
    ${siteFooter()}
  `;

  initReveal(root);
  const stopHeader = initHeaderScroll(root);
  root.__cleanup = () => stopHeader();

  const grid = root.querySelector('[data-grid]');
  const open = (card) => { if (card?.dataset.username) location.hash = `#/u/${card.dataset.username}`; };
  grid.addEventListener('click', (event) => open(event.target.closest('[data-username]')));
  grid.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const card = event.target.closest('[data-username]');
      if (card) {
        event.preventDefault();
        open(card);
      }
    }
  });

  root.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      root.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === button));
      const filter = button.dataset.filter;
      grid.querySelectorAll('[data-username]').forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  root.querySelectorAll('[data-scroll]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      location.hash = '#/';
      setTimeout(() => {
        document.getElementById(anchor.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    });
  });

  return root;
}

export function initHeaderScroll(root) {
  const header = root.querySelector('[data-header]');
  if (!header) return () => {};
  const update = () => header.classList.toggle('scrolled', window.scrollY > 12);
  update();
  window.addEventListener('scroll', update, { passive: true });
  return () => window.removeEventListener('scroll', update);
}
