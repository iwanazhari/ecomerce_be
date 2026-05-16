/**
 * Image Processing Subscriber
 *
 * Hooks into Medusa's file upload workflow to process images:
 * - Resize large images to max 1200px
 * - Generate WebP version for modern browsers
 * - Generate thumbnail (400px) for product grids
 * - Validate file type and size (by inspecting actual file content)
 *
 * Triggered on: file.created event
 */

import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import type { IFileModuleService, Logger } from '@medusajs/types'
import sharp from 'sharp'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = parseInt(process.env.MINIO_MAX_FILE_SIZE || '5242880', 10) // 5MB default

// Image dimensions
const MAX_WIDTH = 1200
const THUMBNAIL_WIDTH = 400
const WEBP_QUALITY = 80

const s3Client = new S3Client({
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
})

const BUCKET = process.env.MINIO_BUCKET || ''

/**
 * Process uploaded image file:
 * 1. Download from S3
 * 2. Validate size and type
 * 3. Resize to max dimensions
 * 4. Generate WebP version
 * 5. Generate thumbnail
 * 6. Upload all versions back to S3
 */
export default async function processImageUpload({ event, container }: SubscriberArgs<{ id: string }>) {
  const fileId = event.data.id
  if (!fileId) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger
  const fileService = container.resolve(Modules.FILE) as unknown as IFileModuleService

  try {
    // Get file from Medusa to get its URL
    const files = await fileService.listFiles({ id: fileId })
    const file = files[0]
    if (!file) {
      logger.warn(`[ImageProcessor] File ${fileId} not found`)
      return
    }

    const fileUrl = file.url
    if (!fileUrl) {
      logger.warn(`[ImageProcessor] No URL for file ${fileId}`)
      return
    }

    // Extract file key from URL
    const fileKey = getFileKeyFromUrl(fileUrl)
    if (!fileKey) {
      logger.warn(`[ImageProcessor] Could not extract file key from URL: ${fileUrl}`)
      return
    }

    // Download file from S3
    const getObject = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: fileKey }))
    const buffer = await getObject.Body?.transformToByteArray()
    if (!buffer || buffer.length === 0) {
      logger.warn(`[ImageProcessor] Empty body for file ${fileKey}`)
      return
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      logger.error(`[ImageProcessor] Rejected ${fileKey}: file too large (${buffer.length} bytes, max ${MAX_FILE_SIZE})`)
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }))
      return
    }

    // Validate image type by attempting to parse with sharp
    let metadata: sharp.Metadata
    try {
      metadata = await sharp(buffer).metadata()
    } catch {
      logger.error(`[ImageProcessor] Rejected ${fileKey}: not a valid image file`)
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }))
      return
    }

    const format = metadata.format
    if (!format || !['jpeg', 'png', 'webp'].includes(format)) {
      logger.error(`[ImageProcessor] Rejected ${fileKey}: unsupported format ${format}`)
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }))
      return
    }

    // Parse file key to get base name and extension
    const parsedPath = parseFileKey(fileKey)
    const contentType = `image/${format}`

    // Process: resize to max width
    const resizedBuffer = await sharp(buffer)
      .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()

    // Generate WebP version
    const webpBuffer = await sharp(resizedBuffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // Generate thumbnail
    const thumbnailBuffer = await sharp(resizedBuffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, { fit: 'inside', withoutEnlargement: true })
      .toBuffer()

    const thumbnailWebpBuffer = await sharp(thumbnailBuffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    // Upload processed versions
    const uploads = [
      // Replace original with resized version
      uploadToS3(fileKey, resizedBuffer, contentType),
      // WebP version
      uploadToS3(`${parsedPath.dirname}/${parsedPath.name}.webp`, webpBuffer, 'image/webp'),
      // Thumbnail (JPEG)
      uploadToS3(`${parsedPath.dirname}/${parsedPath.name}-thumb.jpg`, thumbnailBuffer, 'image/jpeg'),
      // Thumbnail (WebP)
      uploadToS3(`${parsedPath.dirname}/${parsedPath.name}-thumb.webp`, thumbnailWebpBuffer, 'image/webp'),
    ]

    await Promise.all(uploads)

    logger.info(`[ImageProcessor] Processed ${fileKey}: ${format} → resized, WebP, thumbnails`)
  } catch (error: any) {
    logger.error(`[ImageProcessor] Error processing file ${fileId}: ${error.message}`)
  }
}

function getFileKeyFromUrl(url: string): string | null {
  try {
    // Handle R2 public URLs: https://pub-xxx.r2.dev/uploads/file.jpg
    const pubMatch = url.match(/pub-[^/]+\.r2\.dev\/(.+)/)
    if (pubMatch) return pubMatch[1]

    // Handle endpoint URLs: https://xxx.r2.cloudflarestorage.com/bucket/uploads/file.jpg
    const endpointMatch = url.match(/r2\.cloudflarestorage\.com\/[^/]+\/(.+)/)
    if (endpointMatch) return endpointMatch[1]

    // Handle relative paths: /static/uploads/file.jpg or /uploads/file.jpg
    if (url.startsWith('/uploads/') || url.startsWith('/static/uploads/')) {
      const path = url.replace('/static', '')
      return path.startsWith('/') ? path.slice(1) : path
    }

    // Already a file key
    return url
  } catch {
    return null
  }
}

function parseFileKey(key: string): { dirname: string; name: string; ext: string } {
  const lastSlash = key.lastIndexOf('/')
  const dirname = lastSlash >= 0 ? key.slice(0, lastSlash) : ''
  const basename = lastSlash >= 0 ? key.slice(lastSlash + 1) : key
  const lastDot = basename.lastIndexOf('.')
  const name = lastDot >= 0 ? basename.slice(0, lastDot) : basename
  const ext = lastDot >= 0 ? basename.slice(lastDot) : ''
  return { dirname, name, ext }
}

async function uploadToS3(key: string, buffer: Buffer, contentType: string) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    })
  )
}

export const config: SubscriberConfig = {
  event: ['file.created'],
  context: { subscriberId: 'image-processing-subscriber' },
}
