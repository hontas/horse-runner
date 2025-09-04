import { useRef, useEffect } from 'react'
import { GameState } from '../types/gameTypes'
import {
  SWIPE_MIN_DISTANCE,
  SWIPE_MAX_TIME,
  TAP_MAX_TIME,
  TAP_DUCK_DURATION,
} from '../constants/gameConstants'

interface TouchControlsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  gameState: GameState
  startGame: () => void
  togglePause: () => void
  jump: () => void
  startDuck: () => void
  stopDuck: () => void
}

export const useTouchControls = ({
  canvasRef,
  gameState,
  startGame,
  togglePause,
  jump,
  startDuck,
  stopDuck,
}: TouchControlsProps) => {
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const isDuckingFromTouch = useRef<boolean>(false)
  const hasProcessedGesture = useRef<boolean>(false)
  const touchStartGroundLevel = useRef<number>(0)
  const tapDuckTimeout = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch) return

      touchStartY.current = touch.clientY
      touchStartTime.current = Date.now()
      hasProcessedGesture.current = false

      // Get canvas bounds for ground level calculation
      const rect = canvas.getBoundingClientRect()
      const canvasHeight = rect.height
      const groundLevel = canvasHeight * 0.75 // Approximate ground level
      touchStartGroundLevel.current = groundLevel

      // If game not started, start it
      if (!gameState.gameStarted) {
        startGame()
        hasProcessedGesture.current = true
        return
      }

      // If game over, restart
      if (
        gameState.gameStarted &&
        !gameState.gameRunning &&
        !gameState.gamePaused
      ) {
        startGame()
        hasProcessedGesture.current = true
        return
      }

      // If game is paused, resume
      if (gameState.gamePaused) {
        togglePause()
        hasProcessedGesture.current = true
        return
      }

      // Don't process tap actions here - wait to see if it's a swipe or tap
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch || hasProcessedGesture.current) return

      const deltaY = touch.clientY - touchStartY.current
      const deltaTime = Date.now() - touchStartTime.current

      // Only process swipes if game is running
      if (!gameState.gameRunning || gameState.gamePaused) return

      // Swipe detection - minimum distance and time check
      if (Math.abs(deltaY) > SWIPE_MIN_DISTANCE && deltaTime < SWIPE_MAX_TIME) {
        hasProcessedGesture.current = true

        if (deltaY < -SWIPE_MIN_DISTANCE) {
          // Swipe up - jump
          jump()
        } else if (deltaY > SWIPE_MIN_DISTANCE) {
          // Swipe down - duck
          if (!isDuckingFromTouch.current) {
            isDuckingFromTouch.current = true
            startDuck()
          }
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()

      const deltaTime = Date.now() - touchStartTime.current

      // If no gesture was processed and it was a quick touch (tap), process as tap
      if (!hasProcessedGesture.current && deltaTime < TAP_MAX_TIME) {
        // Only process taps if game is running
        if (gameState.gameRunning && !gameState.gamePaused) {
          // Get the touch position from the original touch start
          const rect = canvas.getBoundingClientRect()
          const tapY = touchStartY.current - rect.top
          const groundLevel = touchStartGroundLevel.current

          if (tapY < groundLevel) {
            // Tap above ground level - jump
            jump()
          } else {
            // Tap below ground level - brief duck action
            startDuck()

            // Clear any existing timeout
            if (tapDuckTimeout.current) {
              clearTimeout(tapDuckTimeout.current)
            }

            // Stop ducking after set duration
            tapDuckTimeout.current = window.setTimeout(() => {
              stopDuck()
              tapDuckTimeout.current = null
            }, TAP_DUCK_DURATION)
          }
        }
        hasProcessedGesture.current = true
      }

      // Stop ducking if we were ducking from a swipe gesture
      if (isDuckingFromTouch.current) {
        isDuckingFromTouch.current = false
        stopDuck()
      }
    }

    // Add touch event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('touchcancel', handleTouchEnd)

      // Clean up any pending duck timeout
      if (tapDuckTimeout.current) {
        clearTimeout(tapDuckTimeout.current)
        tapDuckTimeout.current = null
      }
    }
  }, [
    gameState.gameStarted,
    gameState.gameRunning,
    gameState.gamePaused,
    startGame,
    togglePause,
    jump,
    startDuck,
    stopDuck,
  ])
}
