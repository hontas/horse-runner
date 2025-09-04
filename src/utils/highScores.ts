import { HighScore, HighScoreState } from '../types/gameTypes'

const HIGH_SCORES_KEY = 'horse-runner-high-scores'
const LAST_PLAYER_NAME_KEY = 'horse-runner-last-player'
const VERSION_KEY = 'horse-runner-game-version'
const MAX_HIGH_SCORES = 5

// Use commit hash as primary version, fallback to build time for dev
const GAME_VERSION = __COMMIT_HASH__ !== 'dev' ? __COMMIT_HASH__ : __BUILD_TIME__

/**
 * Load high scores from local storage
 */
export const loadHighScores = (): HighScoreState => {
  try {
    const currentVersion = localStorage.getItem(VERSION_KEY)
    
    // Only reset on actual deployments (when we have a real commit hash, not 'dev')
    // Skip version check for local development to preserve high scores during dev
    const isProduction = __COMMIT_HASH__ !== 'dev'
    
    if (isProduction && currentVersion !== GAME_VERSION) {
      // Clear old scores on version change (production deployments only)
      localStorage.removeItem(HIGH_SCORES_KEY)
      localStorage.removeItem(LAST_PLAYER_NAME_KEY)
      localStorage.setItem(VERSION_KEY, GAME_VERSION)
      
      return {
        scores: [],
        lastPlayerName: '',
      }
    }

    const scoresData = localStorage.getItem(HIGH_SCORES_KEY)
    const lastPlayerName =
      localStorage.getItem(LAST_PLAYER_NAME_KEY) || ''

    const scores: HighScore[] = scoresData ? JSON.parse(scoresData) : []

    return {
      scores: scores.slice(0, MAX_HIGH_SCORES), // Ensure we never have more than 5
      lastPlayerName,
    }
  } catch (error) {
    console.warn('Failed to load high scores:', error)
    return {
      scores: [],
      lastPlayerName: '',
    }
  }
}

/**
 * Save high scores to local storage
 */
export const saveHighScores = (
  scores: HighScore[],
  lastPlayerName: string
): void => {
  try {
    // Keep only top 5 scores, sorted by score descending
    const topScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HIGH_SCORES)

    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores))
    localStorage.setItem(LAST_PLAYER_NAME_KEY, lastPlayerName)
  } catch (error) {
    console.warn('Failed to save high scores:', error)
  }
}

/**
 * Add a new high score and return updated list
 */
export const addHighScore = (
  currentScores: HighScore[],
  newScore: HighScore
): HighScore[] => {
  const updatedScores = [...currentScores, newScore]

  // Sort by score descending and keep only top 5
  return updatedScores
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HIGH_SCORES)
}

/**
 * Check if a score qualifies for the high score list
 */
export const isHighScore = (scores: HighScore[], newScore: number): boolean => {
  if (scores.length < MAX_HIGH_SCORES) {
    return true
  }

  const lowestHighScore = scores[scores.length - 1]?.score || 0
  return newScore > lowestHighScore
}

/**
 * Get rank of a score (1-based, or null if not in top 5)
 */
export const getScoreRank = (
  scores: HighScore[],
  scoreValue: number
): number | null => {
  // Create a temporary list with the new score
  const tempScores = [
    ...scores,
    { name: '', score: scoreValue, distance: 0, date: '' },
  ]
  const sortedScores = tempScores.sort((a, b) => b.score - a.score)

  const rank = sortedScores.findIndex((score) => score.score === scoreValue) + 1
  return rank <= MAX_HIGH_SCORES ? rank : null
}
