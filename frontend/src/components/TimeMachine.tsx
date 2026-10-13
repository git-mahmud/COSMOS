import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import type { Observation } from '../api'
import Candidates from './Candidates'

const FULL = 0.3 // degrees
const MIN = 0.06
type View = 'slider' | 'blink' | 'diff' | 'side'

async function waitReady(id: string, cancelled: () => boolean) {
  while (!cancelled()) {
    const r = await fetch(`/api/prepare?id=${encodeURIComponent(id)}`)
    const { state } = await r.json()
    if (state === 'ready') return
    if (String(state).startsWith('error')) throw new Error(String(state))
    await new Promise((res) => setTimeout(res, 3000))
  }
}

type Props = { a: Observation; b: Observation; center: { ra: number; dec: number } }

export default function TimeMachine({ a, b, center }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [msg, setMsg] = useState('')
  const [view, setView] = useState<View>('slider')
  const [pos, setPos] = useState(50)
  const [showB, setShowB] = useState(false)
  const [ctr, setCtr] = useState(center)
  const [size, setSize] = useState(FULL)
  const [imgError, setImgError] = useState(false)

  const make = (v: 'a' | 'b' | 'diff', c = ctr, s = size) =>
    `/api/compare?a=${encodeURIComponent(a.source_id)}&b=${encodeURIComponent(b.source_id)}` +
    `&ra=${c.ra}&dec=${c.dec}&size=${s}&view=${v}`

  useEffect(() => {
    let stop = false
    setCtr(center)
    setSize(FULL)
    setImgError(false)
    setStatus('loading')
    setMsg('Downloading the two images from NASA. The first time this takes a few minutes.')
    ;(async () => {
      try {
        await Promise.all([waitReady(a.source_id, () => stop), waitReady(b.source_id, () => stop)])
        if (stop) return
        setMsg('Aligning the two images on the sky…')
        const r = await fetch(make('diff', center, FULL))
        if (!r.ok) {
          const d = await r.json().catch(() => null)
          throw new Error(d?.detail ?? `Error ${r.status}`)
        }
        if (!stop) setStatus('ready')
      } catch (e) {
        if (!stop) {
          setStatus('error')
          setMsg(e instanceof Error ? e.message : 'Something went wrong')
        }
      }
    })()
    return () => {
      stop = true
    }
  }, [a.source_id, b.source_id, center.ra, center.dec])

  useEffect(() => {
    if (view !== 'blink' || status !== 'ready') return
    const t = setInterval(() => setShowB((x) => !x), 700)
    return () => clearInterval(t)
  }, [view, status])

  function zoomAt(e: MouseEvent<HTMLDivElement>) {
    if (size <= MIN) return
    const r = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const fy = (e.clientY - r.top) / r.height
    const cosd = Math.cos((ctr.dec * Math.PI) / 180)
    // north is up, east is left
    setCtr({ ra: ctr.ra + ((0.5 - fx) * size) / cosd, dec: ctr.dec + (0.5 - fy) * size })
    setSize(Math.max(MIN, size / 2))
    setImgError(false)
  }

  function zoomOut() {
    setSize(Math.min(FULL, size * 2))
    if (size * 2 >= FULL) setCtr(center)
    setImgError(false)
  }

  function reset() {
    setCtr(center)
    setSize(FULL)
    setImgError(false)
  }

  const sameBand = a.wavelength_um[0] === b.wavelength_um[0] && a.wavelength_um[1] === b.wavelength_um[1]
  const imgCls = 'block w-full [image-rendering:pixelated]'
  const box = 'cursor-zoom-in'
  const tabs: [View, string][] = [['slider', 'Slider'], ['blink', 'Blink'], ['diff', 'Difference'], ['side', 'Side by side']]
  const onErr = () => setImgError(true)

  return (
    <section id="time-machine" className="mt-8 rounded-xl border border-cyan-500/30 bg-slate-900 p-4">
      <h3 className="text-xl font-bold text-cyan-400">Time Machine</h3>
      <p className="mt-1 text-sm text-slate-400">
        A: {a.observed_start?.slice(0, 10)} · B: {b.observed_start?.slice(0, 10)}
      </p>
      {!sameBand && (
        <p className="mt-2 text-sm text-amber-400">
          Warning: A and B show different color bands, so they are not fairly comparable.
        </p>
      )}

      {status !== 'ready' && (
        <p className={`mt-6 text-sm ${status === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
          {status === 'loading' ? '⏳ ' : ''}{msg}
        </p>
      )}

      {status === 'ready' && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  view === v ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>View: {size.toFixed(2)}° wide · RA {ctr.ra.toFixed(3)}, Dec {ctr.dec.toFixed(3)}</span>
            <button onClick={zoomOut} disabled={size >= FULL} className="rounded bg-slate-800 px-3 py-1 hover:bg-slate-700 disabled:opacity-40">Zoom out</button>
            <button onClick={reset} disabled={size >= FULL} className="rounded bg-slate-800 px-3 py-1 hover:bg-slate-700 disabled:opacity-40">Reset</button>
            <span className="text-slate-500">{size > MIN ? 'Click a picture to zoom in there.' : 'Maximum zoom.'}</span>
          </div>

          {imgError && (
            <p className="mt-2 text-sm text-red-400">
              This spot is not inside both images (or the server is busy). Click Zoom out or Reset.
            </p>
          )}

          <div className="mt-4 max-w-xl">
            {view === 'slider' && (
              <>
                <div className={`relative ${box}`} onClick={zoomAt}>
                  <img src={make('a')} alt="A" className={imgCls} onError={onErr} />
                  <img src={make('b')} alt="B" className={`${imgCls} absolute inset-0`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} onError={onErr} />
                </div>
                <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="mt-2 w-full" />
                <p className="text-xs text-slate-500">Left part shows B (later). Right part shows A (earlier).</p>
              </>
            )}
            {view === 'blink' && (
              <>
                <div className={box} onClick={zoomAt}>
                  <img src={make(showB ? 'b' : 'a')} alt="blink" className={imgCls} onError={onErr} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Showing {showB ? 'B (later)' : 'A (earlier)'}. Watch for anything that moves or changes.</p>
              </>
            )}
            {view === 'diff' && (
              <>
                <div className={box} onClick={zoomAt}>
                  <img src={make('diff')} alt="difference" className={imgCls} onError={onErr} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  B minus A. Grey means no change. White or black dots are differences. A difference is not proof of a real change; noise and small alignment errors also show up here.
                </p>
              </>
            )}
          </div>

          {view === 'side' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <figure>
                <div className={box} onClick={zoomAt}><img src={make('a')} alt="A" className={imgCls} onError={onErr} /></div>
                <figcaption className="mt-1 text-xs text-slate-500">A (earlier)</figcaption>
              </figure>
              <figure>
                <div className={box} onClick={zoomAt}><img src={make('b')} alt="B" className={imgCls} onError={onErr} /></div>
                <figcaption className="mt-1 text-xs text-slate-500">B (later)</figcaption>
              </figure>
            </div>
          )}
        </>
      )}
      {status === 'ready' && <Candidates a={a} b={b} center={center} />}
    </section>
  )
}