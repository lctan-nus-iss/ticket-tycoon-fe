export type GamePhase = 'action' | 'result'

export interface AssetDefinition {
  id:         string
  name:       string
  ticker:     string
  sector?:    string
  group?:     string
  region?:    string
  color:      string
  price:      number
  volatility: number
  dividend:   number
  bankrupt:   boolean
}

export interface Position {
  shares:  number
  avgCost: number
}

export interface Player {
  id:          string
  name:        string
  isAI:        boolean
  color:       string
  cash:        number
  portfolio:   Record<string, Position>
  netWorth:    number
  totalIncome: number
  archetypeId?: string
}

export interface MarketEvent {
  name:         string
  icon:         string
  severity:     'mild' | 'moderate' | 'severe'
  flavor:       string
  effects:      Record<string, number>
  lesson:       string
  bankruptRisk: Record<string, number>
  generatedBy?: string
}

export interface LogEntry {
  type: string
  msg:  string
  ts:   number
}

export interface TradeAction {
  action:    'BUY' | 'SELL' | 'HOLD'
  assetId?:  string
  amount?:   number
  pct?:      number
}

export interface PortfolioAnalysisRequest {
  quarter:               number
  year:                  number
  netWorth:              number
  cash:                  number
  cashPct:               number
  totalIncome:           number
  lastEventName:         string
  positionsSummary:      string
  assetClassMix:         string
  geographicExposure:    string
  weightedVolatility:    number
  annualYield:           number
  bankruptcyExposurePct: number
}

export interface DebriefRequest {
  playerName:          string
  quartersPlayed:      number
  finalNetWorth:       number
  peakNetWorth:        number
  tradeHistory:        string
  eventHistory:        string
  portfolioSnapshots:  string
  missedOpportunities: string
}
