import { icon } from './icons.js';

const activeModals = new Set();

export function closeAllModals() {
  [...activeModals].forEach((close) => close());
}

export function toast(message, type = 'success', timeout = 3200) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const glyph = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check';
  el.innerHTML = `${icon(glyph)}<span>${escapeHtml(message)}</span>`;
  root.appendChild(el);
  const remove = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 280);
  };
  const timer = setTimeout(remove, timeout);
  el.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function openModal({ title, subtitle = '', body = '', actions = [], onMount }) {
  const root = document.getElementById('overlay-root');
  if (!root) return () => {};
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <button class="modal-close" type="button" aria-label="Close">${icon('x')}</button>
      </div>
      <div class="modal-body">
        ${body}
        ${actions.length ? `<div class="modal-actions">${actions.map((a) => `<button type="button" class="btn ${a.variant || 'btn-ghost'}" data-action="${a.id}">${a.icon ? icon(a.icon) : ''}<span>${escapeHtml(a.label)}</span></button>`).join('')}</div>` : ''}
      </div>
    </div>`;
  root.appendChild(backdrop);
  const close = () => {
    activeModals.delete(close);
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  };
  activeModals.add(close);
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelector('.modal-close').addEventListener('click', close);
  backdrop.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = actions.find((a) => a.id === button.dataset.action);
      if (action && action.onClick) action.onClick(close, backdrop);
    });
  });
  document.addEventListener('keydown', onKey);
  if (onMount) onMount(backdrop, close);
  return close;
}

export function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return `https://${raw}`;
  return '';
}

export function debounce(fn, wait = 120) {
  let timer = 0;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}
