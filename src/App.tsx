import WorldView from './components/WorldView'

export default function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-neutral-950 px-4 py-6 text-neutral-100">
      <header className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Incompetent Chambers</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Lobby: Solo / Create / Join · WASD · E · Partner sim (solo) · L debug
        </p>
      </header>
      <div className="max-w-full overflow-auto">
        <WorldView />
      </div>
    </main>
  )
}
