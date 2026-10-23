import {
  Activity,
  BarChart3,
  Eye,
  Globe2,
  Heart,
  Link2,
  MapPin,
  Music2,
  Pause,
  Play,
  Sun,
  Moon,
  Volume2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Profile, StationId } from '../types'
import { STATIONS, stationById } from '../lib/defaults'
import { usePlayer } from '../lib/audio'
import { formatJoined, formatNumber } from '../lib/storage'
import { useCountUp, useNow } from '../lib/hooks'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ClockCard({ profile }: { profile: Profile }) {
  const now = useNow()
  const parts = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(now)
  const offset = -now.getTimezoneOffset() / 60
  const tz = `UTC${offset >= 0 ? '+' : ''}${Number.isInteger(offset) ? offset : offset.toFixed(1)}`
  const hour = now.getHours()
  const isNight = hour < 6 || hour >= 18

  return (
    <section className="widget clock-card">
      <div className="widget-head">
        <span className="widget-label">
          <Globe2 size={14} /> Hora local
        </span>
        <span className="widget-chip">
          {isNight ? <Moon size={12} /> : <Sun size={12} />} {isNight ? 'noite' : 'dia'}
        </span>
      </div>
      <div className="clock-time">
        {get('hour')}:{get('minute')}
        <span className="clock-seconds">:{get('second')}</span>
      </div>
      <div className="clock-meta">
        <span>{date}</span>
        <span className="clock-tz">{tz}</span>
      </div>
      <div className="clock-location">
        <MapPin size={12} />
        {profile.location || 'Em algum lugar do mundo'}
      </div>
    </section>
  )
}

export function StatsCard({
  profile,
  views,
  likes,
  liked,
  onLike,
}: {
  profile: Profile
  views: number
  likes: number
  liked: boolean
  onLike: () => void
}) {
  const [burst, setBurst] = useState(0)
  const countViews = useCountUp(views, 1500)
  const countLikes = useCountUp(likes, 900)
  const chart = useMemo(() => {
    const base = profile.username.length * 7 + views % 31
    return Array.from({ length: 18 }, (_, i) => 18 + Math.abs(Math.sin((i + 1) * 0.72 + base)) * 72 + ((i * 13 + base) % 11))
  }, [profile.username, views])

  const triggerLike = () => {
    if (!liked) setBurst((value) => value + 1)
    onLike()
  }

  return (
    <section className="widget stats-card">
      <div className="widget-head">
        <span className="widget-label">
          <BarChart3 size={14} /> Métricas
        </span>
        <span className="widget-chip live">tempo real</span>
      </div>

      <div className="stats-grid">
        {profile.visibility.showViews ? (
          <div className="stat-cell">
            <span className="stat-icon">
              <Eye size={15} />
            </span>
            <strong>{formatNumber(countViews)}</strong>
            <span>visualizações</span>
          </div>
        ) : null}
        {profile.visibility.showLikes ? (
          <div className="stat-cell">
            <span className="stat-icon">
              <Heart size={15} />
            </span>
            <strong>{formatNumber(countLikes)}</strong>
            <span>curtidas</span>
          </div>
        ) : null}
        <div className="stat-cell">
          <span className="stat-icon">
            <Link2 size={15} />
          </span>
          <strong>{profile.links.length.toString().padStart(2, '0')}</strong>
          <span>links ativos</span>
        </div>
      </div>

      <div className="spark-block">
        <div className="spark-head">
          <span>
            <Activity size={12} /> atividade · 14 dias
          </span>
          <span className="spark-trend">+{(chart[chart.length - 1] / 7).toFixed(1)}%</span>
        </div>
        <div className="spark-chart" aria-hidden="true">
          {chart.map((height, index) => (
            <span key={index} style={{ height: `${height}%`, animationDelay: `${index * 35}ms` }} />
          ))}
        </div>
      </div>

      <div className="stats-footer">
        <button type="button" className={`like-btn ${liked ? 'is-liked' : ''}`} onClick={triggerLike} aria-pressed={liked}>
          <span className={`like-heart ${liked ? 'pop' : ''}`}>
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </span>
          {liked ? 'Curtido' : 'Curtir perfil'}
          <span className="like-count">{formatNumber(likes)}</span>
          {burst > 0 ? (
            <span className="heart-burst" key={burst} aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    ['--dx' as string]: `${(i - 4) * 13 + (i % 2 ? 7 : -7)}px`,
                    ['--dy' as string]: `${-38 - (i % 3) * 17}px`,
                    ['--rot' as string]: `${(i - 4) * 22}deg`,
                  }}
                />
              ))}
            </span>
          ) : null}
        </button>
        <span className="joined">membro desde {formatJoined(profile.memberSince)}</span>
      </div>
    </section>
  )
}

export function MusicCard({
  profile,
  canEdit,
  onVolume,
  onStation,
}: {
  profile: Profile
  canEdit: boolean
  onVolume: (value: number) => void
  onStation: (station: StationId) => void
}) {
  const player = usePlayer(profile.music)
  const station = stationById(profile.music.station)
  const isSynth = profile.music.mode === 'synth'
  const title = isSynth ? station.name : profile.music.title || 'Faixa externa'
  const artist = isSynth ? station.artist : profile.music.artist || 'Artista desconhecido'
  const note = isSynth ? station.note : 'via URL personalizada'
  const cover = isSynth ? '' : profile.music.cover
  const progress = player.duration > 0 ? (player.time / player.duration) * 100 : 0

  return (
    <section className="widget music-card" data-player>
      <div className="widget-head">
        <span className="widget-label">
          <Music2 size={14} /> Agora tocando
        </span>
        <span className={`widget-chip live ${player.playing ? 'is-playing' : ''}`}>
          <span className="live-dot" /> {player.playing ? 'no ar' : 'em espera'}
        </span>
      </div>

      <div className="track-row">
        <div
          className={`track-cover ${player.playing ? 'is-spinning' : ''}`}
          style={{ ['--cover-a' as string]: station.colorA, ['--cover-b' as string]: station.colorB }}
        >
          {cover ? <img src={cover} alt="" /> : null}
          <div className="cover-vinyl" />
          <div className="cover-ring" />
          <div className="cover-center">
            <span />
          </div>
        </div>
        <div className="track-meta">
          <strong>{title}</strong>
          <span>{artist}</span>
          <span className="track-note">{note}</span>
        </div>
        <button type="button" className="play-btn" onClick={player.toggle} aria-label={player.playing ? 'Pausar música' : 'Tocar música'}>
          {player.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>

      <div className={`levels ${player.playing ? 'is-active' : ''}`} aria-hidden="true">
        {player.levels.map((level, index) => (
          <span key={index} style={{ height: `${Math.max(8, level * 100)}%` }} />
        ))}
      </div>

      {isSynth ? (
        <div className="music-status">
          <span className="broadcast">
            <span className="live-dot" /> transmissão generativa
          </span>
          <span className="music-time">{formatTime(player.time)}</span>
        </div>
      ) : (
        <div className="music-status">
          <input
            type="range"
            className="progress-range"
            min={0}
            max={player.duration || 100}
            step={0.1}
            value={Math.min(player.time, player.duration || 100)}
            onChange={(event) => player.seek(Number(event.target.value))}
            aria-label="Progresso da faixa"
            style={{
              background: `linear-gradient(90deg, var(--accent) ${progress}%, rgba(255,255,255,.12) ${progress}%)`,
            }}
          />
          <span className="music-time">
            {formatTime(player.time)} / {formatTime(player.duration)}
          </span>
        </div>
      )}

      <div className="music-controls">
        {isSynth ? (
          <div className="station-dots" role="group" aria-label="Estações">
            {canEdit
              ? STATIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`station-dot ${profile.music.station === item.id ? 'is-active' : ''}`}
                    onClick={() => onStation(item.id)}
                    title={item.name}
                    aria-label={`Estação ${item.name}`}
                  >
                    <span style={{ background: item.colorA }} />
                  </button>
                ))
              : null}
            <span className="station-name">{station.name}</span>
          </div>
        ) : (
          <span className="station-name">faixa externa</span>
        )}
        {canEdit ? (
          <div className="volume-control">
            <Volume2 size={14} />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={profile.music.volume}
              onChange={(event) => onVolume(Number(event.target.value))}
              aria-label="Volume"
              style={{
                background: `linear-gradient(90deg, var(--accent) ${profile.music.volume * 100}%, rgba(255,255,255,.12) ${profile.music.volume * 100}%)`,
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
