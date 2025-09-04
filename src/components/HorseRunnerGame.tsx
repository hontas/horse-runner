import React, { useState, useEffect, useRef } from 'react'
import { useHorseRenderer } from './Horse'
import { soundSystem } from '../utils/soundSystem'
import { particleSystem } from '../utils/particleSystem'
import { useTouchControls } from '../hooks/useTouchControls'
import {
  checkCollision,
  checkPlatformLanding,
  checkPlatformWallCollision,
} from '../utils/collisionHelpers'
import { drawBackground, drawUI, drawGameObject } from './GameObjectRenderer'
import {
  createInitialObjects,
  spawnNewObjects,
  handleCollisionEffects,
} from '../utils/gameLogic'
import {
  StartScreen,
  PauseScreen,
  GameOverScreen,
  GameControls,
  ControlsInfo,
} from './GameOverlays'
import { GameState, HighScoreState } from '../types/gameTypes'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  HORSE_WIDTH,
  HORSE_HEIGHT,
  DUCK_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  PLATFORM_HEIGHT,
  INITIAL_SPEED,
  MIN_SPEED,
  DROWNING_ANIMATION_DURATION,
  DROWNING_BLOCK_DELAY,
  SPEED_FACTOR_INCREASE_RATE,
  MAX_SPEED_FACTOR,
} from '../constants/gameConstants'
import {
  loadHighScores,
  saveHighScores,
  addHighScore,
} from '../utils/highScores'
import styles from './HorseRunnerGame.module.css'

const HorseRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const lastSpawnX = useRef<number>(GAME_WIDTH)
  const keysPressed = useRef<Set<string>>(new Set())

  const [highScoreState, setHighScoreState] = useState<HighScoreState>(() =>
    loadHighScores()
  )

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
    speed: INITIAL_SPEED,
    baseSpeed: INITIAL_SPEED,
    speedBoost: 0,
    speedFactor: 1.0,
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

  // Handle canvas resizing for responsive layout
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const aspectRatio = GAME_WIDTH / GAME_HEIGHT

      let newWidth = containerRect.width - 20 // Account for padding
      let newHeight = newWidth / aspectRatio

      // If height would be too tall, constrain by height
      if (newHeight > containerRect.height - 20) {
        newHeight = containerRect.height - 20
        newWidth = newHeight * aspectRatio
      }

      // Set canvas display size (CSS)
      canvas.style.width = `${newWidth}px`
      canvas.style.height = `${newHeight}px`

      // Keep internal canvas size at game resolution for crisp graphics
      canvas.width = GAME_WIDTH
      canvas.height = GAME_HEIGHT
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 100) // Delay to allow orientation change to complete
    })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('orientationchange', resizeCanvas)
    }
  }, [])

  // Start game
  const startGame = async () => {
    console.log('Starting game...')

    // Resume audio context on user interaction
    await soundSystem.resumeAudioContext()

    const initialObjects = createInitialObjects()

    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      gameRunning: true,
      gamePaused: false,
      score: 0,
      distance: 0,
      keys: 0,
      speed: INITIAL_SPEED,
      speedBoost: 0,
      speedFactor: 1.0,
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

    // Clear any existing particles
    particleSystem.clear()

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

        // Allow jumping if horse is on ground or on a platform (with tolerance)
        if (prev.horse.y >= expectedY - 5) {
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

  // Handle high score submission
  const submitHighScore = (playerName: string) => {
    const newHighScore = {
      name: playerName.trim() || 'Anonymous',
      score: gameState.score,
      distance: Math.floor(gameState.distance),
      date: new Date().toLocaleDateString(),
    }

    const updatedScores = addHighScore(highScoreState.scores, newHighScore)

    const newHighScoreState = {
      scores: updatedScores,
      lastPlayerName: playerName.trim() || highScoreState.lastPlayerName,
    }

    setHighScoreState(newHighScoreState)
    saveHighScores(updatedScores, newHighScoreState.lastPlayerName)
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

  // Touch controls
  useTouchControls({
    canvasRef,
    gameState,
    startGame,
    togglePause,
    jump,
    startDuck,
    stopDuck,
  })

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
                newState.speed = Math.max(MIN_SPEED, newState.speed * 0.7)
                soundSystem.playSound('wallHit', 0.8)
                soundSystem.playSound('dustCloud', 0.4)
                // Create dust cloud effect when hitting platform wall
                particleSystem.createDustCloud(newState.horse.x + 60, newState.horse.y + 20)
              }
            }
          }
        })

        // Check if horse has cleared the blocking platform
        if (
          prev.horse.isBlocked &&
          !hitPlatformWall &&
          !newState.horse.isDrowning
        ) {
          newState.horse.isBlocked = false
        }

        // Handle drowning animation
        if (newState.horse.isDrowning) {
          newState.horse.drowningTimer += 16 // Roughly 16ms per frame at 60fps

          // Stop forward motion after horse has moved into the water
          if (
            newState.horse.drowningTimer >= DROWNING_BLOCK_DELAY &&
            !newState.horse.isBlocked
          ) {
            newState.horse.isBlocked = true
          }

          // Sink the horse into the water over time
          const sinkAmount =
            (newState.horse.drowningTimer / DROWNING_ANIMATION_DURATION) * 60
          newState.horse.y = GROUND_Y - HORSE_HEIGHT + sinkAmount

          // End game after drowning animation completes
          if (newState.horse.drowningTimer >= DROWNING_ANIMATION_DURATION) {
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

        // Update speed factor based on distance (progressive difficulty)
        newState.speedFactor = Math.min(
          MAX_SPEED_FACTOR,
          1.0 + newState.distance * SPEED_FACTOR_INCREASE_RATE
        )

        // Update speed
        if (newState.speedBoost > 0) {
          newState.speedBoost -= 0.02
          newState.speed =
            (newState.baseSpeed + newState.speedBoost) * newState.speedFactor
        } else {
          newState.speed = Math.max(2, newState.speed - 0.005)
          // Apply speed factor to base speed
          if (newState.speed <= newState.baseSpeed) {
            newState.speed = newState.baseSpeed * newState.speedFactor
          }
        }

        // Move all objects left and update them (only if not blocked)
        if (!newState.horse.isBlocked) {
          newState.gameObjects = newState.gameObjects.map((obj) => ({
            ...obj,
            x: obj.x - newState.speed,
          }))
        } else {
          // When blocked, objects don't move - horse stops completely
          newState.gameObjects = newState.gameObjects.map((obj) => ({ ...obj }))
        }

        // Spawn new objects and remove off-screen ones
        newState.gameObjects = spawnNewObjects(
          newState.gameObjects,
          newState.speedFactor
        )
        newState.gameObjects = newState.gameObjects.filter(
          (obj) => obj.x > -100
        )

        // Update distance (only if not blocked by terrain)
        if (!newState.horse.isBlocked) {
          newState.distance += Math.floor(newState.speed / 2)
        }

        // Update particle system
        particleSystem.update()

        // Check collisions
        newState.gameObjects.forEach((obj) => {
          if (!obj.collected && checkCollision(newState.horse, obj)) {
            // Don't mark platforms or water holes as collected - they're permanent terrain
            if (obj.type !== 'platform' && obj.type !== 'waterHole') {
              obj.collected = true
            }

            const collisionUpdates = handleCollisionEffects(
              newState,
              obj,
              soundSystem
            )
            Object.assign(newState, collisionUpdates)
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

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw background
    drawBackground(ctx, GAME_WIDTH, GAME_HEIGHT, GROUND_Y)

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

      // Draw horse with sprite animation
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

      // Draw foreground objects (collectibles)
      gameState.gameObjects.forEach((obj) => {
        if (obj.collected || obj.x + obj.width < 0 || obj.x > GAME_WIDTH + 50)
          return

        // Only draw collectible objects that should appear in front of the horse
        if (
          obj.type === 'fruit' ||
          obj.type === 'star' ||
          obj.type === 'key' ||
          obj.type === 'mushroom'
        ) {
          drawGameObject(ctx, obj)
        }
      })

      // Draw particle effects
      particleSystem.render(ctx)
    }

    // Draw UI
    drawUI(
      ctx,
      gameState.score,
      gameState.distance,
      gameState.speed,
      gameState.keys,
      gameState.speedFactor
    )
  }, [gameState, isImageLoaded, drawHorse])

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

        {/* Game Overlays */}
        {!gameState.gameStarted && <StartScreen onStartGame={startGame} />}

        {gameState.gameStarted && gameState.gamePaused && (
          <PauseScreen onTogglePause={togglePause} />
        )}

        {gameState.gameStarted &&
          !gameState.gameRunning &&
          !gameState.gamePaused && (
            <GameOverScreen
              gameState={gameState}
              highScores={highScoreState.scores}
              lastPlayerName={highScoreState.lastPlayerName}
              onStartGame={startGame}
              onSubmitHighScore={submitHighScore}
            />
          )}
      </div>

      {/* Control Buttons */}
      {gameState.gameStarted &&
        gameState.gameRunning &&
        !gameState.gamePaused && (
          <GameControls
            onJump={jump}
            onStartDuck={startDuck}
            onStopDuck={stopDuck}
            onTogglePause={togglePause}
          />
        )}

      <ControlsInfo />
    </div>
  )
}

export default HorseRunnerGame
