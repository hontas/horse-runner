import { GameObject, GameState } from '../types/gameTypes'
import { GROUND_Y } from '../constants/gameConstants'
import { soundSystem } from '../utils/soundSystem'
import { particleSystem } from '../utils/particleSystem'

/**
 * Terrain object generators
 */
export class TerrainObjects {
  /**
   * Generate a platform at specified level
   */
  static generatePlatform(spawnX: number, level: number): GameObject {
    const platformWidth = 40 + Math.random() * 100 // 40-140px wide
    const platformHeight = 40 * level // Height based on level
    
    return {
      x: spawnX,
      y: GROUND_Y - platformHeight,
      width: platformWidth,
      height: platformHeight,
      type: 'platform',
      platformLevel: level,
      isRideable: true,
    }
  }

  /**
   * Generate a floating platform
   */
  static generateFloatingPlatform(spawnX: number): GameObject {
    const platformWidth = 60 + Math.random() * 80 // 60-140px wide
    const level = 1 + Math.floor(Math.random() * 3) // Random level 1-3
    const baseHeight = 40 * level
    const floatingHeight = baseHeight + 20 + Math.random() * 30 // Extra height for floating
    
    return {
      x: spawnX,
      y: GROUND_Y - floatingHeight,
      width: platformWidth,
      height: 25, // Thinner than ground platforms for floating effect
      type: 'floatingPlatform',
      platformLevel: level,
      isRideable: true,
    }
  }

  /**
   * Generate a ramp
   */
  static generateRamp(spawnX: number): GameObject {
    const rampWidth = 80 + Math.random() * 40 // 80-120px wide
    const rampHeight = 20 + Math.random() * 20 // 20-40px high
    
    return {
      x: spawnX,
      y: GROUND_Y - rampHeight,
      width: rampWidth,
      height: rampHeight,
      type: 'ramp',
      isRideable: true,
      rampSlope: rampHeight / rampWidth, // Store the slope ratio
    }
  }

  /**
   * Generate a bridge
   */
  static generateBridge(spawnX: number): GameObject {
    const bridgeWidth = 100 + Math.random() * 60 // 100-160px wide
    const bridgeHeight = 15 // Thin bridge
    const bridgeY = GROUND_Y - 40 - Math.random() * 30 // Elevated above ground
    
    return {
      x: spawnX,
      y: bridgeY,
      width: bridgeWidth,
      height: bridgeHeight,
      type: 'bridge',
      isRideable: true,
    }
  }

  /**
   * Generate a log pile obstacle
   */
  static generateLogPile(spawnX: number): GameObject {
    const logWidth = 70 + Math.random() * 30 // 70-100px wide
    const logHeight = 25 + Math.random() * 15 // 25-40px high
    
    return {
      x: spawnX,
      y: GROUND_Y - logHeight,
      width: logWidth,
      height: logHeight,
      type: 'logPile',
    }
  }
}

/**
 * Terrain rendering functions
 */
export class TerrainRenderer {
  /**
   * Draw platform terrain
   */
  static drawPlatform(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    const level = obj.platformLevel || 1
    const colors = ['#8B7D6B', '#A0522D', '#CD853F'] // Different shades for different levels

    // Main platform body
    ctx.fillStyle = colors[(level - 1) % colors.length]
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

    // Platform top (grass-like)
    ctx.fillStyle = '#9ACD32'
    ctx.fillRect(obj.x, obj.y, obj.width, 6)

    // Platform edge/wall definition
    ctx.fillStyle = '#696969'
    ctx.fillRect(obj.x, obj.y, 3, obj.height) // Left edge
    ctx.fillRect(obj.x + obj.width - 3, obj.y, 3, obj.height) // Right edge
  }

  /**
   * Draw floating platform terrain
   */
  static drawFloatingPlatform(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    // Use same colors as regular platforms but slightly lighter for floating effect
    const colors = ['#A0938B', '#B0622D', '#DD953F'] // Slightly lighter shades
    const level = obj.platformLevel || 1

    // Main platform body
    ctx.fillStyle = colors[(level - 1) % colors.length]
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

    // Platform top (grass-like)
    ctx.fillStyle = '#9ACD32'
    ctx.fillRect(obj.x, obj.y, obj.width, 6)

    // Platform edge/wall definition
    ctx.fillStyle = '#696969'
    ctx.fillRect(obj.x, obj.y, 3, obj.height) // Left edge
    ctx.fillRect(obj.x + obj.width - 3, obj.y, 3, obj.height) // Right edge

    // Add subtle shadow beneath for floating effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(obj.x + 2, obj.y + obj.height + 2, obj.width - 4, 6)
  }

  /**
   * Draw sloped ramp terrain
   */
  static drawRamp(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    // Main ramp body - more distinct brown
    ctx.fillStyle = '#CD853F' // Peru color - more visible
    
    // Draw ramp as a triangle/slope
    ctx.beginPath()
    ctx.moveTo(obj.x, obj.y + obj.height) // Bottom left
    ctx.lineTo(obj.x + obj.width, obj.y + obj.height) // Bottom right
    ctx.lineTo(obj.x + obj.width, obj.y) // Top right
    ctx.closePath()
    ctx.fill()
    
    // Darker shadow side
    ctx.fillStyle = '#A0522D' // Sienna - darker
    ctx.beginPath()
    ctx.moveTo(obj.x, obj.y + obj.height) // Bottom left
    ctx.lineTo(obj.x + 8, obj.y + obj.height - 8) // Shadow edge
    ctx.lineTo(obj.x + obj.width, obj.y) // Top right
    ctx.closePath()
    ctx.fill()
    
    // Bright grass on top of ramp
    ctx.fillStyle = '#32CD32' // Lime green - more visible
    ctx.beginPath()
    ctx.moveTo(obj.x, obj.y + obj.height) // Bottom left
    ctx.lineTo(obj.x + obj.width, obj.y) // Top right
    ctx.lineTo(obj.x + obj.width, obj.y + 8) // Thicker grass
    ctx.lineTo(obj.x + 8, obj.y + obj.height) // Grass edge
    ctx.closePath()
    ctx.fill()
  }

  /**
   * Draw wooden bridge
   */
  static drawBridge(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    // Bridge deck - wooden planks
    ctx.fillStyle = '#D2B48C'
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
    
    // Wooden plank lines
    ctx.fillStyle = '#CD853F'
    for (let i = 0; i < obj.width; i += 15) {
      ctx.fillRect(obj.x + i, obj.y, 2, obj.height)
    }
    
    // Bridge supports underneath
    ctx.fillStyle = '#A0522D'
    const supportWidth = 8
    const numSupports = Math.floor(obj.width / 40) + 1
    for (let i = 0; i < numSupports; i++) {
      const supportX = obj.x + (i * obj.width) / (numSupports - 1) - supportWidth / 2
      ctx.fillRect(supportX, obj.y + obj.height, supportWidth, 20)
    }
  }

  /**
   * Draw pile of logs
   */
  static drawLogPile(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    // Draw multiple logs stacked
    const logColors = ['#8B4513', '#A0522D', '#CD853F']
    const numLogs = 3 + Math.floor(obj.width / 30)
    
    for (let i = 0; i < numLogs; i++) {
      const logWidth = 25 + Math.random() * 15
      const logHeight = 12 + Math.random() * 8
      const logX = obj.x + (i * (obj.width - logWidth)) / (numLogs - 1)
      const logY = obj.y + obj.height - logHeight - (i % 2) * 8
      
      // Log body
      ctx.fillStyle = logColors[i % logColors.length]
      ctx.fillRect(logX, logY, logWidth, logHeight)
      
      // Log end rings
      ctx.fillStyle = '#654321'
      ctx.fillRect(logX, logY + 2, logWidth, 2)
      ctx.fillRect(logX, logY + logHeight - 4, logWidth, 2)
      
      // End caps
      ctx.fillStyle = '#F4E4BC'
      ctx.fillRect(logX - 1, logY, 2, logHeight)
      ctx.fillRect(logX + logWidth - 1, logY, 2, logHeight)
    }
  }
}

/**
 * Terrain collision effects
 */
export class TerrainEffects {
  /**
   * Handle platform collision effects (no collision - terrain only)
   */
  static handlePlatformCollision(_gameState: GameState): Partial<GameState> {
    // Platforms don't cause game over, they're just terrain
    return {}
  }

  /**
   * Handle floating platform collision effects (no collision - terrain only)
   */
  static handleFloatingPlatformCollision(_gameState: GameState): Partial<GameState> {
    // Floating platforms don't cause game over, they're just terrain
    return {}
  }

  /**
   * Handle ramp collision effects (no collision - terrain only)
   */
  static handleRampCollision(_gameState: GameState): Partial<GameState> {
    // Ramps are rideable terrain, no collision effect
    return {}
  }

  /**
   * Handle bridge collision effects (no collision - terrain only)
   */
  static handleBridgeCollision(_gameState: GameState): Partial<GameState> {
    // Bridges are rideable terrain, no collision effect
    return {}
  }

  /**
   * Handle log pile collision effects
   */
  static handleLogPileCollision(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}
    
    // Log piles act as low barriers - can duck under or jump over
    if (!gameState.horse.isDucking && !gameState.horse.isJumping) {
      updates.gameRunning = false
      
      soundSystem.playSound('gameOver', 0.8)
      soundSystem.playSound('particleExplosion', 0.6)
      soundSystem.stopBackgroundMusic()
      
      // Create wood chips explosion
      particleSystem.createExplosion(gameState.horse.x + 40, gameState.horse.y + 40, 10, '#8B4513')
    }
    
    return updates
  }
}