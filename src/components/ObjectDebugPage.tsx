import React, { useRef, useEffect, useState } from 'react'
import { GameObject } from '../types/gameTypes'
import { drawGameObject } from './GameObjectRenderer'
import { CollectibleObjects } from '../objects/collectibles'
import { ObstacleObjects } from '../objects/obstacles'
import { TerrainObjects } from '../objects/terrain'
import { GROUND_Y } from '../constants/gameConstants'
import styles from './ObjectDebugPage.module.css'

type ObjectCategory = 'collectibles' | 'obstacles' | 'terrain'

interface ObjectDebugPageProps {
  onClose: () => void
}

export const ObjectDebugPage: React.FC<ObjectDebugPageProps> = ({
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedCategory, setSelectedCategory] =
    useState<ObjectCategory>('collectibles')

  // Generate sample objects for each category
  const generateSampleObjects = (category: ObjectCategory): GameObject[] => {
    const objects: GameObject[] = []
    const spacing = 120
    let x = 50

    switch (category) {
      case 'collectibles':
        // Generate fruits at different heights
        objects.push(CollectibleObjects.generateFruit(x))
        x += spacing
        objects.push(CollectibleObjects.generateFruit(x))
        x += spacing
        objects.push(CollectibleObjects.generateFruit(x))
        x += spacing

        // Generate stars
        objects.push(CollectibleObjects.generateStar(x))
        x += spacing
        objects.push(CollectibleObjects.generateStar(x))
        x += spacing

        // Generate keys
        objects.push(CollectibleObjects.generateKey(x))
        x += spacing
        objects.push(CollectibleObjects.generateKey(x))
        x += spacing

        // Generate mushrooms
        objects.push(CollectibleObjects.generateMushroom(x))
        x += spacing
        objects.push(CollectibleObjects.generateMushroom(x))
        break

      case 'obstacles':
        // Water holes
        objects.push(ObstacleObjects.generateWaterHole(x))
        x += spacing
        objects.push(ObstacleObjects.generateWaterHole(x))
        x += spacing

        // Low barriers
        objects.push(ObstacleObjects.generateLowBarrier(x))
        x += spacing
        objects.push(ObstacleObjects.generateLowBarrier(x))
        x += spacing

        // High barriers
        objects.push(ObstacleObjects.generateHighBarrier(x))
        x += spacing
        objects.push(ObstacleObjects.generateHighBarrier(x))
        x += spacing

        // Traditional obstacles
        objects.push(ObstacleObjects.generateObstacle(x))
        x += spacing
        objects.push(ObstacleObjects.generateObstacle(x))
        break

      case 'terrain':
        // Platforms level 1-3
        objects.push(TerrainObjects.generatePlatform(x, 1))
        x += spacing
        objects.push(TerrainObjects.generatePlatform(x, 2))
        x += spacing
        objects.push(TerrainObjects.generatePlatform(x, 3))
        x += spacing

        // Floating platforms
        objects.push(TerrainObjects.generateFloatingPlatform(x))
        x += spacing
        objects.push(TerrainObjects.generateFloatingPlatform(x))
        x += spacing

        break
    }

    return objects
  }

  // Render the debug canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = '#87CEEB' // Sky
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw ground
    ctx.fillStyle = '#A0522D' // Lighter dirt
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y)

    // Draw grass
    ctx.fillStyle = '#228B22'
    ctx.fillRect(0, GROUND_Y - 10, canvas.width, 10)

    // Generate and draw objects
    const objects = generateSampleObjects(selectedCategory)
    objects.forEach((obj) => {
      drawGameObject(ctx, obj)

      // Draw object info
      ctx.save()
      ctx.fillStyle = 'black'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(obj.type, obj.x + obj.width / 2, obj.y - 15)

      // Draw object dimensions
      ctx.font = '10px Arial'
      ctx.fillStyle = 'gray'
      ctx.fillText(
        `${obj.width}x${obj.height}`,
        obj.x + obj.width / 2,
        obj.y - 5
      )
      ctx.restore()
    })

    // Draw grid for reference
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Highlight ground line
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(canvas.width, GROUND_Y)
    ctx.stroke()

    ctx.restore()
  }, [selectedCategory])

  return (
    <div className={styles.debugPage}>
      <div className={styles.header}>
        <h2>Object Debug Viewer</h2>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.controls}>
        <label htmlFor="category-select">Category:</label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(e.target.value as ObjectCategory)
          }
          className={styles.categorySelect}
        >
          <option value="collectibles">Collectibles</option>
          <option value="obstacles">Obstacles</option>
          <option value="terrain">Terrain</option>
        </select>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={400}
          className={styles.debugCanvas}
        />
      </div>

      <div className={styles.info}>
        <h3>Category: {selectedCategory}</h3>
        <p>
          {selectedCategory === 'collectibles' &&
            'Fruits (🍎), Stars (⭐), Keys (🗝️), Mushrooms (🍄) - Items that can be collected for points or effects.'}
          {selectedCategory === 'obstacles' &&
            'Water Holes, Barriers, Obstacles - Items that can cause game over or special effects.'}
          {selectedCategory === 'terrain' &&
            'Platforms - Rideable terrain and environmental obstacles.'}
        </p>
        <p className={styles.instructions}>
          Red line indicates ground level (Y = {GROUND_Y}). Grid squares are
          50x50 pixels.
        </p>
      </div>
    </div>
  )
}
