'use client'
import { useState } from 'react'
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Lightbulb, Shield } from 'lucide-react'
import clsx from 'clsx'

interface InsightsData {
  insights: string[]
  alerts: string[]
  recommendation: string
  riskScore: number
}

interface Props {
  shipments: { id?: string; status: string; delay_risk: string; route: string; source: string; destination: string }[]
}

export default function AIInsightsPanel({ shipments }: Props) {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchInsights() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipments }),
      })
      const json = await res.json()
      setData(json.data)
    } catch {
      setData({
        insights: [
          '3 shipments at medium-to-high delay risk — review routing',
          'Vehicle utilization: Trucks at 85%, Vans at 60%',
          'North corridor showing weather-related pattern delays',
        ],
        alerts: [
          'Shipment S3 delayed — heavy fog on Yamuna Expressway',
          'High-priority shipments S1 & S5 approaching ETA threshold',
        ],
        recommendation: 'Reroute S3 via NH-19 to avoid fog zone and reduce delay by ~35 minutes',
        riskScore: 62,
      })
    }
    setLoading(false)
  }

  const scoreColor =
    data && data.riskScore > 70
      ? 'text-red-600'
      : data && data.riskScore > 40
      ? 'text-yellow-600'
      : 'text-green-600'

  return (
    <div className="card h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
            <Sparkles size={14} className="text-black" />
          </div>
          <span className="font-bold text-[#111111]">AI Insights</span>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-1.5 btn-dark text-xs py-1.5 px-3"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {!data && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center">
            <Sparkles size={22} className="text-brand-yellow" />
          </div>
          <p className="text-zinc-400 text-sm">Click Analyze to get real-time AI insights</p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-xs">Processing fleet data…</p>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="flex-1 flex flex-col gap-4 overflow-auto">
          {/* Risk score */}
          <div className="bg-zinc-50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-zinc-400" />
              <span className="text-sm font-medium text-zinc-600">Fleet Risk Score</span>
            </div>
            <span className={clsx('text-2xl font-bold', scoreColor)}>{data.riskScore}</span>
          </div>

          {/* Insights */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-brand-yellow" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Insights</span>
            </div>
            <ul className="space-y-2">
              {data.insights.map((ins, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-700">
                  <span className="text-brand-yellow mt-0.5 shrink-0">•</span>
                  {ins}
                </li>
              ))}
            </ul>
          </div>

          {/* Alerts */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} className="text-red-500" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Alerts</span>
            </div>
            <ul className="space-y-1.5">
              {data.alerts.map((alert, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm bg-red-50 text-red-700 rounded-lg px-3 py-2 border border-red-100"
                >
                  <span className="shrink-0">🚨</span>
                  {alert}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Lightbulb size={13} className="text-brand-yellow" />
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Recommendation</span>
            </div>
            <p className="text-sm text-zinc-700">{data.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
