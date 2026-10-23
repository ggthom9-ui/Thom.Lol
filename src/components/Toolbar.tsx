import { LockKeyhole, Search, SlidersHorizontal, Sparkles, Volume2, VolumeX } from 'lucide-react'
import type { Profile, ThemeId } from '../types'
import { EFFECTS, THEMES } from '../lib/defaults'

export function Toolbar({
  profile,
  onPalette,
  onTheme,
  onCycleEffect,
  onToggleSound,
  onEdit,
  onLock,
}: {
  profile: Profile
  onPalette: () => void
  onTheme: (id: ThemeId) => void
  onCycleEffect: () => void
  onToggleSound: () => void
  onEdit: () => void
  onLock: () => void
}) {
  const effect = EFFECTS.find((item) => item.id === profile.effect)
  return (
    <div className="toolbar" role="toolbar" aria-label="Ações rápidas">
      <button type="button" className="tool-btn" onClick={onPalette} data-tip="Comandos (⌘K)">
        <Search size={16} />
        <span className="tool-label">Comandos</span>
      </button>
      <span className="tool-divider" />
      <div className="theme-dots" role="group" aria-label="Temas">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-dot ${profile.themeId === theme.id ? 'is-active' : ''}`}
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
            onClick={() => onTheme(theme.id)}
            aria-label={`Tema ${theme.name}`}
            data-tip={theme.name}
          />
        ))}
      </div>
      <span className="tool-divider" />
      <button type="button" className="tool-btn" onClick={onCycleEffect} data-tip="Alternar atmosfera">
        <Sparkles size={16} />
        <span className="tool-label">{effect?.name ?? 'Efeito'}</span>
      </button>
      <button
        type="button"
        className="tool-btn"
        onClick={onToggleSound}
        data-tip={profile.uiSound ? 'Desativar sons' : 'Ativar sons'}
        aria-pressed={profile.uiSound}
      >
        {profile.uiSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
      <span className="tool-divider" />
      <button type="button" className="tool-btn tool-lock" onClick={onLock} data-tip="Bloquear estúdio" aria-label="Bloquear estúdio">
        <LockKeyhole size={16} />
        <span className="tool-label">Bloquear</span>
      </button>
      <button type="button" className="tool-edit" onClick={onEdit}>
        <SlidersHorizontal size={16} />
        <span>Editar</span>
      </button>
    </div>
  )
}
