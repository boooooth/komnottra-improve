# Komnottra (កំណត់ត្រា)

> **Smart Workplace Receipt and Dual-Currency Expense Ledger for Cambodia**  
> Automated multimodal OCR document extraction, dual-currency (USD/KHR) treasury accounting, General Department of Taxation (GDT) audit compliance, and Telegram workplace alert integration.

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/boooooth/komnottra-improve)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.8-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-19%20Passed-success?style=flat)]()

---

## 1. Project Overview & Repository

- **Official GitHub Repository Link:** [https://github.com/boooooth/komnottra-improve](https://github.com/boooooth/komnottra-improve)
- **Clone Command:**
  ```bash
  git clone https://github.com/boooooth/komnottra-improve.git
  cd komnottra-improve
  ```

### Problem Statement
In Cambodian business operations, accounting teams lose dozens of hours every week manually recording receipts into spreadsheets:
- **Thermal Paper Degradation:** Paper receipts fade within weeks, compromising audit trails.
- **Dual-Currency Volatility:** Transactions occur simultaneously in US Dollars (USD) and Khmer Riel (KHR). Manual conversions cause rounding and formula errors.
- **Tax Compliance Gaps:** Differentiating between VAT-creditable tax invoices with a valid General Department of Taxation (GDT) Tax Identification Number (TIN) and informal petty cash slips is tedious and error-prone.
- **Approval Bottlenecks:** Lack of instant team-to-owner approval workflows leads to unrecorded expenses and delayed reconciliations.

### Core Solution
1. **Intelligent Multimodal Capture:** Upload receipt photos or mobile snapshots. Google Gemini 2.5 Flash parses merchant names, invoice numbers, dates, currency, totals, VAT, and vendor TINs in seconds.
2. **Dual-Currency Ledger Engine:** Retains exact original transaction figures while calculating base currency equivalents using configurable exchange rates (e.g. 4,100 KHR / USD).
3. **Automated GDT Tax Validation:** Identifies valid Cambodian TIN formats (`K001-XXXX` / `L001-XXXX`) and calculates enterprise tax compliance percentages.
4. **Executive Financial Visualizations:** Donut Cashflow Ratio, Dynamic Runway Horizon Meter (Burn rate calculation), and GDT Tax Compliance Rings.
5. **Role-Based Access Control (RBAC):** Dual-tier permission model enabling Members to submit receipts/income while reserving approval and rejection authority for Owners.

---

## 2. Technology Stack & System Architecture

```text
+----------------------------------------------------------------------------+
|                             KOMNOTTRA PLATFORM                             |
+----------------------------------------------------------------------------+
       |                                              |
       v                                              v
+-------------------------------+             +------------------------------+
|       CLIENT INTERFACE        |             |      INTEGRATION LAYER       |
| Next.js 16 (App Router)       |             | Telegram Bot Webhook API     |
| React 19 + TypeScript         |             | Cloudflare Zero Trust Tunnel |
| Vanilla CSS Design System     |             | Google Gemini 2.5 Flash OCR  |
+-------------------------------+             +------------------------------+
       |                                              |
       v                                              v
+----------------------------------------------------------------------------+
|                          BACKEND API ROUTE LAYER                           |
|  - In-Memory Sliding-Window Rate Limiter (30-60 req/min)                   |
|  - Magic-Byte Binary Header Inspector (PNG, JPEG, WebP, PDF)               |
|  - Real-Time PostgreSQL User Session Verification (jose HS256)             |
+----------------------------------------------------------------------------+
       |                                              |
       v                                              v
+-------------------------------+             +------------------------------+
|        DATABASE LAYER         |             |       PERSISTENT DISK        |
| PostgreSQL 18 (Alpine)        |             | Uploaded Receipt Storage     |
| Prisma ORM 6.19 (Type-safe)   |             | (UUID Named, Exec-Disabled)  |
+-------------------------------+             +------------------------------+
```

- **Frontend:** Next.js 16.3.8, React 19.2.8, TypeScript 5, Lucide Icons
- **Backend / API:** Next.js Server Components, API Route Handlers, Node.js Buffer crypto
- **Database:** PostgreSQL 18 with Prisma ORM 6
- **AI Engine:** Google Gemini Vision (`@google/genai` / `gemini-2.5-flash`)
- **Security:** `jose` (HS256 JWT), `bcryptjs`, in-memory sliding-window rate limiting, magic-byte binary header inspection

---

## 3. Deployment Instructions

### Method A: Local Development Setup (Node.js)

#### Prerequisites
- Node.js 20+ installed
- PostgreSQL database running (or Docker)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Open .env and set your DATABASE_URL, JWT_SECRET, and GEMINI_API_KEY

# 3. Synchronize database schema
npx prisma generate
npx prisma db push

# 4. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Method B: Production Docker Compose Deployment (Recommended)

This single command launches the web app, PostgreSQL 18 database, OmniRoute proxy, Prisma Studio, and Cloudflare tunnel:

```bash
# 1. Clone repository
git clone https://github.com/boooooth/komnottra-improve.git
cd komnottra-improve

# 2. Configure production secrets
cp .env.example .env
# Edit .env with your production credentials:
# - JWT_SECRET: Strong random string (e.g., openssl rand -base64 32)
# - GEMINI_API_KEY: Google AI API Key
# - CLOUDFLARE_TUNNEL_TOKEN: (Optional, for public HTTPS access)

# 3. Build and launch containers in detached mode
docker compose up -d --build
```

**Services Launched:**
- `komnottra-web`: Next.js web application on port `3000` (auto-syncs Prisma on boot).
- `komnottra-db`: PostgreSQL 18 database on port `5432` with persistent volume `./data-stuff/postgres`.
- `komnottra-omniroute`: OmniRoute AI proxy on port `20128`.
- `komnottra-studio`: Prisma Studio visual database GUI on port `5555`.
- `komnottra-tunnel`: Cloudflare Zero Trust Tunnel for domain routing.

---

### Method C: Cloud VPS Deployment (DigitalOcean Droplet / Ubuntu)

#### Step 1: Create a DigitalOcean Droplet
1. Create a Droplet with **Ubuntu 24.04 LTS** or the **Docker on Ubuntu** Marketplace image.
2. Select the **Singapore (SGP1)** datacenter region (fastest ping to Cambodia).
3. Select the **Basic Plan** ($6/mo for 1GB RAM or $12/mo for 2GB RAM).
4. Set your root password or add your SSH key, then click **Create Droplet**.

#### Step 2: Configure 2GB Swap Memory (Recommended for 1GB Droplets)
SSH into your server and run:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

#### Step 3: Install Docker (if not using pre-built image)
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
```

#### Step 4: Clone and Launch Komnottra
```bash
git clone https://github.com/boooooth/komnottra-improve.git komnottra
cd komnottra

# Set environment secrets
cp .env.example .env
nano .env # Set JWT_SECRET, GEMINI_API_KEY, and CLOUDFLARE_TUNNEL_TOKEN

# Launch production containers
docker compose up -d --build
```

#### Step 5: Verify Container Health
```bash
docker compose ps
curl -s http://localhost:3000/api/auth/me
```

---

## 4. Comprehensive Test Cases & Verification Suite

Komnottra includes an automated verification test suite covering core accounting algorithms, tax regex parsing, binary magic-byte validation, rate limiting, and cryptographic session security.

### Running Automated Tests
```bash
npm test
```

### Test Case Matrix

| Test ID | Category | Test Objective | Input / Condition | Expected Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Accounting Engine** | USD to KHR conversion accuracy | `$150.50` at `4,100 KHR/USD` rate | Calculates `617,050 KHR` with zero float rounding errors. | **PASS** |
| **TC-02** | **Accounting Engine** | KHR to USD conversion accuracy | `4,100,000 KHR` at `4,100 KHR/USD` | Exact quotient of `$1,000.00`. | **PASS** |
| **TC-03** | **Runway Horizon** | Burn rate & treasury runway | `$12,000` Cash, `$3,000/mo` Burn | Calculates `4.0 months` and categorizes as `Caution` (3–6 mo). | **PASS** |
| **TC-04** | **GDT Tax Compliance** | Standard Cambodian TIN syntax | String `K001-10023456` | Matches `/^[KL]\d{3}-\d{6,10}$/i` pattern and tags as Tax Invoice. | **PASS** |
| **TC-05** | **GDT Tax Compliance** | Invalid TIN rejection | Strings `001-10023456`, `—`, `N/A` | Rejected; categorized as informal expense slip without VAT credit. | **PASS** |
| **TC-06** | **Security / Upload** | PNG magic-byte verification | Buffer starting with `89 50 4E 47` | Accepted; detected as `image/png` with `.png` extension. | **PASS** |
| **TC-07** | **Security / Upload** | JPEG magic-byte verification | Buffer starting with `FF D8 FF` | Accepted; detected as `image/jpeg` with `.jpg` extension. | **PASS** |
| **TC-08** | **Security / Upload** | Anti-Spoofing / Disguised script | Text buffer `<?php echo "..." ?>` | Rejected with `400 Bad Request` (Invalid file format). | **PASS** |
| **TC-09** | **Security / DoS** | Sliding-window rate limiter | 3 allowed requests within window | First 3 requests return `allowed: true`. | **PASS** |
| **TC-10** | **Security / DoS** | Rate limit quota breach | 4th burst request exceeding quota | Blocked with `allowed: false` and `429 Too Many Requests`. | **PASS** |
| **TC-11** | **Auth & Sessions** | Cryptographic token creation | Valid user payload | Signed HS256 JWT string generated via `jose`. | **PASS** |
| **TC-12** | **Auth & Sessions** | Signature tampering detection | Modified signature in token string | Verification returns `null`; rejects unauthorized request. | **PASS** |
| **TC-13** | **Database Sync** | Real-time session invalidation | Token valid, but user purged from DB | `getCurrentUser()` returns `null` immediately revoking access. | **PASS** |
| **TC-14** | **RBAC Enforcement** | Member approval restriction | Member role calls approval endpoint | Returns `403 Forbidden: Only workspace owners can approve`. | **PASS** |
| **TC-15** | **AI Vision OCR** | Multimodal receipt extraction | Valid receipt image to `/api/scan` | Extracts vendor, date, currency, total, VAT, and confidence. | **PASS** |
| **TC-16** | **Telegram Integration** | Webhook secret token validation | POST `/api/telegram/webhook` | Verifies `X-Telegram-Bot-Api-Secret-Token` header. | **PASS** |

---

## 5. Security & Self-Assessment Highlights

For in-depth architectural and risk documentation, refer to:
- [TECHNICAL_DOCUMENTATION.md](file:///home/bothhh/komnottra/TECHNICAL_DOCUMENTATION.md) — System architecture, core algorithms, database schemas, and data pipelines.
- [SECURITY_SELF_ASSESSMENT.md](file:///home/bothhh/komnottra/SECURITY_SELF_ASSESSMENT.md) — Threat modeling, permission-tier implementation, and remediated risk registry.

### Security Highlights
- **Active Database User Synchronization:** Stale JWTs cannot bypass revocation; every authenticated request verifies user existence in PostgreSQL.
- **Magic-Byte Binary Inspection:** Disallows uploaded scripts disguised with image extensions.
- **Sliding-Window Rate Limiting:** Enforces quotas on `/api/scan` (30 req/min) and `/api/income` (60 req/min).
- **Dual-Tier Role-Based Access Control:** Strict server-side guards preventing unauthorized members from modifying approval statuses.

---

