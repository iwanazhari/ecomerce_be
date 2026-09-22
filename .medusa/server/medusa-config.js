"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
(0, utils_1.loadEnv)(process.env.NODE_ENV || 'development', process.cwd());
module.exports = (0, utils_1.defineConfig)({
    projectConfig: {
        databaseUrl: process.env.DATABASE_URL,
        http: {
            storeCors: process.env.STORE_CORS,
            adminCors: process.env.ADMIN_CORS,
            authCors: process.env.AUTH_CORS,
            jwtSecret: process.env.JWT_SECRET || 'supersecret',
            cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
            // JWT token expiry: 7 days for persistent admin/customer sessions
            jwtExpiresIn: '7d',
        },
    },
    modules: {
        // Cache — Redis for performance & persistence
        [utils_1.Modules.CACHE]: {
            resolve: '@medusajs/medusa/cache-redis',
            options: {
                redisUrl: process.env.CACHE_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
            },
        },
        // Event Bus — Redis for reliable background tasks & webhooks
        [utils_1.Modules.EVENT_BUS]: {
            resolve: '@medusajs/medusa/event-bus-redis',
            options: {
                redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            },
        },
        // Workflow Engine — In-memory (cukup untuk development, tidak butuh persistensi job)
        [utils_1.Modules.WORKFLOW_ENGINE]: {
            resolve: '@medusajs/medusa/workflow-engine-inmemory',
        },
        [utils_1.Modules.PAYMENT]: {
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
        [utils_1.Modules.FILE]: {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBMEU7QUFFMUUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTdELE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBQSxvQkFBWSxFQUFDO0lBQzVCLGFBQWEsRUFBRTtRQUNiLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7UUFDckMsSUFBSSxFQUFFO1lBQ0osU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVztZQUNsQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXO1lBQ2xDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVU7WUFDaEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLGFBQWE7WUFDbEQsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLGFBQWE7WUFDeEQsa0VBQWtFO1lBQ2xFLFlBQVksRUFBRSxJQUFJO1NBQ25CO0tBQ0Y7SUFDRCxPQUFPLEVBQUU7UUFDUCw4Q0FBOEM7UUFDOUMsQ0FBQyxlQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDZixPQUFPLEVBQUUsOEJBQThCO1lBQ3ZDLE9BQU8sRUFBRTtnQkFDUCxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksd0JBQXdCO2FBQzNGO1NBQ0Y7UUFDRCw2REFBNkQ7UUFDN0QsQ0FBQyxlQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDbkIsT0FBTyxFQUFFLGtDQUFrQztZQUMzQyxPQUFPLEVBQUU7Z0JBQ1AsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLHdCQUF3QjthQUM1RDtTQUNGO1FBQ0QscUZBQXFGO1FBQ3JGLENBQUMsZUFBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSwyQ0FBMkM7U0FDckQ7UUFDRCxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNqQixPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLE9BQU8sRUFBRTtnQkFDUCxTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsT0FBTyxFQUFFLHdCQUF3Qjt3QkFDakMsRUFBRSxFQUFFLFVBQVU7d0JBQ2QsT0FBTyxFQUFFOzRCQUNQLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUU7NEJBQ2hELFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUU7NEJBQ2hELFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixLQUFLLE1BQU07eUJBQzVEO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELHVDQUF1QztRQUN2QyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNkLE9BQU8sRUFBRSx1QkFBdUI7WUFDaEMsT0FBTyxFQUFFO2dCQUNQLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxPQUFPLEVBQUUsbUJBQW1CO3dCQUM1QixFQUFFLEVBQUUsT0FBTzt3QkFDWCxPQUFPLEVBQUU7NEJBQ1AsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLGdDQUFnQzs0QkFDdkUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLHVCQUF1Qjs0QkFDL0QsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLFVBQVU7NEJBQzlDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxXQUFXOzRCQUMvQyxhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksWUFBWTs0QkFDMUQsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxZQUFZOzRCQUNsRSx3QkFBd0IsRUFBRTtnQ0FDeEIsY0FBYyxFQUFFLElBQUk7NkJBQ3JCO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELGlCQUFpQjtRQUNqQixRQUFRLEVBQUU7WUFDUixPQUFPLEVBQUUsd0JBQXdCO1NBQ2xDO1FBQ0QsVUFBVSxFQUFFO1lBQ1YsT0FBTyxFQUFFLDBCQUEwQjtTQUNwQztRQUNELFFBQVEsRUFBRTtZQUNSLE9BQU8sRUFBRSx3QkFBd0I7U0FDbEM7UUFDRCxvQkFBb0IsRUFBRTtZQUNwQixPQUFPLEVBQUUsbUNBQW1DO1NBQzdDO0tBQ0Y7Q0FDRixDQUFDLENBQUEifQ==