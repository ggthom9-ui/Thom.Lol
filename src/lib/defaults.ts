import type { EffectId, FontId, Profile, Station, ThemePreset } from '../types'

export const AVATAR_FALLBACK = '/avatar.svg'

export const THEMES: ThemePreset[] = [
  { id: 'void', name: 'Void', accent: '#8b5cf6', accent2: '#22d3ee', bg: '#050509', bgSoft: '#0a0a12', effect: 'aurora' },
  { id: 'neon', name: 'Neon', accent: '#ff2e88', accent2: '#8b5cf6', bg: '#06040a', bgSoft: '#0d0714', effect: 'grid' },
  { id: 'sunset', name: 'Sunset', accent: '#fb7185', accent2: '#f59e0b', bg: '#100608', bgSoft: '#1a0b0c', effect: 'embers' },
  { id: 'ocean', name: 'Oceano', accent: '#38bdf8', accent2: '#2dd4bf', bg: '#030c13', bgSoft: '#06141d', effect: 'stars' },
  { id: 'matrix', name: 'Matrix', accent: '#22c55e', accent2: '#a3e635', bg: '#020604', bgSoft: '#04100a', effect: 'matrix' },
  { id: 'mono', name: 'Mono', accent: '#e5e5e5', accent2: '#8a8a93', bg: '#08080a', bgSoft: '#111114', effect: 'none' },
  { id: 'candy', name: 'Candy', accent: '#f472b6', accent2: '#a78bfa', bg: '#0b0613', bgSoft: '#150b22', effect: 'snow' },
]

export const EFFECTS: { id: EffectId; name: string; description: string }[] = [
  { id: 'aurora', name: 'Aurora', description: 'Nebulosas em movimento' },
  { id: 'stars', name: 'Estrelas', description: 'Campo estelar à deriva' },
  { id: 'snow', name: 'Neve', description: 'Flocos silenciosos' },
  { id: 'rain', name: 'Chuva', description: 'Gotas e névoa' },
  { id: 'embers', name: 'Brasas', description: 'Partículas quentes' },
  { id: 'matrix', name: 'Matrix', description: 'Chuva de código' },
  { id: 'grid', name: 'Grid', description: 'Horizonte retrô' },
  { id: 'none', name: 'Limpo', description: 'Só o essencial' },
]

export const FONTS: { id: FontId; name: string; sample: string }[] = [
  { id: 'sora', name: 'Sora', sample: 'Aa' },
  { id: 'inter', name: 'Inter', sample: 'Aa' },
  { id: 'playfair', name: 'Playfair', sample: 'Aa' },
]

export const STATIONS: Station[] = [
  {
    id: 'nocturne',
    name: 'Nocturne',
    artist: 'Thom.Lol',
    note: 'Am9 · 66 BPM',
    colorA: '#8b5cf6',
    colorB: '#22d3ee',
    root: 45,
    chords: [
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [48, 52, 55, 59],
      [55, 59, 62, 66],
    ],
    scale: [57, 60, 62, 64, 67, 69, 72, 74],
    bpm: 66,
    cutoff: 1150,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    artist: 'Thom.Lol',
    note: 'Dmaj9 · 72 BPM',
    colorA: '#2dd4bf',
    colorB: '#60a5fa',
    root: 50,
    chords: [
      [50, 54, 57, 61],
      [45, 49, 52, 56],
      [47, 50, 54, 57],
      [43, 47, 50, 54],
    ],
    scale: [62, 64, 66, 69, 71, 74, 76, 78],
    bpm: 72,
    cutoff: 1500,
  },
  {
    id: 'afterglow',
    name: 'Afterglow',
    artist: 'Thom.Lol',
    note: 'F#m9 · 60 BPM',
    colorA: '#fb7185',
    colorB: '#f59e0b',
    root: 42,
    chords: [
      [54, 57, 61, 64],
      [50, 54, 57, 61],
      [47, 50, 54, 57],
      [52, 56, 59, 63],
    ],
    scale: [54, 57, 59, 61, 64, 66, 69, 71],
    bpm: 60,
    cutoff: 900,
  },
]

export const ICON_CHOICES = [
  'globe',
  'mail',
  'sparkles',
  'link',
  'briefcase',
  'code',
  'music',
  'book',
  'calendar',
  'heart',
  'camera',
  'gamepad',
  'discord',
  'x',
  'instagram',
  'github',
  'spotify',
  'tiktok',
  'twitch',
  'telegram',
  'youtube',
  'steam',
  'roblox',
  'kick',
  'soundcloud',
  'reddit',
  'linkedin',
  'behance',
  'dribbble',
  'gmail',
]

export const SOCIAL_CHOICES = [
  'discord',
  'x',
  'instagram',
  'github',
  'spotify',
  'tiktok',
  'twitch',
  'telegram',
  'youtube',
  'steam',
  'roblox',
  'kick',
  'soundcloud',
  'reddit',
  'linkedin',
  'behance',
  'dribbble',
  'gmail',
]

export const DEFAULT_PROFILE: Profile = {
  version: 2,
  displayName: 'Thom',
  username: 'thom',
  bio: 'Product designer e dev criativo. Desenho interfaces que respiram, construo ideias de madrugada e transformo detalhes em experiências que ninguém esquece.',
  avatar: '/avatar.svg',
  role: 'Product Designer & Creative Developer',
  location: 'São Paulo, Brasil',
  status: 'Disponível para projetos',
  tags: ['Design', 'Front-end', 'Música'],
  verified: true,
  memberSince: '2023-04-12',
  themeId: 'void',
  accent: '#8b5cf6',
  accent2: '#22d3ee',
  font: 'sora',
  effect: 'aurora',
  density: 55,
  speed: 1,
  glass: 62,
  radius: 26,
  tilt: true,
  backgroundImage: '',
  imageBlur: 10,
  imageDim: 58,
  links: [
    { id: 'lnk-portfolio', label: 'Portfólio', description: 'Projetos, estudos de caso e experimentos', url: 'https://thom.lol', icon: 'globe' },
    { id: 'lnk-discord', label: 'Discord', description: 'Entre na comunidade — 2.4k membros', url: 'https://discord.gg/thomlol', icon: 'discord' },
    { id: 'lnk-spotify', label: 'Playlist da madrugada', description: 'As faixas que viram trilha do processo', url: 'https://open.spotify.com', icon: 'spotify' },
    { id: 'lnk-github', label: 'GitHub', description: 'Código aberto, protótipos e experimentos', url: 'https://github.com', icon: 'github' },
    { id: 'lnk-contact', label: 'Vamos construir algo', description: 'hello@thom.lol · resposta em 24h', url: 'mailto:hello@thom.lol', icon: 'mail' },
  ],
  socials: [
    { id: 'soc-x', platform: 'x', url: 'https://x.com' },
    { id: 'soc-instagram', platform: 'instagram', url: 'https://instagram.com' },
    { id: 'soc-github', platform: 'github', url: 'https://github.com' },
    { id: 'soc-discord', platform: 'discord', url: 'https://discord.gg' },
    { id: 'soc-telegram', platform: 'telegram', url: 'https://telegram.org' },
    { id: 'soc-spotify', platform: 'spotify', url: 'https://open.spotify.com' },
  ],
  music: {
    mode: 'synth',
    station: 'nocturne',
    title: '',
    artist: '',
    cover: '',
    url: '',
    volume: 0.55,
    autoplay: false,
  },
  visibility: {
    showViews: true,
    showLikes: true,
    showStats: true,
    showClock: true,
    showMusic: true,
    showLocation: true,
  },
  uiSound: true,
}

export function themeById(id: string): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export function stationById(id: string): Station {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0]
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
