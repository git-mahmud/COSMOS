import { useEffect, useState } from 'react'
import type { Observation } from '../api'
import Candidates from './Candidates'

const SIZE = 0.3 // degrees
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

  const url = (v: 'a' | 'b' | 'diff') =>
    `/api/compare?a=${encodeURIComponent(a.source_id)}&b=${encodeURIComponent(b.source_id)}` +
    `&ra=${center.ra}&dec=${center.dec}&size=${SIZE}&view=${v}`

  useEffect(() => {
    let stop = false
    setStatus('loading')
    setMsg('Downloading the two images from NASA. The first time this takes a few minutes.')
    ;(async () => {
      try {
        await Promise.all([waitReady(a.source_id, () => stop), waitReady(b.source_id, () => stop)])
        if (stop) return
        setMsg('Aligning the two images on the sky…')
        const r = await fetch(url('diff'))
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

  const sameBand = a.wavelength_um[0] === b.wavelength_um[0] && a.wavelength_um[1] === b.wavelength_um[1]
  const imgCls = 'block w-full [image-rendering:pixelated]'
  const tabs: [View, string][] = [['slider', 'Slider'], ['blink', 'Blink'], ['diff', 'Difference'], ['side', 'Side by side']]

  return (
    <section id="time-machine" className="mt-8 rounded-xl border border-cyan-500/30 bg-slate-900 p-4">
      <h3 className="text-xl font-bold text-cyan-400">Time Machine</h3>
      <p className="mt-1 text-sm text-slate-400">
        A: {a.observed_start?.slice(0, 10)} · B: {b.observed_start?.slice(0, 10)} · centered on RA {center.ra}, Dec {center.dec}
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

          <div className="mt-4 max-w-xl">
            {view === 'slider' && (
              <>
                <div className="relative">
                  <img src={url('a')} alt="A" className={imgCls} />
                  <img src={url('b')} alt="B" className={`${imgCls} absolute inset-0`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
                </div>
                <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="mt-2 w-full" />
                <p className="text-xs text-slate-500">Left part shows B (later). Right part shows A (earlier).</p>
              </>
            )}
            {view === 'blink' && (
              <>
                <img src={url(showB ? 'b' : 'a')} alt="blink" className={imgCls} />
                <p className="mt-2 text-xs text-slate-500">Showing {showB ? 'B (later)' : 'A (earlier)'}. Watch for anything that moves or changes.</p>
              </>
            )}
            {view === 'diff' && (
              <>
                <img src={url('diff')} alt="difference" className={imgCls} />
                <p className="mt-2 text-xs text-slate-500">
                  B minus A. Grey means no change. White or black dots are differences. A difference is not proof of a real change; noise and small alignment errors also show up here.
                </p>
              </>
            )}
          </div>

          {view === 'side' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <figure><img src={url('a')} alt="A" className={imgCls} /><figcaption className="mt-1 text-xs text-slate-500">A (earlier)</figcaption></figure>
              <figure><img src={url('b')} alt="B" className={imgCls} /><figcaption className="mt-1 text-xs text-slate-500">B (later)</figcaption></figure>
            </div>
          )}
        </>
      )}
      {status === 'ready' && <Candidates a={a} b={b} center={center} />}
    </section>
  )
}