import type { Observation } from '../api'

type Props = {
  obs: Observation | null
  a: Observation | null
  b: Observation | null
  onSetA: (o: Observation) => void
  onSetB: (o: Observation) => void
}

export default function ObservationDetail({ obs, a, b, onSetA, onSetB }: Props) {
  if (!obs) {
    return (
      <p className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
        Click an observation below to see its details here.
      </p>
    )
  }
  const [lo, hi] = obs.wavelength_um
  return (
    <section className="mt-4 rounded-xl border border-orange-500/40 bg-slate-900 p-4 text-sm">
      <h3 className="text-lg font-bold text-orange-400">Selected observation</h3>
      <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <div><dt className="text-slate-500">Taken</dt><dd>{obs.observed_start ?? 'unknown'}</dd></div>
        <div><dt className="text-slate-500">Band</dt><dd>{lo != null && hi != null ? `${lo.toFixed(3)} – ${hi.toFixed(3)} µm` : 'unknown'}</dd></div>
        <div><dt className="text-slate-500">RA / Dec</dt><dd>{obs.ra?.toFixed(4)} / {obs.dec?.toFixed(4)}</dd></div>
        <div><dt className="text-slate-500">Source ID</dt><dd className="break-all">{obs.source_id}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={() => onSetA(obs)} className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400">
          Set as A (earlier){a?.source_id === obs.source_id ? ' ✓' : ''}
        </button>
        <button onClick={() => onSetB(obs)} className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-slate-950 hover:bg-orange-400">
          Set as B (later){b?.source_id === obs.source_id ? ' ✓' : ''}
        </button>
        <a href={obs.access_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
          Open data links ↗
        </a>
      </div>
    </section>
  )
}