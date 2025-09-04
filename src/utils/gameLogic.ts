import { GameObject, GameState } from '../types/gameTypes'
import { particleSystem } from './particleSystem'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  PLATFORM_HEIGHT,
  FRUIT_SPEED_BOOST_BASE,
  FRUIT_SPEED_BOOST_MAX,
  MUSHROOM_SPEED_REDUCTION,
  MUSHROOM_SPAWN_CHANCE,
  KEY_SPAWN_CHANCE,
  MIN_OBSTACLE_SPACING,
  MAX_OBSTACLE_SPACING,
} from '../constants/gameConstants'

/**
 * Generate fruit at different heights
 */
const generateFruit = (spawnX: number): GameObject => {
  const fruitHeightRand = Math.random()
  let fruitY: number

  if (fruitHeightRand < 0.3) {
    // Low fruit - can be collected while ducking (10-25px above ground)
    fruitY = GROUND_Y - 10 - Math.random() * 15
  } else if (fruitHeightRand < 0.6) {
    // Medium fruit - can be collected while running normally (25-50px above ground)
    fruitY = GROUND_Y - 25 - Math.random() * 25
  } else {
    // High fruit - requires jumping to collect (50-85px above ground)
    fruitY = GROUND_Y - 50 - Math.random() * 35
  }

  return {
    x: spawnX,
    y: fruitY,
    width: 15,
    height: 15,
    type: 'fruit',
  }
}

/**
 * Generate floating platform - platforms that float in the air
 */
const generateFloatingPlatform = (spawnX: number): GameObject => {
  const platformWidth = 60 + Math.random() * 40 // 60-100px wide
  const floatingHeight = 80 + Math.random() * 60 // 80-140px above ground
  const level = Math.floor(Math.random() * 3) + 1 // Levels 1-3

  return {
    x: spawnX + 100,
    y: GROUND_Y - floatingHeight,
    width: platformWidth,
    height: 25, // Thinner than ground platforms for floating effect
    type: 'floatingPlatform',
    platformLevel: level,
    isRideable: true,
  }
}

/**
 * Generate terrain obstacles and platforms
 */
const generateTerrain = (spawnX: number): GameObject => {
  const terrainRand = Math.random()

  if (terrainRand < 0.12) {
    // Water hole - deep pit filled with water, extends to bottom of screen
    return {
      x: spawnX + 100,
      y: GROUND_Y,
      width: 50,
      height: GAME_HEIGHT - GROUND_Y,
      type: 'waterHole',
      obstacleType: 'waterHole',
    }
  } else if (terrainRand < 0.25) {
    // Low barrier - hangs above ground, can duck under
    return {
      x: spawnX + 100,
      y: GROUND_Y - 50,
      width: 15,
      height: 30,
      type: 'lowBarrier',
      obstacleType: 'lowBarrier',
    }
  } else if (terrainRand < 0.35) {
    // High barrier - must jump over
    return {
      x: spawnX + 100,
      y: GROUND_Y - 60,
      width: 20,
      height: 60,
      type: 'highBarrier',
      obstacleType: 'highBarrier',
    }
  } else if (terrainRand < 0.45) {
    // Traditional wall obstacle
    return {
      x: spawnX + 100,
      y: GROUND_Y - 40,
      width: 20,
      height: 40,
      type: 'obstacle',
      obstacleType: 'wall',
    }
  } else if (terrainRand < 0.6) {
    // Platform level 1 - can be jumped onto
    const platformWidth = 80 + Math.random() * 60 // 80-140px wide
    return {
      x: spawnX + 100,
      y: GROUND_Y - PLATFORM_HEIGHT,
      width: platformWidth,
      height: PLATFORM_HEIGHT,
      type: 'platform',
      platformLevel: 1,
      isRideable: true,
    }
  } else if (terrainRand < 0.75) {
    // Platform level 2 - higher platform
    const platformWidth = 60 + Math.random() * 40 // 60-100px wide
    return {
      x: spawnX + 100,
      y: GROUND_Y - PLATFORM_HEIGHT * 2,
      width: platformWidth,
      height: PLATFORM_HEIGHT * 2,
      type: 'platform',
      platformLevel: 2,
      isRideable: true,
    }
  } else if (terrainRand < 0.88) {
    // Platform level 3 - highest platform
    const platformWidth = 40 + Math.random() * 40 // 40-80px wide
    return {
      x: spawnX + 100,
      y: GROUND_Y - PLATFORM_HEIGHT * 3,
      width: platformWidth,
      height: PLATFORM_HEIGHT * 3,
      type: 'platform',
      platformLevel: 3,
      isRideable: true,
    }
  } else {
    // Floating platform - hovers in the air
    return generateFloatingPlatform(spawnX)
  }
}

/**
 * Generate a star collectible
 */
const generateStar = (spawnX: number): GameObject => ({
  x: spawnX + 50,
  y: GROUND_Y - 70,
  width: 12,
  height: 12,
  type: 'star',
})

/**
 * Generate a mushroom that slows down the horse
 */
const generateMushroom = (spawnX: number): GameObject => {
  // Similar positioning to fruit but slightly different heights
  const mushroomHeightRand = Math.random()
  let mushroomY: number

  if (mushroomHeightRand < 0.4) {
    // Low mushroom - can be collected while running normally (15-35px above ground)
    mushroomY = GROUND_Y - 15 - Math.random() * 20
  } else if (mushroomHeightRand < 0.7) {
    // Medium mushroom - normal running height (35-55px above ground)
    mushroomY = GROUND_Y - 35 - Math.random() * 20
  } else {
    // High mushroom - requires jumping to collect (55-75px above ground)
    mushroomY = GROUND_Y - 55 - Math.random() * 20
  }

  return {
    x: spawnX,
    y: mushroomY,
    width: 15,
    height: 15,
    type: 'mushroom',
  }
}

/**
 * Generate a key that requires jumping to collect
 */
const generateKey = (spawnX: number): GameObject => {
  // Keys are always in the air - horse must jump to get them
  // Position them high enough to require a jump (60-90px above ground)
  const keyY = GROUND_Y - 60 - Math.random() * 30

  return {
    x: spawnX,
    y: keyY,
    width: 16,
    height: 16,
    type: 'key',
  }
}

/**
 * Spawn new game objects when needed
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
    // Generate some new objects with dynamic spacing
    const spawnX = Math.max(rightmostX + spacing, GAME_WIDTH + 50)
    const newObjects: GameObject[] = []

    // Add fruit at different heights
    if (Math.random() < 0.7) {
      newObjects.push(generateFruit(spawnX))
    }

    // Add mushrooms (less frequent than fruit)
    if (Math.random() < MUSHROOM_SPAWN_CHANCE) {
      newObjects.push(generateMushroom(spawnX + 25)) // Slight offset from fruit
    }

    // Add keys (rare, always require jumping)
    if (Math.random() < KEY_SPAWN_CHANCE) {
      newObjects.push(generateKey(spawnX + 50)) // Offset from other collectibles
    }

    // Add platforms and obstacles
    if (Math.random() < 0.5) {
      newObjects.push(generateTerrain(spawnX))
    }

    // Add stars
    if (Math.random() < 0.2) {
      newObjects.push(generateStar(spawnX))
    }

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
      // Progressive speed boost - gets stronger with speed factor
      const boostAmount = FRUIT_SPEED_BOOST_BASE * gameState.speedFactor
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
      // Reduce speed boost - scaled by speed factor for progressive difficulty
      const scaledReduction = MUSHROOM_SPEED_REDUCTION * gameState.speedFactor
      updates.speedBoost = Math.max(
        -1.0,
        gameState.speedBoost - scaledReduction
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
