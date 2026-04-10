import clsx from 'clsx'

interface Props {
  status: 'quote_pending' | 'pending' | 'in_transit' | 'delivered' | 'delayed'
}

const config = {
  quote_pending: { label: 'Quote Pending', cls: 'bg-purple-100 text-purple-700 border border-purple-200' },
  pending: { label: 'Pending', cls: 'bg-zinc-100 text-zinc-600 border border-zinc-200' },
  in_transit: { label: 'In Transit', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  delivered: { label: 'Delivered', cls: 'bg-green-100 text-green-700 border border-green-200' },
  delayed: { label: 'Delayed', cls: 'bg-red-100 text-red-700 border border-red-200' },
}

export default function StatusBadge({ status }: Props) {
  const c = config[status]
  return (
    <span className={clsx('status-badge', c.cls)}>
      {c.label}
    </span>
  )
}
