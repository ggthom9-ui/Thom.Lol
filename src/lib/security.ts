const SECURITY_KEY = 'thomlol.security.v2'
const SESSION_KEY = 'thomlol.owner.session'

export const DEFAULT_PIN = '24735'

let bootstrap: Promise<void> | null = null

interface SecurityConfig {
  version: 1
  salt: string
  hash: string
  createdAt: number
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function session(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function readConfig(): SecurityConfig | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(SECURITY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SecurityConfig
    if (parsed.version !== 1 || !parsed.salt || !parsed.hash) return null
    return parsed
  } catch {
    return null
  }
}

function writeConfig(config: SecurityConfig): void {
  const store = storage()
  if (!store) throw new Error('storage-unavailable')
  store.setItem(SECURITY_KEY, JSON.stringify(config))
}

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function digest(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  if (globalThis.crypto?.subtle) {
    const hash = await globalThis.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  let value = 2166136261
  for (const byte of data) {
    value ^= byte
    value = Math.imul(value, 16777619)
  }
  return `fnv1a-${(value >>> 0).toString(16)}`
}

export function isPinSet(): boolean {
  return readConfig() !== null
}

export async function createPin(pin: string): Promise<void> {
  const salt = randomSalt()
  const hash = await digest(pin, salt)
  writeConfig({ version: 1, salt, hash, createdAt: Date.now() })
}

export async function ensureDefaultPin(): Promise<void> {
  if (readConfig()) return
  if (!bootstrap) {
    bootstrap = createPin(DEFAULT_PIN).finally(() => {
      bootstrap = null
    })
  }
  await bootstrap
}

export async function verifyPin(pin: string): Promise<boolean> {
  await ensureDefaultPin()
  const config = readConfig()
  if (!config) return false
  const hash = await digest(pin, config.salt)
  return hash === config.hash
}

export async function changePin(currentPin: string, nextPin: string): Promise<boolean> {
  const valid = await verifyPin(currentPin)
  if (!valid) return false
  await createPin(nextPin)
  return true
}

export function markSessionUnlocked(): void {
  try {
    session()?.setItem(SESSION_KEY, '1')
  } catch {
    /* session storage unavailable */
  }
}

export function clearSessionUnlocked(): void {
  try {
    session()?.removeItem(SESSION_KEY)
  } catch {
    /* session storage unavailable */
  }
}

export function isSessionUnlocked(): boolean {
  return isPinSet() && session()?.getItem(SESSION_KEY) === '1'
}

export function isValidPin(value: string): boolean {
  return /^\d{4,8}$/.test(value)
}
