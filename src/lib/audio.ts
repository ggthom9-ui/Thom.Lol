import { useCallback, useEffect, useRef, useState } from 'react'
import type { MusicConfig, Station } from '../types'
import { STATIONS, stationById } from './defaults'

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

interface Voice {
  node: OscillatorNode | AudioBufferSourceNode
}

export class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private reverbSend: GainNode | null = null
  private delaySend: GainNode | null = null
  private data: Uint8Array<ArrayBuffer> | null = null
  private voices = new Set<Voice>()
  private chordTimer: number | null = null
  private arpTimer: number | null = null
  private chordIndex = 0
  private arpIndex = 0
  private running = false
  private station: Station
  private volume: number

  constructor(station: Station, volume: number) {
    this.station = station
    this.volume = volume
  }

  setStation(station: Station): void {
    if (station.id === this.station.id) return
    const wasRunning = this.running
    this.stop()
    this.station = station
    if (wasRunning) void this.start()
  }

  setVolume(volume: number): void {
    this.volume = volume
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(volume * 0.9, this.ctx.currentTime, 0.08)
    }
  }

  get isRunning(): boolean {
    return this.running
  }

  getLevels(bars = 24): number[] {
    if (!this.analyser || !this.data) return new Array(bars).fill(2)
    this.analyser.getByteFrequencyData(this.data)
    const result: number[] = []
    const usable = Math.floor(this.data.length * 0.62)
    const step = Math.max(1, Math.floor(usable / bars))
    for (let i = 0; i < bars; i += 1) {
      let sum = 0
      for (let j = 0; j < step; j += 1) sum += this.data[i * step + j] ?? 0
      const value = sum / step / 255
      result.push(Math.max(0.06, Math.pow(value, 0.72)))
    }
    return result
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.82
    master.connect(analyser)
    analyser.connect(ctx.destination)

    const reverbSend = ctx.createGain()
    reverbSend.gain.value = 0.55
    const convolver = ctx.createConvolver()
    convolver.buffer = this.makeImpulse(ctx, 3.1)
    const reverbReturn = ctx.createGain()
    reverbReturn.gain.value = 0.52
    reverbSend.connect(convolver)
    convolver.connect(reverbReturn)
    reverbReturn.connect(master)

    const delaySend = ctx.createGain()
    delaySend.gain.value = 0.42
    const delay = ctx.createDelay(1.2)
    delay.delayTime.value = 60 / this.station.bpm / 2
    const feedback = ctx.createGain()
    feedback.gain.value = 0.34
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2400
    delaySend.connect(delay)
    delay.connect(tone)
    tone.connect(feedback)
    feedback.connect(delay)
    tone.connect(master)

    const air = ctx.createBufferSource()
    air.buffer = this.makeNoise(ctx)
    air.loop = true
    const airFilter = ctx.createBiquadFilter()
    airFilter.type = 'bandpass'
    airFilter.frequency.value = 1400
    airFilter.Q.value = 0.6
    const airGain = ctx.createGain()
    airGain.gain.value = 0.018
    air.connect(airFilter)
    airFilter.connect(airGain)
    airGain.connect(reverbSend)
    air.start()

    this.ctx = ctx
    this.master = master
    this.analyser = analyser
    this.reverbSend = reverbSend
    this.delaySend = delaySend
    this.data = new Uint8Array(analyser.frequencyBinCount)
    return ctx
  }

  private makeImpulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6)
      }
    }
    return buffer
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 2)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    return buffer
  }

  async start(): Promise<void> {
    const ctx = this.ensureContext()
    await ctx.resume()
    if (this.running) return
    this.running = true
    if (this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime)
      this.master.gain.setTargetAtTime(this.volume * 0.9, ctx.currentTime, 0.35)
    }
    this.playChord()
    this.playArp()
    this.chordTimer = window.setInterval(() => this.playChord(), 7600)
    this.arpTimer = window.setInterval(() => this.playArp(), (60 / this.station.bpm / 2) * 1000)
  }

  stop(): void {
    this.running = false
    if (this.chordTimer !== null) window.clearInterval(this.chordTimer)
    if (this.arpTimer !== null) window.clearInterval(this.arpTimer)
    this.chordTimer = null
    this.arpTimer = null
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.12)
    const now = ctx.currentTime
    this.voices.forEach((voice) => {
      try {
        voice.node.stop(now + 0.5)
      } catch {
        /* already stopped */
      }
    })
    this.voices.clear()
    window.setTimeout(() => {
      if (!this.running && this.ctx && this.ctx.state === 'running') {
        void this.ctx.suspend()
      }
    }, 900)
  }

  private track(node: OscillatorNode | AudioBufferSourceNode, stopAt: number): void {
    const voice: Voice = { node }
    this.voices.add(voice)
    node.addEventListener('ended', () => this.voices.delete(voice), { once: true })
    try {
      node.stop(stopAt)
    } catch {
      /* ignore */
    }
  }

  private playChord(): void {
    if (!this.running || !this.ctx || !this.master || !this.reverbSend) return
    const ctx = this.ctx
    const time = ctx.currentTime + 0.05
    const chord = this.station.chords[this.chordIndex % this.station.chords.length]
    const duration = 8.4
    for (const midi of chord) {
      for (const detune of [-7, 6]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = midiToFreq(midi)
        osc.detune.value = detune
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = this.station.cutoff
        filter.Q.value = 0.9
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(0.024, time + 2.1)
        gain.gain.setValueAtTime(0.024, time + duration - 2.4)
        gain.gain.linearRampToValueAtTime(0, time + duration)
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.master)
        gain.connect(this.reverbSend)
        osc.start(time)
        this.track(osc, time + duration + 0.1)
      }
    }
    this.chordIndex += 1
  }

  private playArp(): void {
    if (!this.running || !this.ctx || !this.master || !this.delaySend) return
    const ctx = this.ctx
    const time = ctx.currentTime + 0.03
    const scale = this.station.scale
    const pattern = [0, 2, 4, 3, 5, 4, 2, 1, 3, 5, 6, 4]
    const midi = scale[pattern[this.arpIndex % pattern.length] % scale.length] + (this.arpIndex % 8 === 6 ? 12 : 0)
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = midiToFreq(midi)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(0.055, time + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.35)
    osc.connect(gain)
    gain.connect(this.master)
    gain.connect(this.delaySend)
    osc.start(time)
    this.track(osc, time + 1.45)
    this.arpIndex += 1
  }
}

export interface PlayerApi {
  playing: boolean
  levels: number[]
  time: number
  duration: number
  toggle: () => void
  seek: (value: number) => void
  isSynth: boolean
}

export function usePlayer(music: MusicConfig): PlayerApi {
  const station = stationById(music.station)
  const [playing, setPlaying] = useState(false)
  const [levels, setLevels] = useState<number[]>(() => new Array(24).fill(0.08))
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const engineRef = useRef<AmbientEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef(0)
  const playingRef = useRef(false)
  const startedAt = useRef(0)
  const synthKey = `${music.mode}:${music.station}:${music.url}`
  const lastKey = useRef(synthKey)

  playingRef.current = playing

  const stopAll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    engineRef.current?.stop()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaying(false)
    setLevels(new Array(24).fill(0.08))
  }, [])

  useEffect(() => {
    const wasPlaying = playingRef.current && lastKey.current === synthKey
    lastKey.current = synthKey
    stopAll()
    setTime(0)
    setDuration(0)
    if (music.mode === 'url' && music.url.trim()) {
      const audio = new Audio(music.url)
      audio.loop = true
      audio.preload = 'metadata'
      audio.volume = music.volume
      audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(audio.duration)) setDuration(audio.duration)
      })
      const onEnded = () => {
        setPlaying(false)
        setTime(0)
      }
      audio.addEventListener('ended', onEnded)
      audioRef.current = audio
      if (wasPlaying) {
        void audio.play().then(() => setPlaying(true)).catch(() => undefined)
      }
    } else {
      engineRef.current = new AmbientEngine(station, music.volume)
      if (wasPlaying) {
        void engineRef.current.start().then(() => setPlaying(true)).catch(() => undefined)
      }
    }
    return () => {
      engineRef.current?.stop()
      engineRef.current = null
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthKey])

  useEffect(() => {
    if (music.mode === 'url') {
      engineRef.current?.stop()
      engineRef.current = null
      if (audioRef.current) audioRef.current.volume = music.volume
    } else {
      engineRef.current?.setVolume(music.volume)
    }
  }, [music.volume, music.mode])

  useEffect(() => {
    const tick = () => {
      if (!playingRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      if (music.mode === 'url' && audioRef.current) {
        const audio = audioRef.current
        setTime(audio.currentTime)
        if (Number.isFinite(audio.duration)) setDuration(audio.duration)
        const t = performance.now() / 1000
        setLevels(
          new Array(24).fill(0).map((_, i) => {
            const wave = Math.sin(t * 3.1 + i * 0.7) * 0.28 + Math.sin(t * 1.7 + i * 0.3) * 0.22
            return Math.max(0.08, Math.min(0.95, 0.38 + wave + Math.sin(t * 0.8 + i) * 0.12))
          }),
        )
      } else if (engineRef.current) {
        setTime((performance.now() - startedAt.current) / 1000)
        setLevels(engineRef.current.getLevels(24))
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [music.mode])

  const toggle = useCallback(() => {
    if (music.mode === 'url') {
      const audio = audioRef.current
      if (!audio) return
      if (playingRef.current) {
        audio.pause()
        setPlaying(false)
      } else {
        startedAt.current = performance.now()
        void audio
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false))
      }
      return
    }
    const engine = engineRef.current
    if (!engine) return
    if (playingRef.current) {
      engine.stop()
      setPlaying(false)
    } else {
      startedAt.current = performance.now()
      void engine
        .start()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false))
    }
  }, [music.mode])

  const seek = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value
      setTime(value)
    }
  }, [])

  useEffect(() => {
    if (!music.autoplay) return
    let engaged = false
    const onGesture = (event: PointerEvent) => {
      if (engaged) return
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-player]')) return
      engaged = true
      window.removeEventListener('pointerdown', onGesture)
      const api = music.mode === 'url' ? audioRef.current : engineRef.current
      if (!api || playingRef.current) return
      if (music.mode === 'url') {
        startedAt.current = performance.now()
        void audioRef.current?.play().then(() => setPlaying(true)).catch(() => undefined)
      } else {
        startedAt.current = performance.now()
        void engineRef.current?.start().then(() => setPlaying(true)).catch(() => undefined)
      }
    }
    window.addEventListener('pointerdown', onGesture)
    return () => window.removeEventListener('pointerdown', onGesture)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music.autoplay, music.mode, synthKey])

  return {
    playing,
    levels,
    time,
    duration,
    toggle,
    seek,
    isSynth: music.mode === 'synth',
  }
}

let uiContext: AudioContext | null = null

export function playUiSound(kind: 'click' | 'success' | 'like' = 'click'): void {
  try {
    if (!uiContext) uiContext = new AudioContext()
    const ctx = uiContext
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    const frequencies = kind === 'like' ? [523.25, 659.25] : kind === 'success' ? [659.25, 880] : [880]
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + index * 0.06)
      gain.gain.linearRampToValueAtTime(0.035, now + index * 0.06 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.06 + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + index * 0.06)
      osc.stop(now + index * 0.06 + 0.22)
    })
  } catch {
    /* audio unavailable */
  }
}

export function nextStationId(current: string): string {
  const index = STATIONS.findIndex((s) => s.id === current)
  return STATIONS[(index + 1) % STATIONS.length].id
}
