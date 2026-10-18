# Komnottra — Core Algorithms & Mathematical Formulations

## 1. Dual-Currency Normalization & Currency Conversion

### Mathematical Basis
Cambodia operates as a dual-currency economy where transactions occur interchangeably in United States Dollars (`USD`, `$`) and Cambodian Khmer Riel (`KHR`, `៛`). Official exchange rates are issued daily by the National Bank of Cambodia (NBC), hovering around $1\text{ USD} \approx 4,100\text{ KHR}$.

Komnottra standardizes every transaction into the workspace's designated **Base Currency** ($C_{\text{base}} \in \{\text{KHR}, \text{USD}\}$) while retaining the original transaction currency ($C_{\text{tx}}$) and nominal total ($T_{\text{tx}}$).

### Algorithm Formulation

Given:
- $T_{\text{tx}}$: Nominal transaction amount
- $C_{\text{tx}}$: Transaction currency (`USD` or `KHR`)
- $C_{\text{base}}$: Workspace reporting currency (`USD` or `KHR`)
- $R$: Active exchange rate (e.g., $R = 4,100$ KHR per 1 USD)

The Base Equivalent Amount ($T_{\text{base}}$) is calculated as:

$$\begin{aligned}
\text{If } C_{\text{base}} = \text{USD}: & \quad T_{\text{base}} = \begin{cases} 
T_{\text{tx}} & \text{if } C_{\text{tx}} = \text{USD} \\ 
\frac{T_{\text{tx}}}{R} & \text{if } C_{\text{tx}} = \text{KHR} 
\end{cases} \\
\text{If } C_{\text{base}} = \text{KHR}: & \quad T_{\text{base}} = \begin{cases} 
T_{\text{tx}} \times R & \text{if } C_{\text{tx}} = \text{USD} \\ 
T_{\text{tx}} & \text{if } C_{\text{tx}} = \text{KHR} 
\end{cases}
\end{aligned}$$

### Sign Preservation in Unified Ledgers
To interleave revenue and expenditure without ambiguity:
$$\text{Signed Ledger Value} = \begin{cases} 
+ T_{\text{base}} & \text{if Record is Income (Client Inflow)} \\ 
- T_{\text{base}} & \text{if Record is Receipt (Company Outflow)} 
\end{cases}$$

---

## 2. Gemini Multimodal Prompt Engineering & Dynamic Taxonomy Injection

### Problem Statement
Static OCR models frequently misclassify expenses or assign arbitrary category labels that do not match the company's chart of accounts. Komnottra solves this by dynamically injecting the organization's approved taxonomy into the prompt payload before dispatching to Google Gemini Vision.

### Pseudocode Implementation

```typescript
function buildVisionPrompt(categories: string[], departments: string[]): string {
  const categoriesListStr = categories.join('", "');
  const departmentsListStr = departments.join('", "');

  return `You are an expert Cambodian financial auditor and OCR parser specializing in Khmer and English receipts, tax invoices, and payment slips (such as ABA KHQR, PassApp, Lucky Supermarket, EDC electric bills).
Analyze the provided receipt image and extract the following financial fields into strict JSON:
1. vendor: Merchant or business name (in English or Khmer).
2. receiptNo: The invoice or receipt number (e.g. INV-0451, PA-88213), or generate a short reference if missing.
3. date: Date in DD/MM/YYYY format.
4. currency: "KHR" or "USD". If both are shown, pick the primary transaction currency.
5. total: Total numeric amount paid (numbers only, no symbols).
6. amountExclVat: Subtotal before VAT if tax is explicitly itemized; otherwise equal to total.
7. vat: Explicit VAT amount only if clearly printed as VAT, tax, or អាករ on the receipt. If no VAT is explicitly shown or itemized, return 0.
8. vendorTin: Cambodian Tax Identification Number starting with K or L (e.g. K001-100234567). If not found, return "—".
9. category: Choose the best matching category from this company's approved list: ["${categoriesListStr}"]. If none match, pick the closest one or "Other".
10. department: Choose the best matching department for this expense from this company's list: ["${departmentsListStr}"]. If unclear, pick the closest one or "General".
11. confidence: An integer between 50 and 99 representing OCR confidence.
12. warning: Any warning if text is partly handwritten or faded, or null if clear.
13. note: Short description of purchased goods or service.

Return ONLY the raw JSON object without markdown formatting.`;
}
```

### JSON Sanitization Algorithm
To prevent JSON parsing failures caused by markdown code fences (` ```json `), the response passes through a regex stripper:
```typescript
function sanitizeAiJson(rawText: string): any {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}
```

---

## 3. Financial Runway & Predictive Monthly Burn Rate Formula

### Metric Definitions
1. **Approved Revenue ($I_{\text{total}}$):** Sum of all client invoices where $\text{status} = \text{APPROVED}$.
2. **Approved Outflow ($E_{\text{total}}$):** Sum of all receipts where $\text{status} \in \{\text{APPROVED}, \text{REIMBURSED}\}$.
3. **Net Cashflow ($N_{\text{cash}}$):**
   $$N_{\text{cash}} = I_{\text{total}} - E_{\text{total}}$$

### Burn Rate & Runway Clock Calculation
The average monthly burn rate represents the velocity of capital consumption:

$$\text{Average Monthly Burn } (B_{\text{monthly}}) = \max\left(100, \frac{E_{\text{total}}}{\max\left(1, \frac{N_{\text{receipts}}}{10}\right)}\right)$$

The projected cash runway in months ($R_{\text{months}}$) is given by:

$$R_{\text{months}} = \begin{cases} 
\frac{I_{\text{total}}}{B_{\text{monthly}}} & \text{if } I_{\text{total}} > 0 \\ 
0 & \text{if } I_{\text{total}} \le 0 \text{ and } E_{\text{total}} > 0 \\
\text{"Unknown"} & \text{if no transactions recorded}
\end{cases}$$

---

## 4. Tax Compliance & Cambodian TIN Validation

The General Department of Taxation (GDT) of Cambodia mandates Tax Identification Numbers (TIN) on Value Added Tax (VAT) invoices:
- Standard format: A capital letter prefix (`K` or `L`) followed by a 3-digit regional code, a hyphen, and an 8 to 9-digit registration number.
- Regular Expression: `/^[KL]\d{3}-\d{8,9}$/`

```typescript
function validateCambodianTin(tin: string | null): boolean {
  if (!tin || tin === '—') return false;
  const cleanTin = tin.trim().toUpperCase();
  return /^[KL]\d{3}-\d{8,9}$/.test(cleanTin);
}
```
If a company receipt lacks a valid TIN while itemizing VAT, the system flags the receipt with a tax compliance warning in the audit queue.
