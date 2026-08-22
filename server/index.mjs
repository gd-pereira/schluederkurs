import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 8080
const MAX_SCORES = 20

/** @typedef {{ ws: import('ws').WebSocket, pod: 'a' | 'b', ready: boolean }} Client */
/** @typedef {{ timeMs: number, at: number, code?: string }} ScoreEntry */

/** @type {Map<string, { clients: Client[] }>} */
const rooms = new Map()

/** @type {ScoreEntry[]} */
let highscores = []

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg))
}

function broadcast(room, msg, except) {
  for (const c of room.clients) {
    if (c.ws !== except) send(c.ws, msg)
  }
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

function setCors(req, res) {
  const origin = req.headers.origin || ''
  // Same-origin prod needs no CORS; Vite/dev may hit :8080 from :5173/:4173
  if (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('https://localhost:') ||
    origin.startsWith('https://127.0.0.1:')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.woff') return 'font/woff'
  if (ext === '.woff2') return 'font/woff2'
  return 'application/octet-stream'
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  let rel = urlPath === '/' ? '/index.html' : urlPath
  const filePath = path.normalize(path.join(DIST, rel))
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(DIST, 'index.html'), (err2, html) => {
        if (err2) {
          res.writeHead(404)
          res.end('Not found — run npm run build')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
      })
      return
    }
    res.writeHead(200, { 'Content-Type': contentType(filePath) })
    res.end(data)
  })
}

async function handleApi(req, res) {
  setCors(req, res)
  const urlPath = (req.url || '').split('?')[0]

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }

  if (urlPath === '/api/highscores' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(highscores))
    return true
  }

  if (urlPath === '/api/highscores' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      const timeMs = Number(body.timeMs)
      if (!Number.isFinite(timeMs) || timeMs < 0 || timeMs > 24 * 60 * 60 * 1000) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid timeMs' }))
        return true
      }
      /** @type {ScoreEntry} */
      const entry = {
        timeMs: Math.floor(timeMs),
        at: Date.now(),
      }
      if (typeof body.code === 'string' && body.code.trim()) {
        entry.code = body.code.trim().toUpperCase().slice(0, 8)
      }
      highscores = [...highscores, entry]
        .sort((a, b) => a.timeMs - b.timeMs)
        .slice(0, MAX_SCORES)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(highscores))
      return true
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Bad JSON' }))
      return true
    }
  }

  return false
}

const server = http.createServer(async (req, res) => {
  if (await handleApi(req, res)) return
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res)
    return
  }
  res.writeHead(405)
  res.end('Method not allowed')
})

const wss = new WebSocketServer({ server })

/** Keep reverse-proxy idle timeouts from killing lobby / mid-match sockets */
const HEARTBEAT_MS = 25_000
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate()
      continue
    }
    ws.isAlive = false
    ws.ping()
  }
}, HEARTBEAT_MS)
wss.on('close', () => clearInterval(heartbeat))

wss.on('connection', (ws) => {
  /** @type {{ code: string, pod: 'a' | 'b' } | null} */
  let membership = null
  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }

    if (msg.type === 'hello') {
      const role = msg.role === 'join' ? 'join' : 'host'
      let code =
        typeof msg.code === 'string'
          ? msg.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
          : ''

      if (role === 'host') {
        do {
          code = makeCode()
        } while (rooms.has(code))
        rooms.set(code, { clients: [] })
      } else {
        if (!code || !rooms.has(code)) {
          send(ws, {
            type: 'error',
            message:
              'Room not found. Host may have left, or try Start Game again.',
          })
          return
        }
      }

      const room = rooms.get(code)
      if (!room) return
      if (room.clients.length >= 2) {
        send(ws, { type: 'error', message: 'Room full' })
        return
      }

      const pod = room.clients.length === 0 ? 'a' : 'b'
      const client = { ws, pod, ready: false }
      room.clients.push(client)
      membership = { code, pod }

      send(ws, {
        type: 'welcome',
        code,
        pod,
        peers: room.clients.length,
      })
      broadcast(room, { type: 'peerJoined', peers: room.clients.length, pod }, ws)
      return
    }

    if (msg.type === 'keepalive') {
      // Data-frame keepalive so reverse proxies reset idle timers (lobby + match).
      send(ws, { type: 'keepalive' })
      return
    }

    if (!membership) return
    const room = rooms.get(membership.code)
    if (!room) return
    const self = room.clients.find((c) => c.ws === ws)
    if (!self) return

    if (msg.type === 'ready') {
      self.ready = Boolean(msg.ready)
      const allReady =
        room.clients.length === 2 && room.clients.every((c) => c.ready)
      broadcast(room, {
        type: 'readyState',
        pod: self.pod,
        ready: self.ready,
        allReady,
      })
      if (allReady) {
        broadcast(room, { type: 'startLockdown' })
        for (const c of room.clients) c.ready = false
      }
      return
    }

    if (msg.type === 'matchEvent' || msg.type === 'ghost') {
      broadcast(room, { ...msg, from: self.pod }, ws)
      return
    }
  })

  ws.on('close', () => {
    if (!membership) return
    const room = rooms.get(membership.code)
    if (!room) return
    room.clients = room.clients.filter((c) => c.ws !== ws)
    broadcast(room, {
      type: 'peerLeft',
      peers: room.clients.length,
    })
    if (room.clients.length === 0) rooms.delete(membership.code)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Incompetent Chambers listening on :${PORT}`)
})
