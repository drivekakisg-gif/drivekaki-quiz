// Web Audio API sound generation — no audio files required.
// Howler.js is installed and can replace this when real .mp3 assets are added.

type SoundType = 'correct' | 'wrong' | 'streak' | 'levelup' | 'xpgain' | 'confetti'

class SoundManager {
  private ctx: AudioContext | null = null
  enabled = true

  private get ac(): AudioContext | null {
    if (typeof window === 'undefined') return null
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContext()
      }
      return this.ctx
    } catch {
      return null
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.25,
    delay = 0,
  ) {
    const ac = this.ac
    if (!ac || !this.enabled) return

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)

    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay)
    gain.gain.setValueAtTime(gainVal, ac.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration)

    osc.start(ac.currentTime + delay)
    osc.stop(ac.currentTime + delay + duration)
  }

  play(type: SoundType) {
    if (!this.enabled) return
    switch (type) {
      case 'correct':
        this.tone(880, 0.12, 'sine', 0.3)
        this.tone(1108, 0.18, 'sine', 0.2, 0.08)
        break
      case 'wrong':
        this.tone(280, 0.15, 'sawtooth', 0.2)
        this.tone(220, 0.25, 'sawtooth', 0.15, 0.07)
        break
      case 'streak':
        ;[440, 554, 659, 880].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.22, i * 0.08))
        break
      case 'levelup':
        ;[523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.28, i * 0.12))
        break
      case 'xpgain':
        this.tone(1318, 0.07, 'sine', 0.12)
        break
      case 'confetti':
        ;[659, 784, 1047, 1318].forEach((f, i) => this.tone(f, 0.15, 'sine', 0.2, i * 0.07))
        break
    }
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export const sounds = new SoundManager()
