# Komnottra — Feature Flow Architecture

## 1. Vision OCR & Multi-Channel Receipt Processing Flow

Komnottra ingests receipts and billing slips through two distinct pathways: the **Web Application** and the **Telegram Webhook**. Both channels funnel into the Gemini Vision engine with dynamic prompt injection.

```mermaid
sequenceDiagram
    autonumber
    actor User as Submitter (Web / Telegram)
    participant Client as Web App / Telegram API
    participant Server as Next.js API Route (/api/scan or /api/telegram/webhook)
    participant Gemini as Google Gemini Vision (2.5-flash)
    participant DB as PostgreSQL (Prisma ORM)
    participant Owner as Workspace Owner (Telegram)

    User->>Client: Upload Receipt Photo
    Client->>Server: Transmit Image (Base64 / Multipart)
    Server->>DB: Query Workspace Dynamic Categories & Departments
    DB-->>Server: Return Categories & Departments
    Server->>Gemini: Prompt with Image + Injected Company Taxonomy
    Gemini-->>Server: Structured JSON (Vendor, Date, Currency, Total, VAT, TIN)
    Server->>DB: Save Receipt Record (status = PENDING)
    DB-->>Server: Return Saved ID
    
    alt If Telegram Submission
        Server->>Client: Send Message with Inline Buttons [Expense] / [Income]
        User->>Client: Click [🔴 Expense / Spending]
        Client->>Server: Callback Query (type_exp)
        opt If Amount >= Threshold & notifyHighSpend is Active
            Server->>Owner: Push Telegram "🚨 High Expense Alert"
        end
    else If Web Submission
        Server->>Client: Return OCR Fields for Review
        User->>Client: Click Submit
        opt If Amount >= Threshold & notifyHighSpend is Active
            Server->>Owner: Push Telegram "🚨 High Expense Alert"
        end
    end
```

---

## 2. Telegram Bot 2-Tier RBAC & Dispatching Flow

Telegram interactions are routed through a single webhook endpoint (`/api/telegram/webhook`) and filtered using strict role separation based on registered chat IDs.

```mermaid
flowchart TD
    Update[Telegram Update Arrives] --> Dedupe{Already Processed Update ID?}
    Dedupe -- Yes --> Ack[HTTP 200 OK - Return]
    Dedupe -- No --> StoreUpdate[Record Update ID with TTL]
    
    StoreUpdate --> CheckType{Update Type?}
    
    CheckType -- Callback Query --> HandleCallback["Handle [Expense] or [Income] Button Click"]
    HandleCallback --> CallbackAction{Selected Type?}
    CallbackAction -- Expense --> ConfirmExpense[Mark as Expense & Check Threshold Alert]
    CallbackAction -- Income --> ConvertIncome[Move to Income Table & Skip Alert]
    
    CheckType -- Message --> FindWorkspace[Look up Workspace by Owner or Member Chat ID]
    
    FindWorkspace --> WSFound{Workspace Found?}
    WSFound -- No --> UnknownUserReply[Reply with User Chat ID & Instructions to Connect]
    WSFound -- Yes --> CheckRole{Sender Role?}
    
    %% Member Flow
    CheckRole -- Member --> MemberFilter{Content Type?}
    MemberFilter -- Photo --> ProcessReceipt[Run Gemini Vision OCR & Show Expense/Income Buttons]
    MemberFilter -- Text / Commands --> StaffRestriction["Reply: 🔒 Staff Access Only. Submissions Only."]
    
    %% Owner Flow
    CheckRole -- Owner --> OwnerFilter{Content Type?}
    OwnerFilter -- Photo --> ProcessReceipt
    OwnerFilter -- /summary --> ExecSummary[Query AI Chatbot Agent -> Reply Financial Summary]
    OwnerFilter -- /runway --> ExecRunway[Query AI Chatbot Agent -> Reply Runway & Burn Rate]
    OwnerFilter -- /forecast --> ExecForecast[Query AI Chatbot Agent -> Reply 30-Day Forecast]
    OwnerFilter -- Natural Question --> ChatbotAgent[Query AI Chatbot Agent with Live Approved Ledger Context]
```

---

## 3. Mandatory Approvals & Ledger Gating Flow

The core integrity principle of Komnottra is that **unapproved data never pollutes financial analytics, reports, or home KPIs**.

```mermaid
stateDiagram-v2
    [*] --> Submissions: Web Scan / Telegram Photo / Record Income
    Submissions --> PENDING: Default Initial State
    
    state "Approvals Queue (Owner Web Only)" as Approvals {
        PENDING --> Inspection: Owner Views Details & Photo
        Inspection --> Editing: Owner Modifies Fields if needed
        Editing --> APPROVED: Owner Clicks "Save & Approve"
        Inspection --> APPROVED: Owner Clicks "Approve"
        Inspection --> REJECTED: Owner Clicks "Reject"
        PENDING --> APPROVED: Batch "Approve Selected"
        PENDING --> REJECTED: Batch "Reject Selected"
    }
    
    APPROVED --> FinancialReports: Enters Company Cashflow Statements
    APPROVED --> AnalyticsEngine: Calculates Spend, Revenue, Burn & Runway
    APPROVED --> HomeDashboard: Visible in Recent Activity & KPIs
    APPROVED --> ExcelExporter: Exported into 3-Sheet Financial Workbook
    
    REJECTED --> Excluded: Retained for Audit History, Zero Financial Impact
```

---

## 4. Unified Company Cashflow & Multi-Sheet Excel Flow

```
[Reports Screen Request]
       │
       ▼
Fetch Approved Receipts (status = APPROVED or REIMBURSED)
Fetch Approved Incomes (status = APPROVED)
       │
       ▼
Normalize Currency & Sign
   ├── Incomes: Positive (+), Green Badge
   └── Expenses: Negative (-), Red Badge
       │
       ▼
Sort Unified Array Chronologically by Date (descending)
       │
       ▼
Render Interactive Table & Calculate Top Cards:
   ├── Total Inflow: SUM(Approved Incomes in Base Currency)
   ├── Total Outflow: SUM(Approved Expenses in Base Currency)
   └── Net Cashflow: Total Inflow - Total Outflow
       │
       ▼
[User Clicks "Export Excel"]
       │
       ▼
API Route: /api/export
   ├── Sheet 1: Cashflow Ledger (Chronological Combined Statements)
   ├── Sheet 2: Expense Outflow (Itemized Tax Receipts & TINs)
   └── Sheet 3: Income Inflow (Itemized Client Invoices & Methods)
       │
       ▼
Browser Downloads: komnottra_financial_report_<date>.xlsx
```
