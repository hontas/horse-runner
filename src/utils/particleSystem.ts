export interface Particle {
  x: number
  y: number
  velocityX: number
  velocityY: number
  life: number
  maxLife: number
  size: number
  color: string
  gravity: number
  fadeOut: boolean
}

export interface ParticleEmitter {
  x: number
  y: number
  particles: Particle[]
  isActive: boolean
  type: 'explosion' | 'splash' | 'sparkle' | 'dust' | 'collect'
}

export class ParticleSystem {
  private emitters: ParticleEmitter[] = []
  private maxEmitters = 20

  // Object pools to reuse particles and emitters
  private particlePool: Particle[] = []
  private emitterPool: ParticleEmitter[] = []
  private maxPoolSize = 100

  // Get particle from pool or create new one
  private getParticle(): Particle {
    return (
      this.particlePool.pop() || {
        x: 0,
        y: 0,
        velocityX: 0,
        velocityY: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        color: '',
        gravity: 0,
        fadeOut: true,
      }
    )
  }

  // Return particle to pool
  private returnParticle(particle: Particle): void {
    if (this.particlePool.length < this.maxPoolSize) {
      this.particlePool.push(particle)
    }
  }

  // Get emitter from pool or create new one
  private getEmitter(): ParticleEmitter {
    return (
      this.emitterPool.pop() || {
        x: 0,
        y: 0,
        particles: [],
        isActive: false,
        type: 'explosion',
      }
    )
  }

  // Return emitter to pool
  private returnEmitter(emitter: ParticleEmitter): void {
    if (this.emitterPool.length < this.maxPoolSize) {
      emitter.particles.length = 0 // Clear particles array
      this.emitterPool.push(emitter)
    }
  }

  createExplosion(
    x: number,
    y: number,
    particleCount: number = 8,
    color: string = '#FF6B35'
  ): void {
    const emitter = this.getEmitter()
    emitter.x = x
    emitter.y = y
    emitter.isActive = true
    emitter.type = 'explosion'

    // Create particles in all directions using pooled objects
    for (let i = 0; i < particleCount; i++) {
      const angle =
        (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
      const speed = 3 + Math.random() * 4

      const particle = this.getParticle()
      particle.x = x
      particle.y = y
      particle.velocityX = Math.cos(angle) * speed
      particle.velocityY = Math.sin(angle) * speed
      particle.life = 0
      particle.maxLife = 30 + Math.random() * 20 // 30-50 frames
      particle.size = 3 + Math.random() * 4
      particle.color = color
      particle.gravity = 0.1
      particle.fadeOut = true

      emitter.particles.push(particle)
    }

    this.addEmitter(emitter)
  }

  // Helper method to create particles efficiently
  private createParticleGroup(
    x: number,
    y: number,
    type: ParticleEmitter['type'],
    particleCount: number,
    particleConfig: (i: number) => Partial<Particle>
  ): void {
    const emitter = this.getEmitter()
    emitter.x = x
    emitter.y = y
    emitter.isActive = true
    emitter.type = type

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticle()
      const config = particleConfig(i)

      particle.x = config.x ?? x
      particle.y = config.y ?? y
      particle.velocityX = config.velocityX ?? 0
      particle.velocityY = config.velocityY ?? 0
      particle.life = 0
      particle.maxLife = config.maxLife ?? 30
      particle.size = config.size ?? 2
      particle.color = config.color ?? '#FFFFFF'
      particle.gravity = config.gravity ?? 0.1
      particle.fadeOut = config.fadeOut ?? true

      emitter.particles.push(particle)
    }

    this.addEmitter(emitter)
  }

  createWaterSplash(x: number, y: number): void {
    this.createParticleGroup(x, y, 'splash', 12, (_i) => {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.6 // Upward arc
      const speed = 2 + Math.random() * 5

      return {
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        maxLife: 40 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.7 ? '#4A90E2' : '#87CEEB', // Blue water colors
        gravity: 0.15,
      }
    })
  }

  createSparkleEffect(x: number, y: number): void {
    this.createParticleGroup(x, y, 'sparkle', 6, (_i) => {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2

      return {
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 1, // Slight upward bias
        maxLife: 25 + Math.random() * 15,
        size: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#FFD700' : '#FFF8DC', // Gold colors
        gravity: 0.05,
      }
    })
  }

  createDustCloud(x: number, y: number): void {
    this.createParticleGroup(x, y, 'dust', 10, (_i) => {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8
      const speed = 1 + Math.random() * 3

      return {
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        maxLife: 35 + Math.random() * 25,
        size: 3 + Math.random() * 5,
        color: Math.random() < 0.6 ? '#D2B48C' : '#DEB887', // Tan/beige dust colors
        gravity: 0.02,
      }
    })
  }

  createCollectEffect(x: number, y: number, color: string = '#32CD32'): void {
    this.createParticleGroup(x, y, 'collect', 8, (_i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.4 // Upward cone
      const speed = 1 + Math.random() * 2

      return {
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        maxLife: 30 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        color,
        gravity: -0.02, // Negative gravity for floating effect
      }
    })
  }

  update(): void {
    // Use reverse iteration to safely remove emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i]

      // Update particles in this emitter
      for (let j = emitter.particles.length - 1; j >= 0; j--) {
        const particle = emitter.particles[j]

        particle.life++

        // Update position
        particle.x += particle.velocityX
        particle.y += particle.velocityY

        // Apply gravity
        particle.velocityY += particle.gravity

        // Apply air resistance
        particle.velocityX *= 0.98
        particle.velocityY *= 0.98

        // Remove dead particles and return to pool
        if (particle.life >= particle.maxLife) {
          emitter.particles.splice(j, 1)
          this.returnParticle(particle)
        }
      }

      // Remove empty emitters and return to pool
      if (emitter.particles.length === 0) {
        emitter.isActive = false
        this.emitters.splice(i, 1)
        this.returnEmitter(emitter)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.emitters.forEach((emitter) => {
      emitter.particles.forEach((particle) => {
        const alpha = particle.fadeOut
          ? 1 - particle.life / particle.maxLife
          : 0.8

        ctx.save()
        ctx.globalAlpha = alpha

        // Draw particle based on type
        if (emitter.type === 'sparkle') {
          // Draw sparkle as a star shape
          this.drawStar(
            ctx,
            particle.x,
            particle.y,
            particle.size,
            particle.color
          )
        } else {
          // Draw as circle
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })
    })
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 1

    ctx.beginPath()
    // Simple 4-pointed star
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size / 2, y - size / 2)
    ctx.lineTo(x + size, y)
    ctx.lineTo(x + size / 2, y + size / 2)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x - size / 2, y + size / 2)
    ctx.lineTo(x - size, y)
    ctx.lineTo(x - size / 2, y - size / 2)
    ctx.closePath()

    ctx.fill()
    ctx.stroke()
  }

  private addEmitter(emitter: ParticleEmitter): void {
    this.emitters.push(emitter)

    // Keep only the most recent emitters
    if (this.emitters.length > this.maxEmitters) {
      this.emitters.shift()
    }
  }

  clear(): void {
    // Return all particles and emitters to pools
    this.emitters.forEach((emitter) => {
      emitter.particles.forEach((particle) => {
        this.returnParticle(particle)
      })
      this.returnEmitter(emitter)
    })
    this.emitters = []
  }

  getActiveParticleCount(): number {
    return this.emitters.reduce(
      (total, emitter) => total + emitter.particles.length,
      0
    )
  }
}

// Export a singleton instance
export const particleSystem = new ParticleSystem()
