import { GameObject } from '../types/gameTypes'
import {
  GAME_HEIGHT,
  GROUND_Y,
  PLATFORM_HEIGHT,
  MUSHROOM_SPAWN_CHANCE,
  KEY_SPAWN_CHANCE,
} from '../constants/gameConstants'

// Weighted spawn table for easier balancing
interface SpawnEntry {
  type: 'collectible' | 'terrain' | 'obstacle'
  weight: number
  generator: (spawnX: number) => GameObject
}

export class ObjectSpawner {
  private collectibleTable: SpawnEntry[] = [
    {
      type: 'collectible',
      weight: 0.7, // 70% chance for fruit
      generator: (spawnX) => this.generateFruit(spawnX),
    },
    {
      type: 'collectible', 
      weight: MUSHROOM_SPAWN_CHANCE, // 15% chance for mushrooms
      generator: (spawnX) => this.generateMushroom(spawnX + 25),
    },
    {
      type: 'collectible',
      weight: KEY_SPAWN_CHANCE, // 8% chance for keys
      generator: (spawnX) => this.generateKey(spawnX + 50),
    },
    {
      type: 'collectible',
      weight: 0.2, // 20% chance for stars
      generator: (spawnX) => this.generateStar(spawnX),
    },
  ]

  private terrainTable: SpawnEntry[] = [
    {
      type: 'terrain',
      weight: 0.08,
      generator: (spawnX) => this.generateWaterHole(spawnX),
    },
    {
      type: 'terrain',
      weight: 0.10,
      generator: (spawnX) => this.generateLowBarrier(spawnX),
    },
    {
      type: 'terrain',
      weight: 0.08,
      generator: (spawnX) => this.generateHighBarrier(spawnX),
    },
    {
      type: 'terrain',
      weight: 0.08,
      generator: (spawnX) => this.generateObstacle(spawnX),
    },
    {
      type: 'terrain',
      weight: 0.15,
      generator: (spawnX) => this.generatePlatform(spawnX, 1),
    },
    {
      type: 'terrain',
      weight: 0.15,
      generator: (spawnX) => this.generatePlatform(spawnX, 2),
    },
    {
      type: 'terrain',
      weight: 0.13,
      generator: (spawnX) => this.generatePlatform(spawnX, 3),
    },
    {
      type: 'terrain',
      weight: 0.23, // Increased from 0.12 to 0.23
      generator: (spawnX) => this.generateFloatingPlatform(spawnX),
    },
  ]

  // Weighted random selection
  private selectFromTable(table: SpawnEntry[]): SpawnEntry | null {
    const random = Math.random()
    let currentWeight = 0
    
    for (const entry of table) {
      currentWeight += entry.weight
      if (random <= currentWeight) {
        return entry
      }
    }
    
    return null // Shouldn't happen if weights are properly configured
  }

  generateObjects(spawnX: number): GameObject[] {
    const newObjects: GameObject[] = []

    // Generate collectibles (higher frequency)
    const collectibleEntry = this.selectFromTable(this.collectibleTable)
    if (collectibleEntry) {
      newObjects.push(collectibleEntry.generator(spawnX))
    }

    // Generate terrain (50% chance)
    if (Math.random() < 0.5) {
      const terrainEntry = this.selectFromTable(this.terrainTable)
      if (terrainEntry) {
        newObjects.push(terrainEntry.generator(spawnX))
      }
    }

    return newObjects
  }

  private generateFruit(spawnX: number): GameObject {
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

  private generateMushroom(spawnX: number): GameObject {
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

  private generateKey(spawnX: number): GameObject {
    // Keys are always in the air - horse must jump to get them
    const keyY = GROUND_Y - 60 - Math.random() * 30

    return {
      x: spawnX,
      y: keyY,
      width: 16,
      height: 16,
      type: 'key',
    }
  }

  private generateStar(spawnX: number): GameObject {
    return {
      x: spawnX + 50,
      y: GROUND_Y - 70,
      width: 12,
      height: 12,
      type: 'star',
    }
  }

  private generateWaterHole(spawnX: number): GameObject {
    return {
      x: spawnX + 100,
      y: GROUND_Y,
      width: 50,
      height: GAME_HEIGHT - GROUND_Y,
      type: 'waterHole',
      obstacleType: 'waterHole',
    }
  }

  private generateLowBarrier(spawnX: number): GameObject {
    return {
      x: spawnX + 100,
      y: GROUND_Y - 50,
      width: 15,
      height: 30,
      type: 'lowBarrier',
      obstacleType: 'lowBarrier',
    }
  }

  private generateHighBarrier(spawnX: number): GameObject {
    return {
      x: spawnX + 100,
      y: GROUND_Y - 60,
      width: 20,
      height: 60,
      type: 'highBarrier',
      obstacleType: 'highBarrier',
    }
  }

  private generateObstacle(spawnX: number): GameObject {
    return {
      x: spawnX + 100,
      y: GROUND_Y - 40,
      width: 20,
      height: 40,
      type: 'obstacle',
      obstacleType: 'wall',
    }
  }

  private generatePlatform(spawnX: number, level: number): GameObject {
    const platformWidths = {
      1: 80 + Math.random() * 60, // 80-140px wide
      2: 60 + Math.random() * 40, // 60-100px wide  
      3: 40 + Math.random() * 40, // 40-80px wide
    }

    return {
      x: spawnX + 100,
      y: GROUND_Y - PLATFORM_HEIGHT * level,
      width: platformWidths[level as keyof typeof platformWidths] || 60,
      height: PLATFORM_HEIGHT * level,
      type: 'platform',
      platformLevel: level,
      isRideable: true,
    }
  }

  private generateFloatingPlatform(spawnX: number): GameObject {
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
}