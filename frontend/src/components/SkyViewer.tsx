import { useEffect, useRef, useState } from 'react'
import type { Observation } from '../api'

declare const A: any

type Props = {
  center: { ra: number; dec: number }
  items: Observation[]
  selected: Observation | null
}

export default function SkyViewer({ center, items, selected }: Props) {
  const aladin = useRef<any>(null)
  const allCat = useRef<any>(null)
  const selCat = useRef<any>(null)
  const started = useRef(false)
  const [ready, setReady] = useState(false)

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

  return (
    <div id="sky" className="mt-6">
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