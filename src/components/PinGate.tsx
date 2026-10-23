import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { changePin, isValidPin, verifyPin } from '../lib/security'

export type PinMode = 'unlock' | 'change'

interface Props {
  open: boolean
  mode: PinMode
  onClose: () => void
  onSuccess: (mode: PinMode) => void
}

const COPY: Record<PinMode, { eyebrow: string; title: string; description: string; action: string }> = {
  unlock: {
    eyebrow: 'acesso do dono',
    title: 'Estúdio protegido',
    description: 'Digite seu PIN para desbloquear a edição e as configurações deste perfil.',
    action: 'Desbloquear estúdio',
  },
  change: {
    eyebrow: 'segurança',
    title: 'Alterar PIN',
    description: 'Confirme o código atual e defina um novo PIN de acesso.',
    action: 'Atualizar PIN',
  },
}

export function PinGate({ open, mode, onClose, onSuccess }: Props) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [current, setCurrent] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setPin('')
    setConfirm('')
    setCurrent('')
    setError('')
    setBusy(false)
    setVisible(false)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open, mode])

  useEffect(() => {
    if (!open) return
    document.body.classList.add('is-pin-open')
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.classList.remove('is-pin-open')
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose])

  if (!open) return null

  const copy = COPY[mode]
  const fail = (message: string) => {
    setError(message)
    setShake((value) => value + 1)
    window.setTimeout(() => inputRef.current?.focus(), 30)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setError('')

    if (!isValidPin(pin) && mode !== 'change') {
      fail('O PIN precisa ter de 4 a 8 dígitos numéricos.')
      return
    }

    if (mode !== 'unlock' && !isValidPin(pin)) {
      fail('O novo PIN precisa ter de 4 a 8 dígitos numéricos.')
      return
    }

    if (mode !== 'unlock' && pin !== confirm) {
      fail('Os PINs não coincidem. Digite novamente.')
      return
    }

    if (mode === 'change' && !current) {
      fail('Digite o PIN atual para continuar.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'unlock') {
        const valid = await verifyPin(pin)
        if (!valid) {
          fail('PIN incorreto. Tente novamente.')
          return
        }
        onSuccess('unlock')
        return
      }

      const updated = await changePin(current, pin)
      if (!updated) {
        fail('PIN atual incorreto. Tente novamente.')
        return
      }
      onSuccess('change')
    } catch {
      fail('Não foi possível salvar o PIN neste navegador.')
    } finally {
      setBusy(false)
    }
  }

  const update = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setter(event.target.value.replace(/\D/g, '').slice(0, 8))
    if (error) setError('')
  }

  return (
    <div className="overlay pin-overlay" onMouseDown={onClose} role="presentation">
      <div
        className={`pin-card ${error ? 'has-error' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-title"
        aria-describedby="pin-description"
        onMouseDown={(event) => event.stopPropagation()}
        key={shake}
      >
        <button type="button" className="pin-close" onClick={onClose} aria-label="Fechar">
          <X size={15} />
        </button>

        <span className="pin-mark" aria-hidden="true">
          {mode === 'change' ? <KeyRound size={21} /> : <LockKeyhole size={21} />}
        </span>
        <span className="pin-eyebrow">
          <ShieldCheck size={11} /> {copy.eyebrow}
        </span>
        <h2 id="pin-title">{copy.title}</h2>
        <p id="pin-description">{copy.description}</p>

        <form className="pin-form" onSubmit={(event) => void submit(event)}>
          <input type="text" name="username" autoComplete="username" value="owner" readOnly hidden />
          {mode === 'change' ? (
            <label className="pin-field">
              <span>PIN atual</span>
              <input
                ref={inputRef}
                className="pin-input"
                type={visible ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="••••"
                maxLength={8}
                value={current}
                onChange={update(setCurrent)}
                aria-invalid={Boolean(error)}
              />
            </label>
          ) : null}

          <label className="pin-field">
            <span>{mode === 'unlock' ? 'PIN de acesso' : 'Novo PIN'}</span>
            <div className="pin-input-wrap">
              <input
                ref={mode === 'change' ? undefined : inputRef}
                className="pin-input"
                type={visible ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete={mode === 'unlock' ? 'current-password' : 'new-password'}
                placeholder="••••"
                maxLength={8}
                value={pin}
                onChange={update(setPin)}
                aria-invalid={Boolean(error)}
              />
              <button
                type="button"
                className="pin-eye"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? 'Ocultar PIN' : 'Mostrar PIN'}
                tabIndex={-1}
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {mode !== 'unlock' ? (
            <label className="pin-field">
              <span>Confirmar PIN</span>
              <input
                className="pin-input"
                type={visible ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="••••"
                maxLength={8}
                value={confirm}
                onChange={update(setConfirm)}
                aria-invalid={Boolean(error)}
              />
            </label>
          ) : null}

          <p className="pin-hint">Somente números · 4 a 8 dígitos</p>
          {error ? (
            <p className="pin-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn primary pin-submit" disabled={busy}>
            {busy ? 'Verificando…' : copy.action}
          </button>
        </form>

        <p className="pin-foot">
          <LockKeyhole size={11} /> O PIN fica salvo apenas neste navegador.
        </p>
      </div>
    </div>
  )
}
