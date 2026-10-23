import { presetById } from './data.js';

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class AuraAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.analyser = null;
    this.delay = null;
    this.delayGain = null;
    this.buffer = null;
    this.timer = null;
    this.nextTime = 0;
    this.step = 0;
    this.active = new Set();
    this.mode = null;
    this.element = null;
    this.volume = 0.45;
    this.playing = false;
    this.config = null;
    this.fakeBands = new Array(32).fill(0);
    this.fakeTick = 0;
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.82;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  buildDelay() {
    if (this.delay) return;
    this.delay = this.ctx.createDelay(1.5);
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = 0.34;
    this.delay.connect(this.delayGain);
    this.delayGain.connect(this.delay);
    this.delayGain.connect(this.master);
  }

  note(preset, freq, time, dur, gainValue, type) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = preset.filter * 1.5;
    filter.Q.value = 0.8;
    osc.type = type || preset.wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    if (this.delay) {
      const send = ctx.createGain();
      send.gain.value = 0.5;
      gain.connect(send);
      send.connect(this.delay);
    }
    osc.start(time);
    osc.stop(time + dur + 0.05);
    this.active.add(osc);
    osc.onended = () => {
      this.active.delete(osc);
      try { osc.disconnect(); gain.disconnect(); filter.disconnect(); } catch {}
    };
  }

  startPad(preset) {
    const ctx = this.ctx;
    const root = preset.root;
    const chord = [0, 7, 12, 19, 24];
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = preset.filter;
    filter.Q.value = 1.2;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.0001;
    padGain.gain.linearRampToValueAtTime(preset.pad * 0.16, ctx.currentTime + 2.4);
    padGain.connect(filter);
    filter.connect(this.master);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = preset.filter * 0.35;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.active.add(lfo);
    chord.forEach((semi, index) => {
      const osc = ctx.createOscillator();
      osc.type = index % 2 ? 'sine' : preset.wave;
      osc.frequency.value = midiToFreq(root + semi);
      osc.detune.value = (index - 2) * 4;
      const g = ctx.createGain();
      g.gain.value = 0.6 / (index + 1.4);
      osc.connect(g);
      g.connect(padGain);
      osc.start();
      this.active.add(osc);
    });
  }

  schedule() {
    if (!this.playing || this.mode !== 'synth') return;
    const preset = presetById(this.config?.preset);
    const ctx = this.ctx;
    const stepDur = 60 / preset.bpm / 2;
    while (this.nextTime < ctx.currentTime + 0.45) {
      const degree = preset.scale[this.step % preset.scale.length];
      const octave = this.step % 8 === 0 ? 12 : 0;
      const freq = midiToFreq(preset.root + 12 + degree + octave);
      const accent = this.step % 4 === 0 ? 1.3 : 0.75;
      this.note(preset, freq, this.nextTime, stepDur * 2.2, 0.085 * accent, preset.wave);
      if (this.step % 4 === 0) {
        this.note(preset, midiToFreq(preset.root + degree), this.nextTime, stepDur * 3.4, 0.06, 'sine');
      }
      this.nextTime += stepDur;
      this.step += 1;
    }
  }

  async play(config = {}) {
    this.config = { ...config };
    this.volume = (Number(config.volume ?? 45) || 0) / 100;
    if (config.url) return this.playUrl(config);
    return this.playSynth(config);
  }

  async playSynth(config) {
    if (!this.ensure()) return false;
    if (this.mode === 'url') this.teardown();
    this.mode = 'synth';
    const preset = presetById(config.preset);
    if (this.playing) this.teardownVoices();
    this.startPad(preset);
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.master.gain.exponentialRampToValueAtTime(Math.max(0.02, Math.pow(this.volume, 1.35)), this.ctx.currentTime + 1.6);
    this.playing = true;
    this.schedule();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 120);
    try { await this.ctx.resume(); } catch {}
    return true;
  }

  async playUrl(config) {
    this.ensure();
    this.teardown();
    this.mode = 'url';
    const el = new Audio();
    el.src = config.url;
    el.loop = true;
    el.crossOrigin = 'anonymous';
    el.volume = Math.min(1, this.volume);
    this.element = el;
    try {
      await el.play();
      this.playing = true;
      return true;
    } catch {
      this.playing = false;
      return false;
    }
  }

  teardownVoices() {
    clearInterval(this.timer);
    this.timer = null;
    for (const node of this.active) {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    this.active.clear();
  }

  teardown() {
    this.playing = false;
    this.teardownVoices();
    if (this.element) {
      try { this.element.pause(); this.element.src = ''; } catch {}
      this.element = null;
    }
    if (this.master) {
      try {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }
    this.mode = null;
  }

  pause() {
    if (this.mode === 'synth' && this.master) {
      try {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      } catch {}
    }
    if (this.element) {
      try { this.element.pause(); } catch {}
    }
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    setTimeout(() => {
      if (!this.playing) this.teardownVoices();
    }, 420);
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, (Number(value) || 0) / 100));
    if (this.mode === 'synth' && this.master && this.playing) {
      this.master.gain.setTargetAtTime(Math.max(0.0001, Math.pow(this.volume, 1.35)), this.ctx.currentTime, 0.08);
    }
    if (this.element) this.element.volume = this.volume;
  }

  bands(count = 32) {
    if (this.mode === 'synth' && this.analyser && this.playing) {
      this.analyser.getByteFrequencyData(this.buffer);
      const out = [];
      const usable = Math.floor(this.buffer.length * 0.7);
      let peak = 0;
      for (let i = 0; i < count; i += 1) {
        const index = Math.floor((i / count) * usable);
        const value = this.buffer[index] / 255;
        peak = Math.max(peak, value);
        out.push(value);
      }
      if (peak > 0.02) return out;
    }
    this.fakeTick += 1;
    const t = this.fakeTick / 9;
    for (let i = 0; i < count; i += 1) {
      const target = this.playing
        ? 0.16 + Math.abs(Math.sin(t + i * 0.55) * Math.cos(t * 0.6 + i * 0.21)) * 0.72
        : 0.05;
      this.fakeBands[i] = (this.fakeBands[i] || 0) + (target - (this.fakeBands[i] || 0)) * 0.25;
    }
    return this.fakeBands.slice(0, count);
  }
}

export const audio = new AuraAudio();
