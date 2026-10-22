"use strict";
/**
 * Image Cleanup Subscriber
 *
 * Deletes associated images from Cloudflare R2 when a product is deleted.
 * Prevents orphaned files from accumulating in storage.
 *
 * Triggered on: product.deleted event
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = cleanupProductImages;
const utils_1 = require("@medusajs/framework/utils");
const client_s3_1 = require("@aws-sdk/client-s3");
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
async function cleanupProductImages({ event, container }) {
    const productId = event.data.id;
    if (!productId)
        return;
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    try {
        // R2 stores images under "uploads/products/<product-id>/" or similar paths
        // List all objects with the product ID prefix
        const prefix = `uploads/products/${productId}`;
        const listResponse = await s3Client.send(new client_s3_1.ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: prefix,
        }));
        const objects = listResponse.Contents || [];
        if (objects.length === 0) {
            logger.info(`[ImageCleanup] No images found for product ${productId}`);
            return;
        }
        const keys = objects.map((obj) => ({ Key: obj.Key }));
        // Delete all objects in batches (max 1000 per request)
        await s3Client.send(new client_s3_1.DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: keys, Quiet: true },
        }));
        logger.info(`[ImageCleanup] Deleted ${keys.length} images for product ${productId}`);
    }
    catch (error) {
        logger.error(`[ImageCleanup] Error cleaning up images for product ${productId}: ${error.message}`);
    }
}
exports.config = {
    event: ['product.deleted'],
    context: { subscriberId: 'image-cleanup-subscriber' },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UtY2xlYW51cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zdWJzY3JpYmVycy9pbWFnZS1jbGVhbnVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7QUFtQkgsdUNBc0NDO0FBdERELHFEQUFxRTtBQUVyRSxrREFBeUY7QUFFekYsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDO0lBQzVCLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxXQUFXO0lBQy9DLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSx1QkFBdUI7SUFDL0QsV0FBVyxFQUFFO1FBQ1gsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksRUFBRTtRQUMvQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFO0tBQ3BEO0lBQ0QsY0FBYyxFQUFFLElBQUk7Q0FDckIsQ0FBQyxDQUFBO0FBRUYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFBO0FBRTlCLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQWtDO0lBQ3JHLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFBO0lBQy9CLElBQUksQ0FBQyxTQUFTO1FBQUUsT0FBTTtJQUV0QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLE1BQU0sQ0FBVyxDQUFBO0lBRTVFLElBQUksQ0FBQztRQUNILDJFQUEyRTtRQUMzRSw4Q0FBOEM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsb0JBQW9CLFNBQVMsRUFBRSxDQUFBO1FBRTlDLE1BQU0sWUFBWSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FDdEMsSUFBSSxnQ0FBb0IsQ0FBQztZQUN2QixNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxNQUFNO1NBQ2YsQ0FBQyxDQUNILENBQUE7UUFFRCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQTtRQUMzQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsU0FBUyxFQUFFLENBQUMsQ0FBQTtZQUN0RSxPQUFNO1FBQ1IsQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUV0RCx1REFBdUQ7UUFDdkQsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUNqQixJQUFJLGdDQUFvQixDQUFDO1lBQ3ZCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO1NBQ3ZDLENBQUMsQ0FDSCxDQUFBO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQywwQkFBMEIsSUFBSSxDQUFDLE1BQU0sdUJBQXVCLFNBQVMsRUFBRSxDQUFDLENBQUE7SUFDdEYsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyx1REFBdUQsU0FBUyxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ3BHLENBQUM7QUFDSCxDQUFDO0FBRVksUUFBQSxNQUFNLEdBQXFCO0lBQ3RDLEtBQUssRUFBRSxDQUFDLGlCQUFpQixDQUFDO0lBQzFCLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSwwQkFBMEIsRUFBRTtDQUN0RCxDQUFBIn0=