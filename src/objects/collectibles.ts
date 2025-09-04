import { GameObject, GameState } from '../types/gameTypes'
import { GROUND_Y, EMOJI_SIZE_BONUS } from '../constants/gameConstants'
import { soundSystem } from '../utils/soundSystem'
import { particleSystem } from '../utils/particleSystem'

/**
 * Base interface for collectible objects
 */
export interface CollectibleConfig {
  x: number
  points: number
  speedBoostAmount?: number
  heightVariation?: 'low' | 'mid' | 'high' | 'floating'
}

/**
 * Collectible object generators
 */
export class CollectibleObjects {
  /**
   * Generate a fruit (apple) collectible
   */
  static generateFruit(spawnX: number): GameObject {
    const fruitHeightRand = Math.random()
    let fruitY: number

    if (fruitHeightRand < 0.3) {
      // Low fruit - can be collected while ducking (10-25px above ground)
      fruitY = GROUND_Y - 25 - Math.random() * 15
    } else if (fruitHeightRand < 0.7) {
      // Mid fruit - normal running height (25-45px above ground)  
      fruitY = GROUND_Y - 45 - Math.random() * 20
    } else {
      // High fruit - requires jumping (45-80px above ground)
      fruitY = GROUND_Y - 80 - Math.random() * 35
    }

    return {
      x: spawnX,
      y: fruitY,
      width: 25,
      height: 25,
      type: 'fruit',
    }
  }

  /**
   * Generate a star collectible
   */
  static generateStar(spawnX: number): GameObject {
    // Stars are usually floating higher up
    const starY = GROUND_Y - 60 - Math.random() * 40

    return {
      x: spawnX,
      y: starY,
      width: 30,
      height: 30,
      type: 'star',
    }
  }

  /**
   * Generate a key collectible
   */
  static generateKey(spawnX: number): GameObject {
    // Keys at mid-level height
    const keyY = GROUND_Y - 35 - Math.random() * 20

    return {
      x: spawnX,
      y: keyY,
      width: 20,
      height: 20,
      type: 'key',
    }
  }

  /**
   * Generate a mushroom (negative collectible)
   */
  static generateMushroom(spawnX: number): GameObject {
    // Mushrooms grow on ground level
    const mushroomY = GROUND_Y - 25 - Math.random() * 10

    return {
      x: spawnX,
      y: mushroomY,
      width: 25,
      height: 25,
      type: 'mushroom',
    }
  }
}

/**
 * Collectible rendering functions
 */
export class CollectibleRenderer {
  /**
   * Draw a fruit (apple) collectible
   */
  static drawFruit(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    ctx.font = `${obj.height + EMOJI_SIZE_BONUS.fruit}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🍎', obj.x + obj.width / 2, obj.y + obj.height / 2)
  }

  /**
   * Draw a star collectible
   */
  static drawStar(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    ctx.font = `${obj.height + EMOJI_SIZE_BONUS.star}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⭐', obj.x + obj.width / 2, obj.y + obj.height / 2)
  }

  /**
   * Draw a key collectible
   */
  static drawKey(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    ctx.font = `${obj.height + EMOJI_SIZE_BONUS.key}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🗝️', obj.x + obj.width / 2, obj.y + obj.height / 2)
  }

  /**
   * Draw a mushroom collectible
   */
  static drawMushroom(ctx: CanvasRenderingContext2D, obj: GameObject): void {
    ctx.font = `${obj.height + EMOJI_SIZE_BONUS.mushroom}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🍄', obj.x + obj.width / 2, obj.y + obj.height / 2)
  }
}

/**
 * Collectible collision effects
 */
export class CollectibleEffects {
  /**
   * Handle fruit collection effects
   */
  static handleFruitCollection(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}
    
    updates.score = gameState.score + 10
    // Fixed speed boost amount - no longer scales with speed factor
    const boostAmount = 0.6 // FRUIT_SPEED_BOOST_BASE
    updates.speedBoost = Math.min(2.5, gameState.speedBoost + boostAmount) // FRUIT_SPEED_BOOST_MAX
    
    soundSystem.playSound('collect', 0.6)
    if (updates.speedBoost && updates.speedBoost > 0) {
      soundSystem.playSound('speedBoost', 0.4)
    }
    
    // Create red collect particle effect for apples
    particleSystem.createCollectEffect(gameState.horse.x + 40, gameState.horse.y + 40, '#FF6B47')
    
    return updates
  }

  /**
   * Handle star collection effects
   */
  static handleStarCollection(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}
    
    updates.score = gameState.score + 50
    
    soundSystem.playSound('star', 0.8)
    // Create golden sparkle effect
    particleSystem.createSparkleEffect(gameState.horse.x + 40, gameState.horse.y + 40)
    
    return updates
  }

  /**
   * Handle key collection effects
   */
  static handleKeyCollection(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}
    
    updates.keys = gameState.keys + 1
    updates.score = gameState.score + 25
    
    soundSystem.playSound('collect', 0.7)
    // Create yellow collect particle effect
    particleSystem.createCollectEffect(gameState.horse.x + 40, gameState.horse.y + 40, '#FFD700')
    
    return updates
  }

  /**
   * Handle mushroom collection effects
   */
  static handleMushroomCollection(gameState: GameState): Partial<GameState> {
    const updates: Partial<GameState> = {}
    
    // No score - mushrooms are purely negative
    // Fixed speed reduction - no longer scales with speed factor
    updates.speedBoost = Math.max(-2.0, gameState.speedBoost - 0.4) // MUSHROOM_SPEED_REDUCTION
    
    soundSystem.playSound('collect', 0.4) // Quieter sound to indicate it's not as good as fruit
    // Create purple negative effect
    particleSystem.createCollectEffect(gameState.horse.x + 40, gameState.horse.y + 40, '#8B008B')
    
    return updates
  }
}