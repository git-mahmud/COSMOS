import { useState } from 'react'
import type { Observation } from '../api'
import type { Candidate } from '../types'

type Props = {
  a: Observation
  b: Observation
  center: { ra: number; dec: number }
  cand: Candidate
  onClose: () => void
}

const ZOOM = 5
const STEPS = ['Observe', 'Compare', 'Investigate', 'Understand', 'Report']

function Crop({ src, c, label }: { src: string; c: Candidate; label: string }) {
  const p = (f: number) => Math.min(1, Math.max(0, (f * ZOOM - 0.5) / (ZOOM - 1)))
  const px = p(c.x_frac)
  const py = p(c.y_frac)
  const mx = (c.x_frac * ZOOM + px * (1 - ZOOM)) * 100
  const my = (c.y_frac * ZOOM + py * (1 - ZOOM)) * 100
  return (
    <figure>
      <div
        className="relative aspect-square w-full overflow-hidden rounded border border-white/10"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
          backgroundPosition: `${px * 100}% ${py * 100}%`,
          imageRendering: 'pixelated',
        }}
      >
        <span
          className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-400"
          style={{ left: `${mx}%`, top: `${my}%` }}
        />
      </div>
      <figcaption className="mt-1 text-xs text-slate-500">{label}</figcaption>
    </figure>
  )
}

function loadReports(): any[] {
  try {
    return JSON.parse(localStorage.getItem('cosmos_reports') ?? '[]')
  } catch {
    return []
  }
}

export default function DiscoveryJourney({ a, b, center, cand, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(() => loadReports().length)

  const q =
    `a=${encodeURIComponent(a.source_id)}&b=${encodeURIComponent(b.source_id)}` +
    `&ra=${center.ra}&dec=${center.dec}&size=0.3`
  const days = Math.round(
    (new Date(b.observed_start ?? '').getTime() - new Date(a.observed_start ?? '').getTime()) / 86400000,
  )
  const brighter = cand.sign.startsWith('brighter')

  function save() {
    try {
      const all = loadReports()
      all.push({
        candidate: cand.id,
        ra: cand.ra,
        dec: cand.dec,
        signal_sigma: Number(cand.sigma.toFixed(1)),
        observation_a: a.source_id,
        observation_b: b.source_id,
        note,
        created: new Date().toISOString(),
      })
      localStorage.setItem('cosmos_reports', JSON.stringify(all))
      setSaved(all.length)
      setNote('')
    } catch {
      alert('Could not save in this browser.')
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(loadReports(), null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'cosmos-reports.json'
    link.click()
  }

  return (
    <section id="journey" className="mt-6 rounded-xl border border-orange-500/40 bg-slate-950 p-4">
      <div className="flex items-start justify-between gap-4">
        <h4 className="text-lg font-bold text-orange-400">Discovery Journey: Candidate #{cand.id}</h4>
        <button onClick={onClose} className="text-sm text-slate-400 hover:text-white">Close ✕</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`rounded-lg px-3 py-1 text-sm font-semibold ${
              i === step ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm text-slate-300">
        {step === 0 && (
          <>
            <p>Here is the candidate position in the <b>earlier</b> image A ({a.observed_start?.slice(0, 10)}). The orange ring marks where the difference was found, zoomed {ZOOM}×.</p>
            <div className="mt-3 max-w-xs"><Crop src={`/api/compare?${q}&view=a`} c={cand} label="Image A (earlier)" /></div>
          </>
        )}

        {step === 1 && (
          <>
            <p>Now compare the same spot in A and B. Look inside the ring: is there a visible dot in one image but not the other?</p>
            <div className="mt-3 grid max-w-xl grid-cols-2 gap-4">
              <Crop src={`/api/compare?${q}&view=a`} c={cand} label={`A (${a.observed_start?.slice(0, 10)})`} />
              <Crop src={`/api/compare?${q}&view=b`} c={cand} label={`B (${b.observed_start?.slice(0, 10)})`} />
            </div>
          </>
        )}

        {step === 2 && (
          <ul className="list-disc space-y-1 pl-5">
            <li>Position: RA {cand.ra.toFixed(4)}, Dec {cand.dec.toFixed(4)}</li>
            <li>Direction: {cand.sign}</li>
            <li>Signal: {cand.sigma.toFixed(1)}× the normal noise (preliminary, not a probability)</li>
            <li>Size: {cand.area_px} connected pixels above the threshold</li>
            <li>Time between images: {Number.isFinite(days) ? `${days} days` : 'unknown'}</li>
            <li>Same color band: {a.wavelength_um[0] === b.wavelength_um[0] && a.wavelength_um[1] === b.wavelength_um[1] ? 'yes' : 'NO, so the comparison is unreliable'}</li>
            <li className={cand.flag ? 'text-amber-400' : ''}>Bright star check: {cand.flag ?? 'no very bright star right at this spot'}</li>
          </ul>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p>
              <b>What was observed.</b> Near RA {cand.ra.toFixed(4)}, Dec {cand.dec.toFixed(4)}, image B ({b.observed_start?.slice(0, 10)}) is {cand.sign.replace(' in B', '')} than image A ({a.observed_start?.slice(0, 10)}), about {cand.sigma.toFixed(1)}× the typical noise, over {cand.area_px} pixels.
            </p>
            <div>
              <p className="font-semibold text-slate-200">What could explain it</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {cand.flag && <li>A small alignment error between the two images, which often leaves a bright-and-dark pattern around bright stars. This is the most likely cause here.</li>}
                {brighter ? (
                  <li>A star that became brighter, a short-lived event, or an instrument artifact in B.</li>
                ) : (
                  <li>A star that became fainter, or an instrument artifact in A.</li>
                )}
                <li>Random noise that happens to be large at this spot.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Why it is still uncertain</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Only two images were compared. One more observation of this spot would show whether the change repeats.</li>
                <li>This tool does not remove all instrument effects, and it cannot tell what kind of object this is.</li>
              </ul>
            </div>
            <p className="text-slate-400">This explanation is built only from the numbers above. COSMOS does not identify the object.</p>
          </div>
        )}

        {step === 4 && (
          <>
            <p>Write what you saw in Blink or in the zoomed images. It is saved in this browser only.</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Example: I see a faint dot in B that is missing in A."
              className="mt-2 w-full rounded bg-slate-800 p-2 text-white outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button onClick={save} className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-slate-950 hover:bg-orange-400">
                Save my report
              </button>
              <span className="text-slate-400">{saved} saved</span>
              {saved > 0 && <button onClick={download} className="text-cyan-400 hover:underline">Download all reports</button>}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm disabled:opacity-40">← Back</button>
        <button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">Next →</button>
      </div>
    </section>
  )
}