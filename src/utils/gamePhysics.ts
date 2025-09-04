import { Horse, GameObject } from '../types/gameTypes'
import { GameStateUpdater } from './gameStateUpdater'
import {
  GRAVITY,
  GROUND_Y,
  HORSE_HEIGHT,
  DUCK_HEIGHT,
  MIN_SPEED,
  DROWNING_ANIMATION_DURATION,
  DROWNING_BLOCK_DELAY,
} from '../constants/gameConstants'
import {
  checkPlatformLanding,
  checkPlatformWallCollision,
  checkRampLanding,
} from './collisionHelpers'
import { soundSystem } from './soundSystem'
import { particleSystem } from './particleSystem'

/**
 * Update horse physics including gravity, movement, and platform interactions
 */
export function updateHorsePhysics(
  updater: GameStateUpdater,
  horse: Horse,
  gameObjects: GameObject[],
  speed: number
): { landedOnPlatform: boolean; hitPlatformWall: boolean } {
  // Update horse physics (skip if drowning)
  if (!horse.isDrowning) {
    // Get current horse state (may have been updated by jump)
    const currentHorse = updater.getCurrentHorse()
    const newVelocityY = currentHorse.velocityY + GRAVITY
    const newY = currentHorse.y + newVelocityY
    updater.updateHorsePosition(undefined, newY, newVelocityY)
  }

  // Platform collision detection  
  let landedOnPlatform = false
  let hitPlatformWall = false

  gameObjects.forEach((obj) => {
    if (obj.type === 'ramp' && obj.isRideable) {
      // Special handling for ramps - horse follows the slope
      const rampResult = checkRampLanding(horse, obj)
      if (rampResult.isOnRamp && rampResult.rampY !== undefined) {
        updater.updateHorsePosition(undefined, rampResult.rampY, 0)
        updater.updateHorseStates({
          isJumping: false,
          currentPlatformLevel: 0, // Ramps are at ground level
        })
        landedOnPlatform = true
      }
    } else if ((obj.type === 'platform' || obj.type === 'floatingPlatform' || obj.type === 'bridge') && obj.isRideable) {
      // Standard platform/bridge handling
      if (checkPlatformLanding(horse, obj)) {
        const platformSurface = obj.y - (horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT)
        updater.updateHorsePosition(undefined, platformSurface, 0)
        updater.updateHorseStates({
          isJumping: false,
          currentPlatformLevel: obj.platformLevel || 0,
        })
        landedOnPlatform = true

        // Play platform landing sound (only once per landing)
        if (horse.currentPlatformLevel !== (obj.platformLevel || 0)) {
          soundSystem.playSound('platformLand', 0.6)
        }
      }

      // Check if horse hits platform wall (not applicable to ramps)
      if (checkPlatformWallCollision(horse, obj)) {
        hitPlatformWall = true
        updater.updateHorseStates({ isBlocked: true })

        // Lose speed when hitting wall (only once)
        if (!horse.isBlocked) {
          const newSpeed = Math.max(MIN_SPEED, speed * 0.7)
          updater.updateGameStats({ speed: newSpeed })
          soundSystem.playSound('wallHit', 0.8)
          soundSystem.playSound('dustCloud', 0.4)
          // Create dust cloud effect when hitting platform wall
          particleSystem.createDustCloud(horse.x + 60, horse.y + 20)
        }
      }
    }
  })

  return { landedOnPlatform, hitPlatformWall }
}

/**
 * Handle drowning animation logic
 */
export function updateDrowningLogic(updater: GameStateUpdater, horse: Horse) {
  if (horse.isDrowning) {
    const newDrowningTimer = horse.drowningTimer + 16 // Roughly 16ms per frame at 60fps

    // Stop forward motion after horse has moved into the water
    if (newDrowningTimer >= DROWNING_BLOCK_DELAY && !horse.isBlocked) {
      updater.updateHorseStates({ isBlocked: true })
    }

    // Sink the horse into the water over time
    const sinkAmount = (newDrowningTimer / DROWNING_ANIMATION_DURATION) * 60
    const newY = GROUND_Y - HORSE_HEIGHT + sinkAmount
    updater.updateHorsePosition(undefined, newY)
    updater.updateHorseStates({ drowningTimer: newDrowningTimer })

    // End game after drowning animation completes
    if (newDrowningTimer >= DROWNING_ANIMATION_DURATION) {
      updater.updateGameStats({ gameRunning: false })
      soundSystem.stopBackgroundMusic()
    }
  }
}

/**
 * Handle ground collision detection
 */
export function updateGroundCollision(
  updater: GameStateUpdater,
  horse: Horse,
  landedOnPlatform: boolean
) {
  // Ground collision (if not on a platform and not drowning)
  if (!landedOnPlatform && !horse.isDrowning) {
    const currentHorse = updater.getCurrentHorse()
    const targetGroundY = GROUND_Y - (currentHorse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT)
    
    if (currentHorse.y >= targetGroundY) {
      updater.updateHorsePosition(undefined, targetGroundY, 0)
      updater.updateHorseStates({
        isJumping: false,
        currentPlatformLevel: 0, // Back to ground level
      })
    }
  }
}

/**
 * Clear blocking state if horse has cleared obstacles
 */
export function updateBlockingState(
  updater: GameStateUpdater,
  horse: Horse,
  hitPlatformWall: boolean
) {
  // Check if horse has cleared the blocking platform
  if (horse.isBlocked && !hitPlatformWall && !horse.isDrowning) {
    updater.updateHorseStates({ isBlocked: false })
  }
}