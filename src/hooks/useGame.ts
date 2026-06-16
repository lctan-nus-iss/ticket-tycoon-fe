import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import type { GameStateDTO } from '../store/types'

const api = axios.create({ baseURL: '/api' })

interface GameSession {
  gameId:    string
  state:     GameStateDTO | null
  loading:   boolean
  error:     string | null
}

export function useGame() {
  const navigate = useNavigate()
  const [session, setSession] = useState<GameSession>({
    gameId: '', state: null, loading: false, error: null,
  })

  const setLoading = (loading: boolean) =>
    setSession(s => ({ ...s, loading, error: null }))

  const setError = (error: string) =>
    setSession(s => ({ ...s, loading: false, error }))

  const setState = (gameId: string, state: GameStateDTO) =>
    setSession({ gameId, state, loading: false, error: null })

  /** Start a new game session */
  const startGame = useCallback(async (humanName: string, aiIds: string[]) => {
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>('/game/start', {
        humanName, aiArchetypeIds: aiIds,
      })
      setState(data.gameId, data)
      navigate('/game')
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
    }
  }, [navigate])

  /** Advance quarter — triggers event generation + AI player turns on the backend */
  const advanceQuarter = useCallback(async () => {
    if (!session.gameId) return
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>(`/game/${session.gameId}/advance`)
      setState(session.gameId, data)
      if (data.gameOver) navigate('/win')
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
    }
  }, [session.gameId, navigate])

  /** Human player buy */
  const buy = useCallback(async (assetId: string, amount: number) => {
    if (!session.gameId) return
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>(
        `/game/${session.gameId}/buy`, { assetId, amount })
      setState(session.gameId, data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
    }
  }, [session.gameId])

  /** Human player sell */
  const sell = useCallback(async (assetId: string, pct: number) => {
    if (!session.gameId) return
    setLoading(true)
    try {
      const { data } = await api.post<GameStateDTO>(
        `/game/${session.gameId}/sell`, { assetId, pct })
      setState(session.gameId, data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message)
    }
  }, [session.gameId])

  return { session, startGame, advanceQuarter, buy, sell }
}
