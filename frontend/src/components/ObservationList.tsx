import type { Observation } from '../api'

function band(o: Observation) {
  const [a, b] = o.wavelength_um
  return a != null && b != null ? `${a.toFixed(2)} – ${b.toFixed(2)} µm` : 'unknown'
}

type Props = {
  items: Observation[]
  selectedId: string | null
  onSelect: (o: Observation) => void
}

export default function ObservationList({ items, selectedId, onSelect }: Props) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((o) => (
        <article
          key={o.source_id}
          onClick={() => onSelect(o)}
          className={`cursor-pointer rounded-xl border bg-slate-900 p-4 text-sm transition hover:border-cyan-500 ${
            o.source_id === selectedId ? 'border-orange-500' : 'border-white/10'
          }`}
        >
          <p className="font-semibold text-cyan-400">{o.observed_start?.slice(0, 10) ?? 'Unknown date'}</p>
          <p className="mt-2 text-slate-300">Band: {band(o)}</p>
          <p className="text-slate-300">RA {o.ra?.toFixed(3)} · Dec {o.dec?.toFixed(3)}</p>
          <p className="mt-2 break-all text-xs text-slate-500">{o.source_id}</p>
        </article>
      ))}
    </div>
  )
}