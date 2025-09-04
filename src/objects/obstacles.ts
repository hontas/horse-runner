import { GameObject, GameState } from '../types/gameTypes'
import { GROUND_Y, EMOJI_SIZE_BONUS } from '../constants/gameConstants'
import { soundSystem } from '../utils/soundSystem'
import { particleSystem } from '../utils/particleSystem'

/**
 * Obstacle object generators
 */
export class ObstacleObjects {
  /**
   * Generate a water hole obstacle
   */
  static generateWaterHole(spawnX: number): GameObject {
    const waterHoleWidth = 60 + Math.random() * 30 // 60-90px wide
    const waterHoleHeight = 100

    return {
      x: spawnX,
      y: GROUND_Y, // Deep pit extending below ground
      width: waterHoleWidth,
      height: waterHoleHeight, // Full depth to bottom of screen
      type: 'waterHole',
    }
  }

  /**
   * Generate a low barrier obstacle (can be ducked under)
   */
  static generateLowBarrier(spawnX: number): GameObject {
    const barrierWidth = 20 + Math.random() * 20 // 20-40px wide
    const barrierHeight = 30 + Math.random() * 15 // 30-45px high

    return {
      x: spawnX,
      y: GROUND_Y - barrierHeight,
      width: barrierWidth,
      height: barrierHeight,
      type: 'lowBarrier',
    }
  }

  /**
   * Generate a high barrier obstacle (must be jumped over)
   */
  static generateHighBarrier(spawnX: number): GameObject {
    const barrierWidth = 15 + Math.random() * 15 // 15-30px wide
    const barrierHeight = 60 + Math.random() * 20 // 60-80px high

    return {
      x: spawnX,
      y: GROUND_Y - barrierHeight,
      width: barrierWidth,
      height: barrierHeight,
      type: 'highBarrier',
    }
  }

  /**
   * Generate a traditional wall obstacle
   */
  static generateObstacle(spawnX: number): GameObject {
    const obstacleWidth = 20 + Math.random() * 15 // 20-35px wide
    const obstacleHeight = 50 + Math.random() * 20 // 50-70px high

    return {
      x: spawnX,
      y: GROUND_Y - obstacleHeight,
      width: obstacleWidth,
      height: obstacleHeight,
      type: 'obstacle',
    }
  }
}

/**
 * Obstacle rendering functions
 */
export class ObstacleRenderer {
  /**
   * Draw animated water hole
   */
  static drawWaterHole(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    // Dark pit walls/edges
    ctx.fillStyle = '#2C3E50'
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

    // Main water body - fills the entire pit
    ctx.fillStyle = '#1B4F72'
    ctx.fillRect(obj.x + 3, obj.y, obj.width - 6, obj.height)

    // Lighter water in center for depth effect
    ctx.fillStyle = '#2471A3'
    ctx.fillRect(obj.x + 6, obj.y, obj.width - 12, obj.height)

    // Animated water surface at ground level
    const time = Date.now() * 0.003
    const waveOffset1 = Math.sin(time + obj.x * 0.01) * 2
    const waveOffset2 = Math.sin(time * 1.5 + obj.x * 0.01) * 1.5

    // Water surface layers with waves
    ctx.fillStyle = '#3498DB'
    ctx.fillRect(obj.x + 3, obj.y + waveOffset1, obj.width - 6, 8)

    ctx.fillStyle = '#5DADE2'
    ctx.fillRect(obj.x + 6, obj.y + 2 + waveOffset2, obj.width - 12, 4)

    // Bright surface reflection
    ctx.fillStyle = '#AED6F1'
    ctx.fillRect(obj.x + 8, obj.y + 3 + waveOffset1, obj.width - 16, 2)
  }

  /**
   * Draw low barrier (rock)
   */
  static drawLowBarrier(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    ctx.font = `${obj.height + EMOJI_SIZE_BONUS.rock}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🪨', obj.x + obj.width / 2, obj.y + obj.height / 2)
  }

  /**
   * Draw high barrier (stone wall)
   */
  static drawHighBarrier(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    // High barrier - must jump over
    ctx.fillStyle = '#2F4F2F'
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

    // Add some stone texture
    ctx.fillStyle = '#1C1C1C'
    for (let i = 0; i < obj.width; i += 6) {
      for (let j = 0; j < obj.height; j += 6) {
        if ((i + j) % 12 === 0) {
          ctx.fillRect(obj.x + i, obj.y + j, 3, 3)
        }
      }
    }
  }

  /**
   * Draw traditional obstacle (cactus)
   */
  static drawObstacle(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    ctx.font = `${obj.height + EMOJI_SIZE_BONUS.cactus}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🌵', obj.x + obj.width / 2, obj.y + obj.height / 2)
  }
}

/**
 * Obstacle collision effects
 */
export class ObstacleEffects {
  /**
   * Handle water hole collision effects
   */
  static handleWaterHoleCollision(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}

    // Water hole causes drowning
    if (!gameState.horse.isDrowning) {
      const horse = { ...gameState.horse }
      horse.isDrowning = true
      horse.drowningTimer = 0
      updates.horse = horse

      soundSystem.playSound('waterSplash', 0.9)
      // Create water splash effect
      particleSystem.createWaterSplash(
        gameState.horse.x + 40,
        gameState.horse.y + 40
      )
    }

    return updates
  }

  /**
   * Handle low barrier collision effects
   */
  static handleLowBarrierCollision(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}

    // Low barrier only causes game over if not ducking
    if (!gameState.horse.isDucking) {
      updates.gameRunning = false

      soundSystem.playSound('gameOver', 0.8)
      soundSystem.playSound('particleExplosion', 0.6)
      soundSystem.stopBackgroundMusic()

      // Create brown dust explosion for hitting barrier
      particleSystem.createExplosion(
        gameState.horse.x + 40,
        gameState.horse.y + 40,
        10,
        '#8B4513'
      )
    }

    return updates
  }

  /**
   * Handle high barrier collision effects
   */
  static handleHighBarrierCollision(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}

    // High barriers always cause game over
    updates.gameRunning = false

    soundSystem.playSound('gameOver', 0.8)
    soundSystem.playSound('particleExplosion', 0.6)
    soundSystem.stopBackgroundMusic()

    // Create red explosion effect
    particleSystem.createExplosion(
      gameState.horse.x + 40,
      gameState.horse.y + 40,
      12,
      '#FF4444'
    )

    return updates
  }

  /**
   * Handle traditional obstacle collision effects
   */
  static handleObstacleCollision(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}

    // Traditional obstacles always cause game over
    updates.gameRunning = false

    soundSystem.playSound('gameOver', 0.8)
    soundSystem.playSound('particleExplosion', 0.6)
    soundSystem.stopBackgroundMusic()

    // Create red explosion effect
    particleSystem.createExplosion(
      gameState.horse.x + 40,
      gameState.horse.y + 40,
      12,
      '#FF4444'
    )

    return updates
  }
}
