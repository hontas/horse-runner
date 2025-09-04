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

  createExplosion(x: number, y: number, particleCount: number = 8, color: string = '#FF6B35'): void {
    const emitter: ParticleEmitter = {
      x,
      y,
      particles: [],
      isActive: true,
      type: 'explosion'
    }

    // Create particles in all directions
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
      const speed = 3 + Math.random() * 4
      
      emitter.particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0,
        maxLife: 30 + Math.random() * 20, // 30-50 frames
        size: 3 + Math.random() * 4,
        color,
        gravity: 0.1,
        fadeOut: true
      })
    }

    this.addEmitter(emitter)
  }

  createWaterSplash(x: number, y: number): void {
    const emitter: ParticleEmitter = {
      x,
      y,
      particles: [],
      isActive: true,
      type: 'splash'
    }

    // Create water droplets
    const particleCount = 12
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.6 // Upward arc
      const speed = 2 + Math.random() * 5
      
      emitter.particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.7 ? '#4A90E2' : '#87CEEB', // Blue water colors
        gravity: 0.15,
        fadeOut: true
      })
    }

    this.addEmitter(emitter)
  }

  createSparkleEffect(x: number, y: number): void {
    const emitter: ParticleEmitter = {
      x,
      y,
      particles: [],
      isActive: true,
      type: 'sparkle'
    }

    // Create sparkly particles for collectibles
    const particleCount = 6
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 2
      
      emitter.particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed - 1, // Slight upward bias
        life: 0,
        maxLife: 25 + Math.random() * 15,
        size: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#FFD700' : '#FFF8DC', // Gold colors
        gravity: 0.05,
        fadeOut: true
      })
    }

    this.addEmitter(emitter)
  }

  createDustCloud(x: number, y: number): void {
    const emitter: ParticleEmitter = {
      x,
      y,
      particles: [],
      isActive: true,
      type: 'dust'
    }

    // Create dust particles for wall hits
    const particleCount = 10
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8
      const speed = 1 + Math.random() * 3
      
      emitter.particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0,
        maxLife: 35 + Math.random() * 25,
        size: 3 + Math.random() * 5,
        color: Math.random() < 0.6 ? '#D2B48C' : '#DEB887', // Tan/beige dust colors
        gravity: 0.02,
        fadeOut: true
      })
    }

    this.addEmitter(emitter)
  }

  createCollectEffect(x: number, y: number, color: string = '#32CD32'): void {
    const emitter: ParticleEmitter = {
      x,
      y,
      particles: [],
      isActive: true,
      type: 'collect'
    }

    // Create upward floating particles for collectibles
    const particleCount = 8
    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.4 // Upward cone
      const speed = 1 + Math.random() * 2
      
      emitter.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        color,
        gravity: -0.02, // Negative gravity for floating effect
        fadeOut: true
      })
    }

    this.addEmitter(emitter)
  }

  update(): void {
    this.emitters = this.emitters.filter(emitter => {
      // Update all particles in this emitter
      emitter.particles = emitter.particles.filter(particle => {
        particle.life++
        
        // Update position
        particle.x += particle.velocityX
        particle.y += particle.velocityY
        
        // Apply gravity
        particle.velocityY += particle.gravity
        
        // Apply air resistance
        particle.velocityX *= 0.98
        particle.velocityY *= 0.98
        
        // Remove dead particles
        return particle.life < particle.maxLife
      })
      
      // Remove empty emitters
      if (emitter.particles.length === 0) {
        emitter.isActive = false
        return false
      }
      
      return true
    })
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.emitters.forEach(emitter => {
      emitter.particles.forEach(particle => {
        const alpha = particle.fadeOut 
          ? 1 - (particle.life / particle.maxLife)
          : 0.8
        
        ctx.save()
        ctx.globalAlpha = alpha
        
        // Draw particle based on type
        if (emitter.type === 'sparkle') {
          // Draw sparkle as a star shape
          this.drawStar(ctx, particle.x, particle.y, particle.size, particle.color)
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

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    
    ctx.beginPath()
    // Simple 4-pointed star
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size/2, y - size/2)
    ctx.lineTo(x + size, y)
    ctx.lineTo(x + size/2, y + size/2)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x - size/2, y + size/2)
    ctx.lineTo(x - size, y)
    ctx.lineTo(x - size/2, y - size/2)
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
    this.emitters = []
  }

  getActiveParticleCount(): number {
    return this.emitters.reduce((total, emitter) => total + emitter.particles.length, 0)
  }
}

// Export a singleton instance
export const particleSystem = new ParticleSystem()