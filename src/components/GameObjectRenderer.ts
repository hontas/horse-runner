import { GameObject } from '../types/gameTypes'
import { EMOJI_SIZE_BONUS } from '../constants/gameConstants'

/**
 * Renders a single game object on the canvas
 */
export const drawGameObject = (
  ctx: CanvasRenderingContext2D,
  obj: GameObject
): void => {
  // Save canvas state to prevent corruption
  ctx.save()
  
  switch (obj.type) {
    case 'fruit':
      // Draw apple emoji
      ctx.font = `${obj.height + EMOJI_SIZE_BONUS.fruit}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🍎', obj.x + obj.width / 2, obj.y + obj.height / 2)
      break

    case 'obstacle':
      // Draw cactus emoji
      ctx.font = `${obj.height + EMOJI_SIZE_BONUS.cactus}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🌵', obj.x + obj.width / 2, obj.y + obj.height / 2)
      break

    case 'star':
      // Draw star emoji
      ctx.font = `${obj.height + EMOJI_SIZE_BONUS.star}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⭐', obj.x + obj.width / 2, obj.y + obj.height / 2)
      break

    case 'key':
      // Draw key emoji
      ctx.font = `${obj.height + EMOJI_SIZE_BONUS.key}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🗝️', obj.x + obj.width / 2, obj.y + obj.height / 2)
      break

    case 'mushroom':
      // Draw mushroom emoji - slows down the horse
      ctx.font = `${obj.height + EMOJI_SIZE_BONUS.mushroom}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🍄', obj.x + obj.width / 2, obj.y + obj.height / 2)
      break

    case 'waterHole':
      drawWaterHole(ctx, obj)
      break

    case 'lowBarrier':
      // Draw rock emoji - low barrier you can duck under
      ctx.font = `${obj.height + EMOJI_SIZE_BONUS.rock}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🪨', obj.x + obj.width / 2, obj.y + obj.height / 2)
      break

    case 'highBarrier':
      drawHighBarrier(ctx, obj)
      break

    case 'platform':
      drawPlatform(ctx, obj)
      break

    case 'floatingPlatform':
      drawFloatingPlatform(ctx, obj)
      break
  }
  
  // Restore canvas state
  ctx.restore()
}

/**
 * Draw animated water hole
 */
const drawWaterHole = (
  ctx: CanvasRenderingContext2D,
  obj: GameObject
): void => {
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
}

/**
 * Draw high barrier (stone wall)
 */
const drawHighBarrier = (
  ctx: CanvasRenderingContext2D,
  obj: GameObject
): void => {
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
}

/**
 * Draw platform terrain
 */
const drawPlatform = (ctx: CanvasRenderingContext2D, obj: GameObject): void => {
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
}

/**
 * Draw floating platform terrain (same style as ground platforms but floating in air)
 */
const drawFloatingPlatform = (
  ctx: CanvasRenderingContext2D,
  obj: GameObject
): void => {
  // Use same colors as regular platforms but slightly lighter for floating effect
  const colors = ['#A0938B', '#B0622D', '#DD953F'] // Slightly lighter shades
  const level = obj.platformLevel || 1

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

  // Add subtle shadow beneath for floating effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.fillRect(obj.x + 2, obj.y + obj.height + 2, obj.width - 4, 6)
}

/**
 * Renders the game background (sky, ground, grass) with clouds
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  gameWidth: number,
  gameHeight: number,
  groundY: number,
  distance: number
): void => {
  // Clear canvas with sky color
  ctx.fillStyle = '#87CEEB'
  ctx.fillRect(0, 0, gameWidth, gameHeight)

  // Draw clouds (medium parallax)
  drawClouds(ctx, gameWidth, gameHeight, distance * 0.3)

  // Draw ground
  ctx.fillStyle = '#A0522D'
  ctx.fillRect(0, groundY, gameWidth, gameHeight - groundY)

  // Draw grass
  ctx.fillStyle = '#228B22'
  ctx.fillRect(0, groundY - 10, gameWidth, 10)
}


/**
 * Draw fluffy clouds
 */
const drawClouds = (
  ctx: CanvasRenderingContext2D,
  gameWidth: number,
  _gameHeight: number,
  offset: number
): void => {
  ctx.fillStyle = '#FFFFFF'
  
  // Draw several clouds at different positions
  const cloudPositions = [
    { x: 100, y: 60, size: 1.0 },
    { x: 300, y: 40, size: 0.8 },
    { x: 550, y: 80, size: 1.2 },
    { x: 750, y: 50, size: 0.9 }
  ]
  
  cloudPositions.forEach(cloud => {
    const x = (cloud.x - offset) % (gameWidth + 200) - 100
    drawSingleCloud(ctx, x, cloud.y, cloud.size)
  })
}

/**
 * Draw a single fluffy cloud
 */
const drawSingleCloud = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void => {
  const s = size * 20
  
  // Cloud body - multiple overlapping circles
  ctx.beginPath()
  ctx.arc(x, y, s, 0, Math.PI * 2)
  ctx.arc(x + s * 0.8, y, s * 0.8, 0, Math.PI * 2)
  ctx.arc(x + s * 1.6, y, s * 0.9, 0, Math.PI * 2)
  ctx.arc(x + s * 2.2, y, s * 0.7, 0, Math.PI * 2)
  ctx.arc(x + s * 0.4, y - s * 0.5, s * 0.6, 0, Math.PI * 2)
  ctx.arc(x + s * 1.2, y - s * 0.4, s * 0.7, 0, Math.PI * 2)
  ctx.arc(x + s * 1.8, y - s * 0.3, s * 0.5, 0, Math.PI * 2)
  ctx.fill()
}


/**
 * Renders the game UI elements
 */
export const drawUI = (
  ctx: CanvasRenderingContext2D,
  score: number,
  distance: number,
  speed: number,
  keys: number,
  _speedFactor: number
): void => {
  // Save canvas state for UI rendering
  ctx.save()
  
  // Set text alignment for UI
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Draw UI
  ctx.fillStyle = 'white'
  ctx.font = '16px Arial'
  ctx.fillText(`Score: ${score}`, 10, 30)
  ctx.fillText(`Distance: ${Math.floor(distance)}m`, 10, 50)
  ctx.fillText(`Speed: ${speed.toFixed(1)}`, 10, 70)
  ctx.fillText(`Keys: ${keys}`, 10, 90)
  
  // Restore canvas state
  ctx.restore()
}
