import { useEffect, useRef, useState } from 'react'

interface SpriteFrame {
  x: number
  y: number
  width: number
  height: number
}

interface SpriteAnimationOptions {
  frames: SpriteFrame[]
  frameRate: number // frames per second
  loop?: boolean
  autoStart?: boolean
}

export const useSpriteAnimation = (options: SpriteAnimationOptions) => {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(options.autoStart ?? false)
  const intervalRef = useRef<number>()
  const startTimeRef = useRef<number>()

  const play = () => setIsPlaying(true)
  const pause = () => setIsPlaying(false)
  const stop = () => {
    setIsPlaying(false)
    setCurrentFrame(0)
  }
  const reset = () => setCurrentFrame(0)

  useEffect(() => {
    if (isPlaying && options.frames.length > 0) {
      const frameDuration = 1000 / options.frameRate // ms per frame
      
      const animate = () => {
        const now = performance.now()
        if (!startTimeRef.current) {
          startTimeRef.current = now
        }
        
        const elapsed = now - startTimeRef.current
        const frameIndex = Math.floor(elapsed / frameDuration) % options.frames.length
        
        setCurrentFrame(frameIndex)
        
        if (options.loop !== false || frameIndex < options.frames.length - 1) {
          intervalRef.current = requestAnimationFrame(animate)
        } else {
          setIsPlaying(false)
        }
      }
      
      intervalRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (intervalRef.current) {
          cancelAnimationFrame(intervalRef.current)
        }
      }
    } else {
      startTimeRef.current = undefined
    }
  }, [isPlaying, options.frames.length, options.frameRate, options.loop])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current)
      }
    }
  }, [])

  return {
    currentFrame: options.frames[currentFrame] || options.frames[0],
    frameIndex: currentFrame,
    play,
    pause,
    stop,
    reset,
    isPlaying
  }
}