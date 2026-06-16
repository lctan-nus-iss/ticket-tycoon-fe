import type { AssetDefinition } from '../store/types'

export const STOCKS: AssetDefinition[] = [
  { id:'nvx',  name:'Nexovix Corp',        ticker:'NVX',  sector:'Technology', color:'#4EA8DE', price:80,  volatility:.22, dividend:.004, bankrupt:true  },
  { id:'qntm', name:'Quantum Leap Tech',   ticker:'QNTM', sector:'Technology', color:'#7C5CBF', price:55,  volatility:.28, dividend:0,    bankrupt:true  },
  { id:'cldx', name:'CloudexaInc',         ticker:'CLDX', sector:'Technology', color:'#2D6A5A', price:120, volatility:.18, dividend:.006, bankrupt:true  },
  { id:'prm',  name:'Primefall Bank',      ticker:'PRM',  sector:'Finance',    color:'#2D6A5A', price:65,  volatility:.15, dividend:.025, bankrupt:true  },
  { id:'vlt',  name:'Vaultex Financial',   ticker:'VLT',  sector:'Finance',    color:'#1A4D3A', price:90,  volatility:.13, dividend:.020, bankrupt:true  },
  { id:'drx',  name:'Duralex Energy',      ticker:'DRX',  sector:'Energy',     color:'#B85C00', price:45,  volatility:.25, dividend:.030, bankrupt:true  },
  { id:'solv', name:'Solvara Renewables',  ticker:'SOLV', sector:'Energy',     color:'#C08B2A', price:70,  volatility:.20, dividend:.008, bankrupt:true  },
  { id:'medx', name:'MedxPharma',          ticker:'MEDX', sector:'Healthcare', color:'#9B2C7E', price:110, volatility:.17, dividend:.012, bankrupt:true  },
  { id:'biov', name:'BioVance Labs',       ticker:'BIOV', sector:'Healthcare', color:'#C0392B', price:40,  volatility:.30, dividend:0,    bankrupt:true  },
  { id:'luxe', name:'LuxeRetail Group',    ticker:'LUXE', sector:'Consumer',   color:'#C08B2A', price:75,  volatility:.18, dividend:.018, bankrupt:true  },
  { id:'groc', name:'FreshMart Holdings',  ticker:'GROC', sector:'Consumer',   color:'#2D6A5A', price:88,  volatility:.10, dividend:.022, bankrupt:true  },
  { id:'trns', name:'TransCore Logistics', ticker:'TRNS', sector:'Industrial', color:'#1A5C7A', price:95,  volatility:.14, dividend:.016, bankrupt:true  },
]

export const REITS: AssetDefinition[] = [
  { id:'nxdc', name:'NexaCore Data REIT',     ticker:'NXDC', sector:'Data Centre', color:'#4EA8DE', price:70,  volatility:.12, dividend:.040, bankrupt:true },
  { id:'apex', name:'Apex Tower REIT',        ticker:'APEX', sector:'Office',      color:'#6B7280', price:50,  volatility:.18, dividend:.055, bankrupt:true },
  { id:'vrdx', name:'VerdaHealth REIT',       ticker:'VRDX', sector:'Healthcare',  color:'#9B2C7E', price:85,  volatility:.08, dividend:.042, bankrupt:true },
  { id:'plzx', name:'PlazioCentre REIT',      ticker:'PLZX', sector:'Mall',        color:'#B85C00', price:35,  volatility:.22, dividend:.068, bankrupt:true },
  { id:'logx', name:'LogiPark REIT',          ticker:'LOGX', sector:'Industrial',  color:'#2D6A5A', price:92,  volatility:.10, dividend:.036, bankrupt:true },
  { id:'svrx', name:'SilverLane Office REIT', ticker:'SVRX', sector:'Office',      color:'#6B7280', price:42,  volatility:.20, dividend:.060, bankrupt:true },
  { id:'carx', name:'Carevera Health REIT',   ticker:'CARX', sector:'Healthcare',  color:'#C0392B', price:78,  volatility:.09, dividend:.044, bankrupt:true },
  { id:'whrx', name:'Warehouse Prime REIT',   ticker:'WHRX', sector:'Industrial',  color:'#1A5C7A', price:105, volatility:.11, dividend:.032, bankrupt:true },
]

export const ETFS: AssetDefinition[] = [
  { id:'etf_us',     name:'AmeriCore 500 ETF',    ticker:'AMC',  group:'US Equity ETF',         region:'America',           color:'#1A3A6B', price:100, volatility:.09, dividend:.015, bankrupt:false },
  { id:'etf_ustech', name:'TechVault US ETF',      ticker:'TVU',  group:'US Tech ETF',           region:'America Tech',      color:'#2C5282', price:100, volatility:.14, dividend:.004, bankrupt:false },
  { id:'etf_cn',     name:'ChinaDragon ETF',       ticker:'CDX',  group:'China Tech ETF',        region:'China Tech',        color:'#C0392B', price:100, volatility:.20, dividend:.008, bankrupt:false },
  { id:'etf_asia',   name:'AsiaPac ex-China ETF',  ticker:'APX',  group:'Asia-Pac ex-China ETF', region:'Asia-Pac ex-China', color:'#5B2D8A', price:100, volatility:.13, dividend:.018, bankrupt:false },
  { id:'etf_eu',     name:'EuroStar Broad ETF',    ticker:'ESB',  group:'Europe ETF',            region:'Europe',            color:'#1A6B5A', price:100, volatility:.11, dividend:.020, bankrupt:false },
  { id:'bonds',      name:'SafeHaven Bond ETF',    ticker:'SHB',  group:'Bond ETF',              color:'#2D6A5A',            price:100, volatility:.04, dividend:.012, bankrupt:false },
  { id:'reitx',      name:'AllProp REIT ETF',      ticker:'ALLP', group:'REIT ETF',              color:'#7C5CBF',            price:100, volatility:.10, dividend:.030, bankrupt:false },
  { id:'gold',       name:'GoldVault ETF',         ticker:'GVT',  group:'Commodity ETF',         color:'#C08B2A',            price:100, volatility:.07, dividend:0,    bankrupt:false },
  { id:'silver',     name:'Silver Ridge ETF',      ticker:'SVR',  group:'Commodity ETF',         color:'#6B7280',            price:100, volatility:.13, dividend:0,    bankrupt:false },
  { id:'oil',        name:'BrentWave Oil ETF',     ticker:'BWO',  group:'Commodity ETF',         color:'#B85C00',            price:100, volatility:.22, dividend:0,    bankrupt:false },
]

export const ALL_ASSETS: AssetDefinition[] = [...STOCKS, ...REITS, ...ETFS]
export const AMAP: Record<string, AssetDefinition> = {}
ALL_ASSETS.forEach(a => { AMAP[a.id] = a })
