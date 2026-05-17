# Waterpro Production Deployment

## Quick Start

```bash
# 1. Edit production env files FIRST
nano ../waterpro_backend/.env.production
nano ../waterpro_frontend/.env.production

# 2. Run full deployment
sudo bash deploy.sh
```

## Manual Steps

### A. Nginx + SSL Only
```bash
sudo bash setup-nginx.sh
```

### B. Systemd Services Only
```bash
sudo bash systemd-setup.sh
```

## Architecture

```
Internet
  │
  ├─ https://shop.filterairwaterpro.com  → Nginx → Next.js (3000)
  │   ├─ /api/*     → Medusa Backend (9002)
  │   └─ /ws/*      → WebSocket Bridge (3001)
  │
  ├─ https://cdn.filterairwaterpro.com   → Nginx → MinIO (9001)
  └─ https://admin.filterairwaterpro.com → Nginx → Medusa Admin (9002)
```

## Service Management

```bash
# Check status
systemctl status medusa-backend
systemctl status waterpro-frontend
systemctl status waterpro-bridge
systemctl status minio

# View logs
journalctl -u medusa-backend -f
journalctl -u waterpro-frontend -f
journalctl -u waterpro-bridge -f
journalctl -u minio -f

# Restart services
systemctl restart medusa-backend
systemctl restart waterpro-frontend
systemctl restart waterpro-bridge
```

## SSL Renewal

Auto-renewal is configured via Certbot timer + cron fallback.
Manual renewal: `sudo certbot renew --dry-run`

## Checklist Before Going Live

- [ ] Replace `JWT_SECRET` and `COOKIE_SECRET` in `.env.production` (backend)
- [ ] Replace `MINIO_ROOT_PASSWORD` in `.env.production` (backend)
- [ ] Replace `MIDTRANS_*` keys with production credentials
- [ ] Add `RAJAONGKIR_API_KEY`
- [ ] Verify DNS A records point to `157.66.34.174`
- [ ] Verify SSL certificates issued successfully
- [ ] Test checkout flow in production
- [ ] Run database migrations: `npx medusa db:migrate`
- [ ] Seed admin user if needed
