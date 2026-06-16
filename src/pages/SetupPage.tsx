import React, { useState } from 'react'
import { useGame } from '../hooks/useGame'

const AI_ARCHETYPES = [
  { id:'indexer',    name:'The Indexer',    style:'Passive, globally diversified',  color:'#2D6A5A' },
  { id:'speculator', name:'The Speculator', style:'High risk, chases momentum',     color:'#C0392B' },
  { id:'income',     name:'Income Seeker',  style:'Dividends first, bonds second',  color:'#9B2C7E' },
  { id:'goldbug',    name:'Gold Bug',       style:'Precious metals & safe havens',  color:'#C08B2A' },
  { id:'techbull',   name:'Tech Bull',      style:'US tech & data centre REITs',    color:'#2C5282' },
  { id:'macro',      name:'Macro Trader',   style:'Rotates on geopolitical events', color:'#B85C00' },
  { id:'asiaplay',   name:'Asia Bull',      style:'China & Asia-Pac growth seeker', color:'#5B2D8A' },
]

export function SetupPage() {
  const [name,     setName]     = useState('Player 1')
  const [selected, setSelected] = useState(new Set(['indexer','speculator','income']))
  const { session, startGame } = useGame()
  const { loading, error } = session

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const start = () => {
    startGame(name.trim() || 'Player 1', [...selected])
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'2rem 1rem' }}>
      <div style={{ maxWidth:540, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em',
            textTransform:'uppercase', color:'#2D6A5A', marginBottom:8 }}>
            Quarterly Market Strategy
          </div>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:'3rem',
            fontWeight:900, lineHeight:1, marginBottom:8 }}>
            Ticker Tycoon
          </div>
          <div style={{ fontSize:13, color:'#8A826E', lineHeight:1.6, maxWidth:380, margin:'0 auto' }}>
            Race AI investors from $100,000 to $1,000,000 across stocks, REITs, and global ETFs.
          </div>
        </div>

        <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
          padding:'1.4rem', marginBottom:'1rem', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em',
            textTransform:'uppercase', color:'#8A826E', marginBottom:10 }}>Your name</div>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width:'100%', background:'#F5F0E8', border:'1px solid #D4C9B4',
              borderRadius:8, padding:'10px 14px', fontSize:15, fontWeight:600,
              color:'#1C1A15', outline:'none', fontFamily:'inherit' }} />
        </div>

        <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
          padding:'1.4rem', marginBottom:'1rem', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em',
            textTransform:'uppercase', color:'#8A826E', marginBottom:10 }}>
            AI opponents — click to toggle
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {AI_ARCHETYPES.map(a => (
              <div key={a.id}
                onClick={() => toggle(a.id)}
                style={{ background: selected.has(a.id) ? '#EAF3EF' : '#F5F0E8',
                  border: `1px solid ${selected.has(a.id) ? a.color : '#D4C9B4'}`,
                  borderRadius:8, padding:'10px 13px', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontSize:13, fontWeight:700,
                  color: selected.has(a.id) ? a.color : '#1C1A15', marginBottom:2 }}>
                  {a.name}
                </div>
                <div style={{ fontSize:11, color:'#8A826E' }}>{a.style}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ color:'#C0392B', fontSize:13, marginBottom:'0.5rem',
            background:'#FBEAEA', border:'1px solid #F5C6C6', borderRadius:8, padding:'10px 14px' }}>
            {error}
          </div>
        )}
        <button onClick={start} disabled={loading}
          style={{ width:'100%', background: loading ? '#8A826E' : '#2D6A5A', color:'#fff', border:'none',
            borderRadius:8, padding:14, fontSize:15, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing:'.02em', transition:'background .15s' }}>
          {loading ? 'Starting...' : 'Start Game'}
        </button>
      </div>
    </div>
  )
}
