#!/usr/bin/env bash
# ============================================================
# Waterpro — Production Nginx + Certbot Setup Script
# Domain: shop.filterairwaterpro.com
# VPS IP: 157.66.34.174
# Subdomains: cdn.filterairwaterpro.com, admin.filterairwaterpro.com
# ============================================================
set -euo pipefail

# ---- Configuration ----
SHOP_DOMAIN="shop.filterairwaterpro.com"
CDN_DOMAIN="cdn.filterairwaterpro.com"
ADMIN_DOMAIN="admin.filterairwaterpro.com"
MAIN_DOMAIN="filterairwaterpro.com"
WWW_DOMAIN="www.filterairwaterpro.com"
VPS_IP="157.66.34.174"
EMAIL="admin@filterairwaterpro.com"  # CHANGE THIS to your real email

BACKEND_PORT=9002
BRIDGE_PORT=3001
FRONTEND_PORT=3000    # Next.js production port
MINIO_PORT=9001       # MinIO API port
MINIO_CONSOLE_PORT=9002 # MinIO Console (if needed)

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Pre-flight checks ----
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

log_info "Starting Nginx production setup for Waterpro..."
log_info "Domains: $SHOP_DOMAIN, $CDN_DOMAIN, $ADMIN_DOMAIN"
log_info "VPS IP: $VPS_IP"

# ---- Step 1: Install Nginx & Certbot ----
log_info "Step 1: Installing Nginx and Certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx curl gnupg2

# ---- Step 2: Verify DNS ----
log_info "Step 2: Verifying DNS resolution..."
for domain in "$SHOP_DOMAIN" "$CDN_DOMAIN" "$ADMIN_DOMAIN"; do
    resolved_ip=$(dig +short "$domain" A 2>/dev/null | head -1 || echo "")
    if [ -z "$resolved_ip" ]; then
        log_warn "DNS not resolved for $domain — Certbot will fail. Set up A records first."
        log_warn "A record: $domain → $VPS_IP"
    elif [ "$resolved_ip" != "$VPS_IP" ]; then
        log_warn "DNS mismatch for $domain: resolved to $resolved_ip, expected $VPS_IP"
    else
        log_info "DNS OK: $domain → $resolved_ip"
    fi
done

# ---- Step 3: Create Nginx config directory ----
log_info "Step 3: Creating Nginx configurations..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /var/log/nginx/waterpro
mkdir -p /var/www/certbot

# ---- Step 4: Write Nginx configs ----

# 4a. Shop (main frontend + API reverse proxy)
log_info "Creating Nginx config for $SHOP_DOMAIN..."
cat > /etc/nginx/sites-available/waterpro-shop.conf << 'NGINX_SHOP'
# ============================================================
# Waterpro Shop — Main E-commerce Frontend + API Proxy
# Domain: shop.filterairwaterpro.com
# ============================================================

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name shop.filterairwaterpro.com;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name shop.filterairwaterpro.com;

    # SSL certificates (auto-renewed by Certbot)
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

    # Logging
    access_log /var/log/nginx/waterpro/shop-access.log;
    error_log  /var/log/nginx/waterpro/shop-error.log;

    # ---- Frontend (Next.js) ----
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
        proxy_send_timeout 86400s;
    }

    # ---- Backend API (Medusa) ----
    # /api/* → Medusa backend on port 9002
    location /api/ {
        proxy_pass http://127.0.0.1:9002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://shop.filterairwaterpro.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, x-publishable-api-key" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # ---- WebSocket Bridge (realtime) ----
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
        proxy_send_timeout 86400s;
    }
}
NGINX_SHOP

# 4b. CDN (MinIO reverse proxy)
log_info "Creating Nginx config for $CDN_DOMAIN..."
cat > /etc/nginx/sites-available/waterpro-cdn.conf << 'NGINX_CDN'
# ============================================================
# Waterpro CDN — MinIO Image/Asset Reverse Proxy
# Domain: cdn.filterairwaterpro.com
# ============================================================

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name cdn.filterairwaterpro.com;

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
    listen [::]:443 ssl http2;
    server_name cdn.filterairwaterpro.com;

    ssl_certificate     /etc/letsencrypt/live/cdn.filterairwaterpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cdn.filterairwaterpro.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Caching headers for static assets
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif|css|js|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Browser caching: 1 year for static assets
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # General proxy for all other MinIO requests
    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Amz-Content-Sha256 $http_x_amz_content_sha256;
        proxy_set_header X-Amz-Date $http_x_amz_date;
        proxy_set_header Authorization $http_authorization;

        # No caching for non-static content
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    access_log /var/log/nginx/waterpro/cdn-access.log;
    error_log  /var/log/nginx/waterpro/cdn-error.log;

    # Rate limiting to prevent abuse
    limit_req_zone=$binary_remote_addr zone=cdn_limit:10m rate=30r/s;
    limit_req zone=cdn_limit burst=50 nodelay;
}
NGINX_CDN

# 4c. Admin (Medusa admin dashboard)
log_info "Creating Nginx config for $ADMIN_DOMAIN..."
cat > /etc/nginx/sites-available/waterpro-admin.conf << 'NGINX_ADMIN'
# ============================================================
# Waterpro Admin — Medusa Admin Dashboard
# Domain: admin.filterairwaterpro.com
# ============================================================

server {
    listen 80;
    listen [::]:80;
    server_name admin.filterairwaterpro.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.filterairwaterpro.com;

    ssl_certificate     /etc/letsencrypt/live/admin.filterairwaterpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.filterairwaterpro.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ---- Medusa Admin API ----
    location / {
        proxy_pass http://127.0.0.1:9002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    access_log /var/log/nginx/waterpro/admin-access.log;
    error_log  /var/log/nginx/waterpro/admin-error.log;
}
NGINX_ADMIN

# ---- Step 5: Enable sites ----
log_info "Step 5: Enabling Nginx sites..."
rm -f /etc/nginx/sites-enabled/default

for site in waterpro-shop waterpro-cdn waterpro-admin; do
    ln -sf "/etc/nginx/sites-available/${site}.conf" "/etc/nginx/sites-enabled/${site}.conf"
done

# ---- Step 6: Test Nginx config ----
log_info "Step 6: Testing Nginx configuration..."
nginx -t

# ---- Step 7: Reload Nginx ----
log_info "Step 7: Starting/reloading Nginx..."
systemctl enable nginx
systemctl restart nginx

# ---- Step 8: Obtain SSL certificates ----
log_info "Step 8: Obtaining SSL certificates via Certbot..."

for domain in "$SHOP_DOMAIN" "$CDN_DOMAIN" "$ADMIN_DOMAIN"; do
    log_info "Requesting certificate for $domain..."
    certbot certonly --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$domain" \
        --keep-until-expiring || log_warn "Certbot failed for $domain — DNS may not be ready yet"
done

# ---- Step 9: Setup auto-renew ----
log_info "Step 9: Setting up automatic SSL renewal..."
# Certbot systemd timer is usually auto-enabled, but let's verify
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

# Add a cron job as fallback
(crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# ---- Step 10: Verify ----
log_info "Step 10: Final verification..."
nginx -t

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Nginx setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Frontend:  https://$SHOP_DOMAIN"
echo "  CDN:       https://$CDN_DOMAIN"
echo "  Admin API: https://$ADMIN_DOMAIN"
echo ""
echo "  Backend API (proxied): https://$SHOP_DOMAIN/api/"
echo "  WebSocket (proxied):   https://$SHOP_DOMAIN/ws/"
echo ""
echo "  Next steps:"
echo "  1. Build & start the frontend: cd waterpro_frontend && npm run build && npm run start"
echo "  2. Build & start the backend: cd waterpro_backend && npm run build && npm run start"
echo "  3. Start the bridge: cd waterpro_backend && npm run bridge:start"
echo "  4. Install systemd services: sudo bash deploy/systemd-setup.sh"
echo ""
