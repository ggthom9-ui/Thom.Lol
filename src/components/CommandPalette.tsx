import { ArrowUpRight, Command, CornerDownLeft, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface PaletteAction {
  id: string
  label: string
  hint?: string
  group: string
  icon: ReactNode
  keywords?: string
  run: () => void
}

export function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean
  onClose: () => void
  actions: PaletteAction[]
}) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return actions
    return actions.filter((action) =>
      `${action.label} ${action.group} ${action.keywords ?? ''}`.toLowerCase().includes(normalized),
    )
  }, [actions, query])

  const groups = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, PaletteAction[]>()
    filtered.forEach((action) => {
      if (!map.has(action.group)) {
        map.set(action.group, [])
        order.push(action.group)
      }
      map.get(action.group)?.push(action)
    })
    return order.map((name) => ({ name, items: map.get(name) ?? [] }))
  }, [filtered])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setIndex(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => setIndex(0), [query])

  if (!open) return null

  let flatIndex = -1
  const runAction = (action: PaletteAction) => {
    onClose()
    window.setTimeout(action.run, 40)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex((value) => (filtered.length ? (value + 1) % filtered.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex((value) => (filtered.length ? (value - 1 + filtered.length) % filtered.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const action = filtered[index]
      if (action) runAction(action)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div className="overlay palette-overlay" onMouseDown={onClose} role="presentation">
      <div className="palette" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <div className="palette-search">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="O que você quer fazer?"
            aria-label="Buscar comando"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-body">
          {groups.length ? (
            groups.map((group) => (
              <div className="palette-group" key={group.name}>
                <div className="palette-group-title">{group.name}</div>
                {group.items.map((action) => {
                  flatIndex += 1
                  const active = flatIndex === index
                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={`palette-item ${active ? 'is-active' : ''}`}
                      onMouseEnter={() => setIndex(filtered.indexOf(action))}
                      onClick={() => runAction(action)}
                    >
                      <span className="palette-icon">{action.icon}</span>
                      <span className="palette-label">{action.label}</span>
                      {action.hint ? <span className="palette-hint">{action.hint}</span> : null}
                      <ArrowUpRight size={13} className="palette-arrow" />
                    </button>
                  )
                })}
              </div>
            ))
          ) : (
            <div className="palette-empty">
              <Command size={22} />
              <span>Nenhum comando encontrado para “{query}”.</span>
            </div>
          )}
        </div>
        <div className="palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navegar
          </span>
          <span>
            <CornerDownLeft size={12} /> executar
          </span>
          <span className="palette-brand">
            <span className="live-dot" /> thom.lol
          </span>
        </div>
      </div>
    </div>
  )
}
