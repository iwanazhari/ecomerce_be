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
        accessKeyId: process.env.MINIO_ROOT_USER || process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || process.env.MINIO_SECRET_KEY || '',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UtcHJvY2Vzc2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdWJzY3JpYmVycy9pbWFnZS1wcm9jZXNzaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7OztHQVVHOzs7Ozs7QUFxQ0gscUNBc0dDO0FBeElELHFEQUE4RTtBQUU5RSxrREFBeUI7QUFDekIsa0RBQXNHO0FBRXRHLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFBO0FBQ3BFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQSxDQUFDLGNBQWM7QUFFL0YsbUJBQW1CO0FBQ25CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQTtBQUN0QixNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUE7QUFDM0IsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO0FBRXZCLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQztJQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksV0FBVztJQUMvQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksdUJBQXVCO0lBQy9ELFdBQVcsRUFBRTtRQUNYLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLEVBQUU7UUFDOUUsZUFBZSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFO0tBQ3ZGO0lBQ0QsY0FBYyxFQUFFLElBQUk7Q0FDckIsQ0FBQyxDQUFBO0FBRUYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFBO0FBRTdDOzs7Ozs7OztHQVFHO0FBQ1ksS0FBSyxVQUFVLGtCQUFrQixDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBa0M7SUFDbkcsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUE7SUFDNUIsSUFBSSxDQUFDLE1BQU07UUFBRSxPQUFNO0lBRW5CLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUNBQXlCLENBQUMsTUFBTSxDQUFXLENBQUE7SUFDNUUsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFrQyxDQUFBO0lBRXBGLElBQUksQ0FBQztRQUNILHNDQUFzQztRQUN0QyxNQUFNLEtBQUssR0FBRyxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQTtRQUN6RCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDckIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsTUFBTSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsTUFBTSxZQUFZLENBQUMsQ0FBQTtZQUN4RCxPQUFNO1FBQ1IsQ0FBQztRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7UUFDeEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsTUFBTSxFQUFFLENBQUMsQ0FBQTtZQUN6RCxPQUFNO1FBQ1IsQ0FBQztRQUVELDRCQUE0QjtRQUM1QixNQUFNLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMxQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixNQUFNLENBQUMsSUFBSSxDQUFDLHlEQUF5RCxPQUFPLEVBQUUsQ0FBQyxDQUFBO1lBQy9FLE9BQU07UUFDUixDQUFDO1FBRUQsd0JBQXdCO1FBQ3hCLE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLDRCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzdGLE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRSxDQUFBO1FBQzNELElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLHdDQUF3QyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1lBQzlELE9BQU07UUFDUixDQUFDO1FBRUQscUJBQXFCO1FBQ3JCLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxhQUFhLEVBQUUsQ0FBQztZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixPQUFPLHFCQUFxQixNQUFNLENBQUMsTUFBTSxlQUFlLGFBQWEsR0FBRyxDQUFDLENBQUE7WUFDbkgsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksK0JBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDOUUsT0FBTTtRQUNSLENBQUM7UUFFRCx3REFBd0Q7UUFDeEQsSUFBSSxRQUF3QixDQUFBO1FBQzVCLElBQUksQ0FBQztZQUNILFFBQVEsR0FBRyxNQUFNLElBQUEsZUFBSyxFQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQzNDLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixPQUFPLDBCQUEwQixDQUFDLENBQUE7WUFDNUUsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksK0JBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDOUUsT0FBTTtRQUNSLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFBO1FBQzlCLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDekQsTUFBTSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsT0FBTyx3QkFBd0IsTUFBTSxFQUFFLENBQUMsQ0FBQTtZQUNsRixNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSwrQkFBbUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUM5RSxPQUFNO1FBQ1IsQ0FBQztRQUVELGdEQUFnRDtRQUNoRCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDeEMsTUFBTSxXQUFXLEdBQUcsU0FBUyxNQUFNLEVBQUUsQ0FBQTtRQUVyQywrQkFBK0I7UUFDL0IsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFBLGVBQUssRUFBQyxNQUFNLENBQUM7YUFDdEMsTUFBTSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDO2FBQ3pFLFFBQVEsRUFBRSxDQUFBO1FBRWIsd0JBQXdCO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxlQUFLLEVBQUMsYUFBYSxDQUFDO2FBQzFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQzthQUMvQixRQUFRLEVBQUUsQ0FBQTtRQUViLHFCQUFxQjtRQUNyQixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUEsZUFBSyxFQUFDLGFBQWEsQ0FBQzthQUMvQyxNQUFNLENBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDckYsUUFBUSxFQUFFLENBQUE7UUFFYixNQUFNLG1CQUFtQixHQUFHLE1BQU0sSUFBQSxlQUFLLEVBQUMsZUFBZSxDQUFDO2FBQ3JELElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQzthQUMvQixRQUFRLEVBQUUsQ0FBQTtRQUViLDRCQUE0QjtRQUM1QixNQUFNLE9BQU8sR0FBRztZQUNkLHdDQUF3QztZQUN4QyxVQUFVLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUM7WUFDL0MsZUFBZTtZQUNmLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksT0FBTyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUM7WUFDckYsbUJBQW1CO1lBQ25CLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUM7WUFDL0YsbUJBQW1CO1lBQ25CLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksYUFBYSxFQUFFLG1CQUFtQixFQUFFLFlBQVksQ0FBQztTQUNyRyxDQUFBO1FBRUQsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRTFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsOEJBQThCLE9BQU8sS0FBSyxNQUFNLDhCQUE4QixDQUFDLENBQUE7SUFDN0YsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsTUFBTSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ3BGLENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxHQUFXO0lBQ3BDLElBQUksQ0FBQztRQUNILGlFQUFpRTtRQUNqRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUE7UUFDdEQsSUFBSSxRQUFRO1lBQUUsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFaEMscUZBQXFGO1FBQ3JGLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQTtRQUMxRSxJQUFJLGFBQWE7WUFBRSxPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUUxQyx1RUFBdUU7UUFDdkUsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO1lBQ3RFLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO1FBQ3BELENBQUM7UUFFRCxxQkFBcUI7UUFDckIsT0FBTyxHQUFHLENBQUE7SUFDWixDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEdBQVc7SUFDL0IsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN0QyxNQUFNLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBQzdELE1BQU0sUUFBUSxHQUFHLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUE7SUFDaEUsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN6QyxNQUFNLElBQUksR0FBRyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBO0lBQ2pFLE1BQU0sR0FBRyxHQUFHLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUN2RCxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQTtBQUMvQixDQUFDO0FBRUQsS0FBSyxVQUFVLFVBQVUsQ0FBQyxHQUFXLEVBQUUsTUFBYyxFQUFFLFdBQW1CO0lBQ3hFLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FDakIsSUFBSSw0QkFBZ0IsQ0FBQztRQUNuQixNQUFNLEVBQUUsTUFBTTtRQUNkLEdBQUcsRUFBRSxHQUFHO1FBQ1IsSUFBSSxFQUFFLE1BQU07UUFDWixXQUFXLEVBQUUsV0FBVztRQUN4QixZQUFZLEVBQUUscUNBQXFDLEVBQUUsZUFBZTtLQUNyRSxDQUFDLENBQ0gsQ0FBQTtBQUNILENBQUM7QUFFWSxRQUFBLE1BQU0sR0FBcUI7SUFDdEMsS0FBSyxFQUFFLENBQUMsY0FBYyxDQUFDO0lBQ3ZCLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSw2QkFBNkIsRUFBRTtDQUN6RCxDQUFBIn0=