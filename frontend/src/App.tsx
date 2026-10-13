import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SearchPanel from './components/SearchPanel'
import SkyViewer from './components/SkyViewer'
import ObservationDetail from './components/ObservationDetail'
import TimeMachine from './components/TimeMachine'
import ObservationList from './components/ObservationList'
import { searchObservations, getObservation, type Observation } from './api'

const DEMO_A = 'ivo://irsa.ipac/spherex_qr2?2025W17_4B_0043_1/D1'
const DEMO_B = 'ivo://irsa.ipac/spherex_qr2?2025W19_2B_0103_1/D1'

export default function App() {
  const [items, setItems] = useState<Observation[]>([])
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Observation | null>(null)
  const [a, setA] = useState<Observation | null>(null)
  const [b, setB] = useState<Observation | null>(null)
  const [center, setCenter] = useState({ ra: 150.1, dec: 2.2 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(ra: number, dec: number) {
    setLoading(true)
    setError(null)
    try {
      const results = await searchObservations(ra, dec)
      setCenter({ ra, dec })
      setSelected(null)
      setA(null)
      setB(null)
      setItems(results)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function loadDemo() {
    await handleSearch(151.815, 2.826)
    try {
      const [oa, ob] = await Promise.all([getObservation(DEMO_A), getObservation(DEMO_B)])
      setA(oa)
      setB(ob)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the demo pair')
    }
  }

  function handleSelect(o: Observation) {
    setSelected(o)
    document.getElementById('sky')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar />
      <Hero />
      <main id="explore" className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-4 text-2xl font-bold">Explore Sky</h2>
        <SearchPanel onSearch={handleSearch} loading={loading} />
        <button onClick={loadDemo} disabled={loading} className="mt-3 text-sm text-cyan-400 hover:underline disabled:opacity-50">
          Load demo pair (Apr 25 vs May 9, 2025, same band)
        </button>
        {error && <p className="mt-4 text-red-400">{error}</p>}
        <SkyViewer center={center} items={items} selected={selected} />
        <ObservationDetail obs={selected} a={a} b={b} onSetA={setA} onSetB={setB} />
        {a && b && <TimeMachine a={a} b={b} center={center} />}
        {searched && (
          <>
            <p className="mt-6 text-slate-400">{items.length} observations found</p>
            <ObservationList items={items} selectedId={selected?.source_id ?? null} onSelect={handleSelect} />
          </>
        )}
      </main>
    </>
  )
}