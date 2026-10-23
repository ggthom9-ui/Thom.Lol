import { icon, logoMark, platformList } from './icons.js';
import {
  THEMES, FONTS, NAME_EFFECTS, PARTICLES, BADGES, AUDIO_PRESETS, themeById, presetById
} from './data.js';
import {
  loadMine, saveMine, applyTheme, shareLink, copyText, normalizeProfile, formatNumber, slugify, fontStack
} from './store.js';
import { createProfile } from './profile.js';
import { openModal, download, toast, escapeHtml, debounce } from './ui.js';
import { audio } from './audio.js';

function setPath(object, path, value) {
  const parts = path.split('.');
  let cursor = object;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    if (cursor[key] === undefined || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key];
  }
  const last = parts[parts.length - 1];
  cursor[/^\d+$/.test(last) ? Number(last) : last] = value;
}

function getPath(object, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), object);
}

function switchRow(label, description, path, checked) {
  return `
    <div class="switch-row">
      <div class="switch-info"><b>${label}</b><span>${description}</span></div>
      <button class="switch" type="button" role="switch" aria-checked="${checked ? 'true' : 'false'}" data-toggle="${path}" aria-label="${label}"></button>
    </div>`;
}

function linkRows(profile) {
  if (!profile.links.length) {
    return `<div style="padding:18px 0;text-align:center;color:var(--faint);font-size:12.5px">Nenhum link ainda. Adicione o primeiro abaixo.</div>`;
  }
  return profile.links.map((link, index) => `
    <div class="link-row" data-link-index="${index}">
      <select class="select" data-link-field="platform" aria-label="Plataforma">
        ${platformList.map((p) => `<option value="${p.id}" ${p.id === link.platform ? 'selected' : ''}>${p.label}</option>`).join('')}
      </select>
      <input class="input" type="text" data-link-field="url" value="${escapeHtml(link.url || '')}" placeholder="https://..." aria-label="URL do link" />
      <div class="link-tools">
        <button class="icon-btn" type="button" data-link-move="-1" aria-label="Mover para cima" ${index === 0 ? 'disabled style="opacity:.3"' : ''}>${icon('chevron-up')}</button>
        <button class="icon-btn" type="button" data-link-move="1" aria-label="Mover para baixo" ${index === profile.links.length - 1 ? 'disabled style="opacity:.3"' : ''}>${icon('chevron-down')}</button>
        <button class="icon-btn danger" type="button" data-link-remove aria-label="Remover link">${icon('trash')}</button>
      </div>
    </div>`).join('');
}

function panelProfile(profile) {
  return `
  <section class="panel active" data-panel-view="perfil">
    <div class="panel-head">
      <h2>${icon('user')} Seu perfil</h2>
      <p>O essencial: quem você é e como as pessoas te encontram.</p>
    </div>
    <div class="card">
      <div class="card-title">${icon('link')} identidade</div>
      <div class="field">
        <label>Seu link <span class="hint">somente letras, números, ponto e hífen</span></label>
        <div class="prefix-input"><span>aura.lol/</span><input class="input" type="text" data-bind="username" value="${escapeHtml(profile.username)}" maxlength="24" spellcheck="false" /></div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Nome de exibição</label>
          <input class="input" type="text" data-bind="name" value="${escapeHtml(profile.name)}" maxlength="32" />
        </div>
        <div class="field">
          <label>Pronomes <span class="hint">opcional</span></label>
          <input class="input" type="text" data-bind="pronouns" value="${escapeHtml(profile.pronouns)}" maxlength="18" placeholder="ela/dela" />
        </div>
      </div>
      <div class="field">
        <label>Bio <span class="hint">quebras de linha são preservadas</span></label>
        <textarea class="textarea" data-bind="bio" maxlength="160" placeholder="duas linhas sobre você...">${escapeHtml(profile.bio)}</textarea>
      </div>
      <div class="field">
        <label>Localização <span class="hint">opcional</span></label>
        <input class="input" type="text" data-bind="location" value="${escapeHtml(profile.location)}" maxlength="28" placeholder="São Paulo, BR" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">${icon('image')} avatar</div>
      <div class="avatar-row">
        <div class="avatar-preview" data-avatar-preview>${profile.avatar ? `<img src="${escapeHtml(profile.avatar)}" alt="" />` : escapeHtml((profile.name || '?').charAt(0).toUpperCase())}</div>
        <div class="avatar-actions">
          <button class="btn btn-ghost" type="button" data-avatar-upload>${icon('upload')} enviar imagem</button>
          <button class="btn btn-ghost" type="button" data-avatar-clear>${icon('x')} remover</button>
        </div>
        <input type="file" accept="image/*" hidden data-avatar-file />
      </div>
      <div class="field" style="margin-top:16px">
        <label>ou use uma URL</label>
        <input class="input" type="text" data-bind="avatar" value="${escapeHtml(profile.avatar)}" placeholder="https://..." spellcheck="false" />
      </div>
      <div class="field">
        <label>Formato do avatar</label>
        <div class="seg" data-seg="avatarShape">
          ${[['circle', 'Círculo'], ['squircle', 'Squircle'], ['hexagon', 'Hexágono']].map(([value, label]) => `<button type="button" data-value="${value}" class="${profile.avatarShape === value ? 'active' : ''}">${label}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">${icon('badge-check')} selos</div>
      <div class="chip-row" style="display:flex;gap:8px;flex-wrap:wrap">
        ${BADGES.map((badge) => `<button class="chip ${profile.badges.includes(badge.id) ? 'active' : ''}" type="button" data-badge="${badge.id}">${icon(badge.icon)} ${badge.label}</button>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-title">${icon('sparkles')} entrada</div>
      ${switchRow('Tela de entrada', 'Um convite para entrar — clássico dos perfis com aura.', 'intro', profile.intro)}
      ${switchRow('Presença no Discord', 'Mostra seu card de status e atividade.', 'discord.show', profile.discord.show)}
    </div>
  </section>`;
}

function panelAppearance(profile) {
  return `
  <section class="panel" data-panel-view="aparencia">
    <div class="panel-head">
      <h2>${icon('palette')} Aparência</h2>
      <p>Cor, tipografia e fundo. Aqui nasce a assinatura visual.</p>
    </div>
    <div class="card">
      <div class="card-title">${icon('sparkles')} tema</div>
      <div class="theme-chips">
        ${THEMES.map((theme) => `<button type="button" class="theme-chip ${profile.theme === theme.id ? 'active' : ''}" data-theme-chip="${theme.id}"><i style="background:linear-gradient(140deg, ${theme.accent}, ${theme.accent2})"></i>${theme.name}</button>`).join('')}
      </div>
      <div class="field" style="margin-top:18px">
        <label>Cores de destaque</label>
        <div class="color-grid">
          <div class="color-field" style="background:${profile.accent}"><input type="color" data-bind="accent" value="${profile.accent}" aria-label="Cor primária" /></div>
          <div class="color-field" style="background:${profile.accent2}"><input type="color" data-bind="accent2" value="${profile.accent2}" aria-label="Cor secundária" /></div>
          <div class="color-field" style="background:${profile.bg.colors[2]}"><input type="color" data-bind="bg.colors.2" value="${profile.bg.colors[2]}" aria-label="Cor de fundo" /></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">${icon('layers')} fundo</div>
      <div class="field">
        <label>Tipo de fundo</label>
        <div class="seg" data-seg="bg.type">
          ${[['gradient', 'Gradiente'], ['image', 'Imagem'], ['video', 'Vídeo']].map(([value, label]) => `<button type="button" data-value="${value}" class="${profile.bg.type === value ? 'active' : ''}">${label}</button>`).join('')}
        </div>
      </div>
      <div data-bg-gradient style="${profile.bg.type === 'gradient' ? '' : 'display:none'}">
        <div class="field">
          <label>Cores do gradiente</label>
          <div class="color-grid">
            ${profile.bg.colors.map((color, index) => `<div class="color-field" style="background:${color}"><input type="color" data-bind="bg.colors.${index}" value="${color}" aria-label="Cor ${index + 1}" /></div>`).join('')}
          </div>
        </div>
      </div>
      <div data-bg-image style="${profile.bg.type === 'image' ? '' : 'display:none'}">
        <div class="field">
          <label>URL da imagem</label>
          <input class="input" type="text" data-bind="bg.image" value="${escapeHtml(profile.bg.image)}" placeholder="https://.../wallpaper.jpg" spellcheck="false" />
        </div>
      </div>
      <div data-bg-video style="${profile.bg.type === 'video' ? '' : 'display:none'}">
        <div class="field">
          <label>URL do vídeo <span class="hint">mp4 / webm em loop</span></label>
          <input class="input" type="text" data-bind="bg.video" value="${escapeHtml(profile.bg.video)}" placeholder="https://.../loop.mp4" spellcheck="false" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Sombra <span class="range-val" data-val-for="bg.dim">${profile.bg.dim}%</span></label>
          <div class="range-row"><input type="range" min="0" max="90" data-number data-bind="bg.dim" value="${profile.bg.dim}" /></div>
        </div>
        <div class="field">
          <label>Desfoque <span class="range-val" data-val-for="bg.blur">${profile.bg.blur}px</span></label>
          <div class="range-row"><input type="range" min="0" max="24" data-number data-bind="bg.blur" value="${profile.bg.blur}" /></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">${icon('type')} tipografia</div>
      <div class="field">
        <label>Fonte</label>
        <select class="select" data-bind="font">
          ${FONTS.map((font) => `<option value="${escapeHtml(font.id)}" ${profile.font === font.id ? 'selected' : ''}>${font.label}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Efeito do nome</label>
        <div class="toggle-grid">
          ${NAME_EFFECTS.map((effect) => `<button type="button" class="tile-btn ${profile.nameEffect === effect.id ? 'active' : ''}" data-effect="${effect.id}">${icon(effect.icon)}${effect.label}</button>`).join('')}
        </div>
      </div>
      <div class="field">
        <label>Estilo do cartão</label>
        <div class="seg" data-seg="card">
          ${[['glass', 'Vidro'], ['solid', 'Sólido'], ['none', 'Livre']].map(([value, label]) => `<button type="button" data-value="${value}" class="${profile.card === value ? 'active' : ''}">${label}</button>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

function panelEffects(profile) {
  return `
  <section class="panel" data-panel-view="efeitos">
    <div class="panel-head">
      <h2>${icon('wand')} Efeitos</h2>
      <p>Movimento na medida. Tudo respeita "reduzir movimento" do sistema.</p>
    </div>
    <div class="card">
      <div class="card-title">${icon('star')} partículas</div>
      <div class="toggle-grid">
        ${PARTICLES.map((p) => `<button type="button" class="tile-btn ${profile.effects.particles === p.id ? 'active' : ''}" data-particle="${p.id}">${icon(p.icon)}${p.label}</button>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-title">${icon('cursor')} detalhes</div>
      ${switchRow('Rastro no cursor', 'Pequenos pontos de luz seguem o ponteiro.', 'effects.cursor', profile.effects.cursor)}
      ${switchRow('Granulado', 'Textura de filme sutil sobre o fundo.', 'effects.grain', profile.effects.grain)}
      ${switchRow('Parallax', 'O fundo reage suavemente ao movimento.', 'effects.parallax', profile.effects.parallax)}
    </div>
  </section>`;
}

function panelLinks(profile) {
  return `
  <section class="panel" data-panel-view="links">
    <div class="panel-head">
      <h2>${icon('link')} Links</h2>
      <p>Até 12 links. A ordem aqui é a ordem no perfil.</p>
    </div>
    <div class="card">
      <div class="card-title">${icon('grid')} suas redes</div>
      <div data-links-list>${linkRows(profile)}</div>
      <button class="add-link" type="button" data-add-link ${profile.links.length >= 12 ? 'disabled' : ''}>${icon('plus')} adicionar link</button>
    </div>
    <div class="card" style="background:rgba(139,92,246,.06);border-color:rgba(139,92,246,.18)">
      <div class="card-title" style="margin-bottom:6px">${icon('info')} dica</div>
      <p style="color:var(--muted);font-size:12.5px;line-height:1.6">Sem <code>https://</code>? A gente adiciona. E-mails funcionam com <code>mailto:</code> — ou escolha "Email" e escreva só o endereço.</p>
    </div>
  </section>`;
}

function panelAudio(profile) {
  return `
  <section class="panel" data-panel-view="audio">
    <div class="panel-head">
      <h2>${icon('music')} Áudio</h2>
      <p>Trilha generativa original ou sua própria música. O visualizador é real.</p>
    </div>
    <div class="card">
      <div class="card-title">${icon('headphones')} trilha</div>
      <div class="field">
        <label>Preset generativo <span class="hint">sem arquivos externos</span></label>
        <select class="select" data-bind="audio.preset">
          ${AUDIO_PRESETS.map((p) => `<option value="${p.id}" ${profile.audio.preset === p.id ? 'selected' : ''}>${p.label} · ${p.bpm} bpm</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Ou uma URL de áudio <span class="hint">mp3 / ogg</span></label>
        <input class="input" type="text" data-bind="audio.url" value="${escapeHtml(profile.audio.url)}" placeholder="https://.../track.mp3" spellcheck="false" />
      </div>
      <div class="field">
        <label>Volume inicial <span class="range-val" data-val-for="audio.volume">${profile.audio.volume}%</span></label>
        <div class="range-row"><input type="range" min="0" max="100" data-number data-bind="audio.volume" value="${profile.audio.volume}" /></div>
      </div>
      <button class="btn btn-ghost btn-sm" type="button" data-test-audio>${icon('play')} testar som</button>
    </div>
    <div class="card">
      <div class="card-title">${icon('settings')} comportamento</div>
      ${switchRow('Tocar ao entrar', 'Inicia após o clique na tela de entrada.', 'audio.autoplay', profile.audio.autoplay)}
      ${switchRow('Mostrar player', 'Controle de play e volume no perfil.', 'audio.showPlayer', profile.audio.showPlayer)}
    </div>
    <div class="card" style="background:rgba(34,211,238,.05);border-color:rgba(34,211,238,.18)">
      <div class="card-title" style="margin-bottom:6px">${icon('info')} sobre links externos</div>
      <p style="color:var(--muted);font-size:12.5px;line-height:1.6">O preset generativo funciona sempre. Áudios externos dependem do servidor permitir reprodução — se falhar, o perfil avisa sem quebrar.</p>
    </div>
  </section>`;
}

function panelDiscord(profile) {
  return `
  <section class="panel" data-panel-view="discord">
    <div class="panel-head">
      <h2>${icon('discord')} Discord</h2>
      <p>Um cartão de presença que deixa o perfil vivo.</p>
    </div>
    <div class="card">
      <div class="card-title">${icon('discord')} presença</div>
      ${switchRow('Mostrar cartão', 'Aparece abaixo dos links.', 'discord.show', profile.discord.show)}
      <div class="field" style="margin-top:16px">
        <label>Usuário</label>
        <input class="input" type="text" data-bind="discord.username" value="${escapeHtml(profile.discord.username)}" maxlength="28" />
      </div>
      <div class="field">
        <label>Atividade <span class="hint">o que está tocando / fazendo</span></label>
        <input class="input" type="text" data-bind="discord.activity" value="${escapeHtml(profile.discord.activity)}" maxlength="56" />
      </div>
      <div class="field">
        <label>Status</label>
        <select class="select" data-bind="discord.status">
          ${[['online', 'Online'], ['idle', 'Ausente'], ['dnd', 'Não perturbe'], ['offline', 'Offline']].map(([value, label]) => `<option value="${value}" ${profile.discord.status === value ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
    </div>
  </section>`;
}

function editorShell(profile) {
  const root = document.createElement('div');
  root.className = 'editor';
  root.innerHTML = `
    <div class="editor-bar">
      <a class="brand" href="#/" aria-label="Voltar para o início">
        <span class="brand-mark">${logoMark()}</span>
        <span>AURA</span>
      </a>
      <span class="divider"></span>
      <div class="editor-title"><span class="live-dot"></span><span>editor</span><b>·</b><span data-top-link>aura.lol/${escapeHtml(profile.username)}</span></div>
      <div class="editor-bar-actions">
        <span class="save-state" data-save-state>${icon('check')} salvo</span>
        <button class="btn btn-ghost btn-sm" type="button" data-view-profile aria-label="ver perfil">${icon('external')}<span>ver perfil</span></button>
        <button class="btn btn-soft btn-sm" type="button" data-share aria-label="compartilhar">${icon('share')}<span>compartilhar</span></button>
        <button class="btn btn-primary btn-sm" type="button" data-save aria-label="salvar">${icon('save')}<span>salvar</span></button>
      </div>
    </div>

    <div class="editor-grid">
      <aside class="editor-side">
        <span class="side-label">personalizar</span>
        <button class="side-link active" type="button" data-panel="perfil">${icon('user')} Perfil</button>
        <button class="side-link" type="button" data-panel="aparencia">${icon('palette')} Aparência</button>
        <button class="side-link" type="button" data-panel="efeitos">${icon('wand')} Efeitos</button>
        <button class="side-link" type="button" data-panel="links">${icon('link')} Links <span class="badge-count" data-link-count>${profile.links.length}</span></button>
        <button class="side-link" type="button" data-panel="audio">${icon('music')} Áudio</button>
        <button class="side-link" type="button" data-panel="discord">${icon('discord')} Discord</button>
        <div class="side-foot">
          <p>Salvo automaticamente no seu navegador. <a href="#/discover">Ver inspirações</a></p>
        </div>
      </aside>

      <div class="editor-main">
        ${panelProfile(profile)}
        ${panelAppearance(profile)}
        ${panelEffects(profile)}
        ${panelLinks(profile)}
        ${panelAudio(profile)}
        ${panelDiscord(profile)}
      </div>

      <aside class="preview-col">
        <div class="preview-label"><span class="live-dot"></span> prévia ao vivo</div>
        <div class="preview-shell" data-preview-shell>
          <div class="preview-notch"></div>
          <div class="preview-screen" data-preview-screen></div>
        </div>
        <div class="preview-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-open-profile>${icon('external')} abrir perfil</button>
          <button class="btn btn-ghost btn-sm btn-icon" type="button" data-refresh-preview aria-label="Reiniciar prévia">${icon('rotate')}</button>
        </div>
      </aside>
    </div>
  `;
  return root;
}

export function renderEditor() {
  const profile = loadMine();
  let skipCleanupSave = false;
  const root = editorShell(profile);
  const previewScreen = root.querySelector('[data-preview-screen]');
  const saveState = root.querySelector('[data-save-state]');
  const topLink = root.querySelector('[data-top-link]');
  let preview = null;
  let cleanupFns = [];

  function renderPreview() {
    if (preview) preview.destroy();
    previewScreen.innerHTML = '';
    preview = createProfile(profile, { preview: true, views: profile.views, isOwn: true });
    previewScreen.appendChild(preview.el);
    preview.mount();
  }

  const renderPreviewSoon = debounce(renderPreview, 130);

  function setSaveState(label, pending = false) {
    saveState.innerHTML = pending ? `${icon('rotate')} ${label}` : `${icon('check')} ${label}`;
    saveState.style.color = pending ? 'var(--faint)' : '';
  }

  const persist = debounce(() => {
    const ok = saveMine(profile);
    setSaveState(ok ? 'salvo agora' : 'falha ao salvar', !ok);
  }, 320);

  function markChanged() {
    setSaveState('salvando...', true);
    persist();
  }

  function updateTopLink() {
    topLink.textContent = `aura.lol/${slugify(profile.username) || 'you'}`;
  }

  function updateAllRanges() {
    root.querySelectorAll('input[type="range"]').forEach((input) => {
      const min = Number(input.min) || 0;
      const max = Number(input.max) || 100;
      const value = Number(input.value);
      const pct = ((value - min) / (max - min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
      const display = root.querySelector(`[data-val-for="${input.dataset.bind}"]`);
      if (display) {
        display.textContent = `${value}${input.dataset.bind === 'bg.blur' ? 'px' : '%'}`;
      }
    });
  }

  function updateBgFields() {
    const type = profile.bg.type;
    root.querySelector('[data-bg-gradient]').style.display = type === 'gradient' ? '' : 'none';
    root.querySelector('[data-bg-image]').style.display = type === 'image' ? '' : 'none';
    root.querySelector('[data-bg-video]').style.display = type === 'video' ? '' : 'none';
  }

  function syncColors() {
    root.querySelectorAll('[data-bind="accent"]').forEach((el) => { el.value = profile.accent; el.parentElement.style.background = profile.accent; });
    root.querySelectorAll('[data-bind="accent2"]').forEach((el) => { el.value = profile.accent2; el.parentElement.style.background = profile.accent2; });
    profile.bg.colors.forEach((color, index) => {
      root.querySelectorAll(`[data-bind="bg.colors.${index}"]`).forEach((el) => {
        el.value = color;
        el.parentElement.style.background = color;
      });
    });
  }

  function renderLinks() {
    root.querySelector('[data-links-list]').innerHTML = linkRows(profile);
    root.querySelector('[data-link-count]').textContent = profile.links.length;
    const add = root.querySelector('[data-add-link]');
    add.disabled = profile.links.length >= 12;
    add.style.opacity = add.disabled ? 0.45 : '';
  }

  function updateAvatarPreview() {
    const box = root.querySelector('[data-avatar-preview]');
    if (!box) return;
    box.innerHTML = profile.avatar
      ? `<img src="${escapeHtml(profile.avatar)}" alt="" />`
      : escapeHtml((profile.name || '?').charAt(0).toUpperCase());
  }

  function onField(event) {
    const field = event.target.closest('[data-bind]');
    if (!field) return;
    const path = field.dataset.bind;
    let value = field.value;
    if (field.hasAttribute('data-number')) value = Number(value);
    if (path === 'avatar') updateAvatarPreview();
    setPath(profile, path, value);
    if (path === 'bg.colors.2') {
      const picker = field.parentElement;
      if (picker) picker.style.background = value;
    }
    if (path === 'accent' || path === 'accent2') {
      const picker = field.parentElement;
      if (picker) picker.style.background = value;
    }
    if (path === 'name') updateAvatarPreview();
    if (path === 'username') updateTopLink();
    if (path.startsWith('audio.volume')) audio.setVolume(profile.audio.volume);
    if (path === 'bg.dim' || path === 'bg.blur' || path === 'audio.volume') updateAllRanges();
    renderPreviewSoon();
    markChanged();
  }

  function onToggle(button) {
    const path = button.dataset.toggle;
    const next = !getPath(profile, path);
    setPath(profile, path, next);
    button.setAttribute('aria-checked', next ? 'true' : 'false');
    if (path === 'audio.showPlayer') renderPreview();
    else renderPreviewSoon();
    markChanged();
  }

  const onClick = (event) => {
    const panelBtn = event.target.closest('[data-panel]');
    if (panelBtn) {
      root.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', b === panelBtn));
      root.querySelectorAll('[data-panel-view]').forEach((panel) => panel.classList.toggle('active', panel.dataset.panelView === panelBtn.dataset.panel));
      return;
    }

    const toggle = event.target.closest('[data-toggle]');
    if (toggle) { onToggle(toggle); return; }

    const themeChip = event.target.closest('[data-theme-chip]');
    if (themeChip) {
      applyTheme(profile, themeChip.dataset.themeChip);
      root.querySelectorAll('[data-theme-chip]').forEach((b) => b.classList.toggle('active', b === themeChip));
      syncColors();
      const fontSelect = root.querySelector('[data-bind="font"]');
      if (fontSelect) fontSelect.value = profile.font;
      renderPreview();
      markChanged();
      toast(`Tema ${themeById(profile.theme).name} aplicado`, 'success');
      return;
    }

    const seg = event.target.closest('[data-seg] button');
    if (seg) {
      const group = seg.closest('[data-seg]');
      const path = group.dataset.seg;
      setPath(profile, path, seg.dataset.value);
      group.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === seg));
      if (path === 'bg.type') updateBgFields();
      renderPreview();
      markChanged();
      return;
    }

    const effect = event.target.closest('[data-effect]');
    if (effect) {
      profile.nameEffect = effect.dataset.effect;
      root.querySelectorAll('[data-effect]').forEach((b) => b.classList.toggle('active', b === effect));
      renderPreview();
      markChanged();
      return;
    }

    const particle = event.target.closest('[data-particle]');
    if (particle) {
      profile.effects.particles = particle.dataset.particle;
      root.querySelectorAll('[data-particle]').forEach((b) => b.classList.toggle('active', b === particle));
      renderPreview();
      markChanged();
      return;
    }

    const badge = event.target.closest('[data-badge]');
    if (badge) {
      const id = badge.dataset.badge;
      if (profile.badges.includes(id)) profile.badges = profile.badges.filter((b) => b !== id);
      else profile.badges.push(id);
      badge.classList.toggle('active');
      renderPreviewSoon();
      markChanged();
      return;
    }

    if (event.target.closest('[data-avatar-upload]')) {
      root.querySelector('[data-avatar-file]').click();
      return;
    }
    if (event.target.closest('[data-avatar-clear]')) {
      profile.avatar = '';
      const input = root.querySelector('[data-bind="avatar"]');
      if (input) input.value = '';
      updateAvatarPreview();
      renderPreviewSoon();
      markChanged();
      return;
    }

    const linkEl = event.target.closest('[data-link-index]');
    if (linkEl) {
      const index = Number(linkEl.dataset.linkIndex);
      if (event.target.closest('[data-link-remove]')) {
        profile.links.splice(index, 1);
        renderLinks();
        renderPreview();
        markChanged();
        return;
      }
      const move = event.target.closest('[data-link-move]');
      if (move) {
        const dir = Number(move.dataset.linkMove);
        const target = index + dir;
        if (target >= 0 && target < profile.links.length) {
          [profile.links[index], profile.links[target]] = [profile.links[target], profile.links[index]];
          renderLinks();
          renderPreview();
          markChanged();
        }
        return;
      }
    }

    if (event.target.closest('[data-add-link]')) {
      if (profile.links.length >= 12) return;
      profile.links.push({ platform: 'globe', url: 'https://' });
      renderLinks();
      renderPreview();
      markChanged();
      return;
    }

    if (event.target.closest('[data-test-audio]')) {
      if (audio.playing) {
        audio.pause();
        toast('Som pausado', 'info');
      } else {
        saveMine(profile);
        audio.play({ preset: profile.audio.preset, url: profile.audio.url, volume: profile.audio.volume })
          .then((ok) => toast(ok ? 'Tocando prévia do áudio' : 'Não foi possível tocar esse áudio', ok ? 'success' : 'error'))
          .catch(() => toast('Não foi possível tocar esse áudio', 'error'));
      }
      return;
    }

    if (event.target.closest('[data-save]')) {
      saveMine(profile);
      setSaveState('salvo agora');
      markSavedPulse();
      toast('Perfil salvo neste navegador', 'success');
      return;
    }

    if (event.target.closest('[data-view-profile]') || event.target.closest('[data-open-profile]')) {
      saveMine(profile);
      location.hash = `#/u/${encodeURIComponent(slugify(profile.username) || 'you')}`;
      return;
    }

    if (event.target.closest('[data-refresh-preview]')) {
      renderPreview();
      return;
    }

    if (event.target.closest('[data-share]')) {
      openShare();
    }
  };

  function markSavedPulse() {
    saveState.animate(
      [{ opacity: 0.4 }, { opacity: 1 }],
      { duration: 320, easing: 'ease-out' }
    );
  }

  const onLinkField = (event) => {
    const field = event.target.closest('[data-link-field]');
    if (!field) return;
    const row = field.closest('[data-link-index]');
    if (!row) return;
    const index = Number(row.dataset.linkIndex);
    profile.links[index][field.dataset.linkField] = field.value;
    renderPreviewSoon();
    markChanged();
  };

  const onLinkFieldChange = (event) => {
    const field = event.target.closest('[data-link-field]');
    if (field && field.dataset.linkField === 'url' && field.value && !/^(https?:\/\/|mailto:|tel:)/i.test(field.value)) {
      if (/^[\w.-]+\.[a-z]{2,}/i.test(field.value)) {
        field.value = `https://${field.value}`;
        profile.links[Number(field.closest('[data-link-index]').dataset.linkIndex)].url = field.value;
        renderPreviewSoon();
        markChanged();
      }
    }
    const usernameInput = event.target.closest('[data-bind="username"]');
    if (usernameInput) {
      const clean = slugify(usernameInput.value) || 'you';
      profile.username = clean;
      usernameInput.value = clean;
      updateTopLink();
      markChanged();
      renderPreviewSoon();
    }
  };

  const onAvatarFile = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Escolha um arquivo de imagem', 'error');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast('Imagem muito grande (máx. 6MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 320;
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1, size / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          profile.avatar = canvas.toDataURL('image/jpeg', 0.86);
        } catch {
          profile.avatar = String(reader.result);
        }
        const input = root.querySelector('[data-bind="avatar"]');
        if (input) input.value = profile.avatar;
        updateAvatarPreview();
        renderPreviewSoon();
        markChanged();
        toast('Avatar atualizado', 'success');
      };
      img.onerror = () => toast('Não foi possível ler essa imagem', 'error');
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  function openShare() {
    saveMine(profile);
    setSaveState('salvo agora');
    const link = shareLink(profile);
    openModal({
      title: 'Compartilhar sua aura',
      subtitle: 'Este link carrega o perfil completo. Funciona em qualquer navegador.',
      body: `
        <div class="field">
          <label>Link público</label>
          <input class="input" readonly value="${escapeHtml(link)}" data-share-link />
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <button class="btn btn-ghost btn-sm" type="button" data-export>${icon('download')} exportar JSON</button>
          <button class="btn btn-ghost btn-sm" type="button" data-import>${icon('upload')} importar JSON</button>
        </div>
        <p style="color:var(--faint);font-size:11px;margin-top:14px;line-height:1.5">Dica: links com avatar em base64 podem ficar longos. Para um link curto, use uma URL de imagem.</p>
        <input type="file" accept="application/json" hidden data-import-file />
      `,
      actions: [
        { id: 'copy', label: 'Copiar link', icon: 'copy', variant: 'btn-primary', onClick: async (close) => {
          const ok = await copyText(link);
          toast(ok ? 'Link copiado' : 'Não foi possível copiar', ok ? 'success' : 'error');
        } },
        { id: 'open', label: 'Abrir perfil', icon: 'external', variant: 'btn-ghost', onClick: (close) => {
          close();
          location.hash = `#/u/${encodeURIComponent(slugify(profile.username) || 'you')}`;
        } }
      ],
      onMount: (backdrop) => {
        backdrop.querySelector('[data-export]').addEventListener('click', () => {
          download(`${slugify(profile.username) || 'aura'}-profile.json`, JSON.stringify(profile, null, 2));
          toast('JSON exportado', 'success');
        });
        const fileInput = backdrop.querySelector('[data-import-file]');
        backdrop.querySelector('[data-import]').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
          const file = fileInput.files && fileInput.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(String(reader.result));
              const next = normalizeProfile(parsed);
              skipCleanupSave = true;
              saveMine(next);
              toast('Perfil importado', 'success');
              window.dispatchEvent(new Event('aura:rerender'));
            } catch {
              toast('JSON inválido', 'error');
            }
          };
          reader.readAsText(file);
        });
      }
    });
  }

  root.addEventListener('input', onField);
  root.addEventListener('change', onLinkFieldChange);
  root.addEventListener('change', onAvatarFile);
  root.addEventListener('input', onLinkField);
  root.addEventListener('click', onClick);

  function fitPreview() {
    const col = root.querySelector('.preview-col');
    const shell = root.querySelector('[data-preview-shell]');
    if (!col || !shell) return;
    const available = col.clientHeight - 118;
    const scale = Math.max(0.5, Math.min(1, available / 680));
    shell.style.transform = `scale(${scale})`;
  }

  const onResize = debounce(fitPreview, 120);
  window.addEventListener('resize', onResize);

  renderPreview();
  updateAllRanges();
  updateTopLink();

  root.__cleanup = () => {
    if (preview) preview.destroy();
    persist.cancel();
    renderPreviewSoon.cancel();
    if (!skipCleanupSave) saveMine(profile);
    audio.pause();
    window.removeEventListener('resize', onResize);
  };

  requestAnimationFrame(() => {
    fitPreview();
    root.querySelectorAll('.panel.active, .preview-col').forEach((el) => {
      el.style.animation = 'none';
    });
  });

  root.__profile = profile;
  return root;
}
