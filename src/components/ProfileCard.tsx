import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Eye,
  Heart,
  MapPin,
  Pencil,
  Share2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { Profile } from '../types'
import { formatJoined, formatNumber } from '../lib/storage'
import { BrandIcon } from './BrandIcon'
import { ItemIcon } from './ItemIcon'

interface Props {
  profile: Profile
  views: number
  likes: number
  canEdit: boolean
  onEdit: () => void
  onShare: () => void
  onLinkClick: (label: string) => void
}

function Avatar({ src, name }: { src: string; name: string }) {
  const [current, setCurrent] = useState(src)
  return (
    <img
      key={src}
      src={current}
      alt={`Avatar de ${name}`}
      draggable={false}
      onError={() => setCurrent('/avatar.svg')}
    />
  )
}

export function ProfileCard({ profile, views, likes, canEdit, onEdit, onShare, onLinkClick }: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const frameRef = useRef(0)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    card.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`)
    card.style.setProperty('--my', `${(py * 100).toFixed(2)}%`)
    if (!profile.tilt || reduced) return
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      card.style.transform = `perspective(1300px) rotateX(${((0.5 - py) * 2.6).toFixed(2)}deg) rotateY(${((px - 0.5) * 3.4).toFixed(2)}deg)`
    })
  }

  const handleLeave = () => {
    const card = cardRef.current
    if (!card) return
    cancelAnimationFrame(frameRef.current)
    card.style.transform = 'perspective(1300px) rotateX(0deg) rotateY(0deg)'
    card.style.setProperty('--mx', '50%')
    card.style.setProperty('--my', '20%')
  }

  const joined = formatJoined(profile.memberSince)

  return (
    <div className="card-shell">
      <article
        ref={cardRef}
        className="profile-card"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div className="card-banner">
          <div className="banner-aurora" />
          <div className="banner-grid" />
          <div className="banner-shine" />
          <div className="banner-orbit orbit-one" />
          <div className="banner-orbit orbit-two" />
          <div className="banner-spark spark-one" />
          <div className="banner-spark spark-two" />
          <div className="banner-spark spark-three" />
          <div className="banner-actions">
            <button type="button" className="icon-btn glass" onClick={onShare} aria-label="Compartilhar perfil" title="Compartilhar perfil">
              <Share2 size={16} />
            </button>
            {canEdit ? (
              <button type="button" className="icon-btn glass" onClick={onEdit} aria-label="Editar perfil" title="Editar perfil">
                <Pencil size={16} />
              </button>
            ) : null}
          </div>
          <div className="banner-badge">
            <span className="badge-dot" />
            {profile.verified ? 'perfil verificado' : 'perfil público'}
          </div>
        </div>

        <div className="card-body">
          <div className="identity-row">
            <div className="avatar-block">
              <div className="avatar-halo" />
              <div className="avatar-ring">
                <div className="avatar">
                  <Avatar src={profile.avatar || '/avatar.svg'} name={profile.displayName} />
                </div>
              </div>
              <span className="status-dot" aria-label={profile.status} title={profile.status} />
            </div>

            <div className="identity-text">
              <h1 className="display-name">
                {profile.displayName || 'Sem nome'}
                {profile.verified ? <BadgeCheck className="verified" size={21} strokeWidth={2.2} aria-label="Verificado" /> : null}
              </h1>
              <div className="identity-sub">
                <span className="handle">@{profile.username || 'usuario'}</span>
                <span className="sub-separator" />
                <span className="role">{profile.role || 'Criativo'}</span>
              </div>
              <div className="status-pill">
                <span className="pulse-dot" />
                {profile.status || 'Por aí'}
              </div>
            </div>
          </div>

          <p className="bio">{profile.bio}</p>

          <div className="tag-row">
            {profile.tags.filter(Boolean).map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="meta-row">
            {profile.visibility.showLocation && profile.location ? (
              <span className="meta-item">
                <MapPin size={13} /> {profile.location}
              </span>
            ) : null}
            <span className="meta-item">
              <CalendarDays size={13} /> desde {joined}
            </span>
          </div>

          {profile.socials.length ? (
            <div className="social-row">
              {profile.socials.map((social) => (
                <a
                  key={social.id}
                  className="social-btn"
                  href={social.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.platform}
                  data-tip={social.platform}
                >
                  <BrandIcon name={social.platform} size={17} />
                </a>
              ))}
              {canEdit ? (
                <>
                  <span className="social-line" />
                  <button type="button" className="social-btn social-add" onClick={onEdit} aria-label="Adicionar redes" data-tip="Adicionar">
                    <span>+</span>
                  </button>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="links-block">
            <div className="links-head">
              <span>Links</span>
              <span className="links-count">{profile.links.length.toString().padStart(2, '0')}</span>
            </div>
            <div className="links-list">
              {profile.links.length ? (
                profile.links.map((link, index) => (
                  <a
                    key={link.id}
                    className="link-row"
                    href={link.url || '#'}
                    target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noreferrer noopener"
                    style={{ ['--index' as string]: index }}
                    onClick={() => onLinkClick(link.label)}
                  >
                    <span className="link-icon">
                      <ItemIcon name={link.icon} size={18} />
                    </span>
                    <span className="link-text">
                      <span className="link-label">{link.label || 'Link sem nome'}</span>
                      {link.description ? <span className="link-desc">{link.description}</span> : null}
                    </span>
                    <span className="link-arrow">
                      <ArrowUpRight size={16} />
                    </span>
                  </a>
                ))
              ) : canEdit ? (
                <button type="button" className="empty-links" onClick={onEdit}>
                  <span className="empty-icon">+</span>
                  Nenhum link ainda. Abra o estúdio e adicione o primeiro.
                </button>
              ) : (
                <div className="empty-links is-static">Nenhum link publicado ainda.</div>
              )}
            </div>
          </div>

          <div className="card-footer">
            <div className="footer-stats">
              {profile.visibility.showViews ? (
                <span>
                  <Eye size={14} /> {formatNumber(views)}
                </span>
              ) : null}
              {profile.visibility.showLikes ? (
                <span>
                  <Heart size={14} /> {formatNumber(likes)}
                </span>
              ) : null}
            </div>
            <span className="footer-slug">
              <span className="slug-dot" />
              thom.lol/{profile.username || 'usuario'}
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}
