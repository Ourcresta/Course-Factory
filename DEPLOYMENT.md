# GURU Production Deployment Guide

## Overview
Complete guide for deploying GURU Admin Portal + Backend API to AWS EC2.

---

## Pre-Deployment Checklist

- [ ] All environment variables documented in `.env.example`
- [ ] No hardcoded secrets in codebase
- [ ] Admin authentication tested locally
- [ ] Public APIs are read-only (GET only)
- [ ] Database migrations ready
- [ ] Health check endpoint working (`/api/health`)

---

## Step 1: EC2 Instance Setup

### Launch Instance
```bash
# Use AWS Console or CLI
# - AMI: Ubuntu 22.04 LTS
# - Instance type: t3.micro (free tier) or t3.small
# - Storage: 20GB gp3
# - Security Group: Allow 22, 80, 443
```

### Security Group Rules
| Type  | Port | Source            | Description      |
|-------|------|-------------------|------------------|
| SSH   | 22   | Your IP only      | Admin access     |
| HTTP  | 80   | 0.0.0.0/0         | Redirect to HTTPS|
| HTTPS | 443  | 0.0.0.0/0         | Main traffic     |

### Connect & Update
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Dependencies

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x

# Install other tools
sudo apt install -y git nginx

# Install PM2 globally
sudo npm install -g pm2
```

---

## Step 3: Deploy Application

### Clone Repository
```bash
# Create app directory
sudo mkdir -p /var/www/guru
sudo chown ubuntu:ubuntu /var/www/guru
cd /var/www/guru

# Clone (use deploy key or token)
git clone https://github.com/your-org/guru.git .
```

### Install & Build
```bash
# Install dependencies
npm ci --production=false

# Build the application
npm run build
```

### Directory Structure After Build
```
/var/www/guru/
├── dist/
│   ├── index.js         # Backend entry
│   └── public/          # Frontend assets
│       ├── index.html
│       └── assets/
├── node_modules/
├── package.json
└── ecosystem.config.js
```

---

## Step 4: Configure Environment

```bash
# Create environment file
sudo nano /var/www/guru/.env
```

### Production .env Content
```env
NODE_ENV=production
PORT=5000

# Database (RDS or external)
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/guru

# Security
SESSION_SECRET=<generate-64-char-random-string>

# AI Service
OPENAI_API_KEY=sk-your-key

# Email
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=admin@yourdomain.com
```

### Generate Secure Secret
```bash
openssl rand -hex 64
```

---

## Step 5: Setup PM2

```bash
# Create log directory
sudo mkdir -p /var/log/guru
sudo chown ubuntu:ubuntu /var/log/guru

# Start application
cd /var/www/guru
pm2 start ecosystem.config.js --env production

# Verify running
pm2 status
pm2 logs guru-api

# Save process list
pm2 save

# Enable startup on reboot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### PM2 Commands Reference
```bash
pm2 status              # Check status
pm2 logs guru-api       # View logs
pm2 restart guru-api    # Restart
pm2 stop guru-api       # Stop
pm2 reload guru-api     # Zero-downtime reload
pm2 monit               # Live monitoring
```

---

## Step 6: Configure Nginx

### Install & Configure
```bash
# Copy config
sudo cp /var/www/guru/nginx/guru.conf /etc/nginx/sites-available/guru

# Edit domain names
sudo nano /etc/nginx/sites-available/guru
# Replace: guru.yourdomain.com → your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/guru /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default

# Test configuration
sudo nginx -t

# If SSL certs don't exist yet, comment out SSL lines temporarily
# Then reload
sudo systemctl reload nginx
```

---

## Step 7: Setup HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d guru.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## Step 8: Security Hardening

### UFW Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### SSH Hardening
```bash
sudo nano /etc/ssh/sshd_config

# Set these values:
PasswordAuthentication no
PermitRootLogin no
AllowUsers ubuntu

sudo systemctl restart sshd
```

### Fail2ban (Optional)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Step 9: Post-Deploy Validation

### Health Check
```bash
curl https://guru.yourdomain.com/api/health
# Expected: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Admin Login Test
```bash
curl -X POST https://guru.yourdomain.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ourshiksha.ai","password":"YourPassword"}'
```

### Public API Test
```bash
curl https://guru.yourdomain.com/api/public/courses \
  -H "X-API-Key: ais_your-api-key"
```

### Checklist
- [ ] Health endpoint responds
- [ ] Admin login works
- [ ] Course creation works
- [ ] Public APIs respond with API key
- [ ] SSL certificate valid
- [ ] Logs are clean (`pm2 logs`)

---

## Step 10: Monitoring & Maintenance

### Log Rotation
```bash
sudo nano /etc/logrotate.d/guru

# Content:
/var/log/guru/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### AWS CloudWatch (Optional)
```bash
# Install CloudWatch agent
sudo apt install -y amazon-cloudwatch-agent
```

### Billing Alert
Set up AWS billing alert at $5 threshold in AWS Console.

---

## Rollback Plan

### Quick Rollback
```bash
cd /var/www/guru

# Check current version
git log --oneline -5

# Rollback to previous commit
git checkout <previous-commit-hash>
npm ci --production=false
npm run build
pm2 reload guru-api
```

### Database Rollback
- Use RDS point-in-time recovery
- Or restore from latest snapshot

---

## Troubleshooting

### App Won't Start
```bash
pm2 logs guru-api --lines 100
# Check for missing env vars or port conflicts
```

### 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check nginx upstream
sudo nginx -t
sudo systemctl status nginx
```

### Database Connection Errors
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check security group allows EC2 → RDS
```

### SSL Issues
```bash
# Renew manually
sudo certbot renew

# Check certificate
sudo certbot certificates
```

---

## Deployment Commands Summary

```bash
# Fresh deploy
cd /var/www/guru
git pull origin main
npm ci --production=false
npm run build
pm2 reload guru-api

# View status
pm2 status
pm2 logs guru-api

# Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Contact

For deployment issues, contact the DevOps team.
For application issues, check the audit logs in the admin panel.
