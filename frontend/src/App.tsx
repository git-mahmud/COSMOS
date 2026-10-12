import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SearchPanel from './components/SearchPanel'
import SkyViewer from './components/SkyViewer'
import ObservationDetail from './components/ObservationDetail'
import ObservationList from './components/ObservationList'
import { searchObservations, type Observation } from './api'

export default function App() {
  const [items, setItems] = useState<Observation[]>([])
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Observation | null>(null)
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
      setItems(results)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
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
        {error && <p className="mt-4 text-red-400">{error}</p>}
        <SkyViewer center={center} items={items} selected={selected} />
        <ObservationDetail obs={selected} />
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