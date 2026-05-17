#!/usr/bin/env bash
# ============================================================
# Waterpro — Full Production Deployment Script
# Usage: sudo bash deploy.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then
    log_error "Run as root: sudo bash deploy.sh"
    exit 1
fi

# Detect project directories (adjust if needed)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../../waterpro_frontend" && pwd)"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Waterpro Production Deployment${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Backend:  $BACKEND_DIR"
echo "  Frontend: $FRONTEND_DIR"
echo ""

# ---- Step 1: Nginx + SSL ----
log_info "Step 1: Setting up Nginx + SSL..."
bash "$SCRIPT_DIR/setup-nginx.sh"

# ---- Step 2: Build Backend ----
log_info "Step 2: Building Medusa backend..."
cd "$BACKEND_DIR"

# Copy production env
if [ -f "$BACKEND_DIR/.env.production" ]; then
    cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env"
    log_info "Copied .env.production → .env"
fi

# Install deps & build
npm install --production=false
npm run build

# Run database migrations
npx medusa db:migrate || log_warn "Migration failed — database may already be up to date"

# ---- Step 3: Build Frontend ----
log_info "Step 3: Building Next.js frontend..."
cd "$FRONTEND_DIR"

# Copy production env
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    cp "$FRONTEND_DIR/.env.production" "$FRONTEND_DIR/.env"
    log_info "Copied .env.production → .env"
fi

npm install --production=false
npm run build

# ---- Step 4: Setup Systemd Services ----
log_info "Step 4: Installing systemd services..."
bash "$SCRIPT_DIR/systemd-setup.sh"

# ---- Step 5: Health Checks ----
log_info "Step 5: Running health checks..."
sleep 5

check_service() {
    local service_name="$1"
    local port="$2"
    if systemctl is-active --quiet "$service_name"; then
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" | grep -q "200\|301\|302\|401\|404"; then
            log_info "$service_name is running on port $port"
        else
            log_warn "$service_name is running but port $port not responding yet (may need more time)"
        fi
    else
        log_error "$service_name is NOT running!"
    fi
}

check_service "medusa-backend" "9002"
check_service "waterpro-bridge" "3001"
check_service "waterpro-frontend" "3000"
check_service "minio" "9001"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  Frontend:  https://shop.filterairwaterpro.com"
echo "  CDN:       https://cdn.filterairwaterpro.com"
echo "  Admin:     https://admin.filterairwaterpro.com"
echo "  API:       https://shop.filterairwaterpro.com/api/"
echo "  WebSocket: https://shop.filterairwaterpro.com/ws/"
echo ""
echo "  Monitor logs:"
echo "    journalctl -u medusa-backend -f"
echo "    journalctl -u waterpro-frontend -f"
echo "    journalctl -u waterpro-bridge -f"
echo "    journalctl -u minio -f"
echo ""
echo "  Nginx logs:"
echo "    tail -f /var/log/nginx/waterpro/shop-access.log"
echo "    tail -f /var/log/nginx/waterpro/shop-error.log"
echo ""
