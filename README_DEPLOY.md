# OurShiksha Guru - MilesWeb Deployment Guide v1.0

Complete step-by-step guide to deploy the OurShiksha Guru Admin Course Factory on MilesWeb hosting.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Build & Deploy](#build--deploy)
6. [Nginx/Apache Configuration](#web-server-configuration)
7. [SSL Certificate](#ssl-certificate)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Runtime environment |
| npm | 10.x | Package manager |
| PostgreSQL | 15+ | Database |
| Git | Latest | Version control |
| PM2 | Latest | Process manager |

### Required Accounts

- MilesWeb hosting account (VPS or Cloud recommended)
- OpenAI API key (for AI course generation)
- Resend API key (for email OTP)
- Domain name (pointed to your server)

---

## Server Requirements

### Minimum Specifications

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| Bandwidth | 1 TB | Unlimited |

### MilesWeb Plan Recommendation

- **Cloud VPS Basic** or higher for production workloads
- Ensure SSH access is enabled
- Request PostgreSQL database (or install via package manager)

---

## Database Setup

### Option 1: MilesWeb Managed PostgreSQL

1. Log into MilesWeb control panel
2. Navigate to **Databases** → **PostgreSQL**
3. Create new database:
   - Database name: `ourshiksha_guru`
   - Username: `guru_admin`
   - Password: (use strong password)
4. Note the connection details

### Option 2: Self-Managed PostgreSQL

```bash
# SSH into your server
ssh user@your-server-ip

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

CREATE DATABASE ourshiksha_guru;
CREATE USER guru_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ourshiksha_guru TO guru_admin;
\q
```

### Initialize Database Schema

The schema will be automatically created when the application starts via Drizzle ORM.

```bash
# After deploying the app, run:
npm run db:push
```

---

## Application Setup

### 1. Clone Repository

```bash
# Navigate to your web directory
cd /var/www

# Clone the repository
git clone https://github.com/your-org/ourshiksha-guru.git
cd ourshiksha-guru
```

### 2. Install Dependencies

```bash
# Install production dependencies
npm ci --production=false
```

### 3. Configure Environment

```bash
# Copy environment template
cp ENV_SAMPLE.txt .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://guru_admin:password@localhost:5432/ourshiksha_guru

# Application
NODE_ENV=production
PORT=5000

# Security (generate unique values)
SESSION_SECRET=$(openssl rand -hex 64)
JWT_SECRET=$(openssl rand -hex 32)

# AI Services
OPENAI_API_KEY=sk-your-key-here

# Email
RESEND_API_KEY=re_your-key-here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com
```

### 4. Initialize Database

```bash
# Push schema to database
npm run db:push
```

---

## Build & Deploy

### 1. Build Application

```bash
# Build frontend and backend
npm run build
```

This creates:
- `dist/public/` - Frontend static files
- `dist/` - Compiled backend

### 2. Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ourshiksha-guru',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
```

### 3. Start Application

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup
```

### 4. Verify Application

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs ourshiksha-guru

# Test locally
curl http://localhost:5000/api/health
```

---

## Web Server Configuration

### Nginx Configuration (Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ourshiksha-guru
```

**Nginx Config File:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    
    # File upload size
    client_max_body_size 10M;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }
    
    # Static files caching
    location /assets {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Uploads directory
    location /uploads {
        alias /var/www/ourshiksha-guru/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

**Enable Site:**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ourshiksha-guru /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Apache Configuration (Alternative)

```bash
sudo nano /etc/apache2/sites-available/ourshiksha-guru.conf
```

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    <Location />
        Header always set X-Frame-Options "DENY"
        Header always set X-Content-Type-Options "nosniff"
    </Location>
</VirtualHost>
```

---

## SSL Certificate

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certificate will auto-renew. Test with:
sudo certbot renew --dry-run
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://yourdomain.com/api/health
# Expected: {"status": "ok"}
```

### 2. Admin Login Test

1. Navigate to `https://yourdomain.com/sign-in`
2. Login with admin credentials
3. Verify dashboard loads correctly

### 3. AI Generation Test

1. Go to AI Course Factory
2. Enter a test command
3. Verify course generates successfully

### 4. API Test

```bash
# Test public API (if enabled)
curl -H "X-API-Key: your-api-key" https://yourdomain.com/api/public/courses
```

### 5. Security Headers Check

```bash
# Check security headers
curl -I https://yourdomain.com
```

Look for:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs ourshiksha-guru --lines 100

# Check if port is in use
sudo lsof -i :5000

# Verify environment variables
cat .env | grep -v PASSWORD
```

### Database Connection Failed

```bash
# Test PostgreSQL connection
psql -h localhost -U guru_admin -d ourshiksha_guru

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf for local access
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

### 502 Bad Gateway

```bash
# Check if Node.js is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart application
pm2 restart ourshiksha-guru
```

### Permission Errors

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/ourshiksha-guru

# Fix permissions
chmod -R 755 /var/www/ourshiksha-guru
chmod 600 .env
```

---

## Maintenance

### Daily Tasks

```bash
# Check application status
pm2 status

# Monitor logs for errors
pm2 logs --lines 50
```

### Weekly Tasks

```bash
# Update dependencies (test first!)
npm audit
npm update

# Backup database
pg_dump -U guru_admin ourshiksha_guru > backup_$(date +%Y%m%d).sql
```

### Deploying Updates

```bash
# Pull latest code
git pull origin main

# Install any new dependencies
npm ci

# Rebuild application
npm run build

# Push any schema changes
npm run db:push

# Restart application
pm2 restart ourshiksha-guru
```

### Database Backup

```bash
# Create backup
pg_dump -U guru_admin -h localhost ourshiksha_guru > /backups/guru_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U guru_admin -h localhost ourshiksha_guru < /backups/guru_backup.sql
```

---

## Folder Structure

```
/var/www/ourshiksha-guru/
├── dist/                  # Compiled application
│   ├── index.js          # Server entry point
│   └── public/           # Frontend static files
├── uploads/              # User uploads
├── logs/                 # Application logs
├── node_modules/         # Dependencies
├── .env                  # Environment variables
├── ecosystem.config.js   # PM2 configuration
└── package.json          # Project manifest
```

---

## Support Contacts

| Issue | Contact |
|-------|---------|
| MilesWeb Hosting | support@milesweb.in |
| OpenAI API | platform.openai.com/docs |
| Resend Email | resend.com/docs |
| Application Issues | dev@ourshiksha.com |

---

**Version**: 1.0
**Last Updated**: January 2026
**Author**: OurShiksha DevOps Team
