import { useState } from 'react'

type Props = { onSearch: (ra: number, dec: number) => void; loading: boolean }

export default function SearchPanel({ onSearch, loading }: Props) {
  const [ra, setRa] = useState('150.1')
  const [dec, setDec] = useState('2.2')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(Number(ra), Number(dec))
      }}
      className="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-slate-900 p-4"
    >
      <label className="text-sm">
        <span className="mb-1 block text-slate-400">RA (0 to 360)</span>
        <input value={ra} onChange={(e) => setRa(e.target.value)} type="number" step="any" min="0" max="360"
          className="w-40 rounded bg-slate-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-slate-400">Dec (-90 to 90)</span>
        <input value={dec} onChange={(e) => setDec(e.target.value)} type="number" step="any" min="-90" max="90"
          className="w-40 rounded bg-slate-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500" />
      </label>
      <button type="submit" disabled={loading}
        className="rounded-lg bg-cyan-500 px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}