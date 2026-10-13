const steps = [
  ['1. Explore', 'Search any sky position (RA and Dec). The map shows where each real SPHEREx image is.'],
  ['2. Compare', 'Pick an earlier image (A) and a later image (B) in the same color band. View them with a slider, blink or side by side.'],
  ['3. Discover', 'The Change Finder lists spots where B differs strongly from A, with the evidence behind each one.'],
  ['4. Understand', 'The Discovery Journey explains each candidate in plain words, and says why it is still uncertain.'],
]

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-2xl font-bold">How it works</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([title, text]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm">
            <p className="font-semibold text-cyan-400">{title}</p>
            <p className="mt-2 text-slate-300">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        A candidate is a possible change, not a confirmed asteroid, comet or planet. Confirming one needs more observations.
      </p>
    </section>
  )
}