import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useGame } from '../hooks/useGame'
import { MarketBoard } from '../components/market/MarketBoard'
import { PortfolioAnalysisDrawer } from '../components/portfolio/PortfolioAnalysisDrawer'
import { AMAP } from '../data/assets'

function fmt(n: number) {
  if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}
function fmtP(n: number) { return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%` }

function CollapseToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 6px',
        color:'#8A826E', fontSize:14, lineHeight:1, borderRadius:4,
        display:'flex', alignItems:'center' }}
      aria-label={open ? 'Collapse' : 'Expand'}
    >
      {open ? '▾' : '▸'}
    </button>
  )
}

export function GamePage() {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [eventOpen,       setEventOpen]       = useState(true)
  const [leaderboardOpen, setLeaderboardOpen] = useState(true)
  const [marketOpen,      setMarketOpen]      = useState(true)
  const [portfolioOpen,   setPortfolioOpen]   = useState(true)
  const [logOpen,         setLogOpen]         = useState(true)
  const [tradeAmount,     setTradeAmount]     = useState('10000')
  const [sellPct,         setSellPct]         = useState(25)
  const [tradeError,      setTradeError]      = useState<string | null>(null)
  const {
    gameId, players, prices, prevPrices, bankruptAssets,
    quarter, year, phase, currentEvent, eventLoading, log,
    selectedAsset, actionTab,
    buyAsset, sellAsset, addLog, calcNetWorths, payIncome,
    advanceQuarter: advanceLocal, setSelectedAsset, setActionTab,
  } = useGameStore()
  const { session, advanceQuarter, buy, sell } = useGame()
  const apiLoading = session.loading

  const human  = players[0]
  const sorted = [...players].sort((a,b) => b.netWorth - a.netWorth)

  if (!human) return <Navigate to="/" replace />

  function chgPct(id: string) {
    const c = prices[id], p = prevPrices[id]
    if (!p || Math.abs(c - p) < 0.01) return 0
    return (c - p) / p
  }

  const entries = Object.entries(human.portfolio)
    .filter(([id]) => !bankruptAssets[id] && human.portfolio[id].shares > 0)
  const selected = selectedAsset ? AMAP[selectedAsset] : null
  const selectedPrice = selectedAsset ? prices[selectedAsset] ?? 0 : 0
  const selectedPosition = selectedAsset ? human.portfolio[selectedAsset] : undefined
  const selectedValue = selectedPosition ? selectedPosition.shares * selectedPrice : 0
  const selectedBankrupt = selectedAsset ? !!bankruptAssets[selectedAsset] : false
  const tradeMessage = tradeError || session.error
  const cashIncome = human.cash * 0.0025
  const dividendIncome = entries.reduce((sum, [id, pos]) => {
    const asset = AMAP[id]
    if (!asset || bankruptAssets[id] || !asset.dividend) return sum
    return sum + pos.shares * (prices[id] ?? 0) * asset.dividend
  }, 0)
  const nextPassiveIncome = cashIncome + dividendIncome

  const clearTransaction = () => {
    setSelectedAsset(null)
    setActionTab('buy')
    setTradeAmount('10000')
    setSellPct(25)
    setTradeError(null)
  }

  const runBuy = async () => {
    if (!selectedAsset || !selected) {
      setTradeError('Select an asset from the market board first.')
      return
    }
    const amount = Number(tradeAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setTradeError('Enter a positive buy amount.')
      return
    }
    if (amount > human.cash) {
      setTradeError('Insufficient cash.')
      return
    }
    setTradeError(null)
    if (gameId) {
      const ok = await buy(selectedAsset, amount)
      if (ok) clearTransaction()
      return
    }
    const err = buyAsset(selectedAsset, amount)
    if (err) setTradeError(err)
    else {
      addLog('buy', `Bought ${fmt(amount)} of ${selected.ticker}`)
      clearTransaction()
    }
  }

  const runSell = async () => {
    if (!selectedAsset || !selected) {
      setTradeError('Select an asset from the market board first.')
      return
    }
    if (!selectedPosition || selectedPosition.shares <= 0) {
      setTradeError('No position to sell.')
      return
    }
    if (sellPct <= 0 || sellPct > 100) {
      setTradeError('Choose a sell percentage from 1 to 100.')
      return
    }
    setTradeError(null)
    if (gameId) {
      const ok = await sell(selectedAsset, sellPct)
      if (ok) clearTransaction()
      return
    }
    const err = sellAsset(selectedAsset, sellPct)
    if (err) setTradeError(err)
    else {
      addLog('sell', `Sold ${sellPct}% of ${selected.ticker}`)
      clearTransaction()
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* ── Header ── */}
      <div style={{ background:'#FDFAF4', borderBottom:'1px solid #E2D9C8',
        padding:'1.25rem 1.75rem', display:'grid', gridTemplateColumns:'1fr auto', gap:'2rem' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em',
            textTransform:'uppercase', color:'#2D6A5A', marginBottom:4 }}>
            Quarterly Market Strategy
          </div>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.8rem', fontWeight:900, lineHeight:1 }}>
            Ticker Tycoon
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, minWidth:280 }}>
          {[
            { lbl:'Quarter', val:`Q${quarter} ${2024+year}`, color:'#2D6A5A' },
            { lbl:'Target',  val:'$1M',           color:'#1C1A15' },
            { lbl:'Turn',    val:human.name,       color:'#1C1A15' },
            { lbl:'Mood',    val: eventLoading ? 'Loading…'
                                : currentEvent ? (currentEvent.severity === 'severe' ? 'Volatile'
                                  : currentEvent.severity === 'moderate' ? 'Shifting' : 'Calm')
                                : 'Neutral',       color:'#1C1A15' },
          ].map(({ lbl, val, color }) => (
            <div key={lbl} style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
              borderRadius:8, padding:'8px 12px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em',
                textTransform:'uppercase', color:'#8A826E', marginBottom:3 }}>{lbl}</div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.1rem',
                fontWeight:700, color }}>{val}</div>
            </div>
          ))}
          <button
            onClick={advanceQuarter}
            disabled={apiLoading}
            style={{ gridColumn:'1/-1', background: apiLoading ? '#8A826E' : '#2D6A5A', color:'#fff', border:'none',
              borderRadius:8, padding:10, fontSize:14, fontWeight:700,
              cursor: apiLoading ? 'not-allowed' : 'pointer' }}>
            {apiLoading ? 'Processing…' : 'Advance Quarter'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', minHeight:'calc(100vh - 140px)' }}>

        {/* LEFT */}
        <div style={{ borderRight:'1px solid #E2D9C8', padding:'1.5rem', overflowY:'auto' }}>

          {/* Event */}
          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            marginBottom:'1.25rem', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ background: currentEvent ? '#C0392B' : '#2D6A5A', borderBottom: eventOpen ? '1px solid #E2D9C8' : 'none',
              padding:'.6rem 1.1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.18em',
                textTransform:'uppercase', color:'rgba(255,255,255,.8)' }}>
                Market Event — Q{quarter} Year {year}
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {currentEvent && (
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px',
                    border:'1px solid rgba(255,255,255,.5)', color:'#fff',
                    textTransform:'uppercase' }}>
                    {currentEvent.severity?.toUpperCase()}
                  </span>
                )}
                <button
                  onClick={() => setEventOpen(o => !o)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 6px',
                    color:'rgba(255,255,255,.8)', fontSize:14, lineHeight:1, borderRadius:4 }}
                  aria-label={eventOpen ? 'Collapse' : 'Expand'}
                >
                  {eventOpen ? '▾' : '▸'}
                </button>
              </div>
            </div>
            {eventOpen && (
              <div style={{ padding:'1.25rem' }}>
                {eventLoading
                  ? <div style={{ display:'flex', alignItems:'center', gap:10, color:'#8A826E', fontSize:13 }}>
                      Generating market event...
                    </div>
                  : currentEvent ? (
                    <>
                      <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.1rem',
                        fontWeight:700, marginBottom:8 }}>
                        {currentEvent.icon} {currentEvent.name}
                      </div>
                      <div style={{ fontSize:13, color:'#4A4535', lineHeight:1.6,
                        borderLeft:'3px solid #C2DDD6', paddingLeft:10, marginBottom:10, fontStyle:'italic' }}>
                        {currentEvent.flavor}
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                        {Object.entries(currentEvent.effects ?? {}).map(([id, v]) => (
                          <span key={id} style={{ fontSize:11, fontWeight:700, padding:'2px 8px',
                            borderRadius:4,
                            background: v > 0.01 ? '#EAF3EF' : v < -0.01 ? '#FBEAEA' : '#F5F0E8',
                            color: v > 0.01 ? '#2D6A5A' : v < -0.01 ? '#C0392B' : '#8A826E' }}>
                            {id.toUpperCase()} {fmtP(v)}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em',
                        textTransform:'uppercase', color:'#2D6A5A', marginBottom:4 }}>
                        Why This Happened
                      </div>
                      <div style={{ fontSize:12, color:'#3A2A0A', lineHeight:1.65,
                        background:'#EAF3EF', borderRadius:6, padding:'10px 12px',
                        border:'1px solid #C2DDD6' }}>
                        {currentEvent.lesson}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize:13, color:'#8A826E', lineHeight:1.6 }}>
                      No market event yet. Advance the quarter to generate the first market event.
                    </div>
                  )}
              </div>
            )}
          </div>
          {/* Leaderboard */}
          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            marginBottom:'1.25rem', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom: leaderboardOpen ? '1px solid #E2D9C8' : 'none',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.05rem', fontWeight:700 }}>
                  Leaderboard
                </div>
                <div style={{ fontSize:11, color:'#8A826E', marginTop:2 }}>
                  Net worth = cash + market value of holdings
                </div>
              </div>
              <CollapseToggle open={leaderboardOpen} onClick={() => setLeaderboardOpen(o => !o)} />
            </div>
            {leaderboardOpen && <div style={{ padding:'1rem 1.1rem' }}>
              {sorted.map((p, i) => {
                const pct = Math.min(100, (p.netWorth / 1e6) * 100)
                return (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'.7rem .9rem', border:'1px solid #E2D9C8', borderRadius:8,
                    marginBottom:6, background: !p.isAI ? '#EAF3EF' : '#F5F0E8' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#8A826E', width:18 }}>
                      {i+1}
                    </div>
                    <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background:`${p.color}22`, color:p.color,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:700 }}>
                      {p.name.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>
                        {p.name}{!p.isAI ? ' ★' : ''}
                      </div>
                      <div style={{ height:4, background:'#E2D9C8', borderRadius:2, marginTop:4, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', borderRadius:2,
                          background:p.color, transition:'width .5s' }} />
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:20 }}>
                      {[{ lbl:'Cash', val:fmt(p.cash) }, { lbl:'Net Worth', val:fmt(p.netWorth) }].map(x => (
                        <div key={x.lbl} style={{ textAlign:'right' }}>
                          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.06em',
                            textTransform:'uppercase', color:'#8A826E' }}>{x.lbl}</div>
                          <div style={{ fontSize:14, fontWeight:700 }}>{x.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>}
          </div>

          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom: marketOpen ? '1px solid #E2D9C8' : 'none',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.05rem', fontWeight:700 }}>
                  Market Board
                </div>
                <div style={{ fontSize:11, color:'#8A826E', marginTop:2 }}>
                  Click any row to select for trading
                </div>
              </div>
              <CollapseToggle open={marketOpen} onClick={() => setMarketOpen(o => !o)} />
            </div>
            {marketOpen && (
              <div style={{ padding:'1.1rem' }}>
                <MarketBoard />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem',
          overflowY:'auto' }}>

          {/* Cash & Income */}
          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ padding:'1rem 1.1rem', borderBottom:'1px solid #E2D9C8' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em',
                textTransform:'uppercase', color:'#8A826E', marginBottom:4 }}>
                Available Cash
              </div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:'2rem',
                fontWeight:900, lineHeight:1.05, color:'#2D6A5A' }}>
                {fmt(human.cash)}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'1rem 1.1rem' }}>
              <div style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                borderRadius:8, padding:'9px 10px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                  textTransform:'uppercase', color:'#8A826E', marginBottom:4 }}>
                  Income Earned
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#1C1A15' }}>
                  {fmt(human.totalIncome)}
                </div>
              </div>
              <div style={{ background:'#EAF3EF', border:'1px solid #C2DDD6',
                borderRadius:8, padding:'9px 10px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                  textTransform:'uppercase', color:'#2D6A5A', marginBottom:4 }}>
                  Next Passive Income
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#2D6A5A' }}>
                  {fmt(nextPassiveIncome)}
                </div>
              </div>
              <div style={{ gridColumn:'1/-1', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ fontSize:11, color:'#8A826E' }}>
                  Cash interest: <strong style={{ color:'#1C1A15' }}>{fmt(cashIncome)}</strong>
                </div>
                <div style={{ fontSize:11, color:'#8A826E', textAlign:'right' }}>
                  Dividends: <strong style={{ color:'#1C1A15' }}>{fmt(dividendIncome)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction */}
          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom:'1px solid #E2D9C8',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.05rem', fontWeight:700 }}>
                  Transaction
                </div>
                <div style={{ fontSize:11, color:'#8A826E', marginTop:2 }}>
                  {selected ? `${selected.name} (${selected.ticker})` : 'Select an asset from the market board'}
                </div>
              </div>
              {selected && (
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                    textTransform:'uppercase', color:'#8A826E' }}>Price</div>
                  <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1rem', fontWeight:700 }}>
                    {fmt(selectedPrice)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding:'1rem 1.1rem' }}>
              {selected && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'#F5F0E8', border:'1px solid #E2D9C8', borderRadius:8,
                  padding:'8px 10px', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em',
                    textTransform:'uppercase', color:'#8A826E' }}>
                    Cash available
                  </span>
                  <span style={{ fontSize:14, fontWeight:800, color:'#2D6A5A' }}>
                    {fmt(human.cash)}
                  </span>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
                {(['buy','sell','hold'] as const).map(tab => (
                  <button key={tab}
                    onClick={() => setActionTab(tab)}
                    style={{ background: actionTab === tab ? '#2D6A5A' : '#F5F0E8',
                      color: actionTab === tab ? '#fff' : '#1C1A15',
                      border:'1px solid #D4C9B4', borderRadius:8, padding:'8px 6px',
                      fontSize:12, fontWeight:700, cursor:'pointer', textTransform:'uppercase' }}>
                    {tab}
                  </button>
                ))}
              </div>

              {!selected ? (
                <div style={{ fontSize:13, color:'#8A826E', lineHeight:1.6 }}>
                  Click a row in the market board to prepare a trade.
                </div>
              ) : selectedBankrupt ? (
                <div style={{ fontSize:13, color:'#C0392B', lineHeight:1.6,
                  background:'#FBEAEA', border:'1px solid #F5C6C6', borderRadius:8, padding:'10px 12px' }}>
                  This asset is bankrupt and cannot be traded.
                </div>
              ) : actionTab === 'buy' ? (
                <>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em',
                    textTransform:'uppercase', color:'#8A826E', marginBottom:8 }}>Buy amount</div>
                  <input
                    type="number"
                    min="0"
                    value={tradeAmount}
                    onChange={e => setTradeAmount(e.target.value)}
                    style={{ width:'100%', background:'#F5F0E8', border:'1px solid #D4C9B4',
                      borderRadius:8, padding:'10px 12px', fontSize:14, fontWeight:700,
                      color:'#1C1A15', outline:'none', marginBottom:8 }}
                  />
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginBottom:10 }}>
                    {[10,25,50,100].map(pct => (
                      <button key={pct}
                        onClick={() => setTradeAmount(String(Math.floor(human.cash * pct / 100)))}
                        style={{ background:'#F5F0E8', border:'1px solid #D4C9B4',
                          borderRadius:8, padding:'7px 4px', fontSize:11, fontWeight:700,
                          color:'#1C1A15', cursor:'pointer' }}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <button onClick={runBuy} disabled={apiLoading}
                    style={{ width:'100%', background: apiLoading ? '#8A826E' : '#2D6A5A',
                      color:'#fff', border:'none', borderRadius:8, padding:11,
                      fontSize:14, fontWeight:700, cursor: apiLoading ? 'not-allowed' : 'pointer' }}>
                    {apiLoading ? 'Submitting...' : `Buy ${selected.ticker}`}
                  </button>
                </>
              ) : actionTab === 'sell' ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                    <div style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                      borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                        textTransform:'uppercase', color:'#8A826E' }}>Holding</div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{selectedPosition?.shares.toFixed(2) ?? '0.00'}</div>
                    </div>
                    <div style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                      borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                        textTransform:'uppercase', color:'#8A826E' }}>Value</div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{fmt(selectedValue)}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginBottom:10 }}>
                    {[25,50,75,100].map(pct => (
                      <button key={pct}
                        onClick={() => setSellPct(pct)}
                        style={{ background: sellPct === pct ? '#FBEAEA' : '#F5F0E8',
                          border:`1px solid ${sellPct === pct ? '#C0392B' : '#D4C9B4'}`,
                          borderRadius:8, padding:'7px 4px', fontSize:11, fontWeight:700,
                          color: sellPct === pct ? '#C0392B' : '#1C1A15', cursor:'pointer' }}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <button onClick={runSell} disabled={apiLoading || !selectedPosition}
                    style={{ width:'100%', background: apiLoading || !selectedPosition ? '#8A826E' : '#C0392B',
                      color:'#fff', border:'none', borderRadius:8, padding:11,
                      fontSize:14, fontWeight:700,
                      cursor: apiLoading || !selectedPosition ? 'not-allowed' : 'pointer' }}>
                    {apiLoading ? 'Submitting...' : `Sell ${sellPct}%`}
                  </button>
                </>
              ) : (
                <div style={{ fontSize:13, color:'#8A826E', lineHeight:1.6 }}>
                  Holding selected. No transaction will be submitted.
                </div>
              )}

              {tradeMessage && (
                <div style={{ color:'#C0392B', fontSize:12, marginTop:10,
                  background:'#FBEAEA', border:'1px solid #F5C6C6', borderRadius:8, padding:'9px 10px' }}>
                  {tradeMessage}
                </div>
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom: portfolioOpen ? '1px solid #E2D9C8' : 'none',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.05rem', fontWeight:700 }}>
                  Your Portfolio
                </div>
                <div style={{ fontSize:11, color:'#8A826E', marginTop:2 }}>
                  Review cash, positions, and exposure
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#2D6A5A' }}>
                  {fmt(human.cash)} CASH
                </span>
                <button
                  onClick={() => setDrawerOpen(true)}
                  style={{ fontSize:11, fontWeight:700, color:'#2D6A5A',
                    background:'#EAF3EF', border:'1px solid #C2DDD6', borderRadius:20,
                    padding:'3px 10px', cursor:'pointer' }}>
                  Analyse ↗
                </button>
                <CollapseToggle open={portfolioOpen} onClick={() => setPortfolioOpen(o => !o)} />
              </div>
            </div>
            {portfolioOpen && <div style={{ padding:'1rem 1.1rem' }}>
              {entries.length === 0
                ? <div style={{ fontSize:13, color:'#8A826E', fontStyle:'italic' }}>
                    No holdings yet.
                  </div>
                : entries.map(([id, pos]) => {
                  const price = prices[id] ?? 0
                  const val   = pos.shares * price
                  const gl    = val - pos.shares * pos.avgCost
                  const glP   = (gl / (pos.shares * pos.avgCost)) * 100
                  const chg   = chgPct(id)
                  return (
                    <div key={id} style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                      borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:700 }}>{id.toUpperCase()}</span>
                        <span style={{ fontFamily:'Playfair Display,serif', fontSize:14, fontWeight:700 }}>
                          {fmt(val)}
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#8A826E' }}>
                        <span>{pos.shares.toFixed(2)} units · avg {fmt(pos.avgCost)}</span>
                        <span style={{ color: gl >= 0 ? '#2D6A5A' : '#C0392B', fontWeight:600 }}>
                          {gl >= 0 ? '+' : ''}{fmt(gl)} ({glP.toFixed(1)}%)
                        </span>
                      </div>
                      {chg !== 0 && (
                        <div style={{ fontSize:11, color: chg >= 0 ? '#2D6A5A' : '#C0392B', marginTop:3 }}>
                          This qtr: {fmtP(chg)}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>}
          </div>

          {/* Quarter Log */}
          <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
            overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ padding:'.85rem 1.1rem', borderBottom: logOpen ? '1px solid #E2D9C8' : 'none',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.05rem', fontWeight:700 }}>
                Quarter Log
              </div>
              <CollapseToggle open={logOpen} onClick={() => setLogOpen(o => !o)} />
            </div>
            {logOpen && (
              <div style={{ padding:'1rem 1.1rem', maxHeight:200, overflowY:'auto' }}>
                {log.length === 0
                  ? <div style={{ fontSize:12, color:'#8A826E', fontStyle:'italic' }}>
                      No transactions yet.
                    </div>
                  : log.slice(0, 20).map((l, i) => (
                    <div key={i} style={{ fontSize:12, color:'#4A4535', padding:'5px 0',
                      borderBottom:'1px dashed #E2D9C8' }}>
                      <span style={{ fontWeight:700, marginRight:4,
                        color: l.type === 'buy' ? '#2D6A5A' : l.type === 'sell' ? '#C0392B'
                             : l.type === 'event' ? '#2D6A5A' : '#8A826E' }}>
                        [{l.type.toUpperCase()}]
                      </span>
                      {l.msg}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Drawer */}
      <PortfolioAnalysisDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        gameId={gameId || undefined}
      />
    </div>
  )
}
