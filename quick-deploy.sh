#!/usr/bin/env bash
# ============================================================
# E-commerce Medusa V2 - Quick Deploy Script
# Usage: sudo bash quick-deploy.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_DIR="/root/ecomerce_be"
BACKEND_PORT=9002
FRONTEND_PORT=3000
BRIDGE_PORT=3001
MINIO_PORT=9001

cd "$PROJECT_DIR"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  E-commerce Medusa V2 Deployment${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Step 1: Copy production env
log_info "Step 1: Setting up environment files..."
cp .env.production .env
log_info "Environment file configured"

# Step 2: Install dependencies
log_info "Step 2: Installing dependencies..."
npm install --legacy-peer-deps

# Step 3: Build backend
log_info "Step 3: Building Medusa backend..."
npm run build

# Step 4: Run database migrations
log_info "Step 4: Running database migrations..."
npx medusa db:migrate || log_warn "Migration may have already run"

# Step 5: Seed admin user (optional)
log_info "Step 5: Seeding admin user..."
npx medusa user -e admin@filterairwaterpro.com -p Admin123!@# || log_warn "Admin user may already exist"

# Step 6: Create MinIO data directory
log_info "Step 6: Setting up MinIO..."
mkdir -p /root/minio-data
log_info "MinIO data directory created at /root/minio-data"

# Step 7: Install MinIO binary if not exists
if ! command -v minio &> /dev/null; then
    log_info "Installing MinIO..."
    mkdir -p /root/minio/bin
    cd /root/minio/bin
    wget -q https://dl.min.io/server/minio/release/linux-amd64/minio
    chmod +x minio
    log_info "MinIO installed at /root/minio/bin/minio"
    cd "$PROJECT_DIR"
else
    log_info "MinIO already installed"
fi

# Step 8: Setup PM2 processes
log_info "Step 7: Configuring PM2 processes..."

# Create PM2 ecosystem config
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ecom-backend',
      cwd: '/root/ecomerce_be',
      script: 'node_modules/.bin/medusa',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 9002
      },
      error_file: '/var/log/ecomerce/backend-error.log',
      out_file: '/var/log/ecomerce/backend.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'ecom-bridge',
      cwd: '/root/ecomerce_be',
      script: 'npx',
      args: 'tsx src/bridge/server.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/ecomerce/bridge-error.log',
      out_file: '/var/log/ecomerce/bridge.log',
      time: true
    },
    {
      name: 'ecom-minio',
      cwd: '/root/minio-data',
      script: '/root/minio/bin/minio',
      args: 'server /root/minio-data --console-address :9002 --address :9001',
      instances: 1,
      exec_mode: 'fork',
      env: {
        MINIO_ROOT_USER: 'minioadmin',
        MINIO_ROOT_PASSWORD: 'uGX+DQMvMBnDG+5PfZzlhviyw/xR8YkchFafTm48gjs='
      },
      error_file: '/var/log/ecomerce/minio-error.log',
      out_file: '/var/log/ecomerce/minio.log',
      time: true
    }
  ]
};
EOF

log_info "PM2 ecosystem config created"

# Create log directory
mkdir -p /var/log/ecomerce

# Stop existing processes
log_info "Stopping existing e-commerce processes..."
pm2 stop ecom-backend ecom-bridge ecom-minio 2>/dev/null || true
pm2 delete ecom-backend ecom-bridge ecom-minio 2>/dev/null || true

# Start new processes
log_info "Starting PM2 processes..."
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

log_info "PM2 processes started successfully"

# Step 9: Update Nginx config
log_info "Step 8: Updating Nginx configuration..."

# Backup existing config
if [ -f /etc/nginx/sites-available/ecommerce ]; then
    cp /etc/nginx/sites-available/ecommerce /etc/nginx/sites-available/ecommerce.backup.$(date +%Y%m%d)
    log_info "Backed up existing nginx config"
fi

# Create new nginx config for Medusa V2
cat > /etc/nginx/sites-available/ecommerce-v2 << 'NGINX_EOF'
# ============================================================
# E-commerce Medusa V2 - Nginx Configuration
# Domain: shop.filterairwaterpro.com
# Backend: port 9002, Frontend: port 3000, Bridge: port 3001, MinIO: port 9001
# ============================================================

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name shop.filterairwaterpro.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name shop.filterairwaterpro.com;

    ssl_certificate     /etc/letsencrypt/live/shop.filterairwaterpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shop.filterairwaterpro.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client body size for uploads
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/ecommerce-access.log;
    error_log  /var/log/nginx/ecommerce-error.log;

    # Frontend (Next.js) - default
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
    }

    # Backend API (Medusa)
    location /api/ {
        proxy_pass http://127.0.0.1:9002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Admin API routes
    location /admin/ {
        proxy_pass http://127.0.0.1:9002/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Store API
    location /store/ {
        proxy_pass http://127.0.0.1:9002/store/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Auth routes
    location /auth/ {
        proxy_pass http://127.0.0.1:9002/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Payment routes (Midtrans webhook)
    location /payment/ {
        proxy_pass http://127.0.0.1:9002/payment/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # WebSocket Bridge
    location /ws/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }

    # MinIO CDN (local access)
    location /cdn/ {
        proxy_pass http://127.0.0.1:9001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
NGINX_EOF

# Enable nginx config
ln -sf /etc/nginx/sites-available/ecommerce-v2 /etc/nginx/sites-enabled/ecommerce-v2.conf
rm -f /etc/nginx/sites-enabled/ecommerce.conf 2>/dev/null || true

# Test and reload nginx
nginx -t
systemctl reload nginx

log_info "Nginx configuration updated"

# Final health checks
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Frontend:  https://shop.filterairwaterpro.com"
echo "  Backend:   https://shop.filterairwaterpro.com/api/"
echo "  Admin:     https://shop.filterairwaterpro.com/admin/"
echo "  MinIO CDN: https://shop.filterairwaterpro.com/cdn/"
echo ""
echo "  PM2 Processes:"
pm2 list | grep -E 'ecom-|Name'
echo ""
echo "  Monitor logs:"
echo "    tail -f /var/log/ecomerce/backend.log"
echo "    tail -f /var/log/ecomerce/bridge.log"
echo "    tail -f /var/log/ecomerce/minio.log"
echo "    tail -f /var/log/nginx/ecommerce-access.log"
echo ""
echo "  Useful commands:"
echo "    pm2 logs ecom-backend"
echo "    pm2 restart ecom-backend"
echo "    pm2 monit"
echo ""
