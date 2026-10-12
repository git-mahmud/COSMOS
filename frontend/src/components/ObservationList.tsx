import type { Observation } from '../api'

function band(o: Observation) {
  const [a, b] = o.wavelength_um
  return a != null && b != null ? `${a.toFixed(2)} – ${b.toFixed(2)} µm` : 'unknown'
}

export default function ObservationList({ items }: { items: Observation[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((o) => (
        <article key={o.source_id} className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm">
          <p className="font-semibold text-cyan-400">{o.observed_start?.slice(0, 10) ?? 'Unknown date'}</p>
          <p className="mt-2 text-slate-300">Band: {band(o)}</p>
          <p className="text-slate-300">RA {o.ra?.toFixed(3)} · Dec {o.dec?.toFixed(3)}</p>
          <p className="mt-2 break-all text-xs text-slate-500">{o.source_id}</p>
          <a href={o.access_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-cyan-400 hover:underline">
            Data links ↗
          </a>
        </article>
      ))}
    </div>
  )
}