import { GameObject } from '../types/gameTypes'
import { GAME_WIDTH } from '../constants/gameConstants'

/**
 * Efficient game objects manager that minimizes array operations and object creation
 */
export class GameObjectsManager {
  private visibleObjects: GameObject[] = []
  private backgroundObjects: GameObject[] = []
  private foregroundObjects: GameObject[] = []

  /**
   * Update object positions and filter out off-screen objects
   * Returns new array only if changes occurred
   */
  updateObjects(
    objects: GameObject[],
    speed: number,
    isBlocked: boolean
  ): GameObject[] {
    let hasChanges = false
    let newObjects: GameObject[] | null = null

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]

      // Check if object should be removed (off-screen)
      if (obj.x <= -100) {
        if (!newObjects) {
          newObjects = objects.slice(0, i)
          hasChanges = true
        }
        continue
      }

      // Update position if not blocked
      if (!isBlocked) {
        const newX = obj.x - speed
        if (newX !== obj.x) {
          if (!newObjects) {
            newObjects = objects.slice(0, i)
            hasChanges = true
          }
          newObjects.push({ ...obj, x: newX })
        } else {
          newObjects?.push(obj)
        }
      } else {
        // When blocked, objects don't move
        newObjects?.push(obj)
      }
    }

    return hasChanges ? newObjects || [] : objects
  }

  /**
   * Pre-filter objects for rendering to avoid multiple loops
   * Updates cached visible object arrays
   */
  updateVisibleObjects(objects: GameObject[]) {
    this.visibleObjects.length = 0
    this.backgroundObjects.length = 0
    this.foregroundObjects.length = 0

    for (const obj of objects) {
      if (obj.collected || obj.x + obj.width < 0 || obj.x > GAME_WIDTH + 50) {
        continue
      }

      this.visibleObjects.push(obj)

      // Categorize for layered rendering
      if (this.isBackgroundObject(obj.type)) {
        this.backgroundObjects.push(obj)
      } else if (this.isForegroundObject(obj.type)) {
        this.foregroundObjects.push(obj)
      }
    }
  }

  /**
   * Get pre-filtered visible objects for collision detection
   */
  getVisibleObjects(): readonly GameObject[] {
    return this.visibleObjects
  }

  /**
   * Get background objects for rendering (behind horse)
   */
  getBackgroundObjects(): readonly GameObject[] {
    return this.backgroundObjects
  }

  /**
   * Get foreground objects for rendering (in front of horse)
   */
  getForegroundObjects(): readonly GameObject[] {
    return this.foregroundObjects
  }

  /**
   * Get platform objects for physics calculations
   */
  getPlatformObjects(): GameObject[] {
    return this.visibleObjects.filter(
      (obj) =>
        (obj.type === 'platform' || obj.type === 'floatingPlatform') &&
        obj.isRideable
    )
  }

  private isBackgroundObject(type: GameObject['type']): boolean {
    return (
      type === 'waterHole' ||
      type === 'platform' ||
      type === 'obstacle' ||
      type === 'lowBarrier' ||
      type === 'highBarrier' ||
      type === 'floatingPlatform'
    )
  }

  private isForegroundObject(type: GameObject['type']): boolean {
    return (
      type === 'fruit' ||
      type === 'star' ||
      type === 'key' ||
      type === 'mushroom'
    )
  }
}
