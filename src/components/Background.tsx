import { useEffect, useRef } from 'react'
import type { EffectId, Profile } from '../types'
import { themeById } from '../lib/defaults'

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const int = Number.parseInt(value, 16)
  if (Number.isNaN(int)) return [6, 6, 12]
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  phase: number
  twinkle: number
  alpha: number
  length: number
}

interface Column {
  x: number
  y: number
  speed: number
  chars: string[]
}

const MATRIX_GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF'
const STAR_COUNT = 190

function EffectCanvas({ effect, density, speed, accent, accent2, bg }: { effect: EffectId; density: number; speed: number; accent: string; accent2: string; bg: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (effect === 'none' || effect === 'aurora' || effect === 'grid') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const speedFactor = Math.max(0.15, speed)
    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let frame = 0
    let last = performance.now()
    let running = true
    let particles: Particle[] = []
    let columns: Column[] = []
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null
    let nextShooting = performance.now() + 5000
    const pointer = { x: 0.5, y: 0.5 }
    const [br, bgc, bb] = hexToRgb(bg)

    const init = () => {
      const d = Math.max(6, density)
      if (effect === 'stars') {
        const count = Math.round(STAR_COUNT * (d / 60))
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.5 + 0.35,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.04,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.4 + Math.random() * 1.6,
          alpha: 0.25 + Math.random() * 0.7,
          length: 0,
        }))
      } else if (effect === 'snow') {
        const count = Math.round(140 * (d / 60))
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2.4 + 0.7,
          vx: (Math.random() - 0.5) * 0.35,
          vy: 0.25 + Math.random() * 0.75,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.6 + Math.random(),
          alpha: 0.3 + Math.random() * 0.6,
          length: 0,
        }))
      } else if (effect === 'rain') {
        const count = Math.round(190 * (d / 60))
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0,
          vx: 0.4 + Math.random() * 0.2,
          vy: 6 + Math.random() * 7,
          phase: 0,
          twinkle: 0,
          alpha: 0.12 + Math.random() * 0.3,
          length: 10 + Math.random() * 22,
        }))
      } else if (effect === 'embers') {
        const count = Math.round(95 * (d / 60))
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2.2 + 0.5,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(0.18 + Math.random() * 0.55),
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.8 + Math.random() * 1.8,
          alpha: 0.15 + Math.random() * 0.55,
          length: 0,
        }))
      } else if (effect === 'matrix') {
        const count = Math.round(12 + (d / 100) * 58)
        columns = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * -height,
          speed: 35 + Math.random() * 120,
          chars: Array.from({ length: 14 }, () => MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)]),
        }))
      }
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      init()
      if (reduced) draw(0)
    }

    const onPointer = (event: PointerEvent) => {
      pointer.x = event.clientX / Math.max(1, width) - 0.5
      pointer.y = event.clientY / Math.max(1, height) - 0.5
    }

    const draw = (dt: number) => {
      const step = Math.min(dt, 48) / 16.667
      ctx.clearRect(0, 0, width, height)
      if (effect === 'stars') {
        const ox = pointer.x * -10
        const oy = pointer.y * -8
        particles.forEach((p) => {
          p.x += p.vx * step * speedFactor
          p.y += p.vy * step * speedFactor
          if (p.x < -10) p.x = width + 10
          if (p.x > width + 10) p.x = -10
          if (p.y < -10) p.y = height + 10
          if (p.y > height + 10) p.y = -10
          const tw = 0.5 + 0.5 * Math.sin((performance.now() / 1000) * p.twinkle + p.phase)
          ctx.beginPath()
          ctx.fillStyle = p.r > 1.15 ? accent2 : '#ffffff'
          ctx.globalAlpha = p.alpha * (0.35 + tw * 0.65)
          ctx.arc(p.x + ox, p.y + oy, p.r, 0, Math.PI * 2)
          ctx.fill()
          if (p.r > 1.3) {
            ctx.globalAlpha = p.alpha * tw * 0.18
            ctx.beginPath()
            ctx.arc(p.x + ox, p.y + oy, p.r * 4.2, 0, Math.PI * 2)
            ctx.fill()
          }
        })
        ctx.globalAlpha = 1
        if (!reduced) {
          const now = performance.now()
          if (!shooting && now > nextShooting) {
            shooting = { x: Math.random() * width * 0.7, y: Math.random() * height * 0.35, vx: 6 + Math.random() * 4, vy: 2.2 + Math.random() * 1.6, life: 1 }
            nextShooting = now + 7000 + Math.random() * 9000
          }
          if (shooting) {
            shooting.x += shooting.vx * step * speedFactor
            shooting.y += shooting.vy * step * speedFactor
            shooting.life -= 0.008 * step
            const gradient = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - 90, shooting.y - 34)
            gradient.addColorStop(0, accent2)
            gradient.addColorStop(1, 'transparent')
            ctx.strokeStyle = gradient
            ctx.globalAlpha = Math.max(0, shooting.life) * 0.8
            ctx.lineWidth = 1.4
            ctx.beginPath()
            ctx.moveTo(shooting.x, shooting.y)
            ctx.lineTo(shooting.x - 90, shooting.y - 34)
            ctx.stroke()
            ctx.globalAlpha = 1
            if (shooting.life <= 0 || shooting.x > width + 120) shooting = null
          }
        }
      } else if (effect === 'snow') {
        particles.forEach((p) => {
          p.phase += 0.01 * step * speedFactor
          p.x += (p.vx + Math.sin(p.phase) * 0.32) * step * speedFactor
          p.y += p.vy * step * speedFactor
          if (p.y > height + 10) {
            p.y = -10
            p.x = Math.random() * width
          }
          if (p.x < -10) p.x = width + 10
          if (p.x > width + 10) p.x = -10
          ctx.beginPath()
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = p.alpha * 0.9
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.globalAlpha = 1
      } else if (effect === 'rain') {
        ctx.lineCap = 'round'
        particles.forEach((p) => {
          p.x += p.vx * step * speedFactor
          p.y += p.vy * step * speedFactor
          if (p.y > height + 30) {
            p.y = -30
            p.x = Math.random() * width
          }
          if (p.x > width + 10) p.x = -10
          ctx.strokeStyle = accent2
          ctx.globalAlpha = p.alpha
          ctx.lineWidth = 0.9
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 2, p.y - p.length)
          ctx.stroke()
        })
        ctx.globalAlpha = 1
      } else if (effect === 'embers') {
        ctx.globalCompositeOperation = 'lighter'
        particles.forEach((p) => {
          p.phase += 0.02 * step
          p.x += (p.vx + Math.sin(p.phase) * 0.16) * step * speedFactor
          p.y += p.vy * step * speedFactor
          if (p.y < -20) {
            p.y = height + 20
            p.x = Math.random() * width
          }
          if (p.x < -20) p.x = width + 20
          if (p.x > width + 20) p.x = -20
          const pulse = 0.55 + 0.45 * Math.sin(p.phase * 1.7)
          ctx.globalAlpha = p.alpha * pulse * 0.35
          ctx.fillStyle = accent
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = p.alpha * pulse
          ctx.fillStyle = accent2
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      } else if (effect === 'matrix') {
        ctx.fillStyle = `rgba(${br},${bgc},${bb},0.16)`
        ctx.fillRect(0, 0, width, height)
        ctx.font = '600 15px "SFMono-Regular", ui-monospace, monospace'
        columns.forEach((col) => {
          col.y += col.speed * step * speedFactor * 0.06
          if (col.y > height + 280) {
            col.x = Math.random() * width
            col.y = -Math.random() * 300
            col.speed = 35 + Math.random() * 120
          }
          col.chars.forEach((char, index) => {
            const alpha = index === 0 ? 0.95 : Math.max(0, 0.5 - index * 0.035)
            ctx.fillStyle = index === 0 ? '#eafff0' : accent
            ctx.globalAlpha = alpha
            ctx.fillText(char, col.x, col.y - index * 18)
          })
          if (Math.random() < 0.18) col.chars[0] = MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)]
        })
        ctx.globalAlpha = 1
      }
    }

    const loop = (now: number) => {
      if (!running) return
      const dt = now - last
      last = now
      draw(dt)
      if (reduced) return
      frame = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(frame)
      } else if (!reduced) {
        running = true
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    if (!reduced) frame = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [effect, density, speed, accent, accent2, bg])

  if (effect === 'none' || effect === 'aurora' || effect === 'grid') return null
  return <canvas ref={canvasRef} className="effect-canvas" aria-hidden="true" />
}

export function Background({ profile }: { profile: Profile }) {
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-base" />
      {profile.backgroundImage ? (
        <>
          <div
            className="bg-photo"
            style={{
              backgroundImage: `url(${profile.backgroundImage})`,
              filter: `blur(${profile.imageBlur}px) saturate(1.05)`,
              transform: 'scale(1.08)',
            }}
          />
          <div className="bg-tint" style={{ opacity: Math.min(0.92, Math.max(0.15, profile.imageDim / 100)) }} />
        </>
      ) : null}
      {profile.effect === 'aurora' ? (
        <div className="aurora">
          <span className="aurora-orb orb-a" />
          <span className="aurora-orb orb-b" />
          <span className="aurora-orb orb-c" />
          <span className="aurora-orb orb-d" />
          <span className="aurora-veil" />
        </div>
      ) : null}
      {profile.effect === 'grid' ? (
        <div className="grid-scene">
          <div className="grid-glow" />
          <div className="grid-floor" />
        </div>
      ) : null}
      <EffectCanvas effect={profile.effect} density={profile.density} speed={profile.speed} accent={profile.accent} accent2={profile.accent2} bg={themeById(profile.themeId).bg} />
      <div className="bg-vignette" />
      <div className="bg-grain" />
    </div>
  )
}
