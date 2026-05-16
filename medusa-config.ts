import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
      // JWT token expiry: 7 days for persistent admin/customer sessions
      jwtExpiresIn: '7d',
    },
  },
  modules: {
    // Cache — Redis for performance & persistence
    [Modules.CACHE]: {
      resolve: '@medusajs/medusa/cache-redis',
      options: {
        redisUrl: process.env.CACHE_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
      },
    },
    // Event Bus — Redis for reliable background tasks & webhooks
    [Modules.EVENT_BUS]: {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: {
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    },
    // Workflow Engine — In-memory (cukup untuk development, tidak butuh persistensi job)
    [Modules.WORKFLOW_ENGINE]: {
      resolve: '@medusajs/medusa/workflow-engine-inmemory',
    },
    [Modules.PAYMENT]: {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/midtrans',
            id: 'midtrans',
            options: {
              clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
              serverKey: process.env.MIDTRANS_SERVER_KEY || '',
              isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
            },
          },
        ],
      },
    },
    // File storage — MinIO (S3-compatible)
    [Modules.FILE]: {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "minio",
            options: {
              file_url: process.env.MINIO_CDN_URL || 'http://localhost:9000/waterpro',
              endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
              bucket: process.env.MINIO_BUCKET || 'waterpro',
              region: process.env.MINIO_REGION || 'us-east-1',
              access_key_id: process.env.MINIO_ROOT_USER || 'minioadmin',
              secret_access_key: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    // Custom modules
    wishlist: {
      resolve: './src/modules/wishlist',
    },
    expedition: {
      resolve: './src/modules/expedition',
    },
    province: {
      resolve: './src/modules/province',
    },
    waterproNotification: {
      resolve: './src/modules/notification-custom',
    },
  },
})
