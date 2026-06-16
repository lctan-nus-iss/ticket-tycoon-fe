import React, { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { usePortfolioAnalysis } from '../../hooks/usePortfolioAnalysis'
import { useGameStore } from '../../store/gameStore'
import { AMAP, STOCKS, REITS } from '../../data/assets'

interface Props {
  open:    boolean
  onClose: () => void
  gameId?: string
}

const PIE_COLORS = ['#2D6A5A','#C0392B','#2C5282','#C08B2A','#5B2D8A','#1A6B5A','#6B7280']

function fmt(n: number) {
  if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

export function PortfolioAnalysisDrawer({ open, onClose, gameId = 'local' }: Props) {
  const { players, prices, bankruptAssets, quarter, year } = useGameStore()
  const { text, loading, error, analyse } = usePortfolioAnalysis(gameId)
  const [metrics, setMetrics] = useState<any>(null)
  const human = players[0]

  useEffect(() => {
    if (!open || !human) return
    // Compute metrics for charts
    const entries = Object.entries(human.portfolio)
      .filter(([id]) => !bankruptAssets[id] && human.portfolio[id].shares > 0)
    const totalInvested = entries.reduce((s,[id,pos]) => s + pos.shares*(prices[id]??0), 0)

    const classMap: Record<string,number>  = {}
    const regionMap: Record<string,number> = {}
    const volData: any[] = []

    entries.forEach(([id, pos]) => {
      const a = AMAP[id]; if (!a) return
      const val = pos.shares * prices[id]
      const cls = STOCKS.find(s=>s.id===id) ? 'Stocks'
                : REITS.find(r=>r.id===id)  ? 'REITs'
                : a.region ? 'Regional ETFs' : a.group?.split(' ')[0] ?? 'ETF'
      classMap[cls]  = (classMap[cls]  ?? 0) + val
      if (a.region) regionMap[a.region] = (regionMap[a.region] ?? 0) + val
      volData.push({ name: a.ticker, vol: Math.round(a.volatility * 100), pct: Math.round(val/totalInvested*100), color: a.color })
    })
    volData.sort((a,b) => b.vol - a.vol)

    const wVol = entries.reduce((s,[id,pos]) => { const a=AMAP[id]; if(!a) return s; return s+a.volatility*(pos.shares*prices[id])/totalInvested }, 0)
    const wYield = entries.reduce((s,[id,pos]) => { const a=AMAP[id]; if(!a) return s; return s+(a.dividend??0)*(pos.shares*prices[id])/totalInvested }, 0)
    const bExp = entries.reduce((s,[id,pos]) => { const a=AMAP[id]; if(!a) return s; return s+(a.bankrupt?pos.shares*prices[id]:0) },0)/totalInvested*100
    const unrlsd = entries.reduce((s,[id,pos]) => s + (pos.shares*prices[id] - pos.shares*pos.avgCost),0)

    setMetrics({
      totalInvested,
      classData:  Object.entries(classMap).map(([n,v])=>({ name:n, value:Math.round(v/totalInvested*100) })),
      regionData: Object.entries(regionMap).map(([n,v])=>({ name:n, value:Math.round(v/totalInvested*100) })),
      volData,
      wVol, wYield, bExp, unrlsd,
      volLabel: wVol<=0.08?'Conservative':wVol<=0.14?'Moderate':wVol<=0.19?'Aggressive':'Very Aggressive',
    })
    // Kick off AI analysis
    analyse()
  }, [open])

  if (!open) return null

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:300,
               display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{ width:'min(700px,100vw)', height:'100vh', background:'#FDFAF4',
                 borderLeft:'1px solid #E2D9C8', display:'flex', flexDirection:'column',
                 boxShadow:'-8px 0 32px rgba(0,0,0,.12)', animation:'slideIn .2s ease',
                 overflowY:'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'1rem 1.5rem', borderBottom:'1px solid #E2D9C8', background:'#FDFAF4',
                      position:'sticky', top:0, zIndex:1 }}>
          <div>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.2rem', fontWeight:700 }}>
              Portfolio Analysis
            </div>
            <div style={{ fontSize:11, color:'#8A826E', marginTop:2 }}>
              Q{quarter} Year {year} · AI-powered
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%',
            border:'1px solid #D4C9B4', background:'transparent', cursor:'pointer',
            fontSize:18, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            ×
          </button>
        </div>

        <div style={{ padding:'1.5rem' }}>
          {metrics && (
            <>
              {/* Metric cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                {[
                  { lbl:'Net Worth',    val:fmt(human?.netWorth??0),  color:'#2D6A5A' },
                  { lbl:'Unrealised P&L', val:(metrics.unrlsd>=0?'+':'')+fmt(Math.abs(metrics.unrlsd)), color:metrics.unrlsd>=0?'#2D6A5A':'#C0392B' },
                  { lbl:'Portfolio Risk',  val:metrics.volLabel, color:metrics.wVol<=0.08?'#2D6A5A':metrics.wVol<=0.14?'#C08B2A':'#C0392B' },
                  { lbl:'Annual Yield',    val:`${(metrics.wYield*100).toFixed(1)}%`, color:'#C08B2A' },
                ].map(({ lbl, val, color }) => (
                  <div key={lbl} style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                    borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase',
                      color:'#8A826E', marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1.1rem', fontWeight:700, color }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  { title:'Asset Class Allocation', data:metrics.classData },
                  { title:'Geographic Exposure',    data:metrics.regionData },
                ].map(({ title, data }) => (
                  <div key={title} style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                    borderRadius:8, padding:'1rem' }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em',
                      textTransform:'uppercase', color:'#8A826E', marginBottom:8 }}>{title}</div>
                    {data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={data} dataKey="value" nameKey="name"
                            cx="40%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                            {data.map((_: any, i: number) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ fontSize:12, color:'#8A826E', fontStyle:'italic' }}>No data</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Volatility bars */}
              {metrics.volData.length > 0 && (
                <div style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
                  borderRadius:8, padding:'1rem', marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em',
                    textTransform:'uppercase', color:'#8A826E', marginBottom:10 }}>
                    Position Volatility Breakdown
                  </div>
                  {metrics.volData.slice(0,8).map((d: any) => (
                    <div key={d.name} style={{ marginBottom:7 }}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        fontSize:11, marginBottom:2 }}>
                        <span style={{ fontWeight:600 }}>{d.name}</span>
                        <span style={{ color:'#8A826E' }}>{d.pct}% of portfolio · Vol {d.vol}</span>
                      </div>
                      <div style={{ height:5, background:'#E2D9C8', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${Math.min(100,(d.vol/32)*100)}%`,
                          height:'100%', background:d.color, borderRadius:3 }}/>
                      </div>
                    </div>
                  ))}
                  {metrics.bExp > 0 && (
                    <div style={{ marginTop:10, padding:'8px 12px',
                      background: metrics.bExp > 40 ? '#FBEAEA' : '#FDF5E6',
                      border: `1px solid ${metrics.bExp > 40 ? '#F5C6C2' : '#E8CC8A'}`,
                      borderRadius:6, fontSize:12,
                      color: metrics.bExp > 40 ? '#C0392B' : '#C08B2A', fontWeight:600 }}>
                      ⚠ {metrics.bExp.toFixed(0)}% of your invested portfolio is in bankruptcy-risk assets.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* AI analysis */}
          <div style={{ background:'#F5F0E8', border:'1px solid #E2D9C8',
            borderRadius:8, padding:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <span style={{ fontSize:'1.2rem' }}>🤖</span>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:'1rem', fontWeight:700 }}>
                AI Portfolio Advisor
              </div>
              <span style={{ fontSize:10, fontWeight:700, background:'#EAF3EF',
                color:'#2D6A5A', border:'1px solid #C2DDD6', borderRadius:20, padding:'2px 8px' }}>
                AI-powered
              </span>
            </div>
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:10,
                fontSize:13, color:'#8A826E' }}>
                <div style={{ width:16, height:16, border:'2px solid #E2D9C8',
                  borderTopColor:'#2D6A5A', borderRadius:'50%',
                  animation:'spin .6s linear infinite' }}/>
                Analysing your portfolio…
              </div>
            )}
            {error && (
              <div style={{ color:'#C0392B', fontSize:13 }}>Error: {error}</div>
            )}
            {text && !loading && (
              <>
                <div style={{ fontSize:13, color:'#3A2A0A', lineHeight:1.75 }}
                  dangerouslySetInnerHTML={{ __html: text }} />
                <button
                  onClick={analyse}
                  style={{ marginTop:12, background:'transparent', border:'1px solid #D4C9B4',
                    borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600,
                    color:'#8A826E', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  ↻ Regenerate analysis
                </button>
              </>
            )}
          </div>
        </div>

        <style>{`
          @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes spin    { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
