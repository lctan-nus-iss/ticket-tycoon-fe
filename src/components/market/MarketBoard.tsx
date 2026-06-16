import React from 'react'
import { useGameStore } from '../../store/gameStore'
import { STOCKS, REITS, ETFS } from '../../data/assets'
import type { AssetDefinition } from '../../store/types'
import { fmt, fmtP, chgPct, volLabel, volColor } from '../../utils/format'

const GROUPS = [
  { label: 'Individual Stock — Technology', items: STOCKS.filter(s => s.sector === 'Technology') },
  { label: 'Individual Stock — Finance',    items: STOCKS.filter(s => s.sector === 'Finance')    },
  { label: 'Individual Stock — Energy',     items: STOCKS.filter(s => s.sector === 'Energy')     },
  { label: 'Individual Stock — Healthcare', items: STOCKS.filter(s => s.sector === 'Healthcare') },
  { label: 'Individual Stock — Consumer',   items: STOCKS.filter(s => s.sector === 'Consumer')   },
  { label: 'Individual Stock — Industrial', items: STOCKS.filter(s => s.sector === 'Industrial') },
  { label: 'Individual REIT — Data Centre', items: REITS.filter(r => r.sector === 'Data Centre') },
  { label: 'Individual REIT — Office',      items: REITS.filter(r => r.sector === 'Office')      },
  { label: 'Individual REIT — Healthcare',  items: REITS.filter(r => r.sector === 'Healthcare')  },
  { label: 'Individual REIT — Mall',        items: REITS.filter(r => r.sector === 'Mall')        },
  { label: 'Individual REIT — Industrial',  items: REITS.filter(r => r.sector === 'Industrial')  },
  { label: 'Regional Equity ETFs',          items: ETFS.filter(e => !!e.region)                  },
  { label: 'Bond, REIT & Commodity ETFs',   items: ETFS.filter(e => !e.region)                   },
]

const th: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
  color: '#8A826E', padding: '7px 10px', borderBottom: '1px solid #E2D9C8',
  background: '#F5F0E8', whiteSpace: 'nowrap', textAlign: 'left',
}
const thR: React.CSSProperties = { ...th, textAlign: 'right' }

export function MarketBoard() {
  const { prices, prevPrices, bankruptAssets, players, selectedAsset, setSelectedAsset, setActionTab } = useGameStore()
  const human = players[0]

  function handleRowClick(a: AssetDefinition) {
    if (bankruptAssets[a.id]) return
    setSelectedAsset(a.id)
    setActionTab('buy')
  }

  function categoryLabel(a: AssetDefinition): string {
    if (REITS.find(r => r.id === a.id))  return `${a.sector} REIT`
    if (STOCKS.find(s => s.id === a.id)) return `${a.sector} Stock`
    if (a.region) return `${a.region} ETF`
    return a.group ?? 'ETF'
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            <th style={th}>Asset</th>
            <th style={th}>Category</th>
            <th style={thR}>Price</th>
            <th style={thR}>Last Move</th>
            <th style={thR}>Yield</th>
            <th style={thR}>Volatility Index</th>
            <th style={thR}>Status</th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.map(g => (
            <React.Fragment key={g.label}>
              {/* Group header row */}
              <tr>
                <td colSpan={7} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: '#8A826E',
                  padding: '6px 10px', background: '#F5F0E8',
                  borderBottom: '1px solid #E2D9C8',
                }}>
                  {g.label}
                </td>
              </tr>

              {g.items.map(a => {
                const bust    = !!bankruptAssets[a.id]
                const owned   = !!human?.portfolio[a.id]
                const sel     = selectedAsset === a.id
                const price   = prices[a.id] ?? 0
                const chg     = chgPct(price, prevPrices[a.id] ?? price)
                const cat     = categoryLabel(a)
                const vl      = volLabel(a.volatility)
                const vc      = volColor(a.volatility)

                return (
                  <tr
                    key={a.id}
                    onClick={() => handleRowClick(a)}
                    style={{
                      cursor: bust ? 'not-allowed' : 'pointer',
                      background: sel ? '#FDF5E6' : bust ? '#F9F7F4' : '#FDFAF4',
                      opacity: bust ? 0.45 : 1,
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => {
                      if (!bust && !sel)
                        (e.currentTarget as HTMLTableRowElement).style.background = '#EAF3EF'
                    }}
                    onMouseLeave={e => {
                      if (!bust && !sel)
                        (e.currentTarget as HTMLTableRowElement).style.background = '#FDFAF4'
                    }}
                  >
                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 3, height: 28, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: '#1C1A15', lineHeight: 1.2 }}>
                            {a.name}
                            {bust && <span style={{ color: '#C0392B', marginLeft: 4 }}>☠</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#8A826E' }}>{a.ticker}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8', color: '#8A826E' }}>
                      {cat}
                    </td>

                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, color: '#1C1A15' }}>
                        {bust ? '—' : fmt(price)}
                      </span>
                    </td>

                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8', textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: chg > 0.001 ? '#2D6A5A' : chg < -0.001 ? '#C0392B' : '#8A826E',
                      }}>
                        {chg !== 0 ? fmtP(chg) : '0.0%'}
                      </span>
                    </td>

                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8', textAlign: 'right', color: '#8A826E', fontSize: 11.5 }}>
                      {a.dividend ? `${(a.dividend * 100).toFixed(1)}% / qtr` : '—'}
                    </td>

                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8', textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: vc }}>
                        {vl}{' '}
                        <span style={{ color: '#8A826E', fontSize: 10 }}>
                          ({Math.round(a.volatility * 100)})
                        </span>
                      </span>
                    </td>

                    <td style={{ padding: '9px 10px', borderBottom: '1px solid #E2D9C8', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {bust ? (
                          <Pill label="BANKRUPT" bg="#FBEAEA" color="#C0392B" border="#F5C6C2" />
                        ) : a.bankrupt ? (
                          <Pill label="CAN BANKRUPT" bg="#FBEAEA" color="#C0392B" border="#F5C6C2" />
                        ) : (
                          <Pill label="DIVERSIFIED" bg="#EAF3EF" color="#2D6A5A" border="#C2DDD6" />
                        )}
                        {owned && !bust && (
                          <Pill label="OWNED" bg="#FDF5E6" color="#C08B2A" border="#E8CC8A" />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pill({ label, bg, color, border }: { label: string; bg: string; color: string; border: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '.05em',
      padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
      background: bg, color, border: `1px solid ${border}`,
    }}>
      {label}
    </span>
  )
}
