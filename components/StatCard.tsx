import clsx from 'clsx'
import { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  sub?: string
  icon?: ReactNode
  accent?: boolean
  trend?: { value: string; positive: boolean }
}

export default function StatCard({ title, value, sub, icon, accent, trend }: Props) {
  return (
    <div className={clsx('card flex flex-col gap-3', accent && 'bg-[#111111] text-white')}>
      <div className="flex items-start justify-between">
        <span className={clsx('text-sm font-medium', accent ? 'text-zinc-400' : 'text-zinc-500')}>
          {title}
        </span>
        {icon && (
          <div
            className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              accent ? 'bg-white/10' : 'bg-brand-gray'
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <div
          className={clsx(
            'text-3xl font-bold tracking-tight',
            accent ? 'text-white' : 'text-[#111111]'
          )}
        >
          {value}
        </div>
        {sub && (
          <div className={clsx('text-xs mt-0.5', accent ? 'text-zinc-400' : 'text-zinc-500')}>
            {sub}
          </div>
        )}
        {trend && (
          <div
            className={clsx(
              'text-xs font-semibold mt-1',
              trend.positive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {trend.positive ? '▲' : '▼'} {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}
