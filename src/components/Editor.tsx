import {
  AtSign,
  Binary,
  Check,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Copy,
  Download,
  Flame,
  Grid3x3,
  Headphones,
  Image as ImageIcon,
  Info,
  KeyRound,
  Link2,
  LockKeyhole,
  Minus,
  Music2,
  Palette,
  Plus,
  Radio,
  RotateCcw,
  Settings2,
  Share2,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Stars,
  Trash2,
  Upload,
  UserRound,
  Volume2,
  Waves,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { EffectId, FontId, LinkItem, Profile, SocialItem, StationId, ThemeId } from '../types'
import {
  EFFECTS,
  FONTS,
  ICON_CHOICES,
  SOCIAL_CHOICES,
  STATIONS,
  THEMES,
  themeById,
  uid,
} from '../lib/defaults'
import { imageFileToDataUrl, shareUrl } from '../lib/storage'
import { ItemIcon } from './ItemIcon'

export type EditorTab = 'perfil' | 'visual' | 'links' | 'social' | 'musica' | 'sistema'

const TABS: { id: EditorTab; label: string; icon: LucideIcon }[] = [
  { id: 'perfil', label: 'Perfil', icon: UserRound },
  { id: 'visual', label: 'Visual', icon: Palette },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'social', label: 'Redes', icon: AtSign },
  { id: 'musica', label: 'Música', icon: Music2 },
  { id: 'sistema', label: 'Sistema', icon: Settings2 },
]

const EFFECT_ICONS: Record<EffectId, LucideIcon> = {
  aurora: Waves,
  stars: Stars,
  snow: Snowflake,
  rain: CloudRain,
  embers: Flame,
  matrix: Binary,
  grid: Grid3x3,
  none: Minus,
}

const FONT_STACKS: Record<FontId, string> = {
  sora: '"Sora", sans-serif',
  inter: '"Inter", sans-serif',
  playfair: '"Playfair Display", serif',
}

function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label}
        {hint ? <span className="field-hint">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="toggle-field">
      <span className="toggle-text">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
}) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <label className="slider-field">
      <span className="slider-head">
        <span>{label}</span>
        <span className="slider-value">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ background: `linear-gradient(90deg, var(--accent) ${percent}%, rgba(255,255,255,.1) ${percent}%)` }}
      />
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="color-field">
        <span className="color-swatch" style={{ background: value }}>
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Cor ${label}`} />
        </span>
        <input
          className="ui-input mono"
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`Código da cor ${label}`}
        />
      </div>
    </div>
  )
}

export interface EditorProps {
  open: boolean
  profile: Profile
  tab: EditorTab
  onTab: (tab: EditorTab) => void
  onChange: (profile: Profile) => void
  onClose: () => void
  onShare: () => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
  onChangePin: () => void
  onLock: () => void
  notify: (title: string, description?: string) => void
}

export function Editor({
  open,
  profile,
  tab,
  onTab,
  onChange,
  onClose,
  onShare,
  onExport,
  onImport,
  onReset,
  onChangePin,
  onLock,
  notify,
}: EditorProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const bgInput = useRef<HTMLInputElement>(null)
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setConfirmReset(false)
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch })
  const setMusic = (patch: Partial<Profile['music']>) => set({ music: { ...profile.music, ...patch } })
  const setVisibility = (patch: Partial<Profile['visibility']>) =>
    set({ visibility: { ...profile.visibility, ...patch } })

  const applyTheme = (id: ThemeId) => {
    const theme = themeById(id)
    set({ themeId: theme.id, accent: theme.accent, accent2: theme.accent2, effect: theme.effect })
  }

  const updateLink = (id: string, patch: Partial<LinkItem>) =>
    set({ links: profile.links.map((link) => (link.id === id ? { ...link, ...patch } : link)) })

  const moveLink = (id: string, direction: -1 | 1) => {
    const index = profile.links.findIndex((link) => link.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= profile.links.length) return
    const next = [...profile.links]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    set({ links: next })
  }

  const updateSocial = (id: string, patch: Partial<SocialItem>) =>
    set({ socials: profile.socials.map((social) => (social.id === id ? { ...social, ...patch } : social)) })

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = await imageFileToDataUrl(file, 512, true)
      set({ avatar: data })
      notify('Foto atualizada', 'Sua imagem foi recortada e otimizada.')
    } catch (error) {
      notify('Não foi possível usar esta imagem', error instanceof Error ? error.message : undefined)
    }
  }

  const handleCoverFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = await imageFileToDataUrl(file, 800, true)
      setMusic({ cover: data })
      notify('Capa atualizada')
    } catch (error) {
      notify('Não foi possível usar esta imagem', error instanceof Error ? error.message : undefined)
    }
  }

  const handleBackgroundFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      notify('Imagem muito grande', 'Escolha um arquivo com menos de 8 MB.')
      return
    }
    try {
      const data = await imageFileToDataUrl(file, 1800)
      set({ backgroundImage: data })
      notify('Plano de fundo atualizado')
    } catch (error) {
      notify('Não foi possível usar esta imagem', error instanceof Error ? error.message : undefined)
    }
  }

  const currentLink = profile.links.length
  const sharedLink = shareUrl(profile)

  return (
    <div className="editor-overlay" onMouseDown={onClose} role="presentation">
      <aside
        className="editor"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Estúdio de edição"
      >
        <header className="editor-head">
          <div>
            <span className="eyebrow">estúdio thom.lol</span>
            <h2>Seu perfil, do seu jeito.</h2>
            <p>Alterações salvas automaticamente neste navegador.</p>
          </div>
          <div className="editor-head-actions">
            <span className="save-state">
              <span className="save-dot" /> salvo
            </span>
            <button type="button" className="icon-btn glass" onClick={onClose} aria-label="Fechar estúdio">
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="editor-tabs" role="tablist" aria-label="Seções do editor">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`editor-tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => onTab(id)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="editor-content">
          {tab === 'perfil' ? (
            <>
              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">01</span>
                  <h3>Identidade</h3>
                  <span className="section-line" />
                </div>

                <div className="avatar-editor">
                  <div className="avatar-preview">
                    <img src={profile.avatar || '/avatar.svg'} alt="" />
                  </div>
                  <div className="avatar-copy">
                    <strong>Foto de perfil</strong>
                    <span>JPG, PNG ou WebP · corte quadrado automático</span>
                    <div className="row">
                      <button type="button" className="btn small" onClick={() => avatarInput.current?.click()}>
                        <Upload size={14} /> Enviar
                      </button>
                      <button type="button" className="btn small ghost" onClick={() => set({ avatar: '/avatar.svg' })}>
                        Remover
                      </button>
                    </div>
                    <input
                      className="ui-input"
                      placeholder="ou cole uma URL de imagem"
                      value={profile.avatar.startsWith('data:') ? '' : profile.avatar}
                      onChange={(event) => set({ avatar: event.target.value || '/avatar.svg' })}
                    />
                  </div>
                  <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(event) => void handleAvatarFile(event.target.files?.[0])} />
                </div>

                <div className="field-grid">
                  <Field label="Nome de exibição">
                    <input className="ui-input" value={profile.displayName} maxLength={32} onChange={(event) => set({ displayName: event.target.value })} />
                  </Field>
                  <Field label="Nome de usuário" hint="@">
                    <input
                      className="ui-input"
                      value={profile.username}
                      maxLength={20}
                      spellCheck={false}
                      onChange={(event) => set({ username: event.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() })}
                    />
                  </Field>
                </div>

                <Field label="Bio" hint={`${profile.bio.length}/240`}>
                  <textarea className="ui-textarea" value={profile.bio} maxLength={240} rows={4} onChange={(event) => set({ bio: event.target.value })} />
                </Field>

                <div className="field-grid">
                  <Field label="Cargo / título">
                    <input className="ui-input" value={profile.role} maxLength={48} onChange={(event) => set({ role: event.target.value })} />
                  </Field>
                  <Field label="Localização">
                    <input className="ui-input" value={profile.location} maxLength={48} onChange={(event) => set({ location: event.target.value })} />
                  </Field>
                </div>

                <Field label="Status" hint="aparece no selo ao vivo">
                  <input className="ui-input" value={profile.status} maxLength={40} onChange={(event) => set({ status: event.target.value })} />
                </Field>

                <Field label="Tags" hint="separe por vírgula">
                  <input
                    className="ui-input"
                    value={profile.tags.join(', ')}
                    onChange={(event) =>
                      set({
                        tags: event.target.value
                          .split(',')
                          .map((tag) => tag.trim().slice(0, 18))
                          .filter((tag, index, list) => tag && list.indexOf(tag) === index)
                          .slice(0, 5),
                      })
                    }
                  />
                </Field>

                <div className="field-grid">
                  <Field label="Membro desde">
                    <input className="ui-input" type="date" value={profile.memberSince} onChange={(event) => set({ memberSince: event.target.value })} />
                  </Field>
                  <div className="field">
                    <span className="field-label">Selo de verificação</span>
                    <Toggle label="Perfil verificado" description="Mostra o selo ao lado do nome" checked={profile.verified} onChange={(value) => set({ verified: value })} />
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {tab === 'visual' ? (
            <>
              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">02</span>
                  <h3>Temas</h3>
                  <span className="section-line" />
                </div>
                <div className="theme-grid">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-card ${profile.themeId === theme.id ? 'is-active' : ''}`}
                      onClick={() => applyTheme(theme.id)}
                      style={{
                        ['--t-a' as string]: theme.accent,
                        ['--t-b' as string]: theme.accent2,
                        ['--t-bg' as string]: theme.bg,
                      }}
                    >
                      <span className="theme-preview">
                        <span className="theme-orb" />
                        <span className="theme-bar" />
                        <span className="theme-bar short" />
                      </span>
                      <span className="theme-card-name">{theme.name}</span>
                      {profile.themeId === theme.id ? (
                        <span className="theme-check">
                          <Check size={11} />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="field-grid">
                  <ColorField label="Cor principal" value={profile.accent} onChange={(value) => set({ accent: value })} />
                  <ColorField label="Cor secundária" value={profile.accent2} onChange={(value) => set({ accent2: value })} />
                </div>

                <div className="field">
                  <span className="field-label">Tipografia</span>
                  <div className="font-grid">
                    {FONTS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        className={`font-card ${profile.font === font.id ? 'is-active' : ''}`}
                        onClick={() => set({ font: font.id })}
                      >
                        <span className="font-sample" style={{ fontFamily: FONT_STACKS[font.id] }}>
                          {font.sample}
                        </span>
                        <span>{font.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">03</span>
                  <h3>Atmosfera</h3>
                  <span className="section-line" />
                </div>
                <div className="effect-grid">
                  {EFFECTS.map((effect) => {
                    const Icon = EFFECT_ICONS[effect.id]
                    return (
                      <button
                        key={effect.id}
                        type="button"
                        className={`effect-card ${profile.effect === effect.id ? 'is-active' : ''}`}
                        onClick={() => set({ effect: effect.id })}
                        title={effect.description}
                      >
                        <span className="effect-icon">
                          <Icon size={18} />
                        </span>
                        <span className="effect-name">{effect.name}</span>
                        <span className="effect-desc">{effect.description}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="slider-grid">
                  <Slider label="Densidade" value={profile.density} min={10} max={100} onChange={(value) => set({ density: value })} format={(value) => `${value}%`} />
                  <Slider label="Velocidade" value={profile.speed} min={0.2} max={2} step={0.1} onChange={(value) => set({ speed: value })} format={(value) => `${value.toFixed(1)}×`} />
                  <Slider label="Vidro" value={profile.glass} min={20} max={95} onChange={(value) => set({ glass: value })} format={(value) => `${value}%`} />
                  <Slider label="Cantos" value={profile.radius} min={8} max={40} onChange={(value) => set({ radius: value })} format={(value) => `${value}px`} />
                </div>

                <Toggle label="Inclinação 3D" description="O cartão reage ao movimento do cursor" checked={profile.tilt} onChange={(value) => set({ tilt: value })} />
              </section>

              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">04</span>
                  <h3>Imagem de fundo</h3>
                  <span className="section-line" />
                </div>
                <div className="background-editor">
                  <div
                    className="background-preview"
                    style={profile.backgroundImage ? { backgroundImage: `url(${profile.backgroundImage})` } : undefined}
                  >
                    {!profile.backgroundImage ? <ImageIcon size={20} /> : null}
                  </div>
                  <div className="background-copy">
                    <strong>Camada atmosférica</strong>
                    <span>Uma imagem com desfoque e escurecimento por cima da cena.</span>
                    <div className="row">
                      <button type="button" className="btn small" onClick={() => bgInput.current?.click()}>
                        <Upload size={14} /> Enviar imagem
                      </button>
                      {profile.backgroundImage ? (
                        <button type="button" className="btn small ghost" onClick={() => set({ backgroundImage: '' })}>
                          Remover
                        </button>
                      ) : null}
                    </div>
                    <input
                      className="ui-input"
                      placeholder="ou cole uma URL"
                      value={profile.backgroundImage.startsWith('data:') ? '' : profile.backgroundImage}
                      onChange={(event) => set({ backgroundImage: event.target.value })}
                    />
                  </div>
                  <input ref={bgInput} type="file" accept="image/*" hidden onChange={(event) => void handleBackgroundFile(event.target.files?.[0])} />
                </div>
                {profile.backgroundImage ? (
                  <div className="slider-grid">
                    <Slider label="Desfoque" value={profile.imageBlur} min={0} max={30} onChange={(value) => set({ imageBlur: value })} format={(value) => `${value}px`} />
                    <Slider label="Escurecer" value={profile.imageDim} min={10} max={92} onChange={(value) => set({ imageDim: value })} format={(value) => `${value}%`} />
                  </div>
                ) : null}
              </section>

              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">05</span>
                  <h3>Widgets visíveis</h3>
                  <span className="section-line" />
                </div>
                <div className="toggle-grid">
                  <Toggle label="Relógio" description="Hora local em tempo real" checked={profile.visibility.showClock} onChange={(value) => setVisibility({ showClock: value })} />
                  <Toggle label="Métricas" description="Cartão de estatísticas" checked={profile.visibility.showStats} onChange={(value) => setVisibility({ showStats: value })} />
                  <Toggle label="Música" description="Player de áudio" checked={profile.visibility.showMusic} onChange={(value) => setVisibility({ showMusic: value })} />
                  <Toggle label="Localização" description="Cidade no cartão" checked={profile.visibility.showLocation} onChange={(value) => setVisibility({ showLocation: value })} />
                  <Toggle label="Visualizações" description="Contador público" checked={profile.visibility.showViews} onChange={(value) => setVisibility({ showViews: value })} />
                  <Toggle label="Curtidas" description="Contador público" checked={profile.visibility.showLikes} onChange={(value) => setVisibility({ showLikes: value })} />
                </div>
              </section>
            </>
          ) : null}

          {tab === 'links' ? (
            <section className="panel-section">
              <div className="section-title">
                <span className="section-index">06</span>
                <h3>Links</h3>
                <span className="section-line" />
                <span className="section-count">{currentLink.toString().padStart(2, '0')}</span>
              </div>
              <p className="section-lead">Organize os destinos do seu cartão. A ordem aqui é a ordem exibida no perfil.</p>

              <div className="item-list">
                {profile.links.map((link, index) => (
                  <div className="item-card" key={link.id}>
                    <div className="item-card-head">
                      <span className="item-preview">
                        <ItemIcon name={link.icon} size={17} />
                      </span>
                      <input
                        className="item-title-input"
                        value={link.label}
                        placeholder="Título do link"
                        maxLength={48}
                        onChange={(event) => updateLink(link.id, { label: event.target.value })}
                      />
                      <div className="item-actions">
                        <button type="button" className="mini-btn" disabled={index === 0} onClick={() => moveLink(link.id, -1)} aria-label="Mover para cima">
                          <ChevronUp size={14} />
                        </button>
                        <button type="button" className="mini-btn" disabled={index === profile.links.length - 1} onClick={() => moveLink(link.id, 1)} aria-label="Mover para baixo">
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="mini-btn danger"
                          onClick={() => set({ links: profile.links.filter((item) => item.id !== link.id) })}
                          aria-label="Remover link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="field-grid">
                      <Field label="URL">
                        <input className="ui-input" value={link.url} placeholder="https://" spellCheck={false} onChange={(event) => updateLink(link.id, { url: event.target.value })} />
                      </Field>
                      <Field label="Descrição">
                        <input className="ui-input" value={link.description} placeholder="Opcional" maxLength={72} onChange={(event) => updateLink(link.id, { description: event.target.value })} />
                      </Field>
                    </div>
                    <div className="icon-picker" role="group" aria-label="Ícone do link">
                      {ICON_CHOICES.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`icon-choice ${link.icon === icon ? 'is-active' : ''}`}
                          onClick={() => updateLink(link.id, { icon })}
                          title={icon}
                        >
                          <ItemIcon name={icon} size={15} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="add-item"
                onClick={() => set({ links: [...profile.links, { id: uid('lnk'), label: 'Novo link', description: '', url: 'https://', icon: 'link' }] })}
              >
                <Plus size={15} /> Adicionar link
              </button>
            </section>
          ) : null}

          {tab === 'social' ? (
            <section className="panel-section">
              <div className="section-title">
                <span className="section-index">07</span>
                <h3>Redes sociais</h3>
                <span className="section-line" />
                <span className="section-count">{profile.socials.length.toString().padStart(2, '0')}</span>
              </div>
              <p className="section-lead">Ícones exibidos na fileira social do cartão. Arraste a ordem com as setas.</p>

              <div className="social-preview">
                {profile.socials.map((social) => (
                  <span key={social.id} className="social-preview-icon">
                    <ItemIcon name={social.platform} size={16} />
                  </span>
                ))}
                <span className="social-preview-line" />
                <span className="social-preview-note">prévia ao vivo</span>
              </div>

              <div className="item-list">
                {profile.socials.map((social, index) => (
                  <div className="social-edit-row" key={social.id}>
                    <span className="social-edit-icon">
                      <ItemIcon name={social.platform} size={16} />
                    </span>
                    <select
                      className="ui-select"
                      value={social.platform}
                      onChange={(event) => updateSocial(social.id, { platform: event.target.value })}
                      aria-label="Plataforma"
                    >
                      {SOCIAL_CHOICES.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                    <input
                      className="ui-input"
                      value={social.url}
                      placeholder="https://"
                      spellCheck={false}
                      onChange={(event) => updateSocial(social.id, { url: event.target.value })}
                      aria-label={`URL de ${social.platform}`}
                    />
                    <button
                      type="button"
                      className="mini-btn danger"
                      onClick={() => set({ socials: profile.socials.filter((item) => item.id !== social.id) })}
                      aria-label="Remover rede social"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="add-item"
                onClick={() => set({ socials: [...profile.socials, { id: uid('soc'), platform: 'instagram', url: 'https://' }] })}
              >
                <Plus size={15} /> Adicionar rede
              </button>
            </section>
          ) : null}

          {tab === 'musica' ? (
            <section className="panel-section">
              <div className="section-title">
                <span className="section-index">08</span>
                <h3>Trilha sonora</h3>
                <span className="section-line" />
              </div>
              <p className="section-lead">
                Escolha uma estação generativa criada em tempo real ou conecte sua própria faixa. O áudio só inicia após uma interação.
              </p>

              <div className="segmented">
                <button type="button" className={profile.music.mode === 'synth' ? 'is-active' : ''} onClick={() => setMusic({ mode: 'synth' })}>
                  <Radio size={14} /> Generativo
                </button>
                <button type="button" className={profile.music.mode === 'url' ? 'is-active' : ''} onClick={() => setMusic({ mode: 'url' })}>
                  <Headphones size={14} /> URL externa
                </button>
              </div>

              {profile.music.mode === 'synth' ? (
                <div className="station-grid">
                  {STATIONS.map((station) => (
                    <button
                      key={station.id}
                      type="button"
                      className={`station-card ${profile.music.station === station.id ? 'is-active' : ''}`}
                      onClick={() => setMusic({ station: station.id as StationId })}
                      style={{ ['--s-a' as string]: station.colorA, ['--s-b' as string]: station.colorB }}
                    >
                      <span className="station-art">
                        <span className="station-vinyl" />
                        <span className="station-glow" />
                      </span>
                      <span className="station-info">
                        <strong>{station.name}</strong>
                        <small>{station.note}</small>
                      </span>
                      {profile.music.station === station.id ? (
                        <span className="station-playing">
                          <span />
                          <span />
                          <span />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="field-grid">
                    <Field label="Título da faixa">
                      <input className="ui-input" value={profile.music.title} placeholder="Nome da música" onChange={(event) => setMusic({ title: event.target.value })} />
                    </Field>
                    <Field label="Artista">
                      <input className="ui-input" value={profile.music.artist} placeholder="Artista" onChange={(event) => setMusic({ artist: event.target.value })} />
                    </Field>
                  </div>
                  <Field label="URL do áudio" hint="mp3, ogg ou wav direto">
                    <input className="ui-input" value={profile.music.url} placeholder="https://exemplo.com/faixa.mp3" spellCheck={false} onChange={(event) => setMusic({ url: event.target.value })} />
                  </Field>
                  <div className="cover-editor">
                    <div className="cover-preview" style={profile.music.cover ? { backgroundImage: `url(${profile.music.cover})` } : undefined}>
                      {!profile.music.cover ? <Music2 size={18} /> : null}
                    </div>
                    <div className="cover-copy">
                      <strong>Capa da faixa</strong>
                      <span>Quadrado · 800px recomendado</span>
                      <div className="row">
                        <button type="button" className="btn small" onClick={() => coverInput.current?.click()}>
                          <Upload size={14} /> Enviar capa
                        </button>
                        {profile.music.cover ? (
                          <button type="button" className="btn small ghost" onClick={() => setMusic({ cover: '' })}>
                            Remover
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <input ref={coverInput} type="file" accept="image/*" hidden onChange={(event) => void handleCoverFile(event.target.files?.[0])} />
                  </div>
                </>
              )}

              <div className="slider-grid">
                <Slider label="Volume" value={profile.music.volume} min={0} max={1} step={0.01} onChange={(value) => setMusic({ volume: value })} format={(value) => `${Math.round(value * 100)}%`} />
              </div>

              <Toggle
                label="Reprodução automática"
                description="Inicia no primeiro clique em qualquer área do perfil"
                checked={profile.music.autoplay}
                onChange={(value) => setMusic({ autoplay: value })}
              />
            </section>
          ) : null}

          {tab === 'sistema' ? (
            <>
              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">09</span>
                  <h3>Segurança</h3>
                  <span className="section-line" />
                </div>
                <p className="section-lead">
                  O estúdio e todas as configurações ficam ocultos para visitantes. Só quem tem o PIN pode editar este perfil.
                </p>
                <div className="security-status">
                  <span className="security-badge">
                    <ShieldCheck size={14} /> PIN ativo
                  </span>
                  <span className="security-note">Sessão ativa nesta aba</span>
                </div>
                <div className="system-actions">
                  <button type="button" className="btn ghost" onClick={onChangePin}>
                    <KeyRound size={15} /> Alterar PIN
                  </button>
                  <button type="button" className="btn ghost" onClick={onLock}>
                    <LockKeyhole size={15} /> Bloquear agora
                  </button>
                </div>
              </section>

              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">10</span>
                  <h3>Compartilhar</h3>
                  <span className="section-line" />
                </div>
                <p className="section-lead">O link abaixo carrega este perfil exatamente como está — sem servidor, sem login. Cole onde quiser.</p>
                <div className="share-box">
                  <div className="share-box-text">
                    <span className="share-box-label">
                      <Sparkles size={12} /> link compartilhável
                    </span>
                    <span className="share-box-url">{sharedLink.slice(0, 64)}…</span>
                  </div>
                  <button type="button" className="btn primary small" onClick={onShare}>
                    <Copy size={14} /> Copiar
                  </button>
                </div>
                <div className="system-actions">
                  <button type="button" className="btn ghost" onClick={onExport}>
                    <Download size={15} /> Exportar JSON
                  </button>
                  <button type="button" className="btn ghost" onClick={() => importInput.current?.click()}>
                    <Upload size={15} /> Importar JSON
                  </button>
                  <input
                    ref={importInput}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) onImport(file)
                      event.target.value = ''
                    }}
                  />
                </div>
              </section>

              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">11</span>
                  <h3>Preferências</h3>
                  <span className="section-line" />
                </div>
                <Toggle label="Sons de interface" description="Cliques suaves nas ações do app" checked={profile.uiSound} onChange={(value) => set({ uiSound: value })} />
                <Toggle label="Selo verificado" description="Exibe o selo ao lado do nome" checked={profile.verified} onChange={(value) => set({ verified: value })} />
              </section>

              <section className="panel-section">
                <div className="section-title">
                  <span className="section-index">12</span>
                  <h3>Zona de risco</h3>
                  <span className="section-line" />
                </div>
                <p className="section-lead">Restaura o perfil de demonstração. Seus links, temas e imagens locais serão apagados.</p>
                <button
                  type="button"
                  className={`btn danger ${confirmReset ? 'is-confirming' : ''}`}
                  onClick={() => {
                    if (!confirmReset) {
                      setConfirmReset(true)
                      window.setTimeout(() => setConfirmReset(false), 4000)
                      return
                    }
                    setConfirmReset(false)
                    onReset()
                  }}
                >
                  <RotateCcw size={15} /> {confirmReset ? 'Confirmar restauração' : 'Restaurar perfil padrão'}
                </button>
              </section>

              <section className="panel-section about-card">
                <span className="about-mark">
                  <Sparkles size={16} />
                </span>
                <div>
                  <strong>Thom.Lol · estúdio v1.0</strong>
                  <p>
                    Um cartão de visitas vivo, construído com React, Web Audio e Canvas. Todos os dados ficam neste navegador — nada é enviado
                    para servidores.
                  </p>
                </div>
                <Info size={15} className="about-info" />
              </section>
            </>
          ) : null}
        </div>

        <footer className="editor-foot">
          <span className="editor-foot-note">
            <span className="live-dot" /> pré-visualização ao vivo
          </span>
          <button type="button" className="btn primary" onClick={onClose}>
            <Check size={15} /> Concluir
          </button>
        </footer>
      </aside>
    </div>
  )
}
