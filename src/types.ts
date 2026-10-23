export type EffectId =
  | 'aurora'
  | 'stars'
  | 'snow'
  | 'rain'
  | 'matrix'
  | 'embers'
  | 'grid'
  | 'none'

export type ThemeId = 'void' | 'neon' | 'sunset' | 'ocean' | 'matrix' | 'mono' | 'candy'
export type FontId = 'sora' | 'inter' | 'playfair'
export type StationId = 'nocturne' | 'aurora' | 'afterglow'

export interface SocialItem {
  id: string
  platform: string
  url: string
}

export interface LinkItem {
  id: string
  label: string
  description: string
  url: string
  icon: string
}

export interface MusicConfig {
  mode: 'synth' | 'url'
  station: StationId
  title: string
  artist: string
  cover: string
  url: string
  volume: number
  autoplay: boolean
}

export interface Visibility {
  showViews: boolean
  showLikes: boolean
  showStats: boolean
  showClock: boolean
  showMusic: boolean
  showLocation: boolean
}

export interface Profile {
  version: number
  displayName: string
  username: string
  bio: string
  avatar: string
  role: string
  location: string
  status: string
  tags: string[]
  verified: boolean
  memberSince: string
  themeId: ThemeId
  accent: string
  accent2: string
  font: FontId
  effect: EffectId
  density: number
  speed: number
  glass: number
  radius: number
  tilt: boolean
  backgroundImage: string
  imageBlur: number
  imageDim: number
  links: LinkItem[]
  socials: SocialItem[]
  music: MusicConfig
  visibility: Visibility
  uiSound: boolean
}

export interface ThemePreset {
  id: ThemeId
  name: string
  accent: string
  accent2: string
  bg: string
  bgSoft: string
  effect: EffectId
}

export interface Station {
  id: StationId
  name: string
  artist: string
  note: string
  colorA: string
  colorB: string
  root: number
  chords: number[][]
  scale: number[]
  bpm: number
  cutoff: number
}
