"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = processImageUpload;
const utils_1 = require("@medusajs/framework/utils");
const sharp_1 = __importDefault(require("sharp"));
const client_s3_1 = require("@aws-sdk/client-s3");
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = parseInt(process.env.MINIO_MAX_FILE_SIZE || '5242880', 10); // 5MB default
// Image dimensions
const MAX_WIDTH = 1200;
const THUMBNAIL_WIDTH = 400;
const WEBP_QUALITY = 80;
const s3Client = new client_s3_1.S3Client({
    region: process.env.MINIO_REGION || 'us-east-1',
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || '',
    },
    forcePathStyle: true,
});
const BUCKET = process.env.MINIO_BUCKET || '';
/**
 * Process uploaded image file:
 * 1. Download from S3
 * 2. Validate size and type
 * 3. Resize to max dimensions
 * 4. Generate WebP version
 * 5. Generate thumbnail
 * 6. Upload all versions back to S3
 */
async function processImageUpload({ event, container }) {
    const fileId = event.data.id;
    if (!fileId)
        return;
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const fileService = container.resolve(utils_1.Modules.FILE);
    try {
        // Get file from Medusa to get its URL
        const files = await fileService.listFiles({ id: fileId });
        const file = files[0];
        if (!file) {
            logger.warn(`[ImageProcessor] File ${fileId} not found`);
            return;
        }
        const fileUrl = file.url;
        if (!fileUrl) {
            logger.warn(`[ImageProcessor] No URL for file ${fileId}`);
            return;
        }
        // Extract file key from URL
        const fileKey = getFileKeyFromUrl(fileUrl);
        if (!fileKey) {
            logger.warn(`[ImageProcessor] Could not extract file key from URL: ${fileUrl}`);
            return;
        }
        // Download file from S3
        const getObject = await s3Client.send(new client_s3_1.GetObjectCommand({ Bucket: BUCKET, Key: fileKey }));
        const buffer = await getObject.Body?.transformToByteArray();
        if (!buffer || buffer.length === 0) {
            logger.warn(`[ImageProcessor] Empty body for file ${fileKey}`);
            return;
        }
        // Validate file size
        if (buffer.length > MAX_FILE_SIZE) {
            logger.error(`[ImageProcessor] Rejected ${fileKey}: file too large (${buffer.length} bytes, max ${MAX_FILE_SIZE})`);
            await s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }));
            return;
        }
        // Validate image type by attempting to parse with sharp
        let metadata;
        try {
            metadata = await (0, sharp_1.default)(buffer).metadata();
        }
        catch {
            logger.error(`[ImageProcessor] Rejected ${fileKey}: not a valid image file`);
            await s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }));
            return;
        }
        const format = metadata.format;
        if (!format || !['jpeg', 'png', 'webp'].includes(format)) {
            logger.error(`[ImageProcessor] Rejected ${fileKey}: unsupported format ${format}`);
            await s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey }));
            return;
        }
        // Parse file key to get base name and extension
        const parsedPath = parseFileKey(fileKey);
        const contentType = `image/${format}`;
        // Process: resize to max width
        const resizedBuffer = await (0, sharp_1.default)(buffer)
            .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        // Generate WebP version
        const webpBuffer = await (0, sharp_1.default)(resizedBuffer)
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
        // Generate thumbnail
        const thumbnailBuffer = await (0, sharp_1.default)(resizedBuffer)
            .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        const thumbnailWebpBuffer = await (0, sharp_1.default)(thumbnailBuffer)
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();
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
        ];
        await Promise.all(uploads);
        logger.info(`[ImageProcessor] Processed ${fileKey}: ${format} → resized, WebP, thumbnails`);
    }
    catch (error) {
        logger.error(`[ImageProcessor] Error processing file ${fileId}: ${error.message}`);
    }
}
function getFileKeyFromUrl(url) {
    try {
        // Handle R2 public URLs: https://pub-xxx.r2.dev/uploads/file.jpg
        const pubMatch = url.match(/pub-[^/]+\.r2\.dev\/(.+)/);
        if (pubMatch)
            return pubMatch[1];
        // Handle endpoint URLs: https://xxx.r2.cloudflarestorage.com/bucket/uploads/file.jpg
        const endpointMatch = url.match(/r2\.cloudflarestorage\.com\/[^/]+\/(.+)/);
        if (endpointMatch)
            return endpointMatch[1];
        // Handle relative paths: /static/uploads/file.jpg or /uploads/file.jpg
        if (url.startsWith('/uploads/') || url.startsWith('/static/uploads/')) {
            const path = url.replace('/static', '');
            return path.startsWith('/') ? path.slice(1) : path;
        }
        // Already a file key
        return url;
    }
    catch {
        return null;
    }
}
function parseFileKey(key) {
    const lastSlash = key.lastIndexOf('/');
    const dirname = lastSlash >= 0 ? key.slice(0, lastSlash) : '';
    const basename = lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
    const lastDot = basename.lastIndexOf('.');
    const name = lastDot >= 0 ? basename.slice(0, lastDot) : basename;
    const ext = lastDot >= 0 ? basename.slice(lastDot) : '';
    return { dirname, name, ext };
}
async function uploadToS3(key, buffer, contentType) {
    await s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    }));
}
exports.config = {
    event: ['file.created'],
    context: { subscriberId: 'image-processing-subscriber' },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UtcHJvY2Vzc2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdWJzY3JpYmVycy9pbWFnZS1wcm9jZXNzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7OztHQVVHOzs7Ozs7QUFxQ0gscUNBc0dDO0FBeElELHFEQUE4RTtBQUU5RSxrREFBeUI7QUFDekIsa0RBQXNHO0FBRXRHLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ3BFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQSxDQUFDLGNBQWM7QUFFL0YsbUJBQW1CO0FBQ25CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQTtBQUN0QixNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUE7QUFDM0IsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0FBRXZCLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQztJQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksV0FBVztJQUMvQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksdUJBQXVCO0lBQy9ELFdBQVcsRUFBRTtRQUNYLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLEVBQUU7UUFDL0MsZUFBZSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksRUFBRTtLQUNwRDtJQUNELGNBQWMsRUFBRSxJQUFJO0NBQ3JCLENBQUMsQ0FBQTtBQUVGLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQTtBQUU3Qzs7Ozs7Ozs7R0FRRztBQUNZLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxFQUFF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