import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { GameStateDTO } from '../store/types'
import { useGameStore } from '../store/gameStore'

const ADVANCE_TIMEOUT_MS = 180_000

const api = axios.create({ baseURL: '/api', timeout: 60_000 })

interface GameSession {
  gameId:    string
  state:     GameStateDTO | null
  loading:   boolean
  error:     string | null
}

export function useGame() {
  const navigate = useNavigate()
  const storeGameId = useGameStore(s => s.gameId)
  const setGameState = useGameStore(s => s.setGameState)
  const [session, setSession] = useState<GameSession>({
    gameId: '', state: null, loading: false, error: null,
  })
  const gameId = session.gameId || storeGameId

  const setLoading = (loading: boolean) =>
    setSession(s => ({ ...s, loading, error: null }))

  const setError = (error: string) =>
    setSession(s => ({ ...s, loading: false, error }))

  const setState = (gameId: string, state: GameStateDTO) => {
    setGameState(state)
    setSession({ gameId, state, loading: false, error: null })
  }

  /** Start a new game session */
  const startGame = useCallback(async (humanName: string, aiIds: string[]) => {
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>('/game/start', {
        humanPlayers: [{
          id: 'human',
          name: humanName,
          color: '#2D6A5A',
        }],
        aiArchetypeIds: aiIds,
      })
      setState(data.gameId, data)
      navigate('/game')
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
    }
  }, [navigate])

  /** Advance quarter — triggers event generation + AI player turns on the backend */
  const advanceQuarter = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>(
        `/game/${gameId}/advance`,
        undefined,
        { timeout: ADVANCE_TIMEOUT_MS },
      )
      setState(data.gameId || gameId, data)
      if (data.gameOver) navigate('/win')
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
    }
  }, [gameId, navigate])

  /** Human player buy */
  const buy = useCallback(async (assetId: string, amount: number) => {
    if (!gameId) return false
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>(
        `/game/${gameId}/buy`, { assetId, amount })
      setState(data.gameId || gameId, data)
      return true
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
      return false
    }
  }, [gameId])

  /** Human player sell */
  const sell = useCallback(async (assetId: string, pct: number) => {
    if (!gameId) return false
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>(
        `/game/${gameId}/sell`, { assetId, pct })
      setState(data.gameId || gameId, data)
      return true
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
      return false
    }
  }, [gameId])

  return { session, startGame, advanceQuarter, buy, sell }
}
