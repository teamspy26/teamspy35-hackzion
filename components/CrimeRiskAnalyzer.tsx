'use client'
import { useState } from 'react'
import {
  analyzeRoute, RouteAnalysis, ModeResult, CITY_STATE,
} from '@/lib/crimeData'
import { CITY_COORDS } from '@/lib/mapData'
import {
  Shield, AlertTriangle, CheckCircle, Plane, Train, Truck,
  Ship, Search, ChevronDown, Zap, TrendingDown, MapPin,
} from 'lucide-react'

const CITIES = Object.keys(CITY_COORDS)

const MODE_ICONS: Record<string, React.ReactNode> = {
  Road: <Truck  size={14} />,
  Rail: <Train  size={14} />,
  Air:  <Plane  size={14} />,
  Ship: <Ship   size={14} />,
}

const RISK_CONFIG = {
  Low:    { bg: 'bg-green-50  border-green-200',  text: 'text-green-700',  bar: 'bg-green-500',  dot: 'bg-green-500'  },
  Medium: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500', dot: 'bg-yellow-500' },
  High:   { bg: 'bg-red-50    border-red-200',    text: 'text-red-700',    bar: 'bg-red-500',    dot: 'bg-red-500'    },
}

function crimeColor(score: number) {
  if (score >= 7) return 'text-red-600 bg-red-50 border-red-200'
  if (score >= 5) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
  return 'text-green-700 bg-green-50 border-green-200'
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct  = (value / max) * 100
  const color = value >= 7 ? 'bg-red-500' : value >= 5 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-bold w-6 text-right ${value >= 7 ? 'text-red-600' : value >= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
        {value}
      </span>
    </div>
  )
}

export default function CrimeRiskAnalyzer() {
  const [source,      setSource]      = useState('Bangalore')
  const [destination, setDestination] = useState('Chennai')
  const [cargoValue,  setCargoValue]  = useState<'low' | 'medium' | 'high'>('medium')
  const [result,      setResult]      = useState<RouteAnalysis | null>(null)
  const [loading,     setLoading]     = useState(false)

  function handleAnalyze() {
    if (!source || !destination || source === destination) return
    setLoading(true)
    setResult(null)
    // Simulate short processing delay
    setTimeout(() => {
      setResult(analyzeRoute(source, destination, cargoValue))
      setLoading(false)
    }, 600)
  }

  const rc = result ? RISK_CONFIG[result.riskLabel] : null

  return (
    <div className="space-y-4">

      {/* ── Input row ── */}
      <div className="grid grid-cols-12 gap-3 items-end">

        {/* Source */}
        <div className="col-span-3">
          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Source City</label>
          <div className="relative">
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#111111]"
            >
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Arrow */}
        <div className="col-span-1 flex items-center justify-center pb-2 text-zinc-400 text-lg font-light">→</div>

        {/* Destination */}
        <div className="col-span-3">
          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Destination City</label>
          <div className="relative">
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#111111]"
            >
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Cargo value */}
        <div className="col-span-3">
          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Cargo Value</label>
          <div className="flex gap-1.5">
            {(['low', 'medium', 'high'] as const).map(v => (
              <button
                key={v}
                onClick={() => setCargoValue(v)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 capitalize transition-all ${
                  cargoValue === v
                    ? v === 'high'   ? 'border-red-400    bg-red-50    text-red-700'
                    : v === 'medium' ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    :                  'border-green-400  bg-green-50  text-green-700'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-zinc-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze button */}
        <div className="col-span-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || source === destination}
            className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-2.5 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && rc && (
        <div className="grid grid-cols-12 gap-4">

          {/* Left: States + Crime Scores */}
          <div className="col-span-4 space-y-3">
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-zinc-500" />
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wide">States on Route</span>
              </div>
              <div className="space-y-2.5">
                {result.states.map(state => {
                  const score = (require('@/lib/crimeData').STATE_CRIME_SCORES as Record<string,number>)[state] ?? 5
                  return (
                    <div key={state}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-zinc-700">{state}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${crimeColor(score)}`}>{score}/10</span>
                      </div>
                      <ScoreBar value={score} />
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Avg Crime Score</span>
                <span className={`text-sm font-extrabold px-2.5 py-1 rounded-xl border ${crimeColor(result.avgCrimeScore)}`}>
                  {result.avgCrimeScore} / 10
                </span>
              </div>
            </div>

            {/* Cargo risk note */}
            {cargoValue === 'high' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  <strong>HIGH value cargo:</strong> Road routes with total risk &gt;5 are automatically excluded. Prefer Rail or Air.
                </p>
              </div>
            )}
          </div>

          {/* Middle: Mode comparison table */}
          <div className="col-span-5">
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center gap-2">
                <Shield size={13} className="text-zinc-500" />
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wide">Transport Mode Comparison</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left px-3 py-2 text-zinc-400 font-semibold">Mode</th>
                    <th className="text-center px-2 py-2 text-zinc-400 font-semibold">Mode Risk</th>
                    <th className="text-center px-2 py-2 text-zinc-400 font-semibold">Total Risk</th>
                    <th className="text-center px-2 py-2 text-zinc-400 font-semibold">Time</th>
                    <th className="text-center px-2 py-2 text-zinc-400 font-semibold">Cost</th>
                    <th className="text-center px-2 py-2 text-zinc-400 font-semibold">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {result.modes.map((m: ModeResult) => {
                    const isAvoid  = m.avoidForHighCargo
                    const isBest   = m.rank === 1
                    const isAlt    = m.rank === 2
                    return (
                      <tr
                        key={m.mode}
                        className={`border-b border-zinc-100 transition-colors ${
                          isBest  ? 'bg-green-50' :
                          isAlt   ? 'bg-blue-50/50' :
                          isAvoid ? 'bg-red-50/40 opacity-60' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`${isBest ? 'text-green-700' : isAvoid ? 'text-red-400' : 'text-zinc-600'}`}>
                              {MODE_ICONS[m.mode]}
                            </span>
                            <span className={`font-bold ${isBest ? 'text-green-800' : isAvoid ? 'text-red-400 line-through' : 'text-zinc-700'}`}>
                              {m.mode}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={`font-bold ${m.modeRisk >= 6 ? 'text-red-600' : m.modeRisk >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {m.modeRisk}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={`font-bold ${m.totalRisk > 6 ? 'text-red-600' : m.totalRisk > 4.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {m.totalRisk}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center text-zinc-500">{m.timeMultiplier}×</td>
                        <td className="px-2 py-2.5 text-center text-zinc-500">{m.costMultiplier}×</td>
                        <td className="px-2 py-2.5 text-center">
                          {isBest  && <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">⭐ Best</span>}
                          {isAlt   && !isBest && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Alt</span>}
                          {isAvoid && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">⚠ Avoid</span>}
                          {!isBest && !isAlt && !isAvoid && (
                            <span className="text-zinc-400">#{m.rank}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 bg-zinc-100/50 text-[10px] text-zinc-400">
                Total Risk = 0.6 × Crime Score + 0.4 × Mode Risk
              </div>
            </div>
          </div>

          {/* Right: Recommendation */}
          <div className="col-span-3 space-y-3">

            {/* Risk badge */}
            <div className={`rounded-xl p-4 border ${rc.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className={rc.text} />
                <span className={`text-sm font-extrabold ${rc.text}`}>{result.riskLabel} Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/60 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${rc.bar}`}
                    style={{ width: `${(result.best.totalRisk / 10) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${rc.text}`}>{result.best.totalRisk}/10</span>
              </div>
            </div>

            {/* Best + Alternative */}
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle size={12} className="text-green-600" />
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Recommended</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-700">{MODE_ICONS[result.best.mode]}</span>
                  <span className="font-bold text-sm text-green-800">{result.best.mode}</span>
                  <span className="text-[10px] text-green-600 ml-auto">Risk: {result.best.totalRisk}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={12} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Alternative</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700">{MODE_ICONS[result.alternative.mode]}</span>
                  <span className="font-bold text-sm text-blue-800">{result.alternative.mode}</span>
                  <span className="text-[10px] text-blue-600 ml-auto">Risk: {result.alternative.totalRisk}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation message — full width */}
          <div className="col-span-12">
            <div className="bg-[#111111] rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-[#EAB308] rounded-lg flex items-center justify-center shrink-0">
                <Zap size={15} className="text-black" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#EAB308] uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Shield size={11} /> AI Safety Recommendation
                </div>
                <p className="text-sm text-zinc-100 leading-relaxed">{result.message}</p>
                <p className="text-[10px] text-zinc-400 mt-1.5">
                  Source: NCRB Indian Crimes Dataset · Risk formula: Total Risk = 0.6 × Crime Score + 0.4 × Mode Risk
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3">
            <Shield size={24} className="text-zinc-300" />
          </div>
          <p className="text-zinc-400 text-sm">Select source, destination and cargo value</p>
          <p className="text-xs text-zinc-300 mt-1">then click <strong className="text-zinc-500">Analyze</strong> to get route safety report</p>
        </div>
      )}
    </div>
  )
}
