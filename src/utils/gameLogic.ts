import { GameObject, GameState } from '../types/gameTypes'
import { particleSystem } from './particleSystem'
import { ObjectSpawner } from './objectSpawner'
import {
  GAME_WIDTH,
  GROUND_Y,
  FRUIT_SPEED_BOOST_BASE,
  FRUIT_SPEED_BOOST_MAX,
  MUSHROOM_SPEED_REDUCTION,
  MIN_OBSTACLE_SPACING,
  MAX_OBSTACLE_SPACING,
} from '../constants/gameConstants'

// Create reusable spawner instance
const objectSpawner = new ObjectSpawner()


/**
 * Spawn new game objects when needed using the cleaner object spawner
 */
export const spawnNewObjects = (
  gameObjects: GameObject[],
  speedFactor: number
): GameObject[] => {
  const rightmostX = Math.max(
    ...gameObjects.map((obj) => obj.x),
    GAME_WIDTH - 500 // Default if no objects
  )

  // Calculate spacing based on speed factor - higher speed = more spacing
  const spacing = Math.min(
    MIN_OBSTACLE_SPACING +
      ((speedFactor - 1) * (MAX_OBSTACLE_SPACING - MIN_OBSTACLE_SPACING)) / 2,
    MAX_OBSTACLE_SPACING
  )

  if (rightmostX < GAME_WIDTH + 100) {
    // Generate new objects with dynamic spacing using the weighted spawner
    const spawnX = Math.max(rightmostX + spacing, GAME_WIDTH + 50)
    const newObjects = objectSpawner.generateObjects(spawnX)
    
    return [...gameObjects, ...newObjects]
  }

  return gameObjects
}

/**
 * Create initial game objects
 */
export const createInitialObjects = (): GameObject[] => {
  const initialObjects: GameObject[] = []

  // Add some initial objects
  for (let i = 1; i <= 3; i++) {
    initialObjects.push({
      x: GAME_WIDTH + i * 200,
      y: GROUND_Y - 25,
      width: 15,
      height: 15,
      type: 'fruit',
    })

    if (i % 2 === 0) {
      initialObjects.push({
        x: GAME_WIDTH + i * 200 + 100,
        y: GROUND_Y - 40,
        width: 20,
        height: 40,
        type: 'obstacle',
      })
    }
  }

  return initialObjects
}

/**
 * Handle collision effects and return updated game state
 */
export const handleCollisionEffects = (
  gameState: GameState,
  obj: GameObject,
  soundSystem: {
    playSound: (sound: string, volume: number) => void
    stopBackgroundMusic: () => void
  }
): Partial<GameState> => {
  const updates: Partial<GameState> = {}

  switch (obj.type) {
    case 'fruit': {
      updates.score = gameState.score + 10
      // Fixed speed boost amount - no longer scales with speed factor
      const boostAmount = FRUIT_SPEED_BOOST_BASE
      updates.speedBoost = Math.min(
        FRUIT_SPEED_BOOST_MAX,
        gameState.speedBoost + boostAmount
      )
      soundSystem.playSound('collect', 0.6)
      if (updates.speedBoost && updates.speedBoost > 0) {
        soundSystem.playSound('speedBoost', 0.4)
      }
      // Create red collect particle effect for apples
      particleSystem.createCollectEffect(obj.x + obj.width/2, obj.y + obj.height/2, '#FF6B47')
      break
    }

    case 'star':
      updates.score = gameState.score + 50
      soundSystem.playSound('star', 0.8)
      // Create golden sparkle effect
      particleSystem.createSparkleEffect(obj.x + obj.width/2, obj.y + obj.height/2)
      break

    case 'key':
      updates.keys = gameState.keys + 1
      updates.score = gameState.score + 25
      soundSystem.playSound('collect', 0.7)
      // Create yellow collect particle effect
      particleSystem.createCollectEffect(obj.x + obj.width/2, obj.y + obj.height/2, '#FFD700')
      break

    case 'mushroom': {
      // No score - mushrooms are purely negative
      // Fixed speed reduction - no longer scales with speed factor
      updates.speedBoost = Math.max(
        -2.0, // Allow deeper slowdown but it will recover naturally over time
        gameState.speedBoost - MUSHROOM_SPEED_REDUCTION
      )
      soundSystem.playSound('collect', 0.4) // Quieter sound to indicate it's not as good as fruit
      // Create purple negative effect
      particleSystem.createCollectEffect(obj.x + obj.width/2, obj.y + obj.height/2, '#8B008B')
      break
    }

    case 'obstacle':
    case 'highBarrier':
      // These obstacles always cause game over
      updates.gameRunning = false
      soundSystem.playSound('gameOver', 0.8)
      soundSystem.playSound('particleExplosion', 0.6)
      soundSystem.stopBackgroundMusic()
      // Create red explosion effect
      particleSystem.createExplosion(gameState.horse.x + 40, gameState.horse.y + 40, 12, '#FF4444')
      break

    case 'waterHole':
      // Water hole causes drowning
      if (!gameState.horse.isDrowning) {
        const horse = { ...gameState.horse }
        horse.isDrowning = true
        horse.drowningTimer = 0
        updates.horse = horse
        soundSystem.playSound('waterSplash', 0.9)
        // Create water splash effect
        particleSystem.createWaterSplash(gameState.horse.x + 40, gameState.horse.y + 40)
      }
      break

    case 'lowBarrier':
      // Low barrier only causes game over if not ducking
      if (!gameState.horse.isDucking) {
        updates.gameRunning = false
        soundSystem.playSound('gameOver', 0.8)
        soundSystem.playSound('particleExplosion', 0.6)
        soundSystem.stopBackgroundMusic()
        // Create brown dust explosion for hitting barrier
        particleSystem.createExplosion(gameState.horse.x + 40, gameState.horse.y + 40, 10, '#8B4513')
      }
      break

    case 'platform':
      // Platforms don't cause game over, they're just terrain
      break

    case 'floatingPlatform':
      // Floating platforms don't cause game over, they're just terrain
      break
  }

  return updates
}
