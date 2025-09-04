import React, { useState } from 'react'
import { GameState, HighScore } from '../types/gameTypes'
import { HighScoreEntry } from './HighScoreEntry'
import { isHighScore } from '../utils/highScores'
import styles from './HorseRunnerGame.module.css'

interface StartScreenProps {
  onStartGame: () => void
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => (
  <div className={styles.overlay}>
    <h2 className={styles.overlayTitle}>🐎 HORSE RUNNER</h2>
    <p className={styles.overlaySubtitle}>
      Jump over obstacles and collect fruits!
    </p>
    <div className={styles.instructions}>
      🍎 Fruit: +10 points, speed boost
      <br />
      🍄 Mushroom: slows down (no points)
      <br />
      ⭐ Star: +50 points
      <br />
      🗝️ Key: +25 points
      <br />
      🌊 Water Hole: Jump or drown!
      <br />
      🪨 Rock: Duck under!
      <br />
      🧱 High Barrier: Jump over!
      <br />
      🌵 Cactus: Game over!
      <br />
      📱 Mobile: Swipe ↑/↓ or tap above/below ground
    </div>
    <button onClick={onStartGame} className={styles.startButton}>
      🎮 START GAME
    </button>
    <p className={styles.hint}>Or press SPACE/ENTER</p>
  </div>
)

interface PauseScreenProps {
  onTogglePause: () => void
}

export const PauseScreen: React.FC<PauseScreenProps> = ({ onTogglePause }) => (
  <div className={styles.overlay}>
    <h2 className={styles.overlayTitle}>⏸️ PAUSED</h2>
    <button onClick={onTogglePause} className={styles.resumeButton}>
      ▶️ RESUME
    </button>
    <p className={styles.hint}>Or press SPACE/ESC</p>
  </div>
)

interface GameOverScreenProps {
  gameState: GameState
  highScores: HighScore[]
  lastPlayerName: string
  onStartGame: () => void
  onSubmitHighScore: (playerName: string) => void
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  gameState,
  highScores,
  lastPlayerName,
  onStartGame,
  onSubmitHighScore,
}) => {
  const [showHighScoreEntry, setShowHighScoreEntry] = useState(() =>
    isHighScore(highScores, gameState.score)
  )

  const handleSubmit = (playerName: string) => {
    onSubmitHighScore(playerName)
    setShowHighScoreEntry(false)
  }

  const handleSkip = () => {
    setShowHighScoreEntry(false)
  }

  return (
    <div className={styles.overlay}>
      <h2 className={styles.overlayTitle}>💥 GAME OVER</h2>
      <p className={styles.finalScore}>Final Score: {gameState.score}</p>
      <p className={styles.finalDistance}>
        Distance: {Math.floor(gameState.distance)}m
      </p>

      {showHighScoreEntry ? (
        <HighScoreEntry
          currentScore={gameState.score}
          currentDistance={Math.floor(gameState.distance)}
          highScores={highScores}
          lastPlayerName={lastPlayerName}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
        />
      ) : (
        <>
          {highScores.length > 0 && (
            <div className={styles.highScoreSection}>
              <h3 className={styles.highScoreTitle}>🏆 HIGH SCORES</h3>
              <div className={styles.highScoreList}>
                {highScores.map((score, index) => (
                  <div
                    key={`${score.name}-${score.score}-${index}`}
                    className={styles.highScoreItem}
                  >
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{score.name}</span>
                    <span className={styles.scoreValue}>{score.score}</span>
                    <span className={styles.distance}>{score.distance}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={onStartGame} className={styles.playAgainButton}>
            🔄 PLAY AGAIN
          </button>
          <p className={styles.hint}>Or press SPACE/ENTER</p>
        </>
      )}
    </div>
  )
}

interface GameControlsProps {
  onJump: () => void
  onStartDuck: () => void
  onStopDuck: () => void
  onTogglePause: () => void
}

export const GameControls: React.FC<GameControlsProps> = ({
  onJump,
  onStartDuck,
  onStopDuck,
  onTogglePause,
}) => (
  <div className={styles.controls}>
    <button onClick={onJump} className={styles.jumpButton}>
      ⬆️ JUMP
    </button>
    <button
      onMouseDown={onStartDuck}
      onMouseUp={onStopDuck}
      onMouseLeave={onStopDuck}
      onTouchStart={onStartDuck}
      onTouchEnd={onStopDuck}
      className={styles.duckButton}
    >
      ⬇️ DUCK
    </button>
    <button onClick={onTogglePause} className={styles.pauseButton}>
      ⏸️ PAUSE
    </button>
  </div>
)

export const ControlsInfo: React.FC = () => (
  <div className={styles.controlsInfo}>
    <div>
      🎮 <strong>Keyboard:</strong> ↑ Jump | ↓ Duck | SPACE Jump | ESC Pause
    </div>
    <div>
      📱 <strong>Mobile:</strong> Swipe ↑/↓, tap above/below ground, or use
      buttons
    </div>
  </div>
)
