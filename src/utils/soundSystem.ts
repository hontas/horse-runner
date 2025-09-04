class SoundSystem {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private isEnabled = true
  private musicSource: AudioBufferSourceNode | null = null
  private musicGainNode: GainNode | null = null

  constructor() {
    this.initializeAudioContext()
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioContext })
          .webkitAudioContext)()
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      this.isEnabled = false
    }
  }

  private async generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    envelope?: {
      attack?: number
      decay?: number
      sustain?: number
      release?: number
    }
  ): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not available')

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    // Default ADSR envelope
    const adsr = {
      attack: envelope?.attack || 0.1,
      decay: envelope?.decay || 0.1,
      sustain: envelope?.sustain || 0.3,
      release: envelope?.release || 0.5,
    }

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const progress = i / length

      // Generate base waveform
      let sample = 0
      if (type === 'sine') {
        sample = Math.sin(2 * Math.PI * frequency * t)
      } else if (type === 'square') {
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
      } else if (type === 'sawtooth') {
        sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
      } else if (type === 'triangle') {
        const phase = (t * frequency) % 1
        sample = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase
      }

      // Apply ADSR envelope
      let amplitude = 1
      if (progress < adsr.attack) {
        amplitude = progress / adsr.attack
      } else if (progress < adsr.attack + adsr.decay) {
        const decayProgress = (progress - adsr.attack) / adsr.decay
        amplitude = 1 - decayProgress * (1 - adsr.sustain)
      } else if (progress < 1 - adsr.release) {
        amplitude = adsr.sustain
      } else {
        const releaseProgress = (progress - (1 - adsr.release)) / adsr.release
        amplitude = adsr.sustain * (1 - releaseProgress)
      }

      data[i] = sample * amplitude * 0.3 // Reduce overall volume
    }

    return buffer
  }

  private async generateNoiseBuffer(
    duration: number,
    _filterFreq?: number
  ): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not available')

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate white noise
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1
    }

    return buffer
  }

  private async generateBackgroundMusic() {
    if (!this.audioContext) return

    const duration = 8 // 8 second loop
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    // Simple chord progression: C - Am - F - G
    const chords = [
      [261.63, 329.63, 392.0], // C major
      [220.0, 261.63, 329.63], // A minor
      [174.61, 220.0, 261.63], // F major
      [196.0, 246.94, 293.66], // G major
    ]

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const chordIndex = Math.floor((t / duration) * 4) % 4
      const chord = chords[chordIndex]

      let sample = 0
      // Add each note in the chord
      chord.forEach((freq) => {
        sample += Math.sin(2 * Math.PI * freq * t) * 0.1
        // Add some harmonics for richness
        sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.02
      })

      // Add a gentle envelope to smooth transitions
      const chordProgress = ((t / duration) * 4) % 1
      const envelope = 0.5 + 0.5 * Math.sin(Math.PI * chordProgress)

      data[i] = sample * envelope * 0.3 // Keep music quiet
    }

    this.sounds.set('backgroundMusic', buffer)
  }

  async initializeSounds() {
    if (!this.audioContext || !this.isEnabled) return

    try {
      // Jump sound - ascending tone
      const jumpBuffer = await this.generateTone(220, 0.3, 'sine', {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 0.2,
      })

      // Add frequency sweep for jump
      const jumpData = jumpBuffer.getChannelData(0)
      for (let i = 0; i < jumpData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const freqSweep = 220 + (440 - 220) * Math.min(t / 0.15, 1) // Sweep from 220Hz to 440Hz
        jumpData[i] =
          Math.sin(2 * Math.PI * freqSweep * t) * 0.3 * (1 - t / 0.3)
      }

      this.sounds.set('jump', jumpBuffer)

      // Collect fruit sound - pleasant chime
      const collectBuffer = await this.generateTone(523, 0.4, 'sine', {
        attack: 0.01,
        decay: 0.15,
        sustain: 0.2,
        release: 0.25,
      })
      this.sounds.set('collect', collectBuffer)

      // Star collect sound - higher chime sequence
      const starBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.6,
        this.audioContext.sampleRate
      )
      const starData = starBuffer.getChannelData(0)
      const notes = [523, 659, 784] // C, E, G
      for (let i = 0; i < starData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const noteIndex = Math.floor(t / 0.2)
        const freq = notes[noteIndex] || notes[notes.length - 1]
        const envelope = Math.max(0, 1 - (t % 0.2) / 0.2)
        starData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2
      }
      this.sounds.set('star', starBuffer)

      // Game over sound - descending tone
      const gameOverBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 1.5,
        this.audioContext.sampleRate
      )
      const gameOverData = gameOverBuffer.getChannelData(0)
      for (let i = 0; i < gameOverData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const freq = 440 * Math.pow(0.5, t / 1.5) // Descending frequency
        const envelope = Math.max(0, 1 - t / 1.5)
        gameOverData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
      }
      this.sounds.set('gameOver', gameOverBuffer)

      // Duck sound - low whoosh
      const duckBuffer = await this.generateNoiseBuffer(0.2)
      const duckData = duckBuffer.getChannelData(0)
      for (let i = 0; i < duckData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const envelope = Math.sin((Math.PI * t) / 0.2) // Bell curve envelope
        duckData[i] *= envelope
      }
      this.sounds.set('duck', duckBuffer)

      // Speed boost sound - rising arpeggio
      const boostBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.5,
        this.audioContext.sampleRate
      )
      const boostData = boostBuffer.getChannelData(0)
      const boostNotes = [261, 329, 392, 523] // C, E, G, C octave
      for (let i = 0; i < boostData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const noteIndex = Math.floor(t / 0.125)
        const freq = boostNotes[noteIndex] || boostNotes[boostNotes.length - 1]
        const envelope = Math.max(0, 1 - (t % 0.125) / 0.125)
        boostData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.15
      }
      this.sounds.set('speedBoost', boostBuffer)

      // Water splash sound - noise burst
      const splashBuffer = await this.generateNoiseBuffer(0.8)
      const splashData = splashBuffer.getChannelData(0)
      for (let i = 0; i < splashData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const envelope = Math.exp(-t * 8) // Sharp decay
        splashData[i] *= envelope * 2
      }
      this.sounds.set('waterSplash', splashBuffer)

      // Platform landing sound - solid thump
      const landBuffer = await this.generateTone(120, 0.3, 'sine', {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.1,
      })
      this.sounds.set('platformLand', landBuffer)

      // Platform wall hit sound - bonk
      const wallHitBuffer = this.audioContext.createBuffer(
        1,
        this.audioContext.sampleRate * 0.4,
        this.audioContext.sampleRate
      )
      const wallHitData = wallHitBuffer.getChannelData(0)
      for (let i = 0; i < wallHitData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const freq = 200 * Math.exp(-t * 5) // Quickly decaying frequency
        const envelope = Math.exp(-t * 8) // Sharp decay
        wallHitData[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4
      }
      this.sounds.set('wallHit', wallHitBuffer)

      // Particle explosion sound - sharp burst
      const explosionBuffer = await this.generateNoiseBuffer(0.3)
      const explosionData = explosionBuffer.getChannelData(0)
      for (let i = 0; i < explosionData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const envelope = Math.exp(-t * 12) // Very sharp decay
        explosionData[i] *= envelope * 1.5
      }
      this.sounds.set('particleExplosion', explosionBuffer)

      // Dust cloud sound - soft poof
      const dustBuffer = await this.generateNoiseBuffer(0.4)
      const dustData = dustBuffer.getChannelData(0)
      for (let i = 0; i < dustData.length; i++) {
        const t = i / this.audioContext.sampleRate
        const envelope = Math.exp(-t * 6) // Moderate decay
        dustData[i] *= envelope * 0.8 // Softer than explosion
      }
      this.sounds.set('dustCloud', dustBuffer)

      // Background music - simple chord progression
      await this.generateBackgroundMusic()

      console.log('Sound system initialized successfully')
    } catch (error) {
      console.error('Failed to initialize sounds:', error)
    }
  }

  playSound(soundName: string, volume: number = 1) {
    if (
      !this.audioContext ||
      !this.isEnabled ||
      this.audioContext.state === 'suspended'
    ) {
      return
    }

    const buffer = this.sounds.get(soundName)
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`)
      return
    }

    try {
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      gainNode.gain.value = Math.max(0, Math.min(1, volume))

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start(0)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        console.error('Failed to resume audio context:', error)
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null
  }

  startBackgroundMusic() {
    if (
      !this.audioContext ||
      !this.isEnabled ||
      this.audioContext.state === 'suspended'
    ) {
      return
    }

    const buffer = this.sounds.get('backgroundMusic')
    if (!buffer || this.musicSource) {
      return // Already playing or no music buffer
    }

    try {
      this.musicSource = this.audioContext.createBufferSource()
      this.musicGainNode = this.audioContext.createGain()

      this.musicSource.buffer = buffer
      this.musicSource.loop = true
      this.musicGainNode.gain.value = 0.2 // Quiet background music

      this.musicSource.connect(this.musicGainNode)
      this.musicGainNode.connect(this.audioContext.destination)

      this.musicSource.start(0)
    } catch (error) {
      console.error('Error starting background music:', error)
    }
  }

  stopBackgroundMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop()
        this.musicSource.disconnect()
      } catch (error) {
        console.error('Error stopping background music:', error)
      }
      this.musicSource = null
      this.musicGainNode = null
    }
  }

  setMusicVolume(volume: number) {
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }
}

export const soundSystem = new SoundSystem()
