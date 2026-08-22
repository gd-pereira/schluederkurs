import { defaultWsUrl, type MatchEvent, type PodId } from './matchEvents'

export type WsHandlers = {
  onWelcome?: (info: { code: string; pod: PodId; peers: number }) => void
  onError?: (message: string) => void
  onPeerJoined?: (peers: number) => void
  onPeerLeft?: (peers: number) => void
  onReadyState?: (info: {
    pod: PodId
    ready: boolean
    allReady: boolean
  }) => void
  onStartLockdown?: () => void
  onMatchEvent?: (event: MatchEvent, from: PodId) => void
  onGhost?: (x: number, y: number, from: PodId) => void
  onClose?: () => void
  onOpen?: () => void
}

export type WsClient = {
  send: (msg: Record<string, unknown>) => void
  close: () => void
}

const KEEPALIVE_MS = 20_000

export function connectWs(handlers: WsHandlers): WsClient {
  const url = defaultWsUrl()
  const ws = new WebSocket(url)
  const queue: Record<string, unknown>[] = []
  let keepaliveId: ReturnType<typeof setInterval> | null = null

  function flush() {
    while (queue.length > 0 && ws.readyState === WebSocket.OPEN) {
      const msg = queue.shift()
      if (msg) ws.send(JSON.stringify(msg))
    }
  }

  function stopKeepalive() {
    if (keepaliveId !== null) {
      clearInterval(keepaliveId)
      keepaliveId = null
    }
  }

  function startKeepalive() {
    stopKeepalive()
    keepaliveId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'keepalive' }))
      }
    }, KEEPALIVE_MS)
  }

  ws.addEventListener('open', () => {
    flush()
    startKeepalive()
    handlers.onOpen?.()
  })

  ws.addEventListener('message', (ev) => {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(String(ev.data)) as Record<string, unknown>
    } catch {
      return
    }

    switch (msg.type) {
      case 'welcome':
        handlers.onWelcome?.({
          code: String(msg.code),
          pod: msg.pod === 'b' ? 'b' : 'a',
          peers: Number(msg.peers) || 1,
        })
        break
      case 'error':
        handlers.onError?.(String(msg.message ?? 'Unknown error'))
        break
      case 'peerJoined':
        handlers.onPeerJoined?.(Number(msg.peers) || 1)
        break
      case 'peerLeft':
        handlers.onPeerLeft?.(Number(msg.peers) || 0)
        break
      case 'readyState':
        handlers.onReadyState?.({
          pod: msg.pod === 'b' ? 'b' : 'a',
          ready: Boolean(msg.ready),
          allReady: Boolean(msg.allReady),
        })
        break
      case 'startLockdown':
        handlers.onStartLockdown?.()
        break
      case 'matchEvent':
        if (msg.event && typeof msg.event === 'object') {
          handlers.onMatchEvent?.(
            msg.event as MatchEvent,
            msg.from === 'b' ? 'b' : 'a',
          )
        }
        break
      case 'ghost':
        handlers.onGhost?.(
          Number(msg.x) || 0,
          Number(msg.y) || 0,
          msg.from === 'b' ? 'b' : 'a',
        )
        break
      case 'keepalive':
        break
      default:
        break
    }
  })

  ws.addEventListener('close', () => {
    stopKeepalive()
    handlers.onClose?.()
  })
  ws.addEventListener('error', () => {
    handlers.onError?.(
      `Cannot reach game server at ${url}. Is npm run server / dev:all running?`,
    )
  })

  return {
    send(msg) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
      } else {
        queue.push(msg)
      }
    },
    close() {
      queue.length = 0
      stopKeepalive()
      ws.close()
    },
  }
}

export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
}

export function helloHost(client: WsClient) {
  client.send({ type: 'hello', role: 'host' })
}

export function helloJoin(client: WsClient, code: string) {
  client.send({ type: 'hello', role: 'join', code: normalizeRoomCode(code) })
}

export function sendReady(client: WsClient, ready: boolean) {
  client.send({ type: 'ready', ready })
}

export function sendMatchEvent(client: WsClient, event: MatchEvent) {
  client.send({ type: 'matchEvent', event })
}

export function sendGhost(client: WsClient, x: number, y: number) {
  client.send({ type: 'ghost', x, y })
}
