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
        waterproNotification: {
            resolve: './src/modules/notification-custom',
        },
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBMEU7QUFFMUUsSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0FBRTdELE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBQSxvQkFBWSxFQUFDO0lBQzVCLGFBQWEsRUFBRTtRQUNiLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVk7UUFDckMsSUFBSSxFQUFFO1lBQ0osU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVztZQUNsQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXO1lBQ2xDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVU7WUFDaEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLGFBQWE7WUFDbEQsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLGFBQWE7U0FDekQ7S0FDRjtJQUNELE9BQU8sRUFBRTtRQUNQLDhDQUE4QztRQUM5QyxDQUFDLGVBQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNmLE9BQU8sRUFBRSw4QkFBOEI7WUFDdkMsT0FBTyxFQUFFO2dCQUNQLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSx3QkFBd0I7YUFDM0Y7U0FDRjtRQUNELDZEQUE2RDtRQUM3RCxDQUFDLGVBQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNuQixPQUFPLEVBQUUsa0NBQWtDO1lBQzNDLE9BQU8sRUFBRTtnQkFDUCxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksd0JBQXdCO2FBQzVEO1NBQ0Y7UUFDRCxxRkFBcUY7UUFDckYsQ0FBQyxlQUFPLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDekIsT0FBTyxFQUFFLDJDQUEyQztTQUNyRDtRQUNELENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sRUFBRSwwQkFBMEI7WUFDbkMsT0FBTyxFQUFFO2dCQUNQLFNBQVMsRUFBRTtvQkFDVDt3QkFDRSxPQUFPLEVBQUUsd0JBQXdCO3dCQUNqQyxFQUFFLEVBQUUsVUFBVTt3QkFDZCxPQUFPLEVBQUU7NEJBQ1AsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRTs0QkFDaEQsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLElBQUksRUFBRTs0QkFDaEQsWUFBWSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEtBQUssTUFBTTt5QkFDNUQ7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsdUNBQXVDO1FBQ3ZDLENBQUMsZUFBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2QsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxPQUFPLEVBQUU7Z0JBQ1AsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE9BQU8sRUFBRSxtQkFBbUI7d0JBQzVCLEVBQUUsRUFBRSxPQUFPO3dCQUNYLE9BQU8sRUFBRTs0QkFDUCxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksdUJBQXVCOzRCQUMvRCxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksVUFBVTs0QkFDOUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLFdBQVc7NEJBQy9DLGFBQWEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxZQUFZOzRCQUMxRCxpQkFBaUIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLFlBQVk7NEJBQ2xFLHdCQUF3QixFQUFFO2dDQUN4QixjQUFjLEVBQUUsSUFBSTs2QkFDckI7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsaUJBQWlCO1FBQ2pCLFFBQVEsRUFBRTtZQUNSLE9BQU8sRUFBRSx3QkFBd0I7U0FDbEM7UUFDRCxvQkFBb0IsRUFBRTtZQUNwQixPQUFPLEVBQUUsbUNBQW1DO1NBQzdDO0tBQ0Y7Q0FDRixDQUFDLENBQUEifQ==