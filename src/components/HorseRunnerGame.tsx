import React, { useState, useEffect, useRef } from 'react'
import { useHorseRenderer } from './Horse'
import { soundSystem } from '../utils/soundSystem'
import styles from './HorseRunnerGame.module.css'

const GAME_WIDTH = 800
const GAME_HEIGHT = 400
const GROUND_Y = 300
const HORSE_WIDTH = 40
const HORSE_HEIGHT = 30
const GRAVITY = 0.8
const JUMP_FORCE = -15
const DUCK_HEIGHT = 20
const PLATFORM_HEIGHT = 40 // Height of each platform level
const MAX_PLATFORM_LEVELS = 3 // Maximum number of levels above ground

interface GameObject {
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
  collected?: boolean
  obstacleType?: 'wall' | 'waterHole' | 'lowBarrier' | 'highBarrier' // For obstacle variants
  platformLevel?: number // For terrain platforms (0 = ground level, 1 = first level up, etc.)
  isRideable?: boolean // Whether horse can ride on top of this
}

interface GameState {
  horse: {
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
  gameObjects: GameObject[]
  speed: number
  baseSpeed: number
  speedBoost: number
  score: number
  distance: number
  keys: number
  gameRunning: boolean
  gameStarted: boolean
  gamePaused: boolean
}

const HorseRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const lastSpawnX = useRef<number>(GAME_WIDTH)
  const keysPressed = useRef<Set<string>>(new Set())

  const [gameState, setGameState] = useState<GameState>({
    horse: {
      x: 100,
      y: GROUND_Y - HORSE_HEIGHT,
      velocityY: 0,
      isDucking: false,
      isJumping: false,
      currentPlatformLevel: 0,
      isBlocked: false,
      isDrowning: false,
      drowningTimer: 0,
    },
    gameObjects: [],
    speed: 4,
    baseSpeed: 4,
    speedBoost: 0,
    score: 0,
    distance: 0,
    keys: 0,
    gameRunning: false,
    gameStarted: false,
    gamePaused: false,
  })

  // Horse renderer with animations
  const { drawHorse, isImageLoaded } = useHorseRenderer({
    x: gameState.horse.x,
    y: gameState.horse.y,
    width: HORSE_WIDTH,
    height: gameState.horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT,
    isJumping: gameState.horse.isJumping,
    isDucking: gameState.horse.isDucking,
    isRunning:
      gameState.gameRunning &&
      gameState.gameStarted &&
      !gameState.gamePaused &&
      !gameState.horse.isDrowning,
  })

  // Initialize sound system
  useEffect(() => {
    const initSounds = async () => {
      await soundSystem.initializeSounds()
    }
    initSounds()
  }, [])

  // Start game
  const startGame = async () => {
    console.log('Starting game...')

    // Resume audio context on user interaction
    await soundSystem.resumeAudioContext()

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

    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      gameRunning: true,
      gamePaused: false,
      score: 0,
      distance: 0,
      keys: 0,
      speed: 4,
      speedBoost: 0,
      gameObjects: initialObjects,
      horse: {
        x: 100,
        y: GROUND_Y - HORSE_HEIGHT,
        velocityY: 0,
        isDucking: false,
        isJumping: false,
        currentPlatformLevel: 0,
        isBlocked: false,
        isDrowning: false,
        drowningTimer: 0,
      },
    }))
    lastSpawnX.current = GAME_WIDTH + 600

    // Start background music
    soundSystem.startBackgroundMusic()

    console.log('Game started with objects:', initialObjects.length)
  }

  // Pause/Resume game
  const togglePause = () => {
    if (gameState.gameStarted && gameState.gameRunning) {
      setGameState((prev) => ({ ...prev, gamePaused: !prev.gamePaused }))
    }
  }

  // Jump
  const jump = () => {
    console.log(
      'Jump called',
      gameState.gameStarted,
      gameState.gameRunning,
      gameState.gamePaused
    )
    if (
      gameState.gameStarted &&
      gameState.gameRunning &&
      !gameState.gamePaused
    ) {
      setGameState((prev) => {
        // Check if horse can jump from current position
        const currentLevel = prev.horse.currentPlatformLevel
        const expectedY =
          currentLevel > 0
            ? GROUND_Y - HORSE_HEIGHT - PLATFORM_HEIGHT * currentLevel
            : GROUND_Y - HORSE_HEIGHT

        console.log(
          'Current horse Y:',
          prev.horse.y,
          'Expected Y for level',
          currentLevel,
          ':',
          expectedY
        )

        // Allow jumping if horse is on ground or on a platform (with tolerance)
        if (prev.horse.y >= expectedY - 5) {
          console.log('Jumping from level', currentLevel)
          soundSystem.playSound('jump', 0.7)
          return {
            ...prev,
            horse: {
              ...prev.horse,
              velocityY: JUMP_FORCE,
              isJumping: true,
              isDucking: false,
            },
          }
        }
        console.log('Not on surface, cannot jump')
        return prev
      })
    }
  }

  // Duck - now continuous while key is held
  const startDuck = () => {
    if (
      gameState.gameStarted &&
      gameState.gameRunning &&
      !gameState.gamePaused
    ) {
      if (!gameState.horse.isDucking) {
        soundSystem.playSound('duck', 0.5)
      }
      setGameState((prev) => ({
        ...prev,
        horse: {
          ...prev.horse,
          isDucking: true,
        },
      }))
    }
  }

  const stopDuck = () => {
    setGameState((prev) => ({
      ...prev,
      horse: {
        ...prev.horse,
        isDucking: false,
      },
    }))
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code)

      switch (e.code) {
        case 'Space':
        case 'Enter':
          e.preventDefault()
          if (!gameState.gameStarted) {
            startGame()
          } else if (
            gameState.gameStarted &&
            !gameState.gameRunning &&
            !gameState.gamePaused
          ) {
            // Game over - restart game
            startGame()
          } else if (gameState.gameStarted) {
            if (gameState.gamePaused) {
              togglePause()
            } else if (e.code === 'Space') {
              jump()
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          togglePause()
          break
        case 'ArrowUp':
          e.preventDefault()
          jump()
          break
        case 'ArrowDown':
          e.preventDefault()
          if (
            !keysPressed.current.has('ArrowDown') ||
            !gameState.horse.isDucking
          ) {
            startDuck()
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code)

      switch (e.code) {
        case 'ArrowDown':
          stopDuck()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    gameState.gameStarted,
    gameState.gameRunning,
    gameState.gamePaused,
    gameState.horse.isDucking,
  ])

  // Collision detection
  const checkCollision = (horse: any, obj: GameObject): boolean => {
    const horseHeight = horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
    return (
      horse.x < obj.x + obj.width &&
      horse.x + HORSE_WIDTH > obj.x &&
      horse.y < obj.y + obj.height &&
      horse.y + horseHeight >= obj.y
    )
  }

  // Platform collision detection - checks if horse can land on top of platform
  const checkPlatformLanding = (horse: any, platform: GameObject): boolean => {
    const horseHeight = horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
    const horseBottom = horse.y + horseHeight
    const platformTop = platform.y

    // Check if horse is horizontally aligned with platform
    const horizontalOverlap =
      horse.x < platform.x + platform.width &&
      horse.x + HORSE_WIDTH > platform.x

    // Check if horse is landing on top of platform (within landing threshold)
    const landingThreshold = 15 // pixels of tolerance for landing
    const isLandingOnTop =
      horseBottom >= platformTop - landingThreshold &&
      horseBottom <= platformTop + 5 && // Small buffer below platform top
      horse.velocityY >= 0 // Horse is falling or at rest

    return horizontalOverlap && isLandingOnTop
  }

  // Platform wall collision - checks if horse hits the side of a platform
  const checkPlatformWallCollision = (
    horse: any,
    platform: GameObject
  ): boolean => {
    const horseHeight = horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
    const horseBottom = horse.y + horseHeight
    const platformTop = platform.y

    // Check if horse is at platform level or below
    const atPlatformLevel = horseBottom > platformTop + 5 // 5px buffer

    // Check if horse hits the front wall of the platform
    const hitsWall =
      horse.x + HORSE_WIDTH >= platform.x &&
      horse.x < platform.x + 10 && // Only check front edge
      atPlatformLevel

    return hitsWall
  }

  // Game loop
  useEffect(() => {
    if (
      !gameState.gameStarted ||
      !gameState.gameRunning ||
      gameState.gamePaused
    ) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = undefined
      }
      return
    }

    const gameLoop = () => {
      setGameState((prev) => {
        // Don't update if game shouldn't be running
        if (!prev.gameStarted || !prev.gameRunning || prev.gamePaused) {
          return prev
        }

        const newState = { ...prev }

        // Update horse physics (skip if drowning)
        newState.horse = { ...prev.horse }
        if (!newState.horse.isDrowning) {
          newState.horse.velocityY += GRAVITY
          newState.horse.y += newState.horse.velocityY
        }

        // Platform and ground collision detection
        let landedOnPlatform = false
        let hitPlatformWall = false

        // Check platform collisions first
        newState.gameObjects.forEach((obj) => {
          if (obj.type === 'platform' && obj.isRideable) {
            // Check if horse can land on platform
            if (checkPlatformLanding(newState.horse, obj)) {
              const platformSurface =
                obj.y - (newState.horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT)
              newState.horse.y = platformSurface
              newState.horse.velocityY = 0
              newState.horse.isJumping = false
              newState.horse.currentPlatformLevel = obj.platformLevel || 0
              landedOnPlatform = true

              // Play platform landing sound (only once per landing)
              if (
                prev.horse.currentPlatformLevel !== (obj.platformLevel || 0)
              ) {
                soundSystem.playSound('platformLand', 0.6)
              }
            }

            // Check if horse hits platform wall
            if (checkPlatformWallCollision(newState.horse, obj)) {
              hitPlatformWall = true
              newState.horse.isBlocked = true

              // Lose speed when hitting wall (only once)
              if (!prev.horse.isBlocked) {
                newState.speed = Math.max(1, newState.speed * 0.7)
                soundSystem.playSound('wallHit', 0.8)
              }
            }
          }
        })

        // Check if horse has cleared the blocking platform (but not if drowning)
        if (
          prev.horse.isBlocked &&
          !hitPlatformWall &&
          !newState.horse.isDrowning
        ) {
          // Horse has cleared the obstacle, resume normal movement
          newState.horse.isBlocked = false
        }

        // Handle drowning animation
        if (newState.horse.isDrowning) {
          newState.horse.drowningTimer += 16 // Roughly 16ms per frame at 60fps

          // Stop forward motion after horse has moved into the water (about one horse length)
          if (
            newState.horse.drowningTimer >= 200 &&
            !newState.horse.isBlocked
          ) {
            newState.horse.isBlocked = true
          }

          // Sink the horse into the water over 1 second
          const sinkAmount = (newState.horse.drowningTimer / 1000) * 60 // 60 pixels over 1 second
          newState.horse.y = GROUND_Y - HORSE_HEIGHT + sinkAmount

          // End game after drowning animation completes
          if (newState.horse.drowningTimer >= 1000) {
            newState.gameRunning = false
            soundSystem.stopBackgroundMusic()
          }
        }

        // Ground collision (if not on a platform and not drowning)
        if (!landedOnPlatform && !newState.horse.isDrowning) {
          const targetGroundY =
            GROUND_Y - (newState.horse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT)
          if (newState.horse.y >= targetGroundY) {
            newState.horse.y = targetGroundY
            newState.horse.velocityY = 0
            newState.horse.isJumping = false
            newState.horse.currentPlatformLevel = 0 // Back to ground level
          }
        }

        // Update speed
        if (newState.speedBoost > 0) {
          newState.speedBoost -= 0.02
          newState.speed = newState.baseSpeed + newState.speedBoost
        } else {
          newState.speed = Math.max(2, newState.speed - 0.005)
        }

        // Move all objects left and update them (but stop if horse is blocked)
        if (!newState.horse.isBlocked) {
          newState.gameObjects = newState.gameObjects.map((obj) => ({
            ...obj,
            x: obj.x - newState.speed,
          }))
        } else {
          // When blocked, objects don't move - creating the effect that horse stops
          // while maintaining the illusion of forward motion
          newState.gameObjects = newState.gameObjects.map((obj) => ({ ...obj }))
        }

        // Spawn new objects if needed
        const rightmostX = Math.max(
          ...newState.gameObjects.map((obj) => obj.x),
          GAME_WIDTH - 500 // Default if no objects
        )

        if (rightmostX < GAME_WIDTH + 100) {
          // Generate some new objects
          const spawnX = Math.max(rightmostX + 150, GAME_WIDTH + 50)
          const newObjects: GameObject[] = []

          // Add fruit at different heights
          if (Math.random() < 0.7) {
            const fruitHeightRand = Math.random()
            let fruitY

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

            newObjects.push({
              x: spawnX,
              y: fruitY,
              width: 15,
              height: 15,
              type: 'fruit',
            })
          }

          // Add platforms and obstacles
          if (Math.random() < 0.5) {
            const terrainRand = Math.random()

            if (terrainRand < 0.15) {
              // Water hole - deep pit filled with water, extends to bottom of screen
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y,
                width: 50,
                height: GAME_HEIGHT - GROUND_Y,
                type: 'waterHole',
                obstacleType: 'waterHole',
              })
            } else if (terrainRand < 0.25) {
              // Low barrier - hangs above ground, can duck under
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y - 50,
                width: 15,
                height: 30,
                type: 'lowBarrier',
                obstacleType: 'lowBarrier',
              })
            } else if (terrainRand < 0.35) {
              // High barrier - must jump over
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y - 60,
                width: 20,
                height: 60,
                type: 'highBarrier',
                obstacleType: 'highBarrier',
              })
            } else if (terrainRand < 0.45) {
              // Traditional wall obstacle
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y - 40,
                width: 20,
                height: 40,
                type: 'obstacle',
                obstacleType: 'wall',
              })
            } else if (terrainRand < 0.7) {
              // Platform level 1 - can be jumped onto
              const platformWidth = 80 + Math.random() * 60 // 80-140px wide
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y - PLATFORM_HEIGHT,
                width: platformWidth,
                height: PLATFORM_HEIGHT,
                type: 'platform',
                platformLevel: 1,
                isRideable: true,
              })
            } else if (terrainRand < 0.85) {
              // Platform level 2 - higher platform
              const platformWidth = 60 + Math.random() * 40 // 60-100px wide
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y - PLATFORM_HEIGHT * 2,
                width: platformWidth,
                height: PLATFORM_HEIGHT * 2,
                type: 'platform',
                platformLevel: 2,
                isRideable: true,
              })
            } else {
              // Platform level 3 - highest platform
              const platformWidth = 40 + Math.random() * 40 // 40-80px wide
              newObjects.push({
                x: spawnX + 100,
                y: GROUND_Y - PLATFORM_HEIGHT * 3,
                width: platformWidth,
                height: PLATFORM_HEIGHT * 3,
                type: 'platform',
                platformLevel: 3,
                isRideable: true,
              })
            }
          }

          // Add stars
          if (Math.random() < 0.2) {
            newObjects.push({
              x: spawnX + 50,
              y: GROUND_Y - 70,
              width: 12,
              height: 12,
              type: 'star',
            })
          }

          newState.gameObjects.push(...newObjects)
        }

        // Remove off-screen objects
        newState.gameObjects = newState.gameObjects.filter(
          (obj) => obj.x > -100
        )

        // Update distance
        newState.distance += Math.floor(newState.speed / 2)

        // Check collisions
        newState.gameObjects.forEach((obj) => {
          if (!obj.collected && checkCollision(newState.horse, obj)) {
            // Don't mark platforms or water holes as collected - they're permanent terrain
            if (obj.type !== 'platform' && obj.type !== 'waterHole') {
              obj.collected = true
            }

            switch (obj.type) {
              case 'fruit':
                newState.score += 10
                newState.speedBoost = Math.min(6, newState.speedBoost + 1.5)
                soundSystem.playSound('collect', 0.6)
                if (newState.speedBoost > 0) {
                  soundSystem.playSound('speedBoost', 0.4)
                }
                break
              case 'star':
                newState.score += 50
                soundSystem.playSound('star', 0.8)
                break
              case 'key':
                newState.keys += 1
                newState.score += 25
                soundSystem.playSound('collect', 0.7)
                break
              case 'obstacle':
              case 'highBarrier':
                // These obstacles always cause game over
                newState.gameRunning = false
                soundSystem.playSound('gameOver', 0.8)
                soundSystem.stopBackgroundMusic()
                break
              case 'waterHole':
                // Water hole causes drowning - we already know there's collision
                if (!newState.horse.isDrowning) {
                  // Start drowning animation
                  newState.horse.isDrowning = true
                  newState.horse.drowningTimer = 0
                  // Don't block immediately - let horse move forward into the water first
                  soundSystem.playSound('waterSplash', 0.9)
                }
                break
              case 'lowBarrier':
                // Low barrier only causes game over if not ducking
                if (!newState.horse.isDucking) {
                  newState.gameRunning = false
                  soundSystem.playSound('gameOver', 0.8)
                  soundSystem.stopBackgroundMusic()
                }
                break
              case 'platform':
                // Platforms don't cause game over, they're just terrain
                // Collision already handled in platform physics section
                break
            }
          }
        })

        return newState
      })

      // Continue the loop
      if (
        gameState.gameStarted &&
        gameState.gameRunning &&
        !gameState.gamePaused
      ) {
        gameLoopRef.current = requestAnimationFrame(gameLoop)
      }
    }

    // Start the loop
    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = undefined
      }
    }
  }, [gameState.gameStarted, gameState.gameRunning, gameState.gamePaused])

  // Helper function to draw individual game objects
  const drawGameObject = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    switch (obj.type) {
      case 'fruit':
        // Draw apple emoji
        ctx.font = `${obj.height + 4}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🍎', obj.x + obj.width / 2, obj.y + obj.height / 2)
        break
      case 'obstacle':
        ctx.fillStyle = '#2F4F2F'
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
        break
      case 'star':
        // Draw star emoji
        ctx.font = `${obj.height + 2}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⭐', obj.x + obj.width / 2, obj.y + obj.height / 2)
        break
      case 'key':
        // Draw key emoji
        ctx.font = `${obj.height}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🗝️', obj.x + obj.width / 2, obj.y + obj.height / 2)
        break
      case 'waterHole':
        // Draw deep water pit that extends to bottom of screen

        // Dark pit walls/edges
        ctx.fillStyle = '#2C3E50'
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

        // Main water body - fills the entire pit
        ctx.fillStyle = '#1B4F72'
        ctx.fillRect(obj.x + 3, obj.y, obj.width - 6, obj.height)

        // Lighter water in center for depth effect
        ctx.fillStyle = '#2471A3'
        ctx.fillRect(obj.x + 6, obj.y, obj.width - 12, obj.height)

        // Animated water surface at ground level
        const time = Date.now() * 0.003
        const waveOffset1 = Math.sin(time + obj.x * 0.01) * 2
        const waveOffset2 = Math.sin(time * 1.5 + obj.x * 0.01) * 1.5

        // Water surface layers with waves
        ctx.fillStyle = '#3498DB'
        ctx.fillRect(obj.x + 3, obj.y + waveOffset1, obj.width - 6, 8)

        ctx.fillStyle = '#5DADE2'
        ctx.fillRect(obj.x + 6, obj.y + 2 + waveOffset2, obj.width - 12, 4)

        // Bright surface reflection
        ctx.fillStyle = '#AED6F1'
        ctx.fillRect(obj.x + 8, obj.y + 3 + waveOffset1, obj.width - 16, 2)
        break
      case 'lowBarrier':
        // Low barrier - hangs above ground, can duck under
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
        // Add some texture/pattern
        ctx.fillStyle = '#654321'
        for (let i = 0; i < obj.width; i += 4) {
          ctx.fillRect(obj.x + i, obj.y, 2, obj.height)
        }
        break
      case 'highBarrier':
        // High barrier - must jump over
        ctx.fillStyle = '#2F4F2F'
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
        // Add some stone texture
        ctx.fillStyle = '#1C1C1C'
        for (let i = 0; i < obj.width; i += 6) {
          for (let j = 0; j < obj.height; j += 6) {
            if ((i + j) % 12 === 0) {
              ctx.fillRect(obj.x + i, obj.y + j, 3, 3)
            }
          }
        }
        break
      case 'platform':
        // Multi-level terrain platforms
        const level = obj.platformLevel || 1
        const colors = ['#8B7D6B', '#A0522D', '#CD853F'] // Different shades for different levels

        // Main platform body
        ctx.fillStyle = colors[(level - 1) % colors.length]
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

        // Platform top (grass-like)
        ctx.fillStyle = '#9ACD32'
        ctx.fillRect(obj.x, obj.y, obj.width, 6)

        // Platform edge/wall definition
        ctx.fillStyle = '#696969'
        ctx.fillRect(obj.x, obj.y, 3, obj.height) // Left edge
        ctx.fillRect(obj.x + obj.width - 3, obj.y, 3, obj.height) // Right edge
        break
    }
  }

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw ground
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y)

    // Draw grass
    ctx.fillStyle = '#228B22'
    ctx.fillRect(0, GROUND_Y - 10, GAME_WIDTH, 10)

    if (gameState.gameStarted) {
      // Draw background objects first (water holes, platforms, obstacles)
      gameState.gameObjects.forEach((obj) => {
        if (obj.collected || obj.x + obj.width < 0 || obj.x > GAME_WIDTH + 50)
          return

        // Only draw background objects that should appear behind the horse
        if (
          obj.type === 'waterHole' ||
          obj.type === 'platform' ||
          obj.type === 'obstacle' ||
          obj.type === 'lowBarrier' ||
          obj.type === 'highBarrier'
        ) {
          drawGameObject(ctx, obj)
        }
      })

      // Draw horse with sprite animation (on top of background objects)
      if (isImageLoaded) {
        drawHorse(ctx)
      } else {
        // Fallback to rectangle if sprite not loaded yet
        ctx.fillStyle = gameState.horse.isJumping ? '#DEB887' : '#8B4513'
        const horseHeight = gameState.horse.isDucking
          ? DUCK_HEIGHT
          : HORSE_HEIGHT
        ctx.fillRect(
          gameState.horse.x,
          gameState.horse.y,
          HORSE_WIDTH,
          horseHeight
        )
      }

      // Draw foreground objects (collectibles that should appear in front of horse)
      gameState.gameObjects.forEach((obj) => {
        if (obj.collected || obj.x + obj.width < 0 || obj.x > GAME_WIDTH + 50)
          return

        // Only draw collectible objects that should appear in front of the horse
        if (obj.type === 'fruit' || obj.type === 'star' || obj.type === 'key') {
          drawGameObject(ctx, obj)
        }
      })
    }

    // Draw UI
    // ctx.fillStyle = '#FFFFFF'
    // ctx.font = '20px Arial'
    // ctx.fillText(`Score: ${gameState.score}`, 10, 30)
    // ctx.fillText(`Distance: ${gameState.distance}`, 10, 55)
    // ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}`, 10, 80)
    // ctx.fillText(`Level: ${gameState.horse.currentPlatformLevel}`, 10, 105)

    // Reset text alignment for UI
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    // Draw UI
    ctx.fillStyle = 'white'
    ctx.font = '16px Arial'
    ctx.fillText(`Score: ${gameState.score}`, 10, 30)
    ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, 10, 50)
    ctx.fillText(`Speed: ${gameState.speed.toFixed(1)}`, 10, 70)
    ctx.fillText(`Keys: ${gameState.keys}`, 10, 90)
  }, [gameState])

  return (
    <div className={styles.gameContainer}>
      <h1 className={styles.title}>🐎 Horse Runner</h1>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className={styles.canvas}
        />

        {/* Start Screen Overlay */}
        {!gameState.gameStarted && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>🐎 HORSE RUNNER</h2>
            <p className={styles.overlaySubtitle}>
              Jump over obstacles and collect fruits!
            </p>
            <div className={styles.instructions}>
              🍎 Fruit: +10 points, speed boost
              <br />
              ⭐ Star: +50 points
              <br />
              🗝️ Key: +25 points
              <br />
              🌊 Water Hole: Jump or drown!
              <br />
              🪵 Low Barrier: Duck under!
              <br />
              🧱 High Barrier: Jump over!
              <br />
              🌵 Wall: Game over!
            </div>
            <button onClick={startGame} className={styles.startButton}>
              🎮 START GAME
            </button>
            <p className={styles.hint}>Or press SPACE/ENTER</p>
          </div>
        )}

        {/* Pause Screen Overlay */}
        {gameState.gameStarted && gameState.gamePaused && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>⏸️ PAUSED</h2>
            <button onClick={togglePause} className={styles.resumeButton}>
              ▶️ RESUME
            </button>
            <p className={styles.hint}>Or press SPACE/ESC</p>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.gameStarted &&
          !gameState.gameRunning &&
          !gameState.gamePaused && (
            <div className={styles.overlay}>
              <h2 className={styles.overlayTitle}>💥 GAME OVER</h2>
              <p className={styles.finalScore}>
                Final Score: {gameState.score}
              </p>
              <p className={styles.finalDistance}>
                Distance: {Math.floor(gameState.distance)}m
              </p>
              <button onClick={startGame} className={styles.playAgainButton}>
                🔄 PLAY AGAIN
              </button>
              <p className={styles.hint}>Or press SPACE/ENTER</p>
            </div>
          )}
      </div>

      {/* Control Buttons */}
      {gameState.gameStarted &&
        gameState.gameRunning &&
        !gameState.gamePaused && (
          <div className={styles.controls}>
            <button onClick={jump} className={styles.jumpButton}>
              ⬆️ JUMP
            </button>
            <button
              onMouseDown={startDuck}
              onMouseUp={stopDuck}
              onMouseLeave={stopDuck}
              onTouchStart={startDuck}
              onTouchEnd={stopDuck}
              className={styles.duckButton}
            >
              ⬇️ DUCK
            </button>
            <button onClick={togglePause} className={styles.pauseButton}>
              ⏸️ PAUSE
            </button>
          </div>
        )}

      <div className={styles.controlsInfo}>
        <div>
          🎮 <strong>Keyboard:</strong> ↑ Jump | ↓ Duck | SPACE Jump | ESC Pause
        </div>
        <div>
          📱 <strong>Mobile:</strong> Use buttons above or touch controls
        </div>
      </div>
    </div>
  )
}

export default HorseRunnerGame
