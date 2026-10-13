const links = [
  ['Explore Sky', '#explore'],
  ['Time Machine', '#time-machine'],
  ['Discoveries', '#discoveries'],
  ['Learn', '#how'],
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <a href="#top" className="text-xl font-bold tracking-widest text-cyan-400">COSMOS</a>
        <nav className="flex gap-3 overflow-x-auto text-xs text-slate-300 sm:gap-6 sm:text-sm">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="whitespace-nowrap hover:text-white">{label}</a>
          ))}
        </nav>
        <a href="#explore" className="hidden rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 sm:block">
          Launch Explorer
        </a>
      </div>
    </header>
  )
}