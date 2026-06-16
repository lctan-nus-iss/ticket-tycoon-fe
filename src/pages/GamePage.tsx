import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { PortfolioAnalysisDrawer } from '../components/portfolio/PortfolioAnalysisDrawer'

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
  const {
    players, prices, prevPrices, bankruptAssets,
    quarter, year, phase, currentEvent, eventLoading, log,
    selectedAsset, actionTab,
    buyAsset, sellAsset, addLog, calcNetWorths, payIncome,
    advanceQuarter, setSelectedAsset, setActionTab,
  } = useGameStore()

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
            onClick={() => { /* trigger quarter advance with event generation */ }}
            style={{ gridColumn:'1/-1', background:'#2D6A5A', color:'#fff', border:'none',
              borderRadius:8, padding:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Advance Quarter
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', minHeight:'calc(100vh - 140px)' }}>

        {/* LEFT */}
        <div style={{ borderRight:'1px solid #E2D9C8', padding:'1.5rem', overflowY:'auto' }}>

          {/* Event */}
          {(eventLoading || currentEvent) && (
            <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
              marginBottom:'1.25rem', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
              <div style={{ background:'#C0392B', borderBottom: eventOpen ? '1px solid #E2D9C8' : 'none',
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
                        Generating market event…
                      </div>
                    : currentEvent && (
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
                    )}
                </div>
              )}
            </div>
          )}

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

          {/* Market table would go here — abbreviated for space */}
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
                <div style={{ fontSize:12, color:'#8A826E', fontStyle:'italic' }}>
                  (Full market table renders here — see MarketBoard component)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem',
          overflowY:'auto' }}>

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
      />
    </div>
  )
}
