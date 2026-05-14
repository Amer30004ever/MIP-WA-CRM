# MaVoid WhatsApp CRM

A WhatsApp-first CRM that centralizes customer conversations, leads, deals, tasks, and dashboard visibility.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

**Prerequisites:** Docker & Docker Compose installed.

```bash
# Clone the repository
git clone https://github.com/MaVoid/MIP-WA-CRM.git
cd MIP-WA-CRM

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your WhatsApp API credentials

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# API Documentation: http://localhost:3001/api/docs
```

> **⚠️ Note:** The `frontend/package.json` and `backend/package.json` files are placeholders.
> Frontend and backend developers must provide their actual `package.json` files before
> `docker-compose up` will successfully build the containers.

---

## 📁 Project Structure

```
MIP-WA-CRM/
│
├── .github/
│   └── workflows/
│       ├── ci-frontend.yml       # CI - lint, build, test frontend
│       ├── ci-backend.yml        # CI - lint, build, test backend (with test DB)
│       ├── cd-frontend.yml   # CD - deploy frontend to VPS
│       └── cd-backend.yml    # CD - deploy backend to VPS
│
├── frontend/
│   ├── Dockerfile   # Multi-stage build for Next.js
│   ├── .dockerignore   # Excludes node_modules, .env, .next
│   ├── (Frontend dev adds src/, public/, etc.)
│   └── package.json (placeholder - frontend dev provides)
│
├── backend/
│   ├── Dockerfile    # Multi-stage build for NestJS
│   ├── .dockerignore   # Excludes dev dependencies and temp files
│   ├── (Backend dev adds src/, prisma/, test/, etc.)
│   └── package.json (placeholder - backend dev provides)
│
├── scripts/
│   ├── backup.sh   # PostgreSQL backup script
│   └── restore.sh
├── caddy/
│   └── Caddyfile   # docker-compose.prod.yml caddyfile configuration
├── docker-compose.yml   # Full local stack (DB, backend, frontend)
├── docker-compose.prod.yml   # Production with nginx + SSL
├── .env.example   # All required environment variables
├── .gitignore   # node_modules, .env, dist, .next
├── .nvmrc # Node.js version 20
└── README.md
```

---

## 💻 Local Development

**For Frontend and Backend developers who need to write code.**

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL 15+ (or use Docker for DB only)
- Git

### Option 1: Full Docker Setup (Recommended for Testing Integration)

```bash
# Start everything (PostgreSQL + Backend + Frontend)
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Frontend runs on http://localhost:3000
# Backend runs on http://localhost:3001
```

### Option 2: Run Natively (For Active Development with Hot Reload)

**Terminal 1 - PostgreSQL (using Docker only):**
```bash
docker-compose up -d postgres postgres_test
```

**Terminal 2 - Backend:**
```bash
cd backend
cp ../.env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
# Backend runs on http://localhost:3001
```

**Terminal 3 - Frontend:**
```bash
cd frontend
# Create .env.local from root example
cp ../.env.example .env.local
# Or manually create with just:
echo NEXT_PUBLIC_API_URL=http://localhost:3001 > .env.local

npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### Frontend Developer Notes

| Task | Command | Location |
|------|---------|----------|
| Start dev server | `npm run dev` | `frontend/` |
| Build for production | `npm run build` | `frontend/` |
| Run linter | `npm run lint` | `frontend/` |
| Type check | `npx tsc --noEmit` | `frontend/` |
| Run tests | `npm test` | `frontend/` |
| Configure Next.js standalone | Add `output: 'standalone'` to `next.config.js` | `frontend/next.config.js` |

### Backend Developer Notes

| Task | Command | Location |
|------|---------|----------|
| Start dev server | `npm run start:dev` | `backend/` |
| Build for production | `npm run build` | `backend/` |
| Run linter | `npm run lint` | `backend/` |
| Generate Prisma client | `npx prisma generate` | `backend/` |
| Run migrations | `npx prisma migrate dev` | `backend/` |
| Run tests | `npm test` | `backend/` |
| Open Prisma Studio | `npx prisma studio` | `backend/` |
| Create health endpoint | `GET /health` return `{ status: 'ok' }` | `backend/src/` |
| Create webhook endpoint | `GET /webhooks/whatsapp` for verification | `backend/src/` |
| Create webhook POST handler | `POST /webhooks/whatsapp` for messages | `backend/src/` |

### Backend Required Endpoints (MVP)

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/health` | GET | Docker health check | `{ status: 'ok' }` |
| `/webhooks/whatsapp` | GET | Webhook verification | Return `hub.challenge` as plain text |
| `/webhooks/whatsapp` | POST | Receive WhatsApp messages | `{ status: 'received' }` |

### Test Database

Two databases are available:
- **Development:** `postgres` on port `5432` (persistent data)
- **Testing:** `postgres_test` on port `5433` (in-memory, resets on restart)

---

## 🚢 Production Deployment

### Generating SSH Key for GitHub Secrets

```bash
# On your local machine, generate an SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096 -C "github-vps-deploy"

# Add the public key to your VPS
ssh-copy-id ubuntu@your-vps-ip

# Then copy the private key content
cat ~/.ssh/id_rsa
# Copy the entire output (including BEGIN and END lines) into VPS_SSH_PRIVATE_KEY secret
text
```

### Creating GitHub Secrets

1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret:

| Secret | How to Get |
|--------|-------------|
| `VPS_SSH_PRIVATE_KEY` | Run `cat ~/.ssh/id_rsa` on your local machine |
| `PROD_ENV_FILE` | Run `cat .env.production` and paste entire content |
| `VPS_HOST` | Your VPS IP address (e.g., `123.456.78.90`) |
| `VPS_USER` | SSH username (`ubuntu` for Ubuntu VPS) |
| `VPS_DOMAIN` | Your domain (e.g., `crm.mavoid.com`) |

### VPS Setup (One-Time)

```bash
# On your VPS, install Docker and Docker Compose
ssh ubuntu@your-vps-ip

sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker

# Create application directory
mkdir -p /app/mavoid-crm
```

### HTTPS Setup for Production (Required for WhatsApp Webhook)

**This project uses Caddy for automatic SSL certificate management.** No manual certbot or SSL configuration needed.

#### Step 1: Configure Your Domain DNS

Point your domain to your VPS IP address:
- Create an A record: `crm.yourdomain.com` → `YOUR_VPS_IP`

#### Step 2: Update Caddyfile

Edit `Caddyfile` and replace `crm.yourdomain.com` with your actual domain:

```caddy
your-actual-domain.com {
    reverse_proxy frontend:3000
    
    handle_path /api/* {
        reverse_proxy backend:3001
    }
    
    handle_path /webhooks/* {
        reverse_proxy backend:3001
    }
}
```
#### Step 3: Deploy with Caddy

```bash
# On your VPS
cd /app/mavoid-crm

# Copy production environment
cp .env.example .env
# Edit .env with your actual domain and WhatsApp credentials

# Start the stack
docker-compose -f docker-compose.prod.yml up -d

# Caddy will automatically:
# 1. Get SSL certificate from Let's Encrypt
# 2. Renew it every 60 days
# 3. Redirect HTTP to HTTPS
```

#### Step 4: Verify SSL

```bash
# Check certificate
curl -I https://crm.yourdomain.com

# Should return HTTP/2 200
```

**Caddy handles SSL automatically. No certbot, no manual renewal, no nginx config needed.**
```

### Deployment Pipeline

The repository includes 4 GitHub Actions workflows:

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| `ci-frontend.yml` | Test frontend | Every push/PR |
| `ci-backend.yml` | Test backend | Every push/PR |
| `cd-frontend.yml` | Deploy to VPS | Merge to main (frontend changes) |
| `cd-backend.yml` | Deploy to VPS | Merge to main (backend changes) |

**Deployment flow:**
1. Push code to feature branch → CI runs
2. Create Pull Request to `main` → CI runs again
3. Merge PR → CD runs, deploys changed service only

### Manual Production Deployment

```bash
# On your VPS
cd /app/mavoid-crm
git pull origin main
docker-compose down
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```
### Rollback Procedure

```bash
# On VPS
cd /app/mavoid-crm

# Revert to previous commit
git log --oneline -5
git reset --hard <previous-commit-hash>

# Redeploy
docker-compose down
docker-compose up -d --build

# Or rollback database only (last backup)
./scripts/restore.sh /backups/postgres/backup_20260510_020000.sql
```

---

## 🔧 Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `POSTGRES_USER` | Database username | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `POSTGRES_DB` | Database name | Yes |
| `JWT_SECRET` | JWT signing key (32+ chars) | Yes |
| `WHATSAPP_ACCESS_TOKEN` | Meta API token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Yes |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | Yes |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | Yes |

See `.env.example` for complete list.

> **⚠️ WhatsApp Webhook Requirement:** The `BACKEND_URL` must be a **public HTTPS URL**.
> For local development, use `ngrok http 3001` (see Troubleshooting section).
> For production, ensure your VPS has SSL configured (see HTTPS section above).


---

## 📱 Testing WhatsApp Webhook Locally

WhatsApp cannot send webhooks to `localhost:3001`. You need a public HTTPS URL.

### Option 1: Ngrok (Easiest for Testing)

**1. Install ngrok**
```bash
# Mac
brew install ngrok

# Download from: https://ngrok.com/download
```

**2. Start your backend locally**
```bash
cd backend && npm run start:dev
```

**3. In another terminal, expose your local server**
```bash
ngrok http 3001
```

**4. Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

**5. Configure webhook in Meta Developer Portal**
- **Callback URL:** `https://abc123.ngrok.io/webhooks/whatsapp`
- **Verify Token:** The value you set in `WHATSAPP_VERIFY_TOKEN`

**How verification works:**
Meta sends a GET request to your webhook:
```text
GET /webhooks/whatsapp?hub.mode=subscribe&hub.challenge=123456&hub.verify_token=your_token
```

Your backend must return the raw `hub.challenge` value (123456) as plain text.

**Success:** Meta shows "Verified" in the developer portal.

---

### Option 2: Cloudflare Tunnel (Free, More Stable)

**1. Install cloudflared**
```bash
# Mac
brew install cloudflared
```

**2. Run the tunnel**
```bash
cloudflared tunnel --url http://localhost:3001
```

**3. Use the provided URL**
```
https://xxxx.trycloudflare.com
```

---

### Verify Webhook Works

**Test the verification endpoint manually:**
```bash
curl "https://your-ngrok-url/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=123&hub.verify_token=your_token"
```

**Expected response:** The challenge number (e.g., `123`)

---

### Troubleshooting Tips

| Issue | Solution |
|-------|----------|
| Webhook verification fails | Check `WHATSAPP_VERIFY_TOKEN` matches exactly |
| Connection refused | Ensure backend is running on port 3001 |
| SSL certificate error | Use HTTPS URL from ngrok/cloudflared |
| Timeout | Check firewall settings |


---

## 🐛 Troubleshooting

### Docker containers won't start

```bash
# Check if ports are already in use
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :5432

# Rebuild all containers
docker-compose down -v
docker-compose up -d --build
```

### Backend can't connect to database

```bash
# Wait for PostgreSQL to be ready
docker-compose logs postgres

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy
```

### Webhook not receiving messages

- Ensure backend is publicly accessible via HTTPS
- Verify webhook URL in Meta Developer Portal
- Check webhook logs in database: 
docker-compose exec postgres psql -U postgres -d mavoid_crm -c "SELECT * FROM \"WebhookLog\" ORDER BY id DESC LIMIT 10;"

### Docker Compose Version Warning

If you see `version is obsolete`, delete the `version: '3.8'` line from `docker-compose.yml`.

---

## 💾 Database Backups

### Automated Daily Backups

```bash
# Make script executable
chmod +x scripts/backup.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /app/mavoid-crm/scripts/backup.sh
```
### Manual Backup
```bash
# Run backup manually
./scripts/backup.sh

# Backups are saved to /backups/postgres/backup_YYYYMMDD_HHMMSS.sql
```
### Restore from Backup
```bash
# Copy backup file to VPS
scp backup_20260510_020000.sql ubuntu@your-vps:/tmp/

# Restore to database
docker exec -i mavoid_postgres psql -U postgres mavoid_crm < /tmp/backup_20260510_020000.sql
```
---

## 🛠 Development Environment Setup

### Node.js Version

This project requires Node.js 20. We recommend using nvm (Node Version Manager):

```bash
# Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use the correct Node version
nvm install 20
nvm use 20

# The .nvmrc file ensures everyone uses the same version

---

## 📝 License

Confidential - MaVoid Internal Use

---

**Document Version:** 1.0
**Last Updated:** May 2026
**Maintained by:** DevOps Team
```

---