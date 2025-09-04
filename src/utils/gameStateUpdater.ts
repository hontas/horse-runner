import { GameState, Horse } from '../types/gameTypes'

/**
 * Efficient game state updater that minimizes object allocation
 * Only creates new objects when values actually change
 */
export class GameStateUpdater {
  private hasChanges = false
  private horseChanges: Partial<Horse> = {}
  private stateChanges: Partial<GameState> = {}

  constructor(private currentState: GameState) {
    this.reset()
  }

  reset() {
    this.hasChanges = false
    this.horseChanges = {}
    this.stateChanges = {}
  }

  // Horse property updaters
  updateHorsePosition(x?: number, y?: number, velocityY?: number) {
    if (x !== undefined && x !== this.currentState.horse.x) {
      this.horseChanges.x = x
      this.hasChanges = true
    }
    if (y !== undefined && y !== this.currentState.horse.y) {
      this.horseChanges.y = y
      this.hasChanges = true
    }
    if (velocityY !== undefined && velocityY !== this.currentState.horse.velocityY) {
      this.horseChanges.velocityY = velocityY
      this.hasChanges = true
    }
  }

  updateHorseStates(states: {
    isDucking?: boolean
    isJumping?: boolean
    isBlocked?: boolean
    isDrowning?: boolean
    currentPlatformLevel?: number
    drowningTimer?: number
  }) {
    const horse = this.currentState.horse
    
    if (states.isDucking !== undefined && states.isDucking !== horse.isDucking) {
      this.horseChanges.isDucking = states.isDucking
      this.hasChanges = true
    }
    if (states.isJumping !== undefined && states.isJumping !== horse.isJumping) {
      this.horseChanges.isJumping = states.isJumping
      this.hasChanges = true
    }
    if (states.isBlocked !== undefined && states.isBlocked !== horse.isBlocked) {
      this.horseChanges.isBlocked = states.isBlocked
      this.hasChanges = true
    }
    if (states.isDrowning !== undefined && states.isDrowning !== horse.isDrowning) {
      this.horseChanges.isDrowning = states.isDrowning
      this.hasChanges = true
    }
    if (states.currentPlatformLevel !== undefined && states.currentPlatformLevel !== horse.currentPlatformLevel) {
      this.horseChanges.currentPlatformLevel = states.currentPlatformLevel
      this.hasChanges = true
    }
    if (states.drowningTimer !== undefined && states.drowningTimer !== horse.drowningTimer) {
      this.horseChanges.drowningTimer = states.drowningTimer
      this.hasChanges = true
    }
  }

  // Game state updaters
  updateGameStats(updates: {
    speed?: number
    speedBoost?: number
    speedFactor?: number
    score?: number
    distance?: number
    keys?: number
    gameRunning?: boolean
  }) {
    const state = this.currentState
    
    if (updates.speed !== undefined && updates.speed !== state.speed) {
      this.stateChanges.speed = updates.speed
      this.hasChanges = true
    }
    if (updates.speedBoost !== undefined && updates.speedBoost !== state.speedBoost) {
      this.stateChanges.speedBoost = updates.speedBoost
      this.hasChanges = true
    }
    if (updates.speedFactor !== undefined && updates.speedFactor !== state.speedFactor) {
      this.stateChanges.speedFactor = updates.speedFactor
      this.hasChanges = true
    }
    if (updates.score !== undefined && updates.score !== state.score) {
      this.stateChanges.score = updates.score
      this.hasChanges = true
    }
    if (updates.distance !== undefined && updates.distance !== state.distance) {
      this.stateChanges.distance = updates.distance
      this.hasChanges = true
    }
    if (updates.keys !== undefined && updates.keys !== state.keys) {
      this.stateChanges.keys = updates.keys
      this.hasChanges = true
    }
    if (updates.gameRunning !== undefined && updates.gameRunning !== state.gameRunning) {
      this.stateChanges.gameRunning = updates.gameRunning
      this.hasChanges = true
    }
  }

  updateGameObjects(gameObjects: GameState['gameObjects']) {
    if (gameObjects !== this.currentState.gameObjects) {
      this.stateChanges.gameObjects = gameObjects
      this.hasChanges = true
    }
  }

  // Build the final state object
  getUpdatedState(): GameState {
    if (!this.hasChanges) {
      return this.currentState
    }

    const newState: GameState = {
      ...this.currentState,
      ...this.stateChanges,
    }

    // Only create new horse object if horse properties changed
    if (Object.keys(this.horseChanges).length > 0) {
      newState.horse = {
        ...this.currentState.horse,
        ...this.horseChanges,
      }
    }

    return newState
  }

  // Check if any changes were made
  hasStateChanges(): boolean {
    return this.hasChanges
  }

  // Get current horse values (including pending changes)
  getCurrentHorse(): Horse {
    return {
      ...this.currentState.horse,
      ...this.horseChanges,
    }
  }
}