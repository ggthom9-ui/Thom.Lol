import type { Profile } from '../types'
import { DEFAULT_PROFILE } from './defaults'

const PROFILE_KEY = 'thomlol.profile.v2'
const METRICS_KEY = 'thomlol.metrics.v1'
const SESSION_KEY = 'thomlol.session'

export interface Metrics {
  views: number
  liked: boolean
  localVisits: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function mergeProfile(raw: unknown): Profile {
  if (!isRecord(raw)) return structuredClone(DEFAULT_PROFILE)
  const base = structuredClone(DEFAULT_PROFILE)
  const merged: Profile = {
    ...base,
    ...(raw as Partial<Profile>),
    links: Array.isArray(raw.links) && raw.links.length ? (raw.links as Profile['links']) : base.links,
    socials: Array.isArray(raw.socials) ? (raw.socials as Profile['socials']) : base.socials,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : base.tags,
    music: { ...base.music, ...(isRecord(raw.music) ? raw.music : {}) },
    visibility: { ...base.visibility, ...(isRecord(raw.visibility) ? raw.visibility : {}) },
  }
  return merged
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return structuredClone(DEFAULT_PROFILE)
    return mergeProfile(JSON.parse(raw))
  } catch {
    return structuredClone(DEFAULT_PROFILE)
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* storage unavailable */
  }
}

export function resetProfile(): Profile {
  localStorage.removeItem(PROFILE_KEY)
  return structuredClone(DEFAULT_PROFILE)
}

export function encodeShare(profile: Profile): string {
  const bytes = new TextEncoder().encode(JSON.stringify(profile))
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare(value: string): Profile | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    return mergeProfile(parsed)
  } catch {
    return null
  }
}

export function shareUrl(profile: Profile): string {
  return `${location.origin}${location.pathname}#p=${encodeShare(profile)}`
}

export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

export function seedNumbers(username: string): { views: number; likes: number } {
  const seed = hashString(username.toLowerCase() || 'thom')
  return {
    views: 4200 + (seed % 8300),
    likes: 280 + (seed % 640),
  }
}

export function readMetrics(username: string): Metrics {
  const seed = seedNumbers(username)
  try {
    const raw = localStorage.getItem(METRICS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Metrics>) : {}
    const localVisits = typeof parsed.localVisits === 'number' ? parsed.localVisits : 0
    return {
      views: seed.views + localVisits,
      liked: parsed.liked === true,
      localVisits,
    }
  } catch {
    return { views: seed.views, liked: false, localVisits: 0 }
  }
}

export function registerVisit(username: string): Metrics {
  const current = readMetrics(username)
  if (sessionStorage.getItem(SESSION_KEY)) return current
  sessionStorage.setItem(SESSION_KEY, '1')
  const next: Metrics = { ...current, localVisits: current.localVisits + 1, views: current.views + 1 }
  localStorage.setItem(METRICS_KEY, JSON.stringify(next))
  return next
}

export function toggleLikeMetric(username: string, liked: boolean): Metrics {
  const current = readMetrics(username)
  const next: Metrics = { ...current, liked }
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function downloadJSON(profile: Profile): void {
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `thomlol-${profile.username || 'perfil'}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function imageFileToDataUrl(file: File, maxSize = 512, square = false): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Arquivo precisa ser uma imagem.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Imagem inválida.'))
      image.onload = () => {
        const ratio = image.width / image.height
        let sx = 0
        let sy = 0
        let sw = image.width
        let sh = image.height
        if (square) {
          const side = Math.min(image.width, image.height)
          sw = side
          sh = side
          sx = (image.width - side) / 2
          sy = (image.height - side) / 2
        }
        let width = sw
        let height = sh
        if (Math.max(width, height) > maxSize) {
          const scale = maxSize / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas indisponível.'))
          return
        }
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height)
        resolve(canvas.toDataURL('image/webp', 0.86))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function parseImport(raw: string): Profile | null {
  try {
    const parsed = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    return mergeProfile(parsed)
  } catch {
    return null
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatJoined(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date)
}

export function dateLabel(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}
