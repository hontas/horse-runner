import { GameObject, GameState } from '../types/gameTypes'
import { GROUND_Y } from '../constants/gameConstants'
import * as colors from '../constants/colors'

/**
 * Terrain object generators
 */
export class TerrainObjects {
  /**
   * Generate a platform at specified level
   */
  static generatePlatform(spawnX: number, level: number): GameObject {
    const platformWidth = 40 + Math.random() * 150 // 40-190px wide
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
    const platformWidth = 60 + Math.random() * 120 // 60-180px wide
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
   * Generate a floating platform with apples on it
   */
  static generateFloatingPlatformWithApples(spawnX: number): GameObject[] {
    const platform = TerrainObjects.generateFloatingPlatform(spawnX)
    const apples: GameObject[] = []

    // Calculate how many apples can fit on the platform (with some padding)
    const appleWidth = 25
    const padding = 15 // Space between apples and from edges
    const availableWidth = platform.width - (padding * 2)
    const numApples = Math.max(1, Math.floor(availableWidth / (appleWidth + padding)))

    // Position apples evenly across the platform
    for (let i = 0; i < numApples; i++) {
      const appleX = platform.x + padding + (i * (availableWidth / numApples)) + (appleWidth / 2)
      const appleY = platform.y - appleWidth - 5 // Position apples just above the platform

      apples.push({
        x: appleX,
        y: appleY,
        width: appleWidth,
        height: appleWidth,
        type: 'fruit',
      })
    }

    return [platform, ...apples]
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
    // const level = obj.platformLevel || 1

    // Main platform body
    ctx.fillStyle = colors.terrain.medium // [(level - 1) % colors.length]
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

    // Platform top (grass-like)
    ctx.fillStyle = colors.grass.light
    ctx.fillRect(obj.x, obj.y, obj.width, 6)

    // Platform edge/wall definition
    ctx.fillStyle = '#696969'
    ctx.fillRect(obj.x, obj.y, 3, obj.height) // Left edge
    ctx.fillRect(obj.x + obj.width - 3, obj.y, 3, obj.height) // Right edge
  }

  /**
   * Draw floating platform terrain
   */
  static drawFloatingPlatform(
    ctx: CanvasRenderingContext2D,
    obj: GameObject
  ): void {
    // Use same colors as regular platforms but slightly lighter for floating effect
    // const level = obj.platformLevel || 1

    // Main platform body
    ctx.fillStyle = colors.terrain.medium // [(level - 1) % colors.length]
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

    // Platform top (grass-like)
    ctx.fillStyle = colors.grass.light
    ctx.fillRect(obj.x, obj.y, obj.width, 6)

    // Platform edge/wall definition
    ctx.fillStyle = '#696969'
    ctx.fillRect(obj.x, obj.y, 3, obj.height) // Left edge
    ctx.fillRect(obj.x + obj.width - 3, obj.y, 3, obj.height) // Right edge

    // Add subtle shadow beneath for floating effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(obj.x + 2, obj.y + obj.height + 2, obj.width - 4, 6)
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
  static handleFloatingPlatformCollision(
    _gameState: GameState
  ): Partial<GameState> {
    // Floating platforms don't cause game over, they're just terrain
    return {}
  }
}
