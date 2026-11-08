"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = realtimeBridge;
const utils_1 = require("@medusajs/framework/utils");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_CHANNEL = 'waterpro:realtime';
// Lazy Redis connection singleton (avoid connection per event)
let redisClient = null;
function getRedisClient() {
    if (redisClient)
        return redisClient;
    redisClient = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times) => {
            if (times > 3)
                return null; // Stop retrying after 3 attempts
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
    });
    redisClient.on('error', (err) => {
        console.error('[RealtimeBridge] Redis error:', err.message);
    });
    return redisClient;
}
function mapEventToSocketEvent(eventName) {
    const mapping = {
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
    };
    return mapping[eventName] ?? null;
}
async function realtimeBridge({ event, container, }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const socketEvent = mapEventToSocketEvent(event.name);
    if (!socketEvent)
        return;
    try {
        const client = getRedisClient();
        await client.connect();
        const payload = {
            event: socketEvent,
            data: event.data,
            timestamp: new Date().toISOString(),
        };
        await client.publish(REDIS_CHANNEL, JSON.stringify(payload));
        logger.debug(`[RealtimeBridge] Published "${event.name}" → "${socketEvent}"`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[RealtimeBridge] Failed to publish "${event.name}": ${message}`);
    }
}
exports.config = {
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
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhbHRpbWUtYnJpZGdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3N1YnNjcmliZXJzL3JlYWx0aW1lLWJyaWRnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7Ozs7OztBQWdESCxpQ0F5QkM7QUF0RUQscURBQXFFO0FBRXJFLHNEQUEyQjtBQUUzQixNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQTtBQUV6QywrREFBK0Q7QUFDL0QsSUFBSSxXQUFXLEdBQWlCLElBQUksQ0FBQTtBQUVwQyxTQUFTLGNBQWM7SUFDckIsSUFBSSxXQUFXO1FBQUUsT0FBTyxXQUFXLENBQUE7SUFDbkMsV0FBVyxHQUFHLElBQUksaUJBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSx3QkFBd0IsRUFBRTtRQUN6RSxhQUFhLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN2QixJQUFJLEtBQUssR0FBRyxDQUFDO2dCQUFFLE9BQU8sSUFBSSxDQUFBLENBQUMsaUNBQWlDO1lBQzVELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BDLENBQUM7UUFDRCxXQUFXLEVBQUUsSUFBSTtLQUNsQixDQUFDLENBQUE7SUFDRixXQUFXLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQzlCLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzdELENBQUMsQ0FBQyxDQUFBO0lBQ0YsT0FBTyxXQUFXLENBQUE7QUFDcEIsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsU0FBaUI7SUFDOUMsTUFBTSxPQUFPLEdBQTJCO1FBQ3RDLGNBQWMsRUFBRSxlQUFlO1FBQy9CLGVBQWUsRUFBRSxlQUFlO1FBQ2hDLGdCQUFnQixFQUFFLGVBQWU7UUFDakMsaUJBQWlCLEVBQUUsZUFBZTtRQUNsQyxzQkFBc0IsRUFBRSxlQUFlO1FBQ3ZDLGlCQUFpQixFQUFFLGVBQWU7UUFDbEMsaUJBQWlCLEVBQUUsZUFBZTtRQUNsQyxpQkFBaUIsRUFBRSxlQUFlO1FBQ2xDLHdCQUF3QixFQUFFLGVBQWU7UUFDekMseUJBQXlCLEVBQUUsZUFBZTtRQUMxQyxjQUFjLEVBQUUsY0FBYztRQUM5QixzQkFBc0IsRUFBRSxrQkFBa0I7UUFDMUMscUJBQXFCLEVBQUUsa0JBQWtCO1FBQ3pDLHFCQUFxQixFQUFFLGtCQUFrQjtRQUN6QyxzQkFBc0IsRUFBRSxrQkFBa0I7S0FDM0MsQ0FBQTtJQUNELE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQTtBQUNuQyxDQUFDO0FBRWMsS0FBSyxVQUFVLGNBQWMsQ0FBQyxFQUMzQyxLQUFLLEVBQ0wsU0FBUyxHQUMrQjtJQUN4QyxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLE1BQU0sQ0FBVyxDQUFBO0lBQzVFLE1BQU0sV0FBVyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUVyRCxJQUFJLENBQUMsV0FBVztRQUFFLE9BQU07SUFFeEIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsY0FBYyxFQUFFLENBQUE7UUFDL0IsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFdEIsTUFBTSxPQUFPLEdBQUc7WUFDZCxLQUFLLEVBQUUsV0FBVztZQUNsQixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDaEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUE7UUFFRCxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtRQUM1RCxNQUFNLENBQUMsS0FBSyxDQUFDLCtCQUErQixLQUFLLENBQUMsSUFBSSxRQUFRLFdBQVcsR0FBRyxDQUFDLENBQUE7SUFDL0UsQ0FBQztJQUFDLE9BQU8sS0FBYyxFQUFFLENBQUM7UUFDeEIsTUFBTSxPQUFPLEdBQUcsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3RFLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEtBQUssQ0FBQyxJQUFJLE1BQU0sT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUNoRixDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFxQjtJQUN0QyxLQUFLLEVBQUU7UUFDTCxjQUFjO1FBQ2QsZUFBZTtRQUNmLGdCQUFnQjtRQUNoQixpQkFBaUI7UUFDakIsc0JBQXNCO1FBQ3RCLGlCQUFpQjtRQUNqQixpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLHdCQUF3QjtRQUN4Qix5QkFBeUI7UUFDekIsY0FBYztRQUNkLHNCQUFzQjtRQUN0QixxQkFBcUI7UUFDckIscUJBQXFCO1FBQ3JCLHNCQUFzQjtLQUN2QjtJQUNELE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSw0QkFBNEIsRUFBRTtDQUN4RCxDQUFBIn0=