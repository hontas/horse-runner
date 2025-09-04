import { GameObject } from '../types/gameTypes'
import {
  MUSHROOM_SPAWN_CHANCE,
  KEY_SPAWN_CHANCE,
} from '../constants/gameConstants'
import {
  CollectibleObjects,
  ObstacleObjects,
  TerrainObjects
} from '../objects'

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
      generator: (spawnX) => CollectibleObjects.generateFruit(spawnX),
    },
    {
      type: 'collectible', 
      weight: MUSHROOM_SPAWN_CHANCE, // 15% chance for mushrooms
      generator: (spawnX) => CollectibleObjects.generateMushroom(spawnX + 25),
    },
    {
      type: 'collectible',
      weight: KEY_SPAWN_CHANCE, // 8% chance for keys
      generator: (spawnX) => CollectibleObjects.generateKey(spawnX + 50),
    },
    {
      type: 'collectible',
      weight: 0.2, // 20% chance for stars
      generator: (spawnX) => CollectibleObjects.generateStar(spawnX),
    },
  ]

  private terrainTable: SpawnEntry[] = [
    // Obstacles
    {
      type: 'obstacle',
      weight: 0.07, // Water holes
      generator: (spawnX) => ObstacleObjects.generateWaterHole(spawnX + 100),
    },
    {
      type: 'obstacle',
      weight: 0.09, // Low barriers
      generator: (spawnX) => ObstacleObjects.generateLowBarrier(spawnX + 100),
    },
    {
      type: 'obstacle',
      weight: 0.07, // High barriers
      generator: (spawnX) => ObstacleObjects.generateHighBarrier(spawnX + 100),
    },
    {
      type: 'obstacle',
      weight: 0.07, // Traditional obstacles
      generator: (spawnX) => ObstacleObjects.generateObstacle(spawnX + 100),
    },
    // Terrain
    {
      type: 'terrain',
      weight: 0.13, // Level 1 platforms
      generator: (spawnX) => TerrainObjects.generatePlatform(spawnX + 100, 1),
    },
    {
      type: 'terrain',
      weight: 0.13, // Level 2 platforms
      generator: (spawnX) => TerrainObjects.generatePlatform(spawnX + 100, 2),
    },
    {
      type: 'terrain',
      weight: 0.11, // Level 3 platforms
      generator: (spawnX) => TerrainObjects.generatePlatform(spawnX + 100, 3),
    },
    {
      type: 'terrain',
      weight: 0.18, // Floating platforms
      generator: (spawnX) => TerrainObjects.generateFloatingPlatform(spawnX + 100),
    },
    {
      type: 'terrain',
      weight: 0.05, // Ramps
      generator: (spawnX) => TerrainObjects.generateRamp(spawnX),
    },
    {
      type: 'terrain',
      weight: 0.04, // Bridges
      generator: (spawnX) => TerrainObjects.generateBridge(spawnX),
    },
    {
      type: 'terrain',
      weight: 0.03, // Log piles
      generator: (spawnX) => TerrainObjects.generateLogPile(spawnX),
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

  generateObjects(spawnX: number, _speedFactor: number = 1.0): GameObject[] {
    const newObjects: GameObject[] = []

    // Generate collectibles (higher frequency)
    const collectibleEntry = this.selectFromTable(this.collectibleTable)
    if (collectibleEntry) {
      newObjects.push(collectibleEntry.generator(spawnX))
    }

    // Generate terrain at constant rate as requested
    const terrainChance = 0.75 // 75% chance for consistent terrain spawning

    if (Math.random() < terrainChance) {
      const terrainEntry = this.selectFromTable(this.terrainTable)
      if (terrainEntry) {
        newObjects.push(terrainEntry.generator(spawnX))
      }
    }

    return newObjects
  }

}