export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <span className="text-xl font-bold tracking-widest text-cyan-400">COSMOS</span>
        <nav className="hidden gap-6 text-sm text-slate-300 sm:flex">
          <a href="#explore" className="hover:text-white">Explore Sky</a>
          <span className="text-slate-500">Time Machine (soon)</span>
          <span className="text-slate-500">Discoveries (soon)</span>
        </nav>
        <a href="#explore" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Launch Explorer
        </a>
      </div>
    </header>
  )
}