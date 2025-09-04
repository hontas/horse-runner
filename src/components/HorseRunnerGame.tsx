import React, { useState, useEffect, useRef } from 'react'
import { useHorseRenderer } from './Horse'
import { soundSystem } from '../utils/soundSystem'
import { particleSystem } from '../utils/particleSystem'
import { useTouchControls } from '../hooks/useTouchControls'
import { checkCollision } from '../utils/collisionHelpers'
import { drawBackground, drawUI, drawGameObject } from './GameObjectRenderer'
import {
  createInitialObjects,
  spawnNewObjects,
  handleCollisionEffects,
} from '../utils/gameLogic'
import { GameStateUpdater } from '../utils/gameStateUpdater'
import { GameObjectsManager } from '../utils/gameObjectsManager'
import {
  updateHorsePhysics,
  updateDrowningLogic,
  updateGroundCollision,
  updateBlockingState,
} from '../utils/gamePhysics'
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
  JUMP_FORCE,
  PLATFORM_HEIGHT,
  INITIAL_SPEED,
  SPEED_FACTOR_INCREASE_RATE,
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
  const objectsManager = useRef(new GameObjectsManager())

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

        // Use efficient state updater
        const updater = new GameStateUpdater(prev)
        const objManager = objectsManager.current

        // Update horse physics
        const { landedOnPlatform, hitPlatformWall } = updateHorsePhysics(
          updater,
          prev.horse,
          objManager.getPlatformObjects(),
          prev.speed
        )

        // Handle drowning animation
        updateDrowningLogic(updater, prev.horse)

        // Ground collision detection
        updateGroundCollision(updater, prev.horse, landedOnPlatform)

        // Update blocking state
        updateBlockingState(updater, prev.horse, hitPlatformWall)

        // Progressive speed factor increase with higher cap for more challenging late game
        const targetSpeedFactor = Math.min(2.2, 1.0 + prev.distance * SPEED_FACTOR_INCREASE_RATE)
        updater.updateGameStats({ speedFactor: targetSpeedFactor })

        // Update speed with natural slowdown recovery (but pause when horse is blocked)
        let newSpeed = prev.speed
        let newSpeedBoost = prev.speedBoost
        const currentHorse = updater.getCurrentHorse()

        if (!currentHorse.isBlocked) {
          // Only update speed/boost when horse is not blocked
          if (prev.speedBoost > 0) {
            // Positive speed boost (from apples) - makes horse faster
            newSpeedBoost = prev.speedBoost - 0.03
            newSpeed = (prev.baseSpeed + newSpeedBoost * 0.8) * targetSpeedFactor
          } else if (prev.speedBoost < 0) {
            // Negative speed effects (from mushrooms) - makes horse slower, recovers over time
            newSpeedBoost = Math.min(0, prev.speedBoost + 0.01) // Gradual recovery from slowdowns
            newSpeed = Math.max(prev.baseSpeed * 0.6, (prev.baseSpeed + newSpeedBoost) * targetSpeedFactor)
          } else {
            // No speed effects - natural deceleration
            newSpeed = Math.max(prev.baseSpeed * 0.8, prev.speed - 0.005)
            // Apply speed factor to maintain base difficulty progression
            if (newSpeed <= prev.baseSpeed) {
              newSpeed = prev.baseSpeed * targetSpeedFactor
            }
          }
        }
        // If horse is blocked, speed and speedBoost remain unchanged
        updater.updateGameStats({ speed: newSpeed, speedBoost: newSpeedBoost })

        // Update game objects efficiently
        let updatedObjects = objManager.updateObjects(prev.gameObjects, newSpeed, currentHorse.isBlocked)

        // Spawn new objects and remove off-screen ones
        updatedObjects = spawnNewObjects(updatedObjects, targetSpeedFactor)
        updater.updateGameObjects(updatedObjects)

        // Update distance (only if not blocked by terrain)
        if (!currentHorse.isBlocked) {
          updater.updateGameStats({ distance: prev.distance + Math.floor(newSpeed / 2) })
        }

        // Update particle system
        particleSystem.update()

        // Pre-filter objects for collision detection
        objManager.updateVisibleObjects(updatedObjects)

        // Check collisions with visible objects only
        objManager.getVisibleObjects().forEach((obj) => {
          let hasCollision = false
          
          // Special collision logic for floating platforms
          if (obj.type === 'floatingPlatform') {
            // For floating platforms, only collide if horse is at platform level or above
            // This allows the horse to walk underneath
            const horseHeight = currentHorse.isDucking ? DUCK_HEIGHT : HORSE_HEIGHT
            const horseBottom = currentHorse.y + horseHeight
            const platformTop = obj.y
            
            // Only collide if horse is at or above platform level
            if (horseBottom <= platformTop + 10) { // Small buffer for landing
              hasCollision = checkCollision(currentHorse, obj)
            }
          } else {
            // Standard collision for all other objects
            hasCollision = checkCollision(currentHorse, obj)
          }

          if (!obj.collected && hasCollision) {
            // Don't mark platforms or water holes as collected - they're permanent terrain
            if (obj.type !== 'platform' && obj.type !== 'waterHole' && obj.type !== 'floatingPlatform') {
              obj.collected = true
            }

            const currentState = updater.getUpdatedState()
            const collisionUpdates = handleCollisionEffects(
              currentState,
              obj,
              soundSystem
            )
            
            // Apply collision updates
            if (collisionUpdates.score !== undefined) {
              updater.updateGameStats({ score: collisionUpdates.score })
            }
            if (collisionUpdates.keys !== undefined) {
              updater.updateGameStats({ keys: collisionUpdates.keys })
            }
            if (collisionUpdates.speedBoost !== undefined) {
              updater.updateGameStats({ speedBoost: collisionUpdates.speedBoost })
            }
            if (collisionUpdates.gameRunning !== undefined) {
              updater.updateGameStats({ gameRunning: collisionUpdates.gameRunning })
            }
            if (collisionUpdates.horse) {
              updater.updateHorseStates({
                isDrowning: collisionUpdates.horse.isDrowning,
                drowningTimer: collisionUpdates.horse.drowningTimer,
              })
            }
          }
        })

        return updater.getUpdatedState()
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

    // Draw background with parallax elements
    drawBackground(ctx, GAME_WIDTH, GAME_HEIGHT, GROUND_Y, gameState.distance)

    if (gameState.gameStarted) {
      const objManager = objectsManager.current

      // Draw background objects first (water holes, platforms, obstacles)
      objManager.getBackgroundObjects().forEach((obj) => {
        drawGameObject(ctx, obj)
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
      objManager.getForegroundObjects().forEach((obj) => {
        drawGameObject(ctx, obj)
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
