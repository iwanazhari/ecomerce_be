# Waterpro — Pre-Deployment Checklist & Guide

## Prompt untuk AI/Developer sebelum Deploy

```
Deploy Waterpro production ke VPS 157.66.34.174 dengan domain shop.filterairwaterpro.com.
Ikuti langkah berikut secara berurutan — JANGAN skip step apapun.

SEBELUM DEPLOY (Pre-flight):
1. Pastikan DNS A records sudah pointing ke 157.66.34.174 untuk:
   - shop.filterairwaterpro.com
   - cdn.filterairwaterpro.com
   - admin.filterairwaterpro.com
2. Verifikasi DNS dengan: dig +short shop.filterairwaterpro.com
3. SSH ke VPS: ssh root@cloud
4. Pastikan dependencies tersedia: Node.js >= 20, PostgreSQL, Redis, Nginx

ENVIRONMENT SETUP:
5. Edit waterpro_backend/.env.production — GANTI SEMUA placeholder:
   - JWT_SECRET: generate dengan 'openssl rand -hex 32'
   - COOKIE_SECRET: generate dengan 'openssl rand -hex 32'
   - MINIO_ROOT_PASSWORD: ganti dengan password kuat (min 20 chars)
   - RAJAONGKIR_API_KEY: isi API key RajaOngkir
   - MIDTRANS keys: ganti ke production saat ready
6. Edit waterpro_frontend/.env.production — verifikasi:
   - NEXT_PUBLIC_MEDUSA_URL = https://shop.filterairwaterpro.com
   - NEXT_PUBLIC_MINIO_CDN_URL = https://cdn.filterairwaterpro.com
7. Copy .env.production ke .env di masing-masing project

DEPLOYMENT:
8. Jalankan: cd waterpro_backend/deploy && sudo bash deploy.sh
9. Tunggu semua service start dan health check selesai
10. Verifikasi SSL: curl -I https://shop.filterairwaterpro.com

POST-DEPLOY:
11. Cek semua service: systemctl status medusa-backend waterpro-frontend waterpro-bridge minio
12. Cek logs: journalctl -u medusa-backend -f
13. Test frontend: buka https://shop.filterairwaterpro.com di browser
14. Test admin: login dengan admin@waterpro.id / admin123
15. Test checkout flow (sandbox Midtrans)
16. Test WebSocket realtime (order notification)
17. Test CDN: upload product image, verify via https://cdn.filterairwaterpro.com
```

---

## Detailed Checklist

### 1. DNS Configuration (Niagahoster / dns-parking.com)

Buat **A records** berikut di DNS Zone Editor:

| Host | Type | Value | TTL |
|---|---|---|---|
| `shop` | A | `157.66.34.174` | 3600 |
| `cdn` | A | `157.66.34.174` | 3600 |
| `admin` | A | `157.66.34.174` | 3600 |
| `@` | A | `157.66.34.174` | 3600 |

**Verifikasi:**
```bash
dig +short shop.filterairwaterpro.com    # → 157.66.34.174
dig +short cdn.filterairwaterpro.com     # → 157.66.34.174
dig +short admin.filterairwaterpro.com   # → 157.66.34.174
```

> DNS propagation bisa makan waktu 5-30 menit. Certbot akan gagal kalau DNS belum resolved.

---

### 2. VPS Prerequisites

SSH ke server dan pastikan semua installed:

```bash
ssh root@cloud

# Cek Node.js (harus >= 20)
node -v   # v20.x atau lebih tinggi

# Cek PostgreSQL
systemctl status postgresql
psql -U iwan -d waterpro -c "SELECT 1"  # test koneksi

# Cek Redis
systemctl status redis
redis-cli ping  # harus reply: PONG

# Cek kalau port sudah dipakai
ss -tlnp | grep -E '9002|3000|3001|9001'
```

**Kalau belum install PostgreSQL:**
```bash
apt-get install -y postgresql
sudo -u postgres psql -c "CREATE USER iwan WITH PASSWORD 'iwan';"
sudo -u postgres psql -c "CREATE DATABASE waterpro OWNER iwan;"
```

**Kalau belum install Redis:**
```bash
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server
```

---

### 3. Generate Secrets

```bash
# JWT Secret
openssl rand -hex 32

# Cookie Secret
openssl rand -hex 32

# MinIO Password
openssl rand -base64 32
```

Copy output masing-masing ke `.env.production`.

---

### 4. Environment Files

#### Backend (`waterpro_backend/.env.production`)
- [ ] `DATABASE_URL` — verify PostgreSQL credentials
- [ ] `JWT_SECRET` — generated, bukan default
- [ ] `COOKIE_SECRET` — generated, bukan default
- [ ] `MINIO_ROOT_PASSWORD` — strong password
- [ ] `RAJAONGKIR_API_KEY` — diisi
- [ ] `MIDTRANS_IS_PRODUCTION` — `false` untuk testing, `true` untuk live
- [ ] `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` — semua pakai `https://` production domains

#### Frontend (`waterpro_frontend/.env.production`)
- [ ] `NEXT_PUBLIC_MEDUSA_URL` → `https://shop.filterairwaterpro.com`
- [ ] `NEXT_PUBLIC_MINIO_CDN_URL` → `https://cdn.filterairwaterpro.com`
- [ ] `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` — sesuai backend

---

### 5. Deploy Steps

```bash
# 1. Upload code ke VPS (dari lokal)
rsync -avz --exclude node_modules --exclude .next --exclude .env \
  /home/iwan/projects/waterpro_backend/ root@cloud:/root/waterpro_backend/
rsync -avz --exclude node_modules --exclude .next --exclude .env \
  /home/iwan/projects/waterpro_frontend/ root@cloud:/root/waterpro_frontend/

# 2. Upload env files
scp waterpro_backend/.env.production root@cloud:/root/waterpro_backend/.env.production
scp waterpro_frontend/.env.production root@cloud:/root/waterpro_frontend/.env.production

# 3. SSH dan deploy
ssh root@cloud
cd /root/waterpro_backend/deploy
sudo bash deploy.sh
```

---

### 6. Post-Deployment Verification

#### Service Health
```bash
# All services active?
systemctl is-active medusa-backend   # → active
systemctl is-active waterpro-frontend # → active
systemctl is-active waterpro-bridge   # → active
systemctl is-active minio             # → active

# Check ports
ss -tlnp | grep -E '9002|3000|3001|9001'
```

#### Nginx & SSL
```bash
# Nginx running?
systemctl status nginx

# SSL valid?
curl -I https://shop.filterairwaterpro.com   # → HTTP/2 200
curl -I https://cdn.filterairwaterpro.com    # → HTTP/2 200

# Auto-renew setup?
sudo certbot renew --dry-run
```

#### Application
```bash
# Backend health
curl http://localhost:9002/store/products?limit=1

# Frontend
curl http://localhost:3000 | head -20

# WebSocket bridge
curl http://localhost:3001

# MinIO
curl http://localhost:9001/minio/health/live
```

#### Browser Testing
- [ ] Homepage loads: `https://shop.filterairwaterpro.com`
- [ ] Product page loads
- [ ] Cart & checkout works
- [ ] Midtrans payment sandbox berhasil
- [ ] Admin login: `admin@waterpro.id` / `admin123`
- [ ] Admin dashboard accessible
- [ ] Product image upload → CDN works
- [ ] Realtime notification (WebSocket) works

---

### 7. Troubleshooting

| Problem | Command |
|---|---|
| Backend crash | `journalctl -u medusa-backend -n 100 --no-pager` |
| Frontend 502 | `journalctl -u waterpro-frontend -n 50` |
| SSL failed | `certbot certificates` + check DNS |
| Nginx error | `tail -f /var/log/nginx/waterpro/shop-error.log` |
| Redis not connected | `redis-cli ping` + check `REDIS_URL` in `.env` |
| Database error | `sudo -u postgres psql -d waterpro -c "\dt"` |
| MinIO not accessible | `journalctl -u minio -n 50` |

---

### 8. Maintenance Commands

```bash
# Restart single service
systemctl restart medusa-backend

# View live logs
journalctl -u medusa-backend -f

# Update code & rebuild
cd /root/waterpro_backend && git pull && npm install && npm run build && systemctl restart medusa-backend
cd /root/waterpro_frontend && git pull && npm install && npm run build && systemctl restart waterpro-frontend

# Database migration
cd /root/waterpro_backend && npx medusa db:migrate

# Force SSL renew
certbot renew --force-renewal

# Nginx reload (after config change)
nginx -t && systemctl reload nginx
```
