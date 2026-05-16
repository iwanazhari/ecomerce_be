/**
 * Image Cleanup Subscriber
 *
 * Deletes associated images from Cloudflare R2 when a product is deleted.
 * Prevents orphaned files from accumulating in storage.
 *
 * Triggered on: product.deleted event
 */

import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import type { Logger } from '@medusajs/types'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
})

const BUCKET = process.env.MINIO_BUCKET || ''

export default async function cleanupProductImages({ event, container }: SubscriberArgs<{ id: string }>) {
  const productId = event.data.id
  if (!productId) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger

  try {
    // R2 stores images under "uploads/products/<product-id>/" or similar paths
    // List all objects with the product ID prefix
    const prefix = `uploads/products/${productId}`

    const listResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
      })
    )

    const objects = listResponse.Contents || []
    if (objects.length === 0) {
      logger.info(`[ImageCleanup] No images found for product ${productId}`)
      return
    }

    const keys = objects.map((obj) => ({ Key: obj.Key! }))

    // Delete all objects in batches (max 1000 per request)
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: keys, Quiet: true },
      })
    )

    logger.info(`[ImageCleanup] Deleted ${keys.length} images for product ${productId}`)
  } catch (error: any) {
    logger.error(`[ImageCleanup] Error cleaning up images for product ${productId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ['product.deleted'],
  context: { subscriberId: 'image-cleanup-subscriber' },
}
