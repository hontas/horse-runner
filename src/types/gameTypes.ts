export interface GameObject {
  x: number
  y: number
  width: number
  height: number
  type:
    | 'fruit'
    | 'obstacle'
    | 'star'
    | 'key'
    | 'waterHole'
    | 'lowBarrier'
    | 'highBarrier'
    | 'platform'
    | 'floatingPlatform'
    | 'mushroom'
  collected?: boolean
  obstacleType?: 'wall' | 'waterHole' | 'lowBarrier' | 'highBarrier' // For obstacle variants
  platformLevel?: number // For terrain platforms (0 = ground level, 1 = first level up, etc.)
  isRideable?: boolean // Whether horse can ride on top of this
}

export interface Horse {
  x: number
  y: number
  velocityY: number
  isDucking: boolean
  isJumping: boolean
  currentPlatformLevel: number // Which platform level the horse is on (0 = ground)
  isBlocked: boolean // Whether forward motion is blocked by terrain
  isDrowning: boolean // Whether horse is drowning in water
  drowningTimer: number // Timer for drowning animation
}

export interface GameState {
  horse: Horse
  gameObjects: GameObject[]
  speed: number
  baseSpeed: number
  speedBoost: number
  speedFactor: number // Progressive difficulty multiplier
  score: number
  distance: number
  keys: number
  gameRunning: boolean
  gameStarted: boolean
  gamePaused: boolean
}

export type GameObjectType = GameObject['type']

export interface HighScore {
  name: string
  score: number
  distance: number
  date: string
}

export interface HighScoreState {
  scores: HighScore[]
  lastPlayerName: string
}
