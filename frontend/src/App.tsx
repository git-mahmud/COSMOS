import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SearchPanel from './components/SearchPanel'
import ObservationList from './components/ObservationList'
import { searchObservations, type Observation } from './api'

export default function App() {
  const [items, setItems] = useState<Observation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(ra: number, dec: number) {
    setLoading(true)
    setError(null)
    try {
      setItems(await searchObservations(ra, dec))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <Hero />
      <main id="explore" className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-4 text-2xl font-bold">Explore Sky</h2>
        <SearchPanel onSearch={handleSearch} loading={loading} />
        {error && <p className="mt-4 text-red-400">{error}</p>}
        {items && (
          <>
            <p className="mt-6 text-slate-400">{items.length} observations found</p>
            <ObservationList items={items} />
          </>
        )}
      </main>
    </>
  )
}