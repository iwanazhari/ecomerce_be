module.exports = {
  apps: [
    {
      name: 'ecom-backend',
      script: 'node',
      args: 'node_modules/.bin/medusa start',
      cwd: '/root/ecomerce_be',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: '9002',
        DATABASE_URL: 'postgresql://iwan:iwan@localhost:5432/medusa-v2',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'd4784a4bae2cdb60673b88b5641ce5ba1d70b428c0de4f8bee533b24dd4a7d01',
        COOKIE_SECRET: 'c817d161d580fbba5867f6c0dd1f14c18d9fc283e8a4d1128ca5edba8e2d473a',
        STORE_CORS: 'https://shop.filterairwaterpro.com',
        ADMIN_CORS: 'https://admin.filterairwaterpro.com',
        AUTH_CORS: 'https://admin.filterairwaterpro.com',
        BACKEND_URL: 'https://shop.filterairwaterpro.com',
        MINIO_ROOT_USER: 'minioadmin',
        MINIO_ROOT_PASSWORD: 'uGX+DQMvMBnDG+5PfZzlhviyw/xR8YkchFafTm48gjs=',
        MINIO_ENDPOINT: 'localhost:9001',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin123456',
        MINIO_CDN_URL: 'https://cdn.filterairwaterpro.com',
        MIDTRANS_SERVER_KEY: 'SB-Mid-server-Jl7eyac41o7k0Lw0viQ3tSRL',
        MIDTRANS_CLIENT_KEY: 'SB-Mid-client-sB8PbHDPwN6b3cBf',
        MIDTRANS_IS_PRODUCTION: 'false',
        NODE_OPTIONS: '--max-old-space-size=600',
        PORT: '9002',
        HTTP_PORT: '9002'
      },
      error_file: '/var/log/waterpro/ecom-backend-error.log',
      out_file: '/var/log/waterpro/ecom-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'ecom-bridge',
      script: 'npx',
      args: 'tsx src/bridge/server.ts',
      cwd: '/root/ecomerce_be',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://iwan:iwan@localhost:5432/medusa-v2',
        REDIS_URL: 'redis://localhost:6379',
      },
      error_file: '/var/log/waterpro/ecom-bridge-error.log',
      out_file: '/var/log/waterpro/ecom-bridge-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
}
