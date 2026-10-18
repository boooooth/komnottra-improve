# Komnottra — Technology Selection & Architecture Rationales

## 1. Complete Technology Stack Matrix

| Layer | Technology | Version | Rationale & Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js (App Router)** | `16.3.8` | Next.js 16 with Turbopack provides hybrid server rendering, streaming, optimized production standalone builds for Docker, and cohesive API routes without needing an auxiliary Express/Fastify server. |
| **UI Library** | **React** | `19.2.8` | Contemporary React 19 architecture providing high performance, seamless state transitions, and server-component readiness. |
| **Language** | **TypeScript** | `^5.0` | Strict end-to-end type safety across database schemas, API payloads, financial calculations, and UI models. Eliminates runtime errors in financial reporting. |
| **Database** | **PostgreSQL (Alpine)** | `18-alpine` | High-performance, ACID-compliant relational storage. Native support for complex queries, relational foreign key constraints, cascading deletes, and JSON columns for audit payloads. |
| **ORM / Data Access** | **Prisma ORM** | `6.19.3` | Type-safe query builder, declarative schema modeling (`prisma/schema.prisma`), automated migrations, and instant database inspection via Prisma Studio. |
| **AI Vision OCR** | **Google Gemini Vision** | `@google/genai ^2.27.0` | State-of-the-art multimodal vision capability. Unmatched precision in tokenizing and extracting complex Khmer script (អក្សរខ្មែរ) on faded receipt thermal paper, PassApp receipts, and ABA KHQR payment slips. |
| **AI Gateway Service**| **OmniRoute** | `latest` | High-availability local AI proxy container allowing dynamic model fallback, rate-limit management, and caching. |
| **Styling & Design** | **Vanilla CSS Modules** | CSS3 | Clean, robust design system using HSL color tokens, CSS variables, and zero runtime CSS overhead. Maximizes performance and visual fidelity without utility framework lock-in. |
| **Auth & Security** | **jose & bcryptjs** | `jose ^6.2.12`, `bcryptjs ^3.0.3` | Modern, lightweight, Edge-compatible JWT encoding/decoding and salted password hashing. HttpOnly cookie storage eliminates XSS token exfiltration. |
| **Spreadsheet Engine** | **ExcelJS** | `^4.4.0` | Enterprise-grade workbook generation. Enables multi-sheet workbooks with custom header styling, currency formatting, column widths, and cashflow formulas. |
| **Ingress & Tunneling**| **Cloudflare Tunnel (`cloudflared`)** | `latest` | Zero-inbound exposure. Outbound-only encrypted tunnel to Cloudflare Edge. Protects internal microservices while providing global public HTTPS and automatic SSL certificates. |
| **Icons** | **Lucide React** | `^1.51.0` | Lightweight, scalable vector iconography consistent across desktop and mobile form factors. |

---

## 2. In-Depth Architectural Rationales

### A. Next.js 16 Standalone Containerization
Instead of running heavy Node servers or multiple microservice runtimes, Komnottra uses Next.js `output: 'standalone'` in Docker.
- **Minimal Image Footprint:** Only the traced dependencies in `node_modules` are copied into the runner layer, reducing image size by over 70%.
- **Single Port Simplicity:** Next.js handles static page rendering, dynamic server-side logic, and backend API routes under a single process listening on port 3000.

### B. PostgreSQL 18 vs SQLite
Earlier prototype versions utilized embedded SQLite. For production multi-user concurrency and enterprise audit durability, Komnottra transitioned to **PostgreSQL 18**:
- Multi-tenancy locking guarantees: simultaneous uploads from multiple staff members across web and Telegram do not result in `database is locked` race conditions.
- Strict foreign key cascades maintain database consistency when workspaces, receipts, or users are modified.

### C. Gemini Vision OCR for Cambodian Financial Receipts
Cambodian merchant receipts present unique technical challenges:
- Thermal paper receipts often combine English text and Khmer script (`អាករ`, `សរុប`, `កាលបរិច្ឆេទ`).
- Transactions occur in dual currencies: USD ($) and Khmer Riel (៛), frequently on the same slip.
- Tax compliance requires detecting the official General Department of Taxation (GDT) TIN format (starting with `K` or `L`).
- Google Gemini Vision (`gemini-2.5-flash`) was selected over generic OCR (such as Tesseract) because it performs semantic comprehension rather than simple letter-recognition, accurately calculating subtotal vs. VAT amounts and recognizing KHQR payment hashes.

### D. Zero-Trust Ingress via Cloudflare Tunnel
- No public router ports (such as `80` or `443`) are opened on the host server.
- The `komnottra-tunnel` container establishes an outbound-only encrypted QUIC/HTTP2 tunnel with Cloudflare's nearest edge server.
- Web traffic to `https://komnottra.runbuddies.win` is authenticated, encrypted, and routed directly to the internal container without exposing the host IP or network to internet scanning.
