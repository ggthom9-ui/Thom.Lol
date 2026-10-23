import {
  Heart,
  Layers,
  LockKeyhole,
  Music2,
  Palette,
  Save,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wand2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EffectId, Profile, ThemeId } from './types'
import { EFFECTS, THEMES, themeById } from './lib/defaults'
import { playUiSound } from './lib/audio'
import {
  decodeShare,
  downloadJSON,
  loadProfile,
  parseImport,
  readMetrics,
  registerVisit,
  resetProfile,
  saveProfile,
  seedNumbers,
  shareUrl,
  toggleLikeMetric,
  type Metrics,
} from './lib/storage'
import { Background } from './components/Background'
import { Header } from './components/Header'
import { ProfileCard } from './components/ProfileCard'
import { ClockCard, MusicCard, StatsCard } from './components/Widgets'
import { Toolbar } from './components/Toolbar'
import { Editor, type EditorTab } from './components/Editor'
import { CommandPalette, type PaletteAction } from './components/CommandPalette'
import { PinGate, type PinMode } from './components/PinGate'
import { Toasts, type ToastItem } from './components/Toasts'
import {
  clearSessionUnlocked,
  ensureDefaultPin,
  isSessionUnlocked,
  markSessionUnlocked,
} from './lib/security'

const FONT_STACKS: Record<Profile['font'], string> = {
  sora: '"Sora", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, serif',
}

function bootstrap(): { profile: Profile; shared: boolean } {
  const match = window.location.hash.match(/p=([^&]+)/)
  if (match) {
    const shared = decodeShare(match[1])
    if (shared) return { profile: shared, shared: true }
  }
  return { profile: loadProfile(), shared: false }
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
}

export default function App() {
  const [boot] = useState(bootstrap)
  const [profile, setProfile] = useState<Profile>(boot.profile)
  const [sharedMode, setSharedMode] = useState(boot.shared)
  const [editorOpen, setEditorOpen] = useState(false)
  const [tab, setTab] = useState<EditorTab>('perfil')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [unlocked, setUnlocked] = useState<boolean>(() => isSessionUnlocked())
  const [pinOpen, setPinOpen] = useState(false)
  const [pinMode, setPinMode] = useState<PinMode>('unlock')
  const pendingAction = useRef<null | (() => void)>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [metrics, setMetrics] = useState<Metrics>(() => readMetrics(boot.profile.username))
  const toastId = useRef(0)
  const usernameRef = useRef(boot.profile.username)
  const firstRender = useRef(true)

  const notify = useCallback((title: string, description?: string, icon?: React.ReactNode) => {
    const id = (toastId.current += 1)
    setToasts((current) => [...current.slice(-2), { id, title, description, icon }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200)
  }, [])

  const click = useCallback(
    (kind: 'click' | 'success' | 'like' = 'click') => {
      if (profile.uiSound) playUiSound(kind)
    },
    [profile.uiSound],
  )

  const claim = useCallback(
    (announce = true) => {
      setSharedMode(false)
      if (window.location.hash) {
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      }
      if (announce) notify('Cópia criada', 'Este perfil agora é seu. Pode editar à vontade.', <Sparkles size={16} />)
    },
    [notify],
  )

  const updateProfile = useCallback(
    (updater: Profile | ((current: Profile) => Profile)) => {
      if (!unlocked) return
      setProfile((current) => (typeof updater === 'function' ? updater(current) : updater))
      if (sharedMode) claim(false)
    },
    [unlocked, sharedMode, claim],
  )

  useEffect(() => {
    void ensureDefaultPin()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const theme = themeById(profile.themeId)
    root.style.setProperty('--accent', profile.accent)
    root.style.setProperty('--accent-2', profile.accent2)
    root.style.setProperty('--bg', theme.bg)
    root.style.setProperty('--bg-soft', theme.bgSoft)
    root.style.setProperty('--bg-raw', theme.bg)
    root.style.setProperty('--radius', `${profile.radius}px`)
    root.style.setProperty('--glass-alpha', `${(profile.glass / 100).toFixed(2)}`)
    root.style.setProperty('--font-display', FONT_STACKS[profile.font])
    root.style.colorScheme = 'dark'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme.bg)
    document.title = `${profile.displayName || 'Perfil'} (@${profile.username || 'usuario'}) — Thom.Lol`
  }, [profile.themeId, profile.accent, profile.accent2, profile.radius, profile.glass, profile.font, profile.displayName, profile.username])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      setMetrics(registerVisit(boot.profile.username))
      return
    }
    if (usernameRef.current !== profile.username) {
      usernameRef.current = profile.username
      setMetrics(readMetrics(profile.username))
    }
  }, [profile.username, boot.profile.username])

  useEffect(() => {
    if (sharedMode) return
    saveProfile(profile)
  }, [profile, sharedMode])

  useEffect(() => {
    document.body.classList.toggle('is-editor-open', editorOpen)
    return () => document.body.classList.remove('is-editor-open')
  }, [editorOpen])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const root = document.documentElement
      root.style.setProperty('--cursor-x', `${event.clientX}px`)
      root.style.setProperty('--cursor-y', `${event.clientY}px`)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => window.removeEventListener('pointermove', onPointer)
  }, [])

  const requestAccess = useCallback(
    (action?: () => void) => {
      if (unlocked) {
        action?.()
        return
      }
      pendingAction.current = action ?? null
      setPinMode('unlock')
      setPinOpen(true)
      click()
    },
    [unlocked, click],
  )

  const enterStudio = useCallback(
    (nextTab: EditorTab = 'perfil') => {
      if (sharedMode) claim()
      setTab(nextTab)
      setEditorOpen(true)
      click()
    },
    [sharedMode, claim, click],
  )

  const openEditor = useCallback(
    (nextTab: EditorTab = 'perfil') => {
      requestAccess(() => enterStudio(nextTab))
    },
    [requestAccess, enterStudio],
  )

  const openPalette = useCallback(() => {
    requestAccess(() => setPaletteOpen(true))
  }, [requestAccess])

  const handlePinSuccess = useCallback(
    (mode: PinMode) => {
      setPinOpen(false)
      if (mode === 'change') {
        click('success')
        notify('PIN atualizado', 'Seu novo código já vale para o próximo acesso.', <ShieldCheck size={16} />)
        return
      }
      setUnlocked(true)
      markSessionUnlocked()
      click('success')
      notify('Estúdio liberado', 'Acesso de dono ativo apenas nesta sessão.', <ShieldCheck size={16} />)
      const action = pendingAction.current
      pendingAction.current = null
      action?.()
    },
    [click, notify],
  )

  const lockStudio = useCallback(() => {
    setPinOpen(false)
    setEditorOpen(false)
    setPaletteOpen(false)
    setUnlocked(false)
    clearSessionUnlocked()
    pendingAction.current = null
    click()
    notify('Estúdio bloqueado', 'A edição e as configurações voltaram a ficar ocultas.', <LockKeyhole size={16} />)
  }, [click, notify])

  const changePinCode = useCallback(() => {
    setPinMode('change')
    setPinOpen(true)
    click()
  }, [click])

  const share = useCallback(async () => {
    await copyText(shareUrl(profile))
    click('success')
    notify('Link copiado', 'Qualquer pessoa que abrir vai ver este perfil.', <Share2 size={16} />)
  }, [profile, click, notify])

  const toggleLike = useCallback(() => {
    const liked = !metrics.liked
    setMetrics(toggleLikeMetric(profile.username, liked))
    if (liked) {
      click('like')
      notify('Obrigado pela curtida', 'Seu carinho foi registrado neste navegador.', <Heart size={16} />)
    } else {
      click()
    }
  }, [metrics.liked, profile.username, click, notify])

  const handleTheme = useCallback(
    (id: ThemeId) => {
      const theme = themeById(id)
      updateProfile((current) => ({
        ...current,
        themeId: theme.id,
        accent: theme.accent,
        accent2: theme.accent2,
        effect: theme.effect,
      }))
      click()
    },
    [updateProfile, click],
  )

  const cycleEffect = useCallback(() => {
    const index = EFFECTS.findIndex((item) => item.id === profile.effect)
    const next = EFFECTS[(index + 1) % EFFECTS.length]
    updateProfile((current) => ({ ...current, effect: next.id as EffectId }))
    click()
    notify('Atmosfera alterada', `${next.name} · ${next.description}`, <Wand2 size={16} />)
  }, [profile.effect, updateProfile, click, notify])

  const toggleSound = useCallback(() => {
    const next = !profile.uiSound
    updateProfile((current) => ({ ...current, uiSound: next }))
    if (next) playUiSound('success')
  }, [profile.uiSound, updateProfile])

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const parsed = parseImport(await file.text())
        if (!parsed) {
          notify('Importação inválida', 'O arquivo não parece ser um perfil do Thom.Lol.')
          return
        }
        setProfile(parsed)
        setSharedMode(false)
        setEditorOpen(false)
        saveProfile(parsed)
        click('success')
        notify('Perfil importado', 'Temas, links e trilha sonora foram restaurados.', <Save size={16} />)
      } catch {
        notify('Não foi possível importar', 'Tente novamente com outro arquivo JSON.')
      }
    },
    [click, notify],
  )

  const handleReset = useCallback(() => {
    const reset = resetProfile()
    setProfile(reset)
    setSharedMode(false)
    setEditorOpen(false)
    if (window.location.hash) history.replaceState(null, '', window.location.pathname)
    click('success')
    notify('Perfil restaurado', 'Voltamos ao layout original de demonstração.', <Sparkles size={16} />)
  }, [click, notify])

  const handleExport = useCallback(() => {
    downloadJSON(profile)
    click()
    notify('Backup gerado', 'O JSON do seu perfil foi baixado.', <Save size={16} />)
  }, [profile, click, notify])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!unlocked) {
          openPalette()
          return
        }
        setPaletteOpen((value) => !value)
        if (profile.uiSound) playUiSound('click')
        return
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() === 'e') {
        event.preventDefault()
        openEditor('perfil')
      } else if (event.key.toLowerCase() === 'l') {
        event.preventDefault()
        toggleLike()
      } else if (event.key.toLowerCase() === 't') {
        if (!unlocked) return
        event.preventDefault()
        const index = THEMES.findIndex((item) => item.id === profile.themeId)
        handleTheme(THEMES[(index + 1) % THEMES.length].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openEditor, openPalette, unlocked, toggleLike, handleTheme, profile.uiSound, profile.themeId])

  const likes = seedNumbers(profile.username).likes + (metrics.liked ? 1 : 0)
  const year = new Date().getFullYear()

  const paletteActions = useMemo<PaletteAction[]>(() => {
    const themeActions: PaletteAction[] = THEMES.map((theme) => ({
      id: `theme-${theme.id}`,
      label: `Tema ${theme.name}`,
      hint: profile.themeId === theme.id ? 'ativo' : undefined,
      group: 'Aparência',
      keywords: `cor ${theme.accent} ${theme.accent2}`,
      icon: (
        <span
          className="palette-swatch"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
        />
      ),
      run: () => handleTheme(theme.id),
    }))

    const effectActions: PaletteAction[] = EFFECTS.map((effect) => ({
      id: `effect-${effect.id}`,
      label: `Atmosfera ${effect.name}`,
      hint: profile.effect === effect.id ? 'ativa' : effect.description,
      group: 'Atmosfera',
      icon: <Sparkles size={15} />,
      run: () => {
        updateProfile((current) => ({ ...current, effect: effect.id }))
        click()
        notify('Atmosfera alterada', effect.description, <Wand2 size={16} />)
      },
    }))

    return [
      { id: 'edit-profile', label: 'Editar identidade', hint: 'E', group: 'Navegação', icon: <UserRound size={15} />, run: () => openEditor('perfil') },
      { id: 'edit-visual', label: 'Ajustar visual', group: 'Navegação', icon: <Palette size={15} />, run: () => openEditor('visual') },
      { id: 'edit-links', label: 'Gerenciar links', group: 'Navegação', icon: <Layers size={15} />, run: () => openEditor('links') },
      { id: 'edit-music', label: 'Trilha sonora', group: 'Navegação', icon: <Music2 size={15} />, run: () => openEditor('musica') },
      { id: 'edit-system', label: 'Sistema e backup', group: 'Navegação', icon: <Settings2 size={15} />, run: () => openEditor('sistema') },
      { id: 'share', label: 'Copiar link compartilhável', hint: 'publicar', group: 'Ações', icon: <Share2 size={15} />, run: () => void share() },
      {
        id: 'like',
        label: metrics.liked ? 'Remover curtida' : 'Curtir perfil',
        hint: 'L',
        group: 'Ações',
        icon: <Heart size={15} />,
        run: toggleLike,
      },
      { id: 'export', label: 'Exportar perfil em JSON', group: 'Dados', icon: <Save size={15} />, run: handleExport },
      { id: 'reset', label: 'Restaurar perfil padrão', group: 'Dados', icon: <Sparkles size={15} />, run: handleReset },
      ...themeActions,
      ...effectActions,
    ]
  }, [profile.themeId, profile.effect, metrics.liked, handleTheme, updateProfile, click, notify, openEditor, share, toggleLike, handleExport, handleReset])

  return (
    <div className={`app ${unlocked ? 'is-owner' : 'is-locked'}`} data-effect={profile.effect}>
      <Background profile={profile} />
      <div className="cursor-glow" aria-hidden="true" />

      <div className="app-content">
        <Header
          profile={profile}
          canEdit={unlocked}
          onShare={() => void share()}
          onPalette={openPalette}
          onEdit={() => openEditor('perfil')}
        />

        {sharedMode ? (
          <div className="shared-banner">
            <span className="shared-banner-icon">
              <Sparkles size={15} />
            </span>
            <div className="shared-banner-text">
              <strong>Você está vendo um perfil compartilhado.</strong>
              <span>{unlocked ? 'Editar criará uma cópia local na sua sessão.' : 'Somente o dono pode editar este perfil.'}</span>
            </div>
            {unlocked ? (
              <button type="button" className="btn small" onClick={() => claim()}>
                Duplicar para mim
              </button>
            ) : null}
          </div>
        ) : null}

        <main className="stage">
          <ProfileCard
            profile={profile}
            views={metrics.views}
            likes={likes}
            canEdit={unlocked}
            onEdit={() => openEditor('perfil')}
            onShare={() => void share()}
            onLinkClick={(label) => notify('Abrindo link', label, <Sparkles size={16} />)}
          />

          <aside className="widgets" aria-label="Painel do perfil">
            {profile.visibility.showClock ? <ClockCard profile={profile} /> : null}
            {profile.visibility.showStats ? (
              <StatsCard profile={profile} views={metrics.views} likes={likes} liked={metrics.liked} onLike={toggleLike} />
            ) : null}
            {profile.visibility.showMusic ? (
              <MusicCard
                profile={profile}
                canEdit={unlocked}
                onVolume={(value) => updateProfile((current) => ({ ...current, music: { ...current.music, volume: value } }))}
                onStation={(station) => {
                  updateProfile((current) => ({ ...current, music: { ...current.music, station } }))
                  click()
                }}
              />
            ) : null}
          </aside>
        </main>

        <footer className="page-footer">
          <div className="footer-brandline">
            <span className="footer-logo">THOM.LOL</span>
            <span>© {year} — feito para se destacar.</span>
          </div>
          <div className="footer-links">
            {unlocked ? (
              <>
                <button type="button" onClick={() => openEditor('perfil')}>
                  Perfil
                </button>
                <button type="button" onClick={() => openEditor('visual')}>
                  Estúdio
                </button>
                <button type="button" onClick={openPalette}>
                  Comandos
                </button>
              </>
            ) : (
              <button type="button" className="footer-access" onClick={() => requestAccess()}>
                <LockKeyhole size={11} /> Acesso restrito
              </button>
            )}
            <button type="button" onClick={() => void share()}>
              Compartilhar
            </button>
          </div>
          <span className="footer-note">
            <span className="live-dot" /> dados salvos localmente
          </span>
        </footer>
      </div>

      {unlocked ? (
        <Toolbar
          profile={profile}
          onPalette={openPalette}
          onTheme={handleTheme}
          onCycleEffect={cycleEffect}
          onToggleSound={toggleSound}
          onEdit={() => openEditor('perfil')}
          onLock={lockStudio}
        />
      ) : null}

      <Editor
        open={editorOpen}
        profile={profile}
        tab={tab}
        onTab={setTab}
        onChange={(next) => updateProfile(next)}
        onClose={() => setEditorOpen(false)}
        onShare={() => void share()}
        onExport={handleExport}
        onImport={(file) => void handleImport(file)}
        onReset={handleReset}
        onChangePin={changePinCode}
        onLock={lockStudio}
        notify={notify}
      />

      <PinGate open={pinOpen} mode={pinMode} onClose={() => setPinOpen(false)} onSuccess={handlePinSuccess} />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={paletteActions} />
      <Toasts items={toasts} onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))} />
    </div>
  )
}
