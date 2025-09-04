import { GameObject } from '../types/gameTypes'
import { CollectibleRenderer } from '../objects/collectibles'
import { ObstacleRenderer } from '../objects/obstacles'
import { TerrainRenderer } from '../objects/terrain'

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
    // Collectibles
    case 'fruit':
      CollectibleRenderer.drawFruit(ctx, obj)
      break

    case 'star':
      CollectibleRenderer.drawStar(ctx, obj)
      break

    case 'key':
      CollectibleRenderer.drawKey(ctx, obj)
      break

    case 'mushroom':
      CollectibleRenderer.drawMushroom(ctx, obj)
      break

    // Obstacles
    case 'waterHole':
      ObstacleRenderer.drawWaterHole(ctx, obj)
      break

    case 'lowBarrier':
      ObstacleRenderer.drawLowBarrier(ctx, obj)
      break

    case 'highBarrier':
      ObstacleRenderer.drawHighBarrier(ctx, obj)
      break

    case 'obstacle':
      ObstacleRenderer.drawObstacle(ctx, obj)
      break

    // Terrain
    case 'platform':
      TerrainRenderer.drawPlatform(ctx, obj)
      break

    case 'floatingPlatform':
      TerrainRenderer.drawFloatingPlatform(ctx, obj)
      break

    case 'ramp':
      TerrainRenderer.drawRamp(ctx, obj)
      break

    case 'bridge':
      TerrainRenderer.drawBridge(ctx, obj)
      break

    case 'logPile':
      TerrainRenderer.drawLogPile(ctx, obj)
      break
  }
  
  // Restore canvas state
  ctx.restore()
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
