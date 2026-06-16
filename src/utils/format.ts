export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

export function fmtP(n: number): string {
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`
}

export function chgPct(curr: number, prev: number): number {
  if (!prev || Math.abs(curr - prev) < 0.01) return 0
  return (curr - prev) / prev
}

export function volLabel(v: number): string {
  if (v <= 0.06) return 'Very Low'
  if (v <= 0.10) return 'Low'
  if (v <= 0.15) return 'Medium'
  if (v <= 0.20) return 'High'
  return 'Very High'
}

export function volColor(v: number): string {
  if (v <= 0.06) return '#2D6A5A'
  if (v <= 0.10) return '#2D6A5A'
  if (v <= 0.15) return '#C08B2A'
  if (v <= 0.20) return '#B85C00'
  return '#C0392B'
}

export function riskLabel(v: number): string {
  if (v <= 0.08) return 'Conservative'
  if (v <= 0.14) return 'Moderate'
  if (v <= 0.19) return 'Aggressive'
  return 'Very Aggressive'
}

export function riskColor(v: number): string {
  if (v <= 0.08) return '#2D6A5A'
  if (v <= 0.14) return '#C08B2A'
  if (v <= 0.19) return '#B85C00'
  return '#C0392B'
}
