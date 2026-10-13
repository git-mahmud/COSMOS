import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Observation } from '../api'

declare const A: any

type Props = {
  center: { ra: number; dec: number }
  items: Observation[]
  selected: Observation | null
  onSearchHere: (ra: number, dec: number) => void
  onMove: (ra: number, dec: number) => void
}

function norm(ra: number, dec: number) {
  return { ra: ((ra % 360) + 360) % 360, dec: Math.max(-90, Math.min(90, dec)) }
}

export default function SkyViewer({ center, items, selected, onSearchHere, onMove }: Props) {
  const aladin = useRef<any>(null)
  const allCat = useRef<any>(null)
  const selCat = useRef<any>(null)
  const started = useRef(false)
  const last = useRef({ ra: -999, dec: -999 })
  const moveRef = useRef(onMove)
  moveRef.current = onMove
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [nameMsg, setNameMsg] = useState('')

  // Start the sky map once
  useEffect(() => {
    if (started.current) return
    started.current = true
    A.init.then(() => {
      const a = A.aladin('#aladin-lite-div', {
        survey: 'P/DSS2/color',
        fov: 1.5,
        showReticle: true,
        showZoomControl: true,
        showFullscreenControl: false,
        showLayersControl: false,
        showGotoControl: false,
      })
      a.gotoRaDec(center.ra, center.dec)

      allCat.current = A.catalog({ name: 'SPHEREx images', sourceSize: 10, color: '#22d3ee', shape: 'circle' })
      selCat.current = A.catalog({ name: 'Selected', sourceSize: 20, color: '#f97316', shape: 'circle' })
      a.addCatalog(allCat.current)
      a.addCatalog(selCat.current)

      aladin.current = a
      setReady(true)
    })
  }, [])

  // Tell the page where the map center is (the search boxes follow it)
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      const [r, d] = aladin.current.getRaDec()
      const p = norm(r, d)
      if (Math.abs(p.ra - last.current.ra) > 0.0005 || Math.abs(p.dec - last.current.dec) > 0.0005) {
        last.current = p
        moveRef.current(p.ra, p.dec)
      }
    }, 400)
    return () => clearInterval(t)
  }, [ready])

  // Jump to the searched spot
  useEffect(() => {
    if (ready) aladin.current.gotoRaDec(center.ra, center.dec)
  }, [ready, center])

  // Draw one dot per observation
  useEffect(() => {
    if (!ready) return
    allCat.current.removeAll()
    const sources = items
      .filter((o) => o.ra != null && o.dec != null)
      .map((o) => A.source(o.ra, o.dec))
    if (sources.length) allCat.current.addSources(sources)
  }, [ready, items])

  // Highlight the selected observation
  useEffect(() => {
    if (!ready) return
    selCat.current.removeAll()
    if (selected && selected.ra != null && selected.dec != null) {
      selCat.current.addSources([A.source(selected.ra, selected.dec)])
      aladin.current.gotoRaDec(selected.ra, selected.dec)
    }
  }, [ready, selected])

  function searchHere() {
    if (!aladin.current) return
    const [r, d] = aladin.current.getRaDec()
    const p = norm(r, d)
    onSearchHere(p.ra, p.dec)
  }

  function goName(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !aladin.current) return
    setNameMsg('Looking up…')
    aladin.current.gotoObject(name.trim(), {
      success: () => {
        setNameMsg('')
        aladin.current.setFoV(3)
      },
      error: () => setNameMsg('Name not found. Try another name, like M31 or Orion Nebula.'),
    })
  }

  return (
    <div id="sky" className="mt-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <form onSubmit={goName} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Go to a name, e.g. M31"
            className="w-52 rounded bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button type="submit" className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">Go</button>
        </form>
        <button
          onClick={searchHere}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Search here (center of the map)
        </button>
        {nameMsg && <span className="text-xs text-amber-400">{nameMsg}</span>}
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Drag the map until the purple + is on the area you want. The RA and Dec boxes above follow the + automatically. Then click Search.
      </p>
      <div
        id="aladin-lite-div"
        className="h-[450px] w-full overflow-hidden rounded-xl border border-white/10"
      />
      <p className="mt-2 text-xs text-slate-500">
        Background: DSS2 survey, for context only. Cyan dots mark the center of each real SPHEREx image. The orange dot is your selection.
      </p>
    </div>
  )
}