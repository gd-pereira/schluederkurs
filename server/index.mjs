import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 8080

/** @typedef {{ ws: import('ws').WebSocket, pod: 'a' | 'b', ready: boolean }} Client */

/** @type {Map<string, { clients: Client[] }>} */
const rooms = new Map()

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

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.ico') return 'image/x-icon'
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
      // SPA fallback
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

const server = http.createServer((req, res) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res)
    return
  }
  res.writeHead(405)
  res.end('Method not allowed')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  /** @type {{ code: string, pod: 'a' | 'b' } | null} */
  let membership = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }

    if (msg.type === 'hello') {
      const role = msg.role === 'join' ? 'join' : 'host'
      let code = typeof msg.code === 'string' ? msg.code.toUpperCase().trim() : ''

      if (role === 'host') {
        do {
          code = makeCode()
        } while (rooms.has(code))
        rooms.set(code, { clients: [] })
      } else {
        if (!code || !rooms.has(code)) {
          send(ws, { type: 'error', message: 'Room not found' })
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
