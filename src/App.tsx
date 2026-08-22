import WorldView from './components/WorldView'

export default function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 overflow-x-hidden bg-neutral-950 px-4 py-6 text-neutral-100">
      <header className="shrink-0 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Incompetent Chambers</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Lobby: Solo Pod A/B · Create / Join · WASD · E · P place (shows feet) · L
          dark
        </p>
      </header>
      {/* No overflow-auto: focus inside task modals must not scroll the game frame */}
      <div className="max-w-full shrink-0">
        <WorldView />
      </div>
    </main>
  )
}
