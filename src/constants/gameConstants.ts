// Game dimensions
export const GAME_WIDTH = 800
export const GAME_HEIGHT = 400
export const GROUND_Y = 300

// Horse properties
export const HORSE_WIDTH = 40
export const HORSE_HEIGHT = 30
export const DUCK_HEIGHT = 20

// Physics constants
export const GRAVITY = 0.8
export const JUMP_FORCE = -15

// Platform system
export const PLATFORM_HEIGHT = 40 // Height of each platform level

// Touch gesture thresholds
export const SWIPE_MIN_DISTANCE = 30
export const SWIPE_MAX_TIME = 500
export const TAP_MAX_TIME = 300
export const TAP_DUCK_DURATION = 500

// Game spawn and timing
export const INITIAL_SPEED = 4
export const MIN_SPEED = 1
export const LANDING_THRESHOLD = 15 // pixels of tolerance for platform landing
export const DROWNING_ANIMATION_DURATION = 1000
export const DROWNING_BLOCK_DELAY = 200

// Speed progression system
export const FRUIT_SPEED_BOOST_BASE = 0.5 // Base speed boost from fruit (reduced from 1.5)
export const FRUIT_SPEED_BOOST_MAX = 3 // Maximum speed boost (reduced from 6)
export const MUSHROOM_SPEED_REDUCTION = 0.3 // How much mushrooms reduce speed boost
export const MUSHROOM_SPAWN_CHANCE = 0.15 // 15% chance to spawn mushrooms (less frequent than fruit)
export const KEY_SPAWN_CHANCE = 0.08 // 8% chance to spawn keys (rare collectible)
export const SPEED_FACTOR_INCREASE_RATE = 0.0002 // How much speed factor increases per distance unit (reduced from 0.001)
export const MAX_SPEED_FACTOR = 2.5 // Maximum speed multiplier (reduced from 3.0)
export const MIN_OBSTACLE_SPACING = 150 // Minimum spacing between obstacles
export const MAX_OBSTACLE_SPACING = 400 // Maximum spacing when speed is high

// Visual scaling for emojis
export const EMOJI_SIZE_BONUS = {
  fruit: 4,
  star: 2,
  cactus: 8,
  rock: 6,
  key: 0,
  mushroom: 4,
} as const
