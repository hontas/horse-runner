import { GameObject, GameState } from '../types/gameTypes'
import { ObjectSpawner } from './objectSpawner'
import { CollectibleEffects } from '../objects/collectibles'
import { ObstacleEffects } from '../objects/obstacles'
import { TerrainEffects } from '../objects/terrain'
import {
  GAME_WIDTH,
  GROUND_Y,
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
    const newObjects = objectSpawner.generateObjects(spawnX, speedFactor)
    
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
  obj: GameObject
): Partial<GameState> => {
  switch (obj.type) {
    // Collectibles
    case 'fruit':
      return CollectibleEffects.handleFruitCollection(gameState)
    case 'star':
      return CollectibleEffects.handleStarCollection(gameState)
    case 'key':
      return CollectibleEffects.handleKeyCollection(gameState)
    case 'mushroom':
      return CollectibleEffects.handleMushroomCollection(gameState)

    // Obstacles
    case 'waterHole':
      return ObstacleEffects.handleWaterHoleCollision(gameState)
    case 'lowBarrier':
      return ObstacleEffects.handleLowBarrierCollision(gameState)
    case 'highBarrier':
      return ObstacleEffects.handleHighBarrierCollision(gameState)
    case 'obstacle':
      return ObstacleEffects.handleObstacleCollision(gameState)

    // Terrain
    case 'platform':
      return TerrainEffects.handlePlatformCollision(gameState)
    case 'floatingPlatform':
      return TerrainEffects.handleFloatingPlatformCollision(gameState)
    case 'ramp':
      return TerrainEffects.handleRampCollision(gameState)
    case 'bridge':
      return TerrainEffects.handleBridgeCollision(gameState)
    case 'logPile':
      return TerrainEffects.handleLogPileCollision(gameState)

    default:
      return {}
  }
}
