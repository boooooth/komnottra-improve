# Komnottra (កំណត់ត្រា)

Smart Workplace Receipt and Expense Ledger for Cambodia.

Komnottra is a specialized expense management platform engineered for Cambodian enterprises, SMEs, and non-governmental organizations. It bridges the gap between frontline employee expense claims and back-office financial reconciliation by automating data extraction, tax compliance checks, and dual-currency accounting.

---

## Background and Problem Statement

In Cambodian workplace operations, finance departments routinely spend hundreds of hours each month manually recording receipts into spreadsheets:

- **Thermal paper degradation:** Paper receipts fade within weeks, resulting in unreadable audit trails and rejected deductions.
- **Dual-currency volatility:** Businesses transact concurrently in United States Dollars (USD) and Khmer Riel (KHR). Manual currency conversion in spreadsheets frequently introduces formula errors (such as `#REF!` or rounding discrepancies).
- **Tax compliance ambiguity:** Differentiating between tax-creditable VAT invoices bearing a General Department of Taxation (GDT) Vendor Taxpayer Identification Number (TIN) and informal petty cash slips (such as street vendors or ride-hailing services) requires tedious manual scrutiny.
- **Inflexible reporting:** Standard accounting packages do not cater to custom company chart of accounts, budget lines, or department-level tracking without extensive reconfiguration.

---

## Solution Overview

Komnottra streamlines receipt processing into a unified digital pipeline:

1. **Intelligent Document Capture:** Upload receipt photos directly from mobile devices or desktops. Google Gemini Vision AI parses key metadata within seconds.
2. **Human-in-the-Loop Review:** Extracted line items (vendor name, receipt number, date, currency, amounts, VAT, and vendor TIN) are presented in a structured form for verification prior to submission.
3. **Dual-Currency Ledger Engine:** Preserves original transaction values while calculating local currency equivalents using configurable exchange rates (including National Bank of Cambodia daily rates).
4. **Automated GDT Tax Validation:** Detects valid Cambodian Tax Identification Numbers (e.g., formats prefixed with K001 or L001) and flags informal or non-VAT expenditures for audit transparency.
5. **Dynamic Column Customization:** Workspace administrators can reorder, toggle visibility, and define mandatory fields according to organizational reporting requirements.
6. **Cambodian Standard Excel Export:** Generates formatted `.xlsx` workbooks containing summary cards, tax invoice breakdowns, and formula-free reconciliation tables ready for monthly filings.

---

## System Architecture and Technology Stack

- **Application Framework:** Next.js 16 (App Router)
- **Frontend Library:** React 19 with TypeScript
- **Database Layer:** SQLite managed with Prisma ORM 6
- **Artificial Intelligence Engine:** Google Gemini Vision (`@google/genai` / `gemini-2.5-flash`) with optional fallback to OpenAI-compatible vision gateways
- **Spreadsheet Generation:** ExcelJS
- **Authentication:** Session-based JSON Web Tokens (jose, bcryptjs) with optional Google OAuth 2.0 integration
- **Styling Architecture:** Responsive CSS with mobile-first layouts and desktop dashboard support

---

## Project Structure

```text
komnottra/
├── prisma/
│   ├── dev.db              # Local SQLite database (git-ignored)
│   ├── schema.prisma       # Prisma schema definitions
│   └── seed.ts             # Database seeding script with demo workspace
├── public/
│   ├── fonts/              # Typography and font assets
│   ├── uploads/            # Uploaded receipts and sample SVGs
│   └── favicon.svg         # Application icon
├── src/
│   ├── app/
│   │   ├── api/            # Route handlers (auth, receipts, scan, export, etc.)
│   │   ├── dashboard/      # Desktop finance ledger and analytics view
│   │   ├── scan/           # Mobile receipt capture and verification screen
│   │   ├── settings/       # Workspace configuration and column management
│   │   ├── login/          # User authentication page
│   │   ├── layout.tsx      # Root application layout
│   │   └── page.tsx        # Landing and entry page
│   ├── components/         # Reusable UI components (modals, tables, cards)
│   └── lib/                # Shared utilities (Prisma client, Gemini AI, auth)
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules for sensitive and build files
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and script definitions
└── tsconfig.json           # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- Node.js version 18.18.0 or later (v20+ recommended)
- npm version 9 or later

### 1. Clone the Repository

```bash
git clone https://github.com/boooooth/turing-hackathon-komnottra.git
cd turing-hackathon-komnottra
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Populate the configuration variables as appropriate:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite connection string (e.g., `file:./dev.db`) |
| `NEXTAUTH_URL` | Yes | Base URL of the application (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Secret string used for session signing |
| `JWT_SECRET` | Yes | Secret string used for JWT tokens |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key for receipt OCR and metadata extraction |
| `GEMINI_MODEL` | Optional | Vision model name (defaults to `gemini-2.5-flash`) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID for social sign-in |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Client Secret for social sign-in |
| `AI_BASE_URL` | Optional | Custom OpenAI-compatible vision gateway endpoint |
| `AI_API_KEY` | Optional | API key for custom vision gateway |

### 4. Initialize Database Schema and Demo Data

Push the Prisma schema to create the local SQLite database and populate demo records:

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Launch the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Pre-Configured Demo Accounts

The seed script creates the following pre-configured demonstration accounts (default password: `komnottra2026`):

- **Workspace Admin (Finance Manager):** `admin@komnottra.kh`
  - Full permissions: customize columns, manage rates, export Excel, invite members.
- **Accountant / Auditor:** `accountant@komnottra.kh`
  - Ledger access: review pending submissions, audit VAT/TIN, verify totals.
- **Employee (Claimant):** `staff@komnottra.kh`
  - Mobile scanner access: capture receipts, review AI extractions, submit claims.

The landing and login pages also provide one-click demo access for rapid evaluation.

---

## Core Capabilities

### Receipt Extraction Pipeline

1. The client submits a receipt image (JPEG, PNG, WebP) to `/api/scan`.
2. The server dispatches the image along with custom organizational taxonomy (departments, expense codes) to Google Gemini Vision.
3. The response is validated and mapped against known Cambodian tax patterns.
4. The user inspects and confirms the fields on the verification screen before committing to the database.

### Dual-Currency Settlement

Receipts can be recorded in either USD or KHR:
- Original transaction figures (`amountExclVat`, `vat`, `total`) are retained verbatim.
- The base equivalent is derived via the configured workspace exchange rate (e.g., 4,000 KHR / USD).
- Summaries display both total USD and total KHR commitments without floating-point inaccuracies.

### General Department of Taxation (GDT) Identification

In Cambodia, valid VAT deduction requires a registered Taxpayer Identification Number (TIN). Komnottra:
- Distinguishes standard tax invoices from simplified receipts.
- Visualizes compliance status through clear ledger tags (Valid TIN vs Missing TIN).
- Flags potential audit issues before monthly tax returns are compiled.

### Column Customization

Workspaces can adapt Komnottra to match their existing chart of accounts:
- Rename headers to match internal terminology.
- Toggle visibility of optional columns (e.g., project codes, payment methods, claimant notes).
- Set required versus optional constraints on fields.

---

## Production Build

To build the project for production deployment:

```bash
npm run build
npm run start
```

Ensure environment variables in your production environment (such as Vercel, Docker, or a Linux VPS) are properly set prior to deployment.

---

## Security and Privacy Guidelines

- Never commit `.env` or sensitive credential files to version control.
- Ensure `JWT_SECRET` and `NEXTAUTH_SECRET` use cryptographically secure random values in production environments.
- Receipt uploads containing sensitive personal or financial information should be stored on private storage systems in enterprise deployments.

---

## License

This project is released under the MIT License.
