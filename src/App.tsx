import { WORLD_H, WORLD_W } from './game/constants'
import { useFitScale } from './hooks/useFitScale'
import WorldView from './components/WorldView'

export default function App() {
  const scale = useFitScale(WORLD_W, WORLD_H, 20)

  return (
    <main className="game-stage relative flex h-svh w-full items-center justify-center overflow-hidden text-neutral-100">
      <div
        className="relative shrink-0"
        style={{
          width: WORLD_W * scale,
          height: WORLD_H * scale,
        }}
      >
        <div
          className="origin-top-left"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `scale(${scale})`,
          }}
        >
          <WorldView />
        </div>
      </div>
    </main>
  )
}
