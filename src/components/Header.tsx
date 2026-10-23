import { Copy, Search, Share2 } from 'lucide-react'
import type { Profile } from '../types'

export function Header({
  profile,
  canEdit,
  onShare,
  onPalette,
  onEdit,
}: {
  profile: Profile
  canEdit: boolean
  onShare: () => void
  onPalette: () => void
  onEdit: () => void
}) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="brand"
        onClick={onEdit}
        aria-label={canEdit ? 'Abrir estúdio de edição' : 'Thom.Lol — acesso restrito'}
        title={canEdit ? 'Abrir estúdio de edição' : 'Acesso restrito'}
      >
        <span className="brand-mark">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--accent)" />
                <stop offset="1" stopColor="var(--accent2)" />
              </linearGradient>
            </defs>
            <path d="M32 8 56 32 32 56 8 32Z" fill="url(#brandGradient)" />
            <path d="M32 21 43 32 32 43 21 32Z" fill="var(--bg)" />
            <circle cx="32" cy="32" r="3" fill="url(#brandGradient)" />
          </svg>
        </span>
        <span className="brand-text">
          <strong>
            THOM<span>.LOL</span>
          </strong>
          <small>identidades vivas</small>
        </span>
        <span className="brand-beta">beta</span>
      </button>

      <div className="topbar-center">
        <span className="topbar-status">
          <span className="live-dot" /> sistema online
        </span>
        <span className="topbar-quote">seu canto da internet</span>
      </div>

      <div className="topbar-actions">
        <button type="button" className="slug-pill" onClick={onShare} title="Copiar link do perfil">
          <span className="slug-dot" />
          <span className="slug-text">thom.lol/{profile.username || 'usuario'}</span>
          <Copy size={12} />
        </button>
        {canEdit ? (
          <button type="button" className="icon-btn glass palette-hint" onClick={onPalette} aria-label="Abrir comandos">
            <Search size={16} />
            <kbd>⌘K</kbd>
          </button>
        ) : null}
        <button type="button" className="btn primary" onClick={onShare}>
          <Share2 size={15} />
          <span>Compartilhar</span>
        </button>
      </div>
    </header>
  )
}
