import axios from 'axios'
import type { PortfolioAnalysisRequest, DebriefRequest } from '../store/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const gameApi = {
  analysePortfolio: (gameId: string, playerId: string, req: PortfolioAnalysisRequest) =>
    api.post<string>(`/game/${gameId}/analyse/${playerId}`, req),

  debrief: (gameId: string, playerId: string, req: DebriefRequest) =>
    api.post(`/game/${gameId}/debrief/${playerId}`, req),

  getProviders: () =>
    api.get('/game/providers'),

  // Streaming portfolio analysis — returns EventSource
  analyseStream: (gameId: string, playerId: string): EventSource =>
    new EventSource(`/api/game/${gameId}/analyse/${playerId}/stream`),
}
