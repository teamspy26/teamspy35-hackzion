import clsx from 'clsx'

interface Props {
  risk: 'low' | 'medium' | 'high'
  size?: 'sm' | 'md'
}

export default function RiskBadge({ risk, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'status-badge font-semibold',
        risk === 'high' && 'risk-high',
        risk === 'medium' && 'risk-medium',
        risk === 'low' && 'risk-low',
        size === 'sm' && 'text-[10px] px-2 py-0.5'
      )}
    >
      {risk.charAt(0).toUpperCase() + risk.slice(1)}
    </span>
  )
}
