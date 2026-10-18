# Komnottra — System Architecture Specification

## 1. High-Level System Architecture Diagram

```mermaid
graph TB
    subgraph Internet ["🌐 Public Internet"]
        Browser["🖥️ Web Browser<br/>(Desktop / Mobile)"]
        TGClient["📱 Telegram App<br/>(Staff / Owner)"]
        TGServers["☁️ Telegram Bot API Server"]
        CFEdge["🛡️ Cloudflare Edge<br/>(SSL/TLS, DDoS, WAF)"]
    end

    subgraph HostServer ["🏢 Host Server (Linux Environment)"]
        subgraph CloudflareContainer ["Ingress Gateway"]
            CFTunnel["komnottra-tunnel<br/>(cloudflared in host mode)"]
        end

        subgraph DockerBridge ["🐳 Isolated Docker Network: komnottra-net"]
            WebContainer["komnottra-web<br/>(Next.js 16 App Router - :3000)"]
            DBContainer["komnottra-db<br/>(PostgreSQL 18 - :5432)"]
            OmniContainer["komnottra-omniroute<br/>(AI Gateway - :20128)"]
            StudioContainer["komnottra-studio<br/>(Prisma Studio - :5555)"]
        end

        subgraph PersistentVolumes ["💾 Host Persistent Storage"]
            PGData[("./data-stuff/postgres")]
            Uploads[("./data-stuff/uploads")]
            OmniData[("./data-stuff/omniroute")]
        end
    end

    subgraph ExternalCloud ["☁️ External Cloud Services"]
        GeminiAPI["🧠 Google Gemini API<br/>(Vision & Multi-modal LLM)"]
    end

    %% Network Connections
    Browser -->|HTTPS komnottra.runbuddies.win| CFEdge
    TGClient -->|Photo / Query| TGServers
    TGServers -->|Webhook POST /api/telegram/webhook| CFEdge

    CFEdge <==|Encrypted Outbound Tunnel| CFTunnel
    CFTunnel -->|HTTP 127.0.0.1:3000| WebContainer

    WebContainer -->|Internal DNS db:5432| DBContainer
    WebContainer -->|Internal DNS omniroute:20128| OmniContainer
    StudioContainer -->|Internal DNS db:5432| DBContainer
    WebContainer -.->|Direct HTTPS API| GeminiAPI
    OmniContainer -.->|Fallback HTTPS API| GeminiAPI

    %% Volume Mounts
    DBContainer --- PGData
    WebContainer --- Uploads
    OmniContainer --- OmniData
```

---

## 2. Container & Service Topology

| Container Name | Base Image | Role & Responsibilities | Port Bindings |
| :--- | :--- | :--- | :--- |
| **`komnottra-web`** | `node:20-alpine` | Core Next.js application server. Serves SSR/Static frontend, executes route handlers (`/api/scan`, `/api/receipts`, `/api/income`, `/api/export`, `/api/telegram/webhook`), handles business logic and authentication. | `127.0.0.1:3000 -> 3000` |
| **`komnottra-db`** | `postgres:18-alpine` | Primary relational database storing Workspaces, Users, Receipts, Incomes, Categories, Departments, and Column definitions. | `127.0.0.1:5432 -> 5432` |
| **`komnottra-studio`**| `komnottra-web` | Graphical database browser running Prisma Studio. Allows direct developer data inspection, auditing, and maintenance. | `127.0.0.1:5555 -> 5555` |
| **`komnottra-omniroute`** | `diegosouzapw/omniroute` | Local AI gateway and proxy. Manages fallback model routing, request retries, and API key abstractions. | `127.0.0.1:20128 -> 20128` |
| **`komnottra-tunnel`** | `cloudflare/cloudflared` | Outbound secure tunnel to Cloudflare Edge. Provides public HTTPS access (`komnottra.runbuddies.win`) without opening public WAN ports. | `network_mode: host` |

---

## 3. Data Storage & Multi-Tenancy Architecture

### A. Relational Schema Isolation
Every business record belongs to a specific `Workspace`:
- `Workspace`: Contains organization metadata, base currency (`KHR` or `USD`), exchange rate, budget limits, Telegram tokens, and alert settings.
- `User`: Accounts linked to a workspace via `workspaceId`. Assigned either `OWNER` or `MEMBER`.
- `Receipt`: Company expenditures with claimant identity, merchant name, TIN, dual-currency amounts, approval status, and image links.
- `Income`: Company revenue entries with client name, invoice number, payment method, dual-currency amounts, and approval status.
- `WorkspaceColumn`: Dynamic column configurations allowing companies to customize spreadsheet exports.

### B. File Storage Layer
- Uploaded receipt and invoice images are saved with unique UUID filenames in `/app/public/uploads`.
- The container path `/app/public/uploads` is mounted to the host filesystem `./data-stuff/uploads`, ensuring files persist across container restarts, image rebuilds, and code deployments.

---

## 4. Integration Boundaries

1. **Telegram Webhook Subsystem:**
   - Registers webhook URL with Telegram API: `https://komnottra.runbuddies.win/api/telegram/webhook`.
   - Update deduplication cache (`processedUpdates`) prevents duplicate processing during network retry storms.
   - Dual-tier chat ID identification ensures owners receive executive capabilities while staff members are restricted to submission workflows.

2. **Gemini Vision Multimodal Subsystem:**
   - Transmits receipt images in base64 format with contextual prompt engineering.
   - Injects the workspace's specific category list and department list into the prompt for context-aware classification.
   - Outputs strict, deterministic JSON parsing directly into database transaction models.
