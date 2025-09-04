import { Horse, GameObject } from '../types/gameTypes'
import {
  HORSE_WIDTH,
  DUCK_HEIGHT,
  HORSE_HEIGHT,
  LANDING_THRESHOLD,
} from '../constants/gameConstants'

/**
 * Check basic collision between horse and a game object
 */
export const checkCollision = (horse: Horse, obj: GameObject): boolean => {
  const horseHeight = horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
  return (
    horse.x < obj.x + obj.width &&
    horse.x + HORSE_WIDTH > obj.x &&
    horse.y < obj.y + obj.height &&
    horse.y + horseHeight >= obj.y
  )
}

/**
 * Check if horse can land on top of a platform
 */
export const checkPlatformLanding = (
  horse: Horse,
  platform: GameObject
): boolean => {
  const horseHeight = horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
  const horseBottom = horse.y + horseHeight
  const platformTop = platform.y

  // Check if horse is horizontally aligned with platform
  const horizontalOverlap =
    horse.x < platform.x + platform.width && horse.x + HORSE_WIDTH > platform.x

  // Check if horse is landing on top of platform (within landing threshold)
  const isLandingOnTop =
    horseBottom >= platformTop - LANDING_THRESHOLD &&
    horseBottom <= platformTop + 5 && // Small buffer below platform top
    horse.velocityY >= 0 // Horse is falling or at rest

  return horizontalOverlap && isLandingOnTop
}

/**
 * Check if horse hits the side wall of a platform
 */
export const checkPlatformWallCollision = (
  horse: Horse,
  platform: GameObject
): boolean => {
  const horseHeight = horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
  const horseBottom = horse.y + horseHeight
  const platformTop = platform.y

  // For floating platforms, only check wall collision if horse is at platform level
  // This allows the horse to walk underneath floating platforms
  if (platform.type === 'floatingPlatform') {
    // Only check wall collision if horse is at or above platform level
    const isAtPlatformLevel = horseBottom <= platformTop + 15 // Slightly larger buffer for floating platforms
    if (!isAtPlatformLevel) {
      return false // No collision if horse is below platform
    }
  }

  // Check if horse is at platform level or below (for regular platforms)
  const atPlatformLevel = horseBottom > platformTop + 5 // 5px buffer

  // Check if horse hits the front wall of the platform
  const hitsWall =
    horse.x + HORSE_WIDTH >= platform.x &&
    horse.x < platform.x + 10 && // Only check front edge
    atPlatformLevel

  return hitsWall
}
