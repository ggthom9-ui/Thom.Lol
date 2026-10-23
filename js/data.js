export const THEMES = [
  {
    id: 'nebula', name: 'Nebula', tag: 'violet',
    accent: '#8b5cf6', accent2: '#22d3ee',
    colors: ['#0b0618', '#160b38', '#04121c'],
    font: 'Space Grotesk'
  },
  {
    id: 'cyber', name: 'Cyber', tag: 'lime',
    accent: '#a3e635', accent2: '#22d3ee',
    colors: ['#050a08', '#0b1a10', '#03131a'],
    font: 'JetBrains Mono'
  },
  {
    id: 'crimson', name: 'Crimson', tag: 'rose',
    accent: '#fb7185', accent2: '#fb923c',
    colors: ['#140609', '#2a0812', '#1a0a05'],
    font: 'Space Grotesk'
  },
  {
    id: 'pastel', name: 'Pastel', tag: 'pink',
    accent: '#f9a8d4', accent2: '#c4b5fd',
    colors: ['#120a14', '#241229', '#170f22'],
    font: 'Inter'
  },
  {
    id: 'noir', name: 'Noir', tag: 'mono',
    accent: '#e5e7eb', accent2: '#9ca3af',
    colors: ['#08080a', '#141418', '#0b0b0e'],
    font: 'Playfair Display'
  },
  {
    id: 'emerald', name: 'Emerald', tag: 'green',
    accent: '#34d399', accent2: '#22d3ee',
    colors: ['#04120d', '#072018', '#03151a'],
    font: 'Space Grotesk'
  },
  {
    id: 'vapor', name: 'Vapor', tag: 'synth',
    accent: '#ff71ce', accent2: '#01cdfe',
    colors: ['#0f0620', '#240b3d', '#071b3a'],
    font: 'Bebas Neue'
  },
  {
    id: 'sunset', name: 'Sunset', tag: 'warm',
    accent: '#fb923c', accent2: '#f472b6',
    colors: ['#150806', '#2a0f0a', '#1c0a16'],
    font: 'Playfair Display'
  }
];

export const FONTS = [
  { id: 'Space Grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', system-ui, sans-serif" },
  { id: 'Inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif" },
  { id: 'Playfair Display', label: 'Playfair', stack: "'Playfair Display', Georgia, serif" },
  { id: 'JetBrains Mono', label: 'JetBrains Mono', stack: "'JetBrains Mono', ui-monospace, monospace" },
  { id: 'Bebas Neue', label: 'Bebas Neue', stack: "'Bebas Neue', 'Space Grotesk', sans-serif" },
  { id: 'System', label: 'System Sans', stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" }
];

export const FONT_STACKS = Object.fromEntries(FONTS.map((f) => [f.id, f.stack]));

export const NAME_EFFECTS = [
  { id: 'static', label: 'Static', icon: 'type' },
  { id: 'shimmer', label: 'Shimmer', icon: 'sparkles' },
  { id: 'neon', label: 'Neon', icon: 'zap' },
  { id: 'glitch', label: 'Glitch', icon: 'shuffle' },
  { id: 'typewriter', label: 'Typewriter', icon: 'cursor' }
];

export const PARTICLES = [
  { id: 'none', label: 'None', icon: 'x' },
  { id: 'stars', label: 'Stars', icon: 'star' },
  { id: 'snow', label: 'Snow', icon: 'snowflake' },
  { id: 'rain', label: 'Rain', icon: 'droplet' },
  { id: 'bubbles', label: 'Bubbles', icon: 'circle' },
  { id: 'hearts', label: 'Hearts', icon: 'heart' },
  { id: 'sparks', label: 'Sparks', icon: 'flame' }
];

export const BADGES = [
  { id: 'verified', label: 'Verified', icon: 'badge-check', cls: 'b-verified' },
  { id: 'crown', label: 'Premium', icon: 'crown', cls: 'b-crown' },
  { id: 'star', label: 'Creator', icon: 'star', cls: 'b-star' },
  { id: 'dev', label: 'Developer', icon: 'code', cls: 'b-dev' },
  { id: 'early', label: 'Early', icon: 'sparkles', cls: 'b-early' }
];

export const AUDIO_PRESETS = [
  { id: 'midnight', label: 'Midnight Drive', bpm: 72, root: 45, scale: [0, 3, 7, 10, 12, 15], wave: 'triangle', filter: 780, pad: 0.5, delay: 0.32 },
  { id: 'nebula', label: 'Nebula Drift', bpm: 64, root: 50, scale: [0, 2, 4, 7, 9, 12, 16], wave: 'sine', filter: 1100, pad: 0.55, delay: 0.4 },
  { id: 'lofi', label: 'Soft Focus', bpm: 76, root: 48, scale: [0, 4, 7, 11, 14, 16], wave: 'sine', filter: 640, pad: 0.62, delay: 0.26 },
  { id: 'pulse', label: 'Night Pulse', bpm: 104, root: 43, scale: [0, 3, 5, 7, 10, 12, 15], wave: 'sawtooth', filter: 900, pad: 0.4, delay: 0.2 }
];

export function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function presetById(id) {
  return AUDIO_PRESETS.find((p) => p.id === id) || AUDIO_PRESETS[0];
}

export const DEFAULT_PROFILE = {
  v: 2,
  username: 'aurora',
  name: 'Aurora',
  bio: 'designing quiet worlds · chasing light',
  avatar: '',
  location: 'Lisbon',
  pronouns: 'she/her',
  badges: ['verified', 'early'],
  theme: 'nebula',
  accent: '#8b5cf6',
  accent2: '#22d3ee',
  bg: {
    type: 'gradient',
    colors: ['#0b0618', '#160b38', '#04121c'],
    image: '',
    video: '',
    blur: 0,
    dim: 32
  },
  font: 'Space Grotesk',
  nameEffect: 'shimmer',
  avatarShape: 'circle',
  card: 'glass',
  intro: true,
  effects: { particles: 'stars', cursor: true, grain: true, parallax: true },
  audio: { preset: 'nebula', url: '', volume: 45, autoplay: true, showPlayer: true },
  discord: { show: true, username: 'aurora', activity: 'ambient sessions — aura.fm', status: 'online' },
  links: [
    { platform: 'discord', url: 'https://discord.com/users/aurora' },
    { platform: 'x', url: 'https://x.com/aurora' },
    { platform: 'instagram', url: 'https://instagram.com/aurora' },
    { platform: 'spotify', url: 'https://open.spotify.com/user/aurora' },
    { platform: 'globe', url: 'https://aura.lol' }
  ],
  views: 1287,
  created: '2026-02-14'
};

const SEEDS = [
  {
    username: 'nova', name: 'Nova', bio: 'digital dreamer · building worlds at 3am',
    badges: ['verified', 'crown'], theme: 'nebula', font: 'Space Grotesk', nameEffect: 'shimmer',
    avatarShape: 'circle', card: 'glass', location: 'Neo Tokyo', pronouns: 'they/them',
    effects: { particles: 'stars', cursor: true, grain: true, parallax: true },
    audio: { preset: 'midnight', url: '', volume: 42, autoplay: true, showPlayer: true },
    discord: { show: true, username: 'nova', activity: 'Midnight Drive — aura.fm', status: 'online' },
    links: [
      { platform: 'discord', url: 'https://discord.com/users/nova' },
      { platform: 'x', url: 'https://x.com/nova' },
      { platform: 'github', url: 'https://github.com/nova' },
      { platform: 'spotify', url: 'https://open.spotify.com/user/nova' }
    ],
    views: 48210, created: '2024-11-02'
  },
  {
    username: 'luna', name: 'Luna', bio: 'soft chaos & strawberry skies\nprobably listening to shoegaze',
    badges: ['verified', 'star'], theme: 'pastel', font: 'Inter', nameEffect: 'neon',
    avatarShape: 'squircle', card: 'glass', location: 'Seoul', pronouns: 'she/her',
    effects: { particles: 'hearts', cursor: true, grain: true, parallax: true },
    audio: { preset: 'lofi', url: '', volume: 38, autoplay: true, showPlayer: true },
    discord: { show: true, username: 'luna', activity: 'Soft Focus — aura.fm', status: 'idle' },
    links: [
      { platform: 'instagram', url: 'https://instagram.com/luna' },
      { platform: 'spotify', url: 'https://open.spotify.com/user/luna' },
      { platform: 'tiktok', url: 'https://tiktok.com/@luna' },
      { platform: 'mail', url: 'mailto:hi@luna.style' }
    ],
    views: 23104, created: '2025-01-18'
  },
  {
    username: 'vex', name: 'Vex', bio: 'ghost in the machine',
    badges: ['dev', 'early'], theme: 'noir', font: 'JetBrains Mono', nameEffect: 'glitch',
    avatarShape: 'squircle', card: 'solid', location: 'Berlin', pronouns: '',
    effects: { particles: 'rain', cursor: false, grain: true, parallax: false },
    audio: { preset: 'pulse', url: '', volume: 30, autoplay: false, showPlayer: true },
    discord: { show: true, username: 'vex', activity: 'compiling reality — vscode', status: 'dnd' },
    links: [
      { platform: 'github', url: 'https://github.com/vex' },
      { platform: 'x', url: 'https://x.com/vex' },
      { platform: 'globe', url: 'https://vex.dev' }
    ],
    views: 15892, created: '2025-03-09'
  },
  {
    username: 'kairo', name: 'Kairo', bio: 'analog heart, digital soul · vhs enthusiast',
    badges: ['verified', 'star'], theme: 'vapor', font: 'Bebas Neue', nameEffect: 'static',
    avatarShape: 'circle', card: 'glass', location: 'Miami', pronouns: 'he/him',
    effects: { particles: 'bubbles', cursor: true, grain: true, parallax: true },
    audio: { preset: 'midnight', url: '', volume: 50, autoplay: true, showPlayer: true },
    discord: { show: true, username: 'kairo', activity: 'Midnight Drive — aura.fm', status: 'online' },
    links: [
      { platform: 'youtube', url: 'https://youtube.com/@kairo' },
      { platform: 'twitch', url: 'https://twitch.tv/kairo' },
      { platform: 'discord', url: 'https://discord.com/users/kairo' },
      { platform: 'instagram', url: 'https://instagram.com/kairo' }
    ],
    views: 31980, created: '2024-08-21'
  },
  {
    username: 'mira', name: 'Mira', bio: 'product designer · she/her · powered by oat milk',
    badges: ['verified'], theme: 'emerald', font: 'Inter', nameEffect: 'typewriter',
    avatarShape: 'circle', card: 'none', location: 'Copenhagen', pronouns: 'she/her',
    effects: { particles: 'none', cursor: true, grain: false, parallax: true },
    audio: { preset: 'lofi', url: '', volume: 26, autoplay: false, showPlayer: true },
    discord: { show: true, username: 'mira', activity: 'designing in figma', status: 'online' },
    links: [
      { platform: 'globe', url: 'https://mira.design' },
      { platform: 'instagram', url: 'https://instagram.com/mira' },
      { platform: 'mail', url: 'mailto:hey@mira.design' }
    ],
    views: 9871, created: '2025-06-02'
  },
  {
    username: 'zero', name: 'Zero', bio: 'breaking things responsibly · CTF gremlin',
    badges: ['dev', 'crown'], theme: 'cyber', font: 'JetBrains Mono', nameEffect: 'glitch',
    avatarShape: 'hexagon', card: 'solid', location: 'unknown', pronouns: 'any',
    effects: { particles: 'sparks', cursor: true, grain: true, parallax: false },
    audio: { preset: 'pulse', url: '', volume: 46, autoplay: true, showPlayer: true },
    discord: { show: true, username: 'zero', activity: 'poking the mainframe', status: 'dnd' },
    links: [
      { platform: 'github', url: 'https://github.com/zero' },
      { platform: 'discord', url: 'https://discord.com/users/zero' },
      { platform: 'telegram', url: 'https://t.me/zero' }
    ],
    views: 76543, created: '2024-05-30'
  }
];

function normalize(seed) {
  const base = structuredClone(DEFAULT_PROFILE);
  const theme = themeById(seed.theme || base.theme);
  return {
    ...base,
    ...seed,
    accent: seed.accent || theme.accent,
    accent2: seed.accent2 || theme.accent2,
    bg: {
      ...base.bg,
      ...(seed.bg || {}),
      colors: (seed.bg && seed.bg.colors) || theme.colors
    },
    effects: { ...base.effects, ...(seed.effects || {}) },
    audio: { ...base.audio, ...(seed.audio || {}) },
    discord: { ...base.discord, ...(seed.discord || {}) },
    links: seed.links ? seed.links.map((l) => ({ ...l })) : base.links.map((l) => ({ ...l })),
    badges: seed.badges ? [...seed.badges] : [...base.badges]
  };
}

export const SEED_PROFILES = SEEDS.map(normalize);

export function seedByUsername(username) {
  return SEED_PROFILES.find((p) => p.username === username) || null;
}

export function freshProfile() {
  return normalize({ ...structuredClone(DEFAULT_PROFILE), views: 0 });
}
