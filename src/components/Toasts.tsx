import { CheckCircle2, Sparkles, X } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ToastItem {
  id: number
  title: string
  description?: string
  icon?: ReactNode
}

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {items.map((toast) => (
        <div className="toast" key={toast.id}>
          <span className="toast-icon">{toast.icon ?? <CheckCircle2 size={16} />}</span>
          <div className="toast-text">
            <strong>{toast.title}</strong>
            {toast.description ? <span>{toast.description}</span> : null}
          </div>
          <span className="toast-spark">
            <Sparkles size={12} />
          </span>
          <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Fechar aviso">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
