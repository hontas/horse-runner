import React, { useState, useEffect, useCallback } from 'react'
import { HighScore } from '../types/gameTypes'
import styles from './HorseRunnerGame.module.css'

interface HighScoreEntryProps {
  currentScore: number
  currentDistance: number
  highScores: HighScore[]
  lastPlayerName: string
  onSubmit: (playerName: string) => void
  onSkip: () => void
}

export const HighScoreEntry: React.FC<HighScoreEntryProps> = ({
  currentScore,
  currentDistance,
  highScores,
  lastPlayerName,
  onSubmit,
  onSkip,
}) => {
  const [playerName, setPlayerName] = useState(lastPlayerName)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and limit to 3 characters
    const value = e.target.value.toUpperCase().slice(0, 3)
    setPlayerName(value)
  }

  const handleSubmit = useCallback(() => {
    if (!hasSubmitted) {
      setHasSubmitted(true)
      onSubmit(playerName)
    }
  }, [hasSubmitted, onSubmit, playerName])

  // Prevent global Enter handler when high score entry is active
  useEffect(() => {
    if (!hasSubmitted) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault()
          e.stopPropagation()
          handleSubmit()
        }
      }

      document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [hasSubmitted, handleSubmit])

  const handleSkip = () => {
    if (!hasSubmitted) {
      setHasSubmitted(true)
      onSkip()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSubmit()
    }
  }

  if (hasSubmitted) {
    return (
      <div className={styles.highScoreSection}>
        <h3 className={styles.highScoreTitle}>🏆 HIGH SCORES</h3>
        <div className={styles.highScoreList}>
          {highScores.map((score, index) => (
            <div
              key={`${score.name}-${score.score}-${index}`}
              className={`${styles.highScoreItem} ${
                score.score === currentScore ? styles.newHighScore : ''
              }`}
            >
              <span className={styles.rank}>#{index + 1}</span>
              <span className={styles.name}>{score.name}</span>
              <span className={styles.scoreValue}>{score.score}</span>
              <span className={styles.distance}>{score.distance}m</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.highScoreEntry}>
      <h3 className={styles.newHighScoreTitle}>🎉 NEW HIGH SCORE!</h3>
      <p className={styles.scoreAchievement}>
        Score: <strong>{currentScore}</strong> | Distance:{' '}
        <strong>{currentDistance}m</strong>
      </p>

      <div className={styles.nameInputSection}>
        <label htmlFor="playerName" className={styles.nameLabel}>
          Enter your name:
        </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={handleNameChange}
          onKeyPress={handleKeyPress}
          className={styles.nameInput}
          maxLength={3}
          placeholder="AAA"
          autoFocus
        />
      </div>

      <div className={styles.highScoreButtons}>
        <button onClick={handleSubmit} className={styles.submitButton}>
          💾 SAVE SCORE
        </button>
        <button onClick={handleSkip} className={styles.skipButton}>
          ⏭️ SKIP
        </button>
      </div>
    </div>
  )
}
