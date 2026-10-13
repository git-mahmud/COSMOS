export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
      <h1 className="text-3xl font-extrabold tracking-wide sm:text-6xl">THE UNIVERSE IS ALWAYS CHANGING</h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
        Explore the sky through real SPHEREx observations. Compare different moments in time. Discover what changes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a href="#explore" className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Explore the Sky</a>
        <a href="#how" className="rounded-lg border border-white/20 px-6 py-3 font-semibold hover:bg-white/10">See How It Works</a>
      </div>
    </section>
  )
}