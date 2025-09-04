import React, { useEffect, useRef } from 'react'
import { useSpriteAnimation } from '../hooks/useSpriteAnimation'

interface HorseProps {
  x: number
  y: number
  width: number
  height: number
  isJumping: boolean
  isDucking: boolean
  isRunning: boolean
}

// Sprite frames for different animations (assuming 80x80 sprite sheet with 4 frames)
const RUNNING_FRAMES = [
  { x: 0, y: 0, width: 80, height: 80 }, // Frame 1
  { x: 80, y: 0, width: 80, height: 80 }, // Frame 2
]

const JUMPING_FRAME = { x: 160, y: 0, width: 80, height: 80 } // Frame 3
const DUCKING_FRAME = { x: 240, y: 0, width: 80, height: 80 } // Frame 4

const Horse: React.FC<HorseProps> = ({
  // x,
  // y,
  // width,
  // height,
  isJumping,
  isDucking,
  isRunning,
}) => {
  const imageRef = useRef<HTMLImageElement>()

  // Running animation
  const runningAnimation = useSpriteAnimation({
    frames: RUNNING_FRAMES,
    frameRate: 8, // 8 frames per second for running
    loop: true,
    autoStart: isRunning && !isJumping && !isDucking,
  })

  // Control animations based on state
  useEffect(() => {
    if (isRunning && !isJumping && !isDucking) {
      runningAnimation.play()
    } else {
      runningAnimation.pause()
    }
  }, [isRunning, isJumping, isDucking])

  // Load sprite image
  useEffect(() => {
    const img = new Image()
    img.src = '/horse-sprite.svg'
    img.onload = () => {
      imageRef.current = img
    }
  }, [])

  return null // This component doesn't render anything directly
}

// Export both the component and a hook for drawing
export const useHorseRenderer = (horseProps: HorseProps) => {
  const imageRef = useRef<HTMLImageElement>()

  // Running animation
  const runningAnimation = useSpriteAnimation({
    frames: RUNNING_FRAMES,
    frameRate: 8,
    loop: true,
    autoStart: false,
  })

  // Control animations
  useEffect(() => {
    if (
      horseProps.isRunning &&
      !horseProps.isJumping &&
      !horseProps.isDucking
    ) {
      runningAnimation.play()
    } else {
      runningAnimation.pause()
    }
  }, [horseProps.isRunning, horseProps.isJumping, horseProps.isDucking])

  // Load sprite image
  useEffect(() => {
    const img = new Image()
    img.src = '/horse-sprite.svg'
    img.onload = () => {
      imageRef.current = img
    }
  }, [])

  const getCurrentFrame = () => {
    if (horseProps.isDucking) return DUCKING_FRAME
    if (horseProps.isJumping) return JUMPING_FRAME
    if (horseProps.isRunning) return runningAnimation.currentFrame
    return RUNNING_FRAMES[0]
  }

  const drawHorse = (ctx: CanvasRenderingContext2D) => {
    if (!imageRef.current) return

    const frame = getCurrentFrame()

    ctx.drawImage(
      imageRef.current,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      horseProps.x,
      horseProps.y,
      horseProps.width,
      horseProps.height
    )
  }

  return { drawHorse, isImageLoaded: !!imageRef.current }
}

export default Horse
