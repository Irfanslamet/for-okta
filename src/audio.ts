type Tone = {
  frequency: number
  delay: number
  duration: number
  volume: number
}

const ambienceVolume = 0.15

export class GachaAudio {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private effectGain: GainNode | null = null
  private ambienceTimer: ReturnType<typeof setInterval> | null = null
  private ambienceStep = 0
  private enabled = false

  async enable() {
    const context = this.getContext()
    this.enabled = true

    if (context.state === 'suspended') await context.resume()
    if (!this.enabled) return
    if (context.state !== 'running') throw new Error('AudioContext did not enter the running state.')

    const now = context.currentTime
    const masterGain = this.masterGain
    if (!masterGain) throw new Error('Audio output is not available.')
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setTargetAtTime(0.8, now, 0.08)
    this.startAmbience()
  }

  disable() {
    this.enabled = false
    if (this.ambienceTimer) clearInterval(this.ambienceTimer)
    this.ambienceTimer = null

    if (!this.context || !this.masterGain) return
    const now = this.context.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setTargetAtTime(0.0001, now, 0.035)
    this.effectGain?.gain.setTargetAtTime(0.0001, now, 0.025)
  }

  playClick() {
    const context = this.getActiveContext()
    if (!context) return

    const now = context.currentTime + 0.01
    const output = this.createEffectOutput(context)
    this.playTone(context, 784, now, 0.12, 0.16, 'triangle', output)
    this.playTone(context, 1174.66, now + 0.035, 0.16, 0.08, 'sine', output)
  }

  playOpenPack(isRare = false) {
    const context = this.getActiveContext()
    if (!context) return

    const now = context.currentTime + 0.02
    const output = this.createEffectOutput(context)
    this.playSweep(context, now, isRare ? 1.25 : 0.95, output)

    const sparkles: Tone[] = [
      { frequency: 523.25, delay: 0.34, duration: 0.72, volume: 0.12 },
      { frequency: 659.25, delay: 0.62, duration: 0.78, volume: 0.11 },
      { frequency: 783.99, delay: 0.9, duration: 0.84, volume: 0.1 },
    ]

    if (isRare) {
      sparkles.push(
        { frequency: 1046.5, delay: 1.02, duration: 1.05, volume: 0.13 },
        { frequency: 1318.51, delay: 1.28, duration: 1.2, volume: 0.1 },
      )
    }

    for (const sparkle of sparkles) {
      this.playTone(
        context,
        sparkle.frequency,
        now + sparkle.delay,
        sparkle.duration,
        sparkle.volume,
        'sine',
        output,
      )
    }
  }

  private createEffectOutput(context: AudioContext) {
    const masterGain = this.masterGain
    if (!masterGain) throw new Error('Audio output is not available.')

    const now = context.currentTime
    if (this.effectGain) {
      const previousGain = this.effectGain
      previousGain.gain.cancelScheduledValues(now)
      previousGain.gain.setTargetAtTime(0.0001, now, 0.025)
      setTimeout(() => previousGain.disconnect(), 250)
    }

    const effectGain = context.createGain()
    effectGain.connect(masterGain)
    this.effectGain = effectGain
    return effectGain
  }

  private getContext() {
    if (this.context && this.masterGain) return this.context
    if (typeof window.AudioContext === 'undefined') {
      throw new Error('Web Audio is not supported by this browser.')
    }

    const context = new window.AudioContext()
    const masterGain = context.createGain()
    masterGain.gain.value = 0.0001
    masterGain.connect(context.destination)
    this.context = context
    this.masterGain = masterGain
    return context
  }

  private getActiveContext() {
    if (!this.enabled || !this.context || this.context.state !== 'running') return null
    return this.context
  }

  private startAmbience() {
    if (this.ambienceTimer) return

    const melody = [
      587.33, 698.46, 880, 1046.5,
      880, 783.99, 698.46, 587.33,
      659.25, 783.99, 987.77, 1174.66,
      987.77, 880, 783.99, 659.25,
    ]
    const chords = [
      [293.66, 369.99, 440],
      [246.94, 293.66, 369.99],
      [196, 246.94, 293.66],
      [220, 329.63, 329.63],
    ]
    const playNextNote = () => {
      const context = this.getActiveContext()
      if (!context) return

      const step = this.ambienceStep % melody.length
      const now = context.currentTime + 0.04
      this.playAmbientNote(context, melody[step], now, 0.62, 0.048 * ambienceVolume)
      if (step % 2 === 0) {
        this.playAmbientNote(context, melody[step] * 2, now + 0.08, 0.46, 0.012 * ambienceVolume)
      }
      if (step % 4 === 0) {
        for (const frequency of chords[Math.floor(step / 4)]) {
          this.playAmbientNote(context, frequency, now, 2.85, 0.014 * ambienceVolume)
        }
      }
      this.ambienceStep += 1
    }

    playNextNote()
    this.ambienceTimer = setInterval(playNextNote, 520)
  }

  private playAmbientNote(
    context: AudioContext,
    frequency: number,
    start: number,
    duration: number,
    volume: number,
  ) {
    const masterGain = this.masterGain
    if (!masterGain) return

    const oscillator = context.createOscillator()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(frequency * 3, 2400), start)
    filter.Q.setValueAtTime(0.45, start)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.045)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(filter)
    filter.connect(envelope)
    envelope.connect(masterGain)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      filter.disconnect()
      envelope.disconnect()
    }, { once: true })
  }

  private playTone(
    context: AudioContext,
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    waveform: OscillatorType,
    output?: AudioNode,
  ) {
    const destination = output ?? this.masterGain
    if (!destination) return

    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    oscillator.type = waveform
    oscillator.frequency.setValueAtTime(frequency, start)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.08)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(envelope)
    envelope.connect(destination)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      envelope.disconnect()
    }, { once: true })
  }

  private playSweep(context: AudioContext, start: number, duration: number, output: AudioNode) {

    const oscillator = context.createOscillator()
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(150, start)
    oscillator.frequency.exponentialRampToValueAtTime(660, start + duration * 0.82)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(360, start)
    filter.frequency.exponentialRampToValueAtTime(2200, start + duration * 0.85)
    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.exponentialRampToValueAtTime(0.12, start + 0.16)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(filter)
    filter.connect(envelope)
    envelope.connect(output)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.03)
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      filter.disconnect()
      envelope.disconnect()
    }, { once: true })
  }
}
