import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

function fmt(n: number) {
  if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`
  if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

export function WinPage() {
  const navigate = useNavigate()
  const { players, quarter, year } = useGameStore()
  const sorted = [...players].sort((a, b) => b.netWorth - a.netWorth)
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣']

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E8', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'2rem', textAlign:'center',
      fontFamily:'Inter,system-ui,sans-serif' }}>
      <div>
        <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🏆</div>
        <div style={{ fontFamily:'Playfair Display,serif', fontSize:'2.5rem',
          fontWeight:900, color:'#2D6A5A', marginBottom:'.4rem' }}>
          {sorted[0]?.name} Wins!
        </div>
        <div style={{ fontSize:13, color:'#8A826E', marginBottom:'2rem' }}>
          Reached $1,000,000 in Year {year}, Quarter {quarter}
        </div>
        <div style={{ background:'#FDFAF4', border:'1px solid #E2D9C8', borderRadius:14,
          padding:'1.5rem', maxWidth:440, width:'100%', margin:'0 auto 2rem',
          boxShadow:'0 4px 12px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em',
            textTransform:'uppercase', color:'#8A826E', marginBottom:12,
            paddingBottom:8, borderBottom:'1px solid #E2D9C8' }}>
            Final Standings
          </div>
          {sorted.map((p, i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12,
              padding:'8px 0', borderBottom: i < sorted.length-1 ? '1px solid #E2D9C8' : 'none' }}>
              <span style={{ fontSize:18, width:28 }}>{medals[i] || i+1}</span>
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                background:`${p.color}22`, color:p.color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:700 }}>
                {p.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'#8A826E' }}>
                  {p.isAI ? 'AI player' : 'Human player'}
                </div>
              </div>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700,
                color: p.netWorth >= 1e6 ? '#2D6A5A' : '#1C1A15' }}>
                {fmt(p.netWorth)}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/')}
          style={{ background:'#2D6A5A', color:'#fff', border:'none', borderRadius:8,
            padding:'13px 40px', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Play Again
        </button>
      </div>
    </div>
  )
}
