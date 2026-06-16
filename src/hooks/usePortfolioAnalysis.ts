import { useState, useCallback } from 'react'
import { gameApi } from '../api/gameApi'
import { useGameStore } from '../store/gameStore'
import { AMAP, STOCKS, REITS } from '../data/assets'
import type { PortfolioAnalysisRequest } from '../store/types'

export function usePortfolioAnalysis(gameId = 'local') {
  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const { players, prices, bankruptAssets, quarter, year, currentEvent } = useGameStore()
  const human = players[0]

  const buildRequest = useCallback((): PortfolioAnalysisRequest | null => {
    if (!human) return null
    const entries = Object.entries(human.portfolio)
      .filter(([id]) => !bankruptAssets[id] && human.portfolio[id].shares > 0)
    if (!entries.length) return null

    const totalInvested = entries.reduce((s, [id, pos]) =>
      s + pos.shares * (prices[id] ?? 0), 0)

    const weightedVol = entries.reduce((s, [id, pos]) => {
      const a = AMAP[id]; if (!a) return s
      return s + a.volatility * (pos.shares * prices[id]) / totalInvested
    }, 0)

    const weightedYield = entries.reduce((s, [id, pos]) => {
      const a = AMAP[id]; if (!a) return s
      return s + (a.dividend ?? 0) * (pos.shares * prices[id]) / totalInvested
    }, 0)

    const bankruptExp = entries.reduce((s, [id, pos]) => {
      const a = AMAP[id]; if (!a) return s
      return s + (a.bankrupt ? pos.shares * prices[id] : 0)
    }, 0) / totalInvested * 100

    // Build class/region maps
    const classMap: Record<string, number>  = {}
    const regionMap: Record<string, number> = {}
    entries.forEach(([id, pos]) => {
      const a   = AMAP[id]; if (!a) return
      const val = pos.shares * prices[id]
      const cls = STOCKS.find(s => s.id === id) ? 'Individual Stocks'
                : REITS.find(r  => r.id === id) ? 'Individual REITs'
                : a.region ? 'Regional ETFs' : a.group ?? 'ETF'
      classMap[cls] = (classMap[cls] ?? 0) + val
      if (a.region) regionMap[a.region] = (regionMap[a.region] ?? 0) + val
    })

    const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`
    const posSummary = entries.map(([id, pos]) => {
      const a   = AMAP[id]; if (!a) return ''
      const val = pos.shares * prices[id]
      const gl  = val - pos.shares * pos.avgCost
      return `${a.name}(${a.ticker}): ${fmt(val)} | P&L ${((gl/(pos.shares*pos.avgCost))*100).toFixed(1)}% | vol ${(a.volatility*100).toFixed(0)}${a.bankrupt?' BANKRUPT_RISK':''}`
    }).join('\n')

    return {
      quarter, year,
      netWorth:              human.netWorth,
      cash:                  human.cash,
      cashPct:               (human.cash / human.netWorth) * 100,
      totalIncome:           human.totalIncome,
      lastEventName:         currentEvent?.name ?? 'None',
      positionsSummary:      posSummary,
      assetClassMix:         Object.entries(classMap).map(([k,v]) => `${k}: ${((v/totalInvested)*100).toFixed(0)}%`).join(', '),
      geographicExposure:    Object.entries(regionMap).map(([k,v]) => `${k}: ${((v/totalInvested)*100).toFixed(0)}%`).join(', '),
      weightedVolatility:    weightedVol,
      annualYield:           weightedYield * 4,
      bankruptcyExposurePct: bankruptExp,
    }
  }, [human, prices, bankruptAssets, quarter, year, currentEvent])

  const analyse = useCallback(async () => {
    const req = buildRequest()
    if (!req) { setError('No portfolio to analyse'); return }
    setLoading(true); setText(''); setError(null)
    try {
      const { data } = await gameApi.analysePortfolio(gameId, human.id, req)
      setText(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [buildRequest, gameId, human?.id])

  const analyseStreaming = useCallback(() => {
    const req = buildRequest()
    if (!req) return
    setLoading(true); setText(''); setError(null)
    const es = gameApi.analyseStream(gameId, human.id)
    es.onmessage = e => setText(prev => prev + e.data)
    es.onerror   = () => { es.close(); setLoading(false) }
  }, [buildRequest, gameId, human?.id])

  return { text, loading, error, analyse, analyseStreaming, buildRequest }
}
