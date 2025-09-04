# 🐎 Horse Runner Game - Claude Development Guide

## Project Overview

A pixel-art horse running game built with React, TypeScript, and Web Audio API. Features animated sprite-based horse character, various obstacle types, collectible items, and immersive sound effects.

## 🎨 Visual Style Guidelines

- **Art Style**: Pixelated/blocky Minecraft-style with My Little Pony aesthetic
- **Color Palette**: Bright pastel colors, especially pinks (`#E91E63`, `#F8BBD9`, `#FF4081`)
- **Animation**: 8 FPS sprite animations for smooth but retro feel
- **Horse Design**: Facing right, colorful mane and tail, expressive large eyes

## 🎮 Game Mechanics

### Controls

- **Jump**: Space, Enter, Up Arrow - Horse jumps over obstacles
- **Duck**: Down Arrow (hold) - Horse ducks under low barriers continuously
- **Pause**: Escape key
- **Touch**: Mobile-friendly buttons with continuous ducking support

### Obstacle Types

1. **Water Holes** (`waterHole`): Deep pits extending to bottom of screen, animated water with bubbles
2. **Low Barriers** (`lowBarrier`): Above-ground wooden obstacles that can be ducked under
3. **High Barriers** (`highBarrier`): Tall stone walls that must be jumped over
4. **Traditional Walls** (`obstacle`): Classic solid barriers

### Platform System

5. **Platforms** (`platform`): Multi-level terrain that can be jumped onto and ridden
   - **Level 1**: Brown earth platforms (40px high)
   - **Level 2**: Gray stone platforms (80px high)
   - **Level 3**: Dark stone platforms (120px high)
   - **Mechanics**:
     - Horse can land on top and ride along
     - Hitting platform walls blocks forward motion and reduces speed by 30%
     - Different platform widths (40-140px) for varied gameplay

### Collectibles

- **🍎 Fruits**: +10 points, speed boost
- **⭐ Stars**: +50 points
- **🗝️ Keys**: +25 points

## 🔊 Sound System Guidelines

### 🎵 Current Sound Effects

The game uses a custom Web Audio API sound system (`src/utils/soundSystem.ts`) that generates all sounds procedurally:

- `jump` - Ascending frequency sweep (220Hz → 440Hz)
- `collect` - Pleasant chime for fruits/keys
- `star` - Musical C-E-G sequence
- `duck` - Low whoosh noise
- `speedBoost` - Rising arpeggio
- `gameOver` - Descending tone
- `waterSplash` - Sharp noise burst for drowning
- `platformLand` - Solid thump when landing on platforms
- `wallHit` - Bonk sound when hitting platform walls

### 🎼 Background Music

- Looping 8-second chord progression: C - Am - F - G
- Multi-voice harmony with gentle transitions
- Quiet volume (20%) to not interfere with gameplay

### ⚠️ IMPORTANT: Sound Integration Requirements

**When adding ANY new game mechanics, effects, or interactions, you MUST add appropriate sound effects:**

1. **New Obstacles**: Each obstacle type needs unique collision sounds
2. **New Collectibles**: Each collectible should have distinct pickup sounds
3. **New Moves/Abilities**: Any new horse actions need audio feedback
4. **Visual Effects**: Particle effects, animations should have corresponding audio
5. **UI Interactions**: Menu clicks, button presses need sound feedback

### 🛠️ Adding New Sounds

When implementing new features, follow this process:

1. **Generate the sound** in `soundSystem.ts`:

   ```typescript
   // Add to initializeSounds() method
   const newEffectBuffer = await this.generateTone(
     frequency,
     duration,
     type,
     envelope
   )
   this.sounds.set('newEffectName', newEffectBuffer)
   ```

2. **Play the sound** in game events:

   ```typescript
   // In collision detection or interaction handlers
   soundSystem.playSound('newEffectName', volume)
   ```

3. **Sound Design Guidelines**:
   - **Positive actions**: Use major scales, ascending tones
   - **Negative events**: Use minor scales, descending tones
   - **Movement sounds**: Use noise with envelopes
   - **Magical effects**: Use arpeggios or chord sequences
   - **Volume levels**: Keep effects 0.4-0.8, music at 0.2

### 🎯 Sound Integration Examples

```typescript
// Example: New power-up collectible
case 'powerUp':
  newState.score += 100;
  newState.specialAbility = true;
  soundSystem.playSound('powerUpChime', 0.8); // High-energy sound
  break;

// Example: New obstacle type
case 'spikes':
  newState.gameRunning = false;
  soundSystem.playSound('spikeHit', 0.9); // Sharp, painful sound
  soundSystem.stopBackgroundMusic();
  break;
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── HorseRunnerGame.tsx    # Main game component
│   ├── Horse.tsx              # Horse sprite animation
│   └── *.module.css          # Component-specific styles
├── hooks/
│   └── useSpriteAnimation.ts  # Sprite animation hook
├── utils/
│   └── soundSystem.ts         # Web Audio API sound system
└── public/
    └── horse-sprite.svg       # Horse sprite sheet (4 frames)
```

## 🔧 Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes TypeScript check)
- `npm run lint` - Run ESLint with TypeScript support
- `npm run preview` - Preview production build
- `npm test` - Run comprehensive checks (types, formatting, lint)

## 🎯 Key Technical Details

### Sprite Animation

- 4-frame sprite sheet: Running (2 frames), Jumping, Ducking
- Located at `/public/horse-sprite.svg`
- 80×80 pixel frames, 320×80 total sprite sheet
- Controlled by `useSpriteAnimation` hook at 8 FPS

### Canvas Rendering

- Game size: 800×400 pixels
- Ground level at Y=300
- 60 FPS game loop using `requestAnimationFrame`
- Layered rendering: background → ground → horse → objects → UI

### Platform System Architecture

- **Platform Levels**: 0 (ground) to 3 (highest platform - 120px high)
- **Landing Detection**: `checkPlatformLanding()` with 15px tolerance
- **Wall Collision**: `checkPlatformWallCollision()` blocks forward motion
- **Visual Rendering**: Color-coded by level with grass tops and 3D edges
- **Speed Penalty**: 30% speed reduction when hitting platform walls
- **Horse State**: Tracks `currentPlatformLevel` and `isBlocked` status

### Collision Detection

- Axis-aligned bounding box (AABB) collision
- Smart collision for different obstacle types
- Height adjustments for ducking horse

### State Management

- React useState for game state
- useRef for animation loops and key tracking
- Persistent key state for continuous ducking

## 🚀 Future Enhancement Guidelines

When adding new features, always consider:

1. **Visual Feedback**: Does it need animation or visual effects?
2. **Audio Feedback**: What sound would enhance this interaction?
3. **Player Control**: How does it fit with existing controls?
4. **Difficulty Balance**: Does it make the game more engaging?
5. **Performance**: Will it affect the 60 FPS target?

Remember: **Every interaction should have both visual and audio feedback** to create an engaging, polished game experience!
