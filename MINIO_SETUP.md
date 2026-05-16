# MinIO + Nginx CDN Setup Guide

## Architecture

```
User → Nginx CDN (port 80/443) → MinIO (port 9000)
        ↑ cache hit                  ↑ S3 API + storage
        (serve cached image)         (store/retrieve files)
```

- **MinIO**: S3-compatible object storage, stores original files
- **Nginx**: Reverse proxy + cache layer (CDN), serves files with `Cache-Control: 1 year`

## Step 1: Start MinIO

```bash
cd /home/iwan/projects/waterpro_backend
docker compose up -d
```

This starts:
- **MinIO API** on `http://localhost:9000`
- **MinIO Console** on `http://localhost:9001` (login: minioadmin / minioadmin)
- Auto-creates bucket `waterpro` with public access

Verify:
```bash
curl http://localhost:9000/minio/health/live
# Should return: OK
```

## Step 2: Configure Nginx CDN

Create `/etc/nginx/conf.d/minio-cdn.conf`:

```nginx
# CDN proxy cache for MinIO images
proxy_cache_path /var/cache/nginx/minio levels=1:2 keys_zone=minio_cache:10m max_size=2g inactive=30d use_temp_path=off;

server {
    listen 80;
    server_name cdn.filterairwaterpro.com;  # or your domain

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Cache settings
    proxy_cache minio_cache;
    proxy_cache_valid 200 304 365d;
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 5s;

    # Add cache control headers for browsers
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header X-Cache-Status $upstream_cache_status;

    location / {
        proxy_pass http://localhost:9000/waterpro;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # MinIO needs these for S3 compatibility
        proxy_set_header Authorization "";
        proxy_hide_header x-amz-request-id;
        proxy_hide_header x-amz-id-2;
        proxy_hide_header Set-Cookie;
        proxy_ignore_headers Set-Cookie;
        proxy_hide_header Set-Cookie;
    }

    # Health check
    location /health {
        access_log off;
        return 200 'OK';
    }
}
```

Reload Nginx:
```bash
nginx -t && systemctl reload nginx
```

## Step 3: Configure Backend (.env)

```env
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET=waterpro
MINIO_CDN_URL=http://localhost:80
MINIO_MAX_FILE_SIZE=5242880
```

## Step 4: Configure Frontend (.env.local)

```env
NEXT_PUBLIC_MINIO_CDN_URL=http://localhost:80
```

## Step 5: Restart Services

```bash
# Backend
cd /home/iwan/projects/waterpro_backend
npm run build
npm run start

# Frontend
cd /home/iwan/projects/waterpro_frontend
npm run dev
```

## Step 6: Verify

1. Upload a product image via admin dashboard
2. Check MinIO Console: http://localhost:9001 → bucket `waterpro` → should see files under `uploads/`
3. Check CDN URL: `curl -I http://localhost:80/uploads/products/xxx.jpg`
   - Should return `X-Cache-Status: MISS` (first request) then `HIT` (subsequent)
   - Should have `Cache-Control: public, max-age=31536000, immutable`
4. Check that 4 versions were created per image:
   - `original.jpg` (resized to max 1200px)
   - `original.webp` (WebP version)
   - `original-thumb.jpg` (400px thumbnail)
   - `original-thumb.webp` (WebP thumbnail)

## Production Setup

### 1. Change MinIO credentials

Edit `docker-compose.yml` and `.env`:
```env
MINIO_ACCESS_KEY=<strong-random-string>
MINIO_SECRET_KEY=<strong-random-string>
```

### 2. Use a real domain for CDN

Replace `cdn.filterairwaterpro.com` in Nginx config with your actual domain.
Add SSL via Certbot:
```bash
certbot --nginx -d cdn.filterairwaterpro.com
```

### 3. Update env vars for production

Backend `.env`:
```env
MINIO_ENDPOINT=http://localhost:9000
MINIO_CDN_URL=https://cdn.filterairwaterpro.com
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_MINIO_CDN_URL=https://cdn.filterairwaterpro.com
```

## Nginx Cache Management

```bash
# Check cache size
du -sh /var/cache/nginx/minio

# Purge entire cache
rm -rf /var/cache/nginx/minio/*

# Purge specific file
# Send PURGE request:
curl -X PURGE http://localhost:80/uploads/products/xxx.jpg
```

## Troubleshooting

### "Access Denied" from MinIO
- Verify bucket `waterpro` has public access: `mc anonymous set public local/waterpro`
- Check credentials match between docker-compose.yml and .env

### CDN returns 404
- Verify MinIO bucket name matches: `MINIO_BUCKET=waterpro`
- Check Nginx `proxy_pass` URL includes bucket: `proxy_pass http://localhost:9000/waterpro;`

### Cache not working
- Check Nginx error log: `tail -f /var/log/nginx/error.log`
- Verify `/var/cache/nginx/minio` directory exists and is writable by nginx user
- Check `X-Cache-Status` header in response

### Images not being processed
- Check backend logs for `[ImageProcessor]` messages
- Verify `sharp` is installed: `npm ls sharp`
- Check MinIO is running: `docker ps | grep minio`
