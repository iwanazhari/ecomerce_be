/**
 * WebSocket Bridge Service
 *
 * Standalone Node.js service that bridges Redis pub/sub → Socket.io.
 *
 * Flow:
 *   Medusa Backend → Subscriber → Redis PUB/SUB "waterpro:realtime"
 *   → This bridge → Socket.io emit → Frontend clients
 *
 * Runs on port 3001 (replacing the old legacy Express backend port).
 *
 * Usage:
 *   npm run bridge    (dev, with tsx)
 *   node dist/bridge/server.js  (production)
 */

import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import Redis from 'ioredis'

const PORT = parseInt(process.env.BRIDGE_PORT || '3001', 10)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const REDIS_CHANNEL = 'waterpro:realtime'
const CORS_ORIGIN = process.env.BRIDGE_CORS_ORIGIN || 'http://localhost:3000'

// --- HTTP Server ---
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok', service: 'waterpro-ws-bridge' }))
})

// --- Socket.io ---
const io = new SocketIO(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

io.on('connection', (socket) => {
  console.log(`[Bridge] Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`[Bridge] Client disconnected: ${socket.id}`)
  })

  socket.on('error', (err) => {
    console.error(`[Bridge] Socket error for ${socket.id}:`, err.message)
  })
})

// --- Redis Subscriber ---
const redisSubscriber = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('[Bridge] Redis connection failed after 10 retries, exiting')
      process.exit(1)
    }
    return Math.min(times * 500, 5000)
  },
  lazyConnect: true,
})

redisSubscriber.on('connect', () => {
  console.log('[Bridge] Connected to Redis')
})

redisSubscriber.on('error', (err) => {
  console.error('[Bridge] Redis error:', err.message)
})

async function start() {
  try {
    await redisSubscriber.connect()
    await redisSubscriber.subscribe(REDIS_CHANNEL)
    console.log(`[Bridge] Subscribed to Redis channel: ${REDIS_CHANNEL}`)
  } catch (err) {
    console.error('[Bridge] Failed to connect to Redis:', err)
    process.exit(1)
  }

  // Handle Redis messages
  redisSubscriber.on('message', (channel, message) => {
    if (channel !== REDIS_CHANNEL) return

    try {
      const payload = JSON.parse(message)
      const { event, data, timestamp } = payload

      if (!event) {
        console.warn('[Bridge] Received message without event name:', message)
        return
      }

      console.log(`[Bridge] Forwarding "${event}" to ${io.sockets.sockets.size} clients`)

      // Emit to all connected clients
      io.emit(event, { data, timestamp })
    } catch (err) {
      console.error('[Bridge] Failed to parse Redis message:', message, err)
    }
  })

  // Start HTTP + Socket.io server
  httpServer.listen(PORT, () => {
    console.log(`[Bridge] WebSocket bridge listening on port ${PORT}`)
    console.log(`[Bridge] CORS origin: ${CORS_ORIGIN}`)
  })
}

// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
  console.log('[Bridge] Shutting down...')
  io.close()
  await redisSubscriber.quit()
  httpServer.close(() => {
    console.log('[Bridge] Closed')
    process.exit(0)
  })
})

process.on('SIGTERM', async () => {
  console.log('[Bridge] Shutting down...')
  io.close()
  await redisSubscriber.quit()
  httpServer.close(() => {
    console.log('[Bridge] Closed')
    process.exit(0)
  })
})

start()
