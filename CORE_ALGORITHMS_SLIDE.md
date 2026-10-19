# Komnottra · Core Algorithmic Architecture
> **AI-Powered Dual-Currency Financial Engine for Cambodian Enterprises**

---

### 1. Multimodal OCR & Document Intelligence
* **Khmer & English Vision LLM**: Custom-prompted vision pipeline (Gemini 2.5 Flash + local proxy fallback) tuned for Cambodian receipts, ABA KHQR slips, and utility bills.
* **Automated Accounting Extraction**: Instantly extracts vendor, date, line items, and Cambodian Tax ID (GDT TIN `K001-xxxxxxxxx`), auto-mapped to company expense categories.

### 2. Dual-Currency Ledger Normalization (USD ⇄ KHR)
* **Dynamic Multi-Currency Engine**: Normalizes mixed daily transactions (USD and Khmer Riel) in real time using National Bank of Cambodia (NBC) official rates ($1 = 4,100៛$).
* **Unified Book Equivalent**: Automatically converts two-sided ledger flows (Client Revenue Inflow vs Business Outflow) into a single base reporting standard.

### 3. Predictive Cash Runway & Burn Rate Engine
* **Rolling Monthly Burn**: $\text{Burn Rate} = \frac{\sum \text{Approved Expenses}}{\text{Active Months}}$.
* **Runway Horizon Matrix**: $\text{Runway} = \frac{\text{Net Cash}}{\text{Monthly Burn}}$, dynamically classified into **Critical** ($<3\text{ mo}$), **Caution** ($3\text{--}6\text{ mo}$), and **Optimal** ($6+\text{ mo}$).
* **30-Day Predictive Horizon**: Weighted moving average forecast with a 5% conservative planning buffer.

### 4. AI Fraud & Tax Compliance Sentinel
* **Composite Duplicate Hash**: Flags identical claims across multiple employees ($\text{Vendor} + \text{Date} + \text{Amount}$).
* **Dynamic Policy Outliers**: Instantly catches unusual high-spend spikes exceeding company thresholds ($>\$100$).
* **GDT Tax Audit Scoring**: Calculates the ratio of valid vendor TINs to ensure compliance for Cambodian VAT input tax deduction.

---
*Slide Key Takeaway: End-to-end automation from raw camera snapshot to audit-ready, dual-currency financial intelligence.*
