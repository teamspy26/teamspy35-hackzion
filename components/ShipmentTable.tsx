'use client'
import { Shipment } from '@/lib/firestore'
import StatusBadge from './StatusBadge'
import RiskBadge from './RiskBadge'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'

interface Props {
  shipments: Shipment[]
  compact?: boolean
  onApproveQuote?: (id: string, price: number) => void
}

export default function ShipmentTable({ shipments, compact, onApproveQuote }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3 pr-4">ID</th>
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3 pr-4">Route</th>
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3 pr-4">Vehicle</th>
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3 pr-4">ETA</th>
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3 pr-4">Price</th>
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3 pr-4">Risk</th>
            <th className="text-left text-xs font-semibold text-zinc-400 pb-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {shipments.map(s => (
            <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors">
              <td className="py-3 pr-4">
                <span className="font-mono font-bold text-[#111111] bg-zinc-100 px-2 py-0.5 rounded text-xs">
                  {s.id?.slice(0,6)}
                </span>
              </td>
              <td className="py-3 pr-4">
                <div className="font-medium text-[#111111]">
                  {s.source} → {s.destination}
                </div>
                {!compact && (
                  <div className="text-xs text-zinc-400 mt-0.5">{s.route}</div>
                )}
              </td>
              <td className="py-3 pr-4 text-zinc-600">{s.vehicle}</td>
              <td className="py-3 pr-4">
                <span className="font-semibold text-[#111111]">{s.eta}</span>
                <span className="text-zinc-400 text-xs"> min</span>
              </td>
              <td className="py-3 pr-4">
                {s.negotiated_price ? (
                  <span className="font-semibold text-[#111111]">₹{s.negotiated_price}</span>
                ) : (
                  <span className="text-zinc-400 text-xs">-</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <RiskBadge risk={s.delay_risk} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={s.status as any} />
                {s.status === 'quote_pending' && onApproveQuote && (
                  <button 
                    onClick={() => onApproveQuote(s.id!, s.negotiated_price || 0)}
                    className="ml-3 inline-flex items-center justify-center gap-1 bg-green-500 text-white rounded text-xs font-bold px-2 py-1 hover:bg-green-600 transition"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {shipments.length === 0 && (
        <div className="text-center py-10 text-zinc-400 text-sm">No shipments found</div>
      )}
    </div>
  )
}
