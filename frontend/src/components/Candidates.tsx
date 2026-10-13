import { useEffect, useState } from 'react'
import type { Observation } from '../api'
import type { Candidate } from '../types'
import DiscoveryJourney from './DiscoveryJourney'

type Result = { threshold_sigma: number; total: number; candidates: Candidate[] }
type Props = { a: Observation; b: Observation; center: { ra: number; dec: number } }

export default function Candidates({ a, b, center }: Props) {
  const [data, setData] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<number | null>(null)
  const [journey, setJourney] = useState<Candidate | null>(null)

  const q = `a=${encodeURIComponent(a.source_id)}&b=${encodeURIComponent(b.source_id)}&ra=${center.ra}&dec=${center.dec}&size=0.3`

  useEffect(() => {
    setData(null)
    setError(null)
    setActive(null)
    setJourney(null)
    fetch(`/api/candidates?${q}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => null)
          throw new Error(d?.detail ?? `Error ${r.status}`)
        }
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [q])

  function startJourney(c: Candidate) {
    setActive(c.id)
    setJourney(c)
    setTimeout(() => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <section id="discoveries" className="mt-8 rounded-xl border border-orange-500/30 bg-slate-900 p-4">
      <h3 className="text-xl font-bold text-orange-400">Change Finder</h3>
      <p className="mt-1 text-sm text-slate-400">
        Spots where B differs strongly from A (more than {data?.threshold_sigma ?? 5}× the normal noise). These are
        candidates for review, not confirmed discoveries. The signal number is a preliminary measure, not a probability.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {data && (
        <p className="mt-2 text-sm text-slate-400">
          Showing the strongest {data.candidates.length} of {data.total} spots found.
        </p>
      )}

      {data && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="relative">
            <img src={`/api/compare?${q}&view=diff`} alt="difference" className="block w-full [image-rendering:pixelated]" />
            {data.candidates.map((c) => (
              <span
                key={c.id}
                onClick={() => setActive(c.id)}
                title={`Candidate #${c.id}`}
                className={`absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 ${
                  active === c.id ? 'border-orange-400' : c.flag ? 'border-amber-300/70' : 'border-cyan-400'
                }`}
                style={{ left: `${c.x_frac * 100}%`, top: `${c.y_frac * 100}%` }}
              />
            ))}
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {data.candidates.length === 0 && (
              <p className="text-sm text-slate-300">No spots passed the threshold. The two images look the same here.</p>
            )}
            {data.candidates.map((c) => (
              <article
                key={c.id}
                className={`rounded-lg border p-3 text-sm ${active === c.id ? 'border-orange-500' : 'border-white/10'}`}
              >
                <p className="font-semibold text-cyan-400">CANDIDATE #{c.id}</p>
                <p className="text-slate-300">RA {c.ra.toFixed(4)} · Dec {c.dec.toFixed(4)}</p>
                <p className="text-slate-300">Signal: {c.sigma.toFixed(1)}× noise (preliminary) · {c.sign}</p>
                {c.flag && <p className="text-amber-400">⚠ {c.flag}</p>}
                <p className="text-slate-500">Status: {c.status}</p>
                <div className="mt-1 flex gap-4">
                  <button onClick={() => setActive(c.id)} className="text-cyan-400 hover:underline">Inspect on map</button>
                  <button onClick={() => startJourney(c)} className="font-semibold text-orange-400 hover:underline">Start Discovery Journey</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {journey && <DiscoveryJourney a={a} b={b} center={center} cand={journey} onClose={() => setJourney(null)} />}
    </section>
  )
}