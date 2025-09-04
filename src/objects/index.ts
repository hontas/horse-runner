/**
 * Central export point for all game objects
 * Provides organized access to collectibles, obstacles, and terrain
 */

// Collectibles
export {
  CollectibleObjects,
  CollectibleRenderer,
  CollectibleEffects,
  type CollectibleConfig
} from './collectibles'

// Obstacles
export {
  ObstacleObjects,
  ObstacleRenderer,
  ObstacleEffects
} from './obstacles'

// Terrain
export {
  TerrainObjects,
  TerrainRenderer,
  TerrainEffects
} from './terrain'

// Re-export types from main types file for convenience
export type { GameObject, GameState } from '../types/gameTypes'