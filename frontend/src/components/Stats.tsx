type Props = { observations: number | null; pairReady: boolean }

export default function Stats({ observations, pairReady }: Props) {
  const cards = [
    ['Observations loaded', observations == null ? 'Search to load' : String(observations)],
    ['Image pair selected', pairReady ? 'Yes (A and B)' : 'Not yet'],
    ['SPHEREx wavelength coverage', '0.75 – 5 µm'],
  ]
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 sm:grid-cols-3">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-cyan-400">{value}</p>
        </div>
      ))}
    </section>
  )
}