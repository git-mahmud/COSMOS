import type { Observation } from '../api'

export default function ObservationDetail({ obs }: { obs: Observation | null }) {
  if (!obs) {
    return (
      <p className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
        Click an observation below to see its details here.
      </p>
    )
  }
  const [a, b] = obs.wavelength_um
  return (
    <section className="mt-4 rounded-xl border border-orange-500/40 bg-slate-900 p-4 text-sm">
      <h3 className="text-lg font-bold text-orange-400">Selected observation</h3>
      <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <div><dt className="text-slate-500">Taken</dt><dd>{obs.observed_start ?? 'unknown'}</dd></div>
        <div><dt className="text-slate-500">Band</dt><dd>{a != null && b != null ? `${a.toFixed(3)} – ${b.toFixed(3)} µm` : 'unknown'}</dd></div>
        <div><dt className="text-slate-500">RA / Dec</dt><dd>{obs.ra?.toFixed(4)} / {obs.dec?.toFixed(4)}</dd></div>
        <div><dt className="text-slate-500">Source ID</dt><dd className="break-all">{obs.source_id}</dd></div>
      </dl>
      <a href={obs.access_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-cyan-400 hover:underline">
        Open data links ↗
      </a>
    </section>
  )
}