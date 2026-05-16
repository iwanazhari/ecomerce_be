"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const ioredis_1 = __importDefault(require("ioredis"));
const PORT = parseInt(process.env.BRIDGE_PORT || '3001', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_CHANNEL = 'waterpro:realtime';
const CORS_ORIGIN = process.env.BRIDGE_CORS_ORIGIN || 'http://localhost:3000';
// --- HTTP Server ---
const httpServer = (0, http_1.createServer)((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'waterpro-ws-bridge' }));
});
// --- Socket.io ---
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
io.on('connection', (socket) => {
    console.log(`[Bridge] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`[Bridge] Client disconnected: ${socket.id}`);
    });
    socket.on('error', (err) => {
        console.error(`[Bridge] Socket error for ${socket.id}:`, err.message);
    });
});
// --- Redis Subscriber ---
const redisSubscriber = new ioredis_1.default(REDIS_URL, {
    retryStrategy: (times) => {
        if (times > 10) {
            console.error('[Bridge] Redis connection failed after 10 retries, exiting');
            process.exit(1);
        }
        return Math.min(times * 500, 5000);
    },
    lazyConnect: true,
});
redisSubscriber.on('connect', () => {
    console.log('[Bridge] Connected to Redis');
});
redisSubscriber.on('error', (err) => {
    console.error('[Bridge] Redis error:', err.message);
});
async function start() {
    try {
        await redisSubscriber.connect();
        await redisSubscriber.subscribe(REDIS_CHANNEL);
        console.log(`[Bridge] Subscribed to Redis channel: ${REDIS_CHANNEL}`);
    }
    catch (err) {
        console.error('[Bridge] Failed to connect to Redis:', err);
        process.exit(1);
    }
    // Handle Redis messages
    redisSubscriber.on('message', (channel, message) => {
        if (channel !== REDIS_CHANNEL)
            return;
        try {
            const payload = JSON.parse(message);
            const { event, data, timestamp } = payload;
            if (!event) {
                console.warn('[Bridge] Received message without event name:', message);
                return;
            }
            console.log(`[Bridge] Forwarding "${event}" to ${io.sockets.sockets.size} clients`);
            // Emit to all connected clients
            io.emit(event, { data, timestamp });
        }
        catch (err) {
            console.error('[Bridge] Failed to parse Redis message:', message, err);
        }
    });
    // Start HTTP + Socket.io server
    httpServer.listen(PORT, () => {
        console.log(`[Bridge] WebSocket bridge listening on port ${PORT}`);
        console.log(`[Bridge] CORS origin: ${CORS_ORIGIN}`);
    });
}
// --- Graceful Shutdown ---
process.on('SIGINT', async () => {
    console.log('[Bridge] Shutting down...');
    io.close();
    await redisSubscriber.quit();
    httpServer.close(() => {
        console.log('[Bridge] Closed');
        process.exit(0);
    });
});
process.on('SIGTERM', async () => {
    console.log('[Bridge] Shutting down...');
    io.close();
    await redisSubscriber.quit();
    httpServer.close(() => {
        console.log('[Bridge] Closed');
        process.exit(0);
    });
});
start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JyaWRnZS9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7OztHQWNHOzs7OztBQUVILCtCQUFtQztBQUNuQyx5Q0FBOEM7QUFDOUMsc0RBQTJCO0FBRTNCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDNUQsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksd0JBQXdCLENBQUE7QUFDbkUsTUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUE7QUFDekMsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSx1QkFBdUIsQ0FBQTtBQUU3RSxzQkFBc0I7QUFDdEIsTUFBTSxVQUFVLEdBQUcsSUFBQSxtQkFBWSxFQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0lBQzNDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtJQUMxRCxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQTtBQUMxRSxDQUFDLENBQUMsQ0FBQTtBQUVGLG9CQUFvQjtBQUNwQixNQUFNLEVBQUUsR0FBRyxJQUFJLGtCQUFRLENBQUMsVUFBVSxFQUFFO0lBQ2xDLElBQUksRUFBRTtRQUNKLE1BQU0sRUFBRSxXQUFXO1FBQ25CLFdBQVcsRUFBRSxJQUFJO0tBQ2xCO0lBQ0QsVUFBVSxFQUFFLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztDQUNyQyxDQUFDLENBQUE7QUFFRixFQUFF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