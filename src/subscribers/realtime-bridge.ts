/**
 * Realtime Bridge Subscriber
 *
 * Bridges Medusa EventBus events to Redis pub/sub for the WebSocket bridge service.
 * This allows real-time push notifications to the frontend via Socket.io.
 *
 * Architecture:
 *   Medusa Event → This Subscriber → Redis PUB/SUB "waterpro:realtime" → Bridge Service → Socket.io → Frontend
 *
 * Event mapping (Medusa → Frontend socket events):
 *   order.placed          → order:created  (store + admin)
 *   order.updated         → order:updated  (store + admin)
 *   order.canceled        → order:updated  (store + admin)
 *   order.completed       → order:updated  (store + admin)
 *   product.created       → stock:updated  (admin)
 *   product.updated       → stock:updated  (admin)
 *   inventory_item.updated → stock:updated (admin)
 *   cart.updated          → cart:updated   (store)
 *   notification.created  → notification:new (store + admin)
 */

import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import type { Logger } from '@medusajs/types'
import Redis from 'ioredis'

const REDIS_CHANNEL = 'waterpro:realtime'

// Lazy Redis connection singleton (avoid connection per event)
let redisClient: Redis | null = null

function getRedisClient(): Redis {
  if (redisClient) return redisClient
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => {
      if (times > 3) return null // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })
  redisClient.on('error', (err) => {
    console.error('[RealtimeBridge] Redis error:', err.message)
  })
  return redisClient
}

function mapEventToSocketEvent(eventName: string): string | null {
  const mapping: Record<string, string> = {
    'order.placed': 'order:created',
    'order.updated': 'order:updated',
    'order.canceled': 'order:updated',
    'order.completed': 'order:updated',
    'order.refund_created': 'order:updated',
    'product.created': 'stock:updated',
    'product.updated': 'stock:updated',
    'product.deleted': 'stock:updated',
    'inventory_item.updated': 'stock:updated',
    'inventory_level.updated': 'stock:updated',
    'cart.updated': 'cart:updated',
    'notification.created': 'notification:new',
    'fulfillment.created': 'shipment:updated',
    'fulfillment.updated': 'shipment:updated',
    'fulfillment.canceled': 'shipment:updated',
  }
  return mapping[eventName] ?? null
}

export default async function realtimeBridge({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger
  const socketEvent = mapEventToSocketEvent(event.name)

  if (!socketEvent) return

  try {
    const client = getRedisClient()
    await client.connect()

    const payload = {
      event: socketEvent,
      data: event.data,
      timestamp: new Date().toISOString(),
    }

    await client.publish(REDIS_CHANNEL, JSON.stringify(payload))
    logger.debug(`[RealtimeBridge] Published "${event.name}" → "${socketEvent}"`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`[RealtimeBridge] Failed to publish "${event.name}": ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    'order.placed',
    'order.updated',
    'order.canceled',
    'order.completed',
    'order.refund_created',
    'product.created',
    'product.updated',
    'product.deleted',
    'inventory_item.updated',
    'inventory_level.updated',
    'cart.updated',
    'notification.created',
    'fulfillment.created',
    'fulfillment.updated',
    'fulfillment.canceled',
  ],
  context: { subscriberId: 'realtime-bridge-subscriber' },
}
