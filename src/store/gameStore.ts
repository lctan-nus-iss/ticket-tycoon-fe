import { create } from 'zustand'
import { ALL_ASSETS, AMAP } from '../data/assets'
import type { Player, GamePhase, MarketEvent, LogEntry, TradeAction } from './types'

interface GameState {
  players:        Player[]
  prices:         Record<string, number>
  prevPrices:     Record<string, number>
  bankruptAssets: Record<string, boolean>
  quarter:        number
  year:           number
  phase:          GamePhase
  currentEvent:   MarketEvent | null
  eventLoading:   boolean
  log:            LogEntry[]
  gameOver:       boolean
  selectedAsset:  string | null
  actionTab:      'buy' | 'sell' | 'hold'

  // Actions
  initGame:       (humanName: string, aiIds: string[]) => void
  setEventLoading:(loading: boolean) => void
  setCurrentEvent:(event: MarketEvent | null) => void
  applyEventPrices:(effects: Record<string, number>) => void
  applyBankruptcy: (assetId: string) => void
  buyAsset:       (assetId: string, amount: number) => string | null
  sellAsset:      (assetId: string, pct: number) => string | null
  payIncome:      () => void
  calcNetWorths:  () => void
  advanceQuarter: () => void
  addLog:         (type: string, msg: string) => void
  setPhase:       (phase: GamePhase) => void
  setSelectedAsset:(id: string | null) => void
  setActionTab:   (tab: 'buy' | 'sell' | 'hold') => void
}

const BASE_PRICES: Record<string, number> = {}
ALL_ASSETS.forEach(a => { BASE_PRICES[a.id] = a.price })

export const useGameStore = create<GameState>((set, get) => ({
  players:        [],
  prices:         { ...BASE_PRICES },
  prevPrices:     { ...BASE_PRICES },
  bankruptAssets: {},
  quarter:        1,
  year:           1,
  phase:          'action',
  currentEvent:   null,
  eventLoading:   false,
  log:            [],
  gameOver:       false,
  selectedAsset:  null,
  actionTab:      'buy',

  initGame: (humanName, aiIds) => {
    const prices = { ...BASE_PRICES }
    const players: Player[] = [
      { id: 'human', name: humanName, isAI: false, color: '#2D6A5A',
        cash: 100000, portfolio: {}, netWorth: 100000, totalIncome: 0 }
    ]
    // AI players initialised with their archetype allocations
    set({ players, prices, prevPrices: { ...prices },
          bankruptAssets: {}, quarter: 1, year: 1, phase: 'action',
          currentEvent: null, eventLoading: false, log: [],
          gameOver: false, selectedAsset: null })
  },

  setEventLoading: loading => set({ eventLoading: loading }),
  setCurrentEvent: event  => set({ currentEvent: event }),
  setPhase:        phase  => set({ phase }),
  setSelectedAsset: id    => set({ selectedAsset: id }),
  setActionTab:    tab    => set({ actionTab: tab }),

  addLog: (type, msg) => set(s => ({
    log: [{ type, msg, ts: Date.now() }, ...s.log].slice(0, 100)
  })),

  applyEventPrices: (effects) => set(s => {
    const prices = { ...s.prices }
    Object.entries(effects).forEach(([id, change]) => {
      if (!s.bankruptAssets[id] && prices[id] !== undefined) {
        const asset = AMAP[id]
        const noise = (Math.random() * 2 - 1) * (asset?.volatility ?? 0.1) * 0.35
        prices[id] = Math.max(0.5, prices[id] * (1 + change + noise))
      }
    })
    return { prices, prevPrices: { ...s.prices } }
  }),

  applyBankruptcy: (assetId) => set(s => {
    const players = s.players.map(p => {
      if (!p.portfolio[assetId]) return p
      const { [assetId]: _, ...rest } = p.portfolio
      return { ...p, portfolio: rest }
    })
    return { bankruptAssets: { ...s.bankruptAssets, [assetId]: true }, players }
  }),

  buyAsset: (assetId, amount) => {
    const { players, prices, bankruptAssets } = get()
    const human = players[0]
    if (bankruptAssets[assetId]) return 'Asset is bankrupt'
    if (amount <= 0 || amount > human.cash) return 'Insufficient cash'
    const price  = prices[assetId]
    const shares = amount / price
    const pos    = human.portfolio[assetId] ?? { shares: 0, avgCost: price }
    const ns     = pos.shares + shares
    const newPos = { shares: ns, avgCost: (pos.shares * pos.avgCost + amount) / ns }
    const updated = { ...human, cash: human.cash - amount,
                      portfolio: { ...human.portfolio, [assetId]: newPos } }
    set(s => ({ players: [updated, ...s.players.slice(1)] }))
    get().calcNetWorths()
    return null
  },

  sellAsset: (assetId, pct) => {
    const { players, prices } = get()
    const human = players[0]
    const pos   = human.portfolio[assetId]
    if (!pos || pos.shares <= 0) return 'No position to sell'
    const ss  = pos.shares * (pct / 100)
    const val = ss * prices[assetId]
    const remaining = pos.shares - ss
    const portfolio = { ...human.portfolio }
    if (remaining < 0.0001) delete portfolio[assetId]
    else portfolio[assetId] = { ...pos, shares: remaining }
    const updated = { ...human, cash: human.cash + val, portfolio }
    set(s => ({ players: [updated, ...s.players.slice(1)] }))
    get().calcNetWorths()
    return null
  },

  payIncome: () => set(s => {
    const players = s.players.map(p => {
      let inc = p.cash * 0.0025
      Object.entries(p.portfolio).forEach(([id, pos]) => {
        const a = AMAP[id]
        if (!a || s.bankruptAssets[id] || !a.dividend) return
        inc += pos.shares * s.prices[id] * a.dividend
      })
      return { ...p, cash: p.cash + inc, totalIncome: p.totalIncome + inc }
    })
    return { players }
  }),

  calcNetWorths: () => set(s => {
    const players = s.players.map(p => {
      let w = p.cash
      Object.entries(p.portfolio).forEach(([id, pos]) => {
        if (!s.bankruptAssets[id]) w += pos.shares * (s.prices[id] ?? 0)
      })
      return { ...p, netWorth: w }
    })
    return { players }
  }),

  advanceQuarter: () => set(s => {
    const quarter = s.quarter >= 4 ? 1 : s.quarter + 1
    const year    = s.quarter >= 4 ? s.year + 1 : s.year
    return { quarter, year, phase: 'action', currentEvent: null }
  }),
}))
