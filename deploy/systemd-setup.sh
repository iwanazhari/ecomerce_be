#!/usr/bin/env bash
# ============================================================
# Waterpro — Systemd Service Setup
# Installs and enables systemd services for:
#   - Medusa Backend (port 9002)
#   - WebSocket Bridge (port 3001)
#   - Next.js Frontend (port 3000)
#   - MinIO (port 9001)
# ============================================================
set -euo pipefail

# ---- Configuration ----
# CHANGE THESE paths to match your VPS setup
BACKEND_DIR="/root/waterpro_backend"
FRONTEND_DIR="/root/waterpro_frontend"
MINIO_BIN="/root/minio/bin/minio"
MINIO_DATA="/root/minio-data"
MINIO_USER="minioadmin"
MINIO_PASS="CHANGE_ME_strong_minio_password"

# Use the user running this script (or root)
RUN_USER="${SUDO_USER:-root}"
RUN_GROUP="$(id -gn "$RUN_USER")"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then
    log_error "Run as root: sudo bash $0"
    exit 1
fi

log_info "Setting up systemd services for Waterpro..."
log_info "Running as user: $RUN_USER"

# ============================================================
# 1. Medusa Backend Service
# ============================================================
log_info "Creating medusa-backend.service..."
cat > /etc/systemd/system/medusa-backend.service << EOF
[Unit]
Description=Waterpro Medusa Backend
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_GROUP
WorkingDirectory=$BACKEND_DIR
Environment=NODE_ENV=production
EnvironmentFile=$BACKEND_DIR/.env.production
ExecStart=$(which node) node_modules/.bin/medusa start
Restart=always
RestartSec=10
StandardOutput=append:/var/log/waterpro/backend.log
StandardError=append:/var/log/waterpro/backend-error.log

# Security
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$BACKEND_DIR /var/log/waterpro

[Install]
WantedBy=multi-user.target
EOF

# ============================================================
# 2. WebSocket Bridge Service
# ============================================================
log_info "Creating waterpro-bridge.service..."
cat > /etc/systemd/system/waterpro-bridge.service << EOF
[Unit]
Description=Waterpro Realtime WebSocket Bridge
After=network.target medusa-backend.service redis.service
Wants=redis.service

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_GROUP
WorkingDirectory=$BACKEND_DIR
Environment=NODE_ENV=production
EnvironmentFile=$BACKEND_DIR/.env.production
ExecStart=$(which npx) tsx src/bridge/server.ts
Restart=always
RestartSec=5
StandardOutput=append:/var/log/waterpro/bridge.log
StandardError=append:/var/log/waterpro/bridge-error.log

[Install]
WantedBy=multi-user.target
EOF

# ============================================================
# 3. Next.js Frontend Service
# ============================================================
log_info "Creating waterpro-frontend.service..."
cat > /etc/systemd/system/waterpro-frontend.service << EOF
[Unit]
Description=Waterpro Next.js Frontend
After=network.target medusa-backend.service

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_GROUP
WorkingDirectory=$FRONTEND_DIR
Environment=NODE_ENV=production
EnvironmentFile=$FRONTEND_DIR/.env.production
ExecStart=$(which node) .next/standalone/server.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/waterpro/frontend.log
StandardError=append:/var/log/waterpro/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

# ============================================================
# 4. MinIO Service
# ============================================================
log_info "Creating minio.service..."
mkdir -p "$MINIO_DATA"
cat > /etc/systemd/system/minio.service << EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
Type=notify
User=$RUN_USER
Group=$RUN_GROUP
Environment=MINIO_ROOT_USER=$MINIO_USER
Environment=MINIO_ROOT_PASSWORD=$MINIO_PASS
ExecStart=$MINIO_BIN server $MINIO_DATA --console-address ":9002"
Restart=always
RestartSec=5
StandardOutput=append:/var/log/waterpro/minio.log
StandardError=append:/var/log/waterpro/minio-error.log

# Security
NoNewPrivileges=true
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# ============================================================
# Create log directory
# ============================================================
mkdir -p /var/log/waterpro
chown "$RUN_USER:$RUN_GROUP" /var/log/waterpro

# ============================================================
# Reload & enable services
# ============================================================
log_info "Reloading systemd daemon..."
systemctl daemon-reload

log_info "Enabling services..."
systemctl enable minio.service
systemctl enable medusa-backend.service
systemctl enable waterpro-bridge.service
systemctl enable waterpro-frontend.service

log_info "Starting services..."
systemctl start minio.service
sleep 2
systemctl start medusa-backend.service
sleep 3
systemctl start waterpro-bridge.service
systemctl start waterpro-frontend.service

log_info "Service status:"
echo ""
systemctl status minio.service --no-pager -l || true
echo "---"
systemctl status medusa-backend.service --no-pager -l || true
echo "---"
systemctl status waterpro-bridge.service --no-pager -l || true
echo "---"
systemctl status waterpro-frontend.service --no-pager -l || true

echo ""
log_info "Systemd services installed and started!"
echo ""
echo "  Useful commands:"
echo "    systemctl status medusa-backend   # Check backend status"
echo "    journalctl -u medusa-backend -f   # Follow backend logs"
echo "    systemctl restart waterpro-bridge # Restart bridge"
echo "    journalctl -u waterpro-frontend -f # Follow frontend logs"
echo ""
