# Komnottra — Slide Presentation Deck (Human Explanation)

> **Goal:** Simple, clear, human explanations for presentations, pitch decks, and demos.  
> Every slide includes: **Big Idea**, **Slide Bullets**, **Visual Graphic Idea**, and **Speaker Script**.

---

## Slide 1: User Flow (How People Actually Use Komnottra)

### 💡 The Big Idea (Simple Explanation)
> **"Zero typing for employees. 100% control for the business owner."**  
> Employees hate typing numbers into spreadsheets after work. With Komnottra, employees just snap a photo on Telegram. The boss checks it on the web, clicks "Approve", and the accounting is done.

### 📋 What Goes on the Slide:
* **The Employee (5 Seconds on the Go):**
  * Opens Telegram on their phone.
  * Snaps a photo of a receipt or invoice.
  * Taps one button: **Expense** or **Income**.
* **The Boss (Total Peace of Mind):**
  * Opens the web dashboard on phone or laptop.
  * Reviews the pending receipt photo and extracted total.
  * Clicks **"Approve"** (or edits if needed).
* **The Result:** The transaction instantly updates the company's cashflow and reports.

### 🎨 Visual Idea for this Slide:
* **Left:** Phone screen showing a Telegram photo upload with two big buttons: `🔴 Expense` and `🟢 Income`.
* **Arrow in middle:** Seamless sync.
* **Right:** Laptop screen showing the boss clicking a green `Approve` button.

### 🗣️ Speaker Script (What to Say):
> *"Employees don't want to type receipts into complicated accounting software at the end of a long day. With Komnottra, they take a photo in Telegram, tap whether it's an expense or income, and they're done. The owner reviews the photo in their dashboard and approves it with one click."*

---

## Slide 2: Feature Flow (The 5-Step Journey of a Receipt)

### 💡 The Big Idea (Simple Explanation)
> **"From a crumpled paper receipt to an official financial statement in 5 clean steps."**  
> Unapproved receipts wait in a digital 'waiting room'—they can never mess up company numbers until the owner approves them.

### 📋 What Goes on the Slide:
1. **Snap & AI Scan:** Upload a receipt photo. AI reads English and Khmer text in 2 seconds.
2. **One-Tap Tag:** Choose if money went out (**Expense**) or came in (**Income**).
3. **Smart Boss Alert:** If an expense is huge (e.g. over $100), the boss gets a direct alert on Telegram. Incomes enter silently without annoying alerts.
4. **The Waiting Room (Approvals):** Every new submission is marked **Pending**. Drafts never touch real company profit or runway charts.
5. **Official Books:** Once approved, the transaction appears in the **Combined Cashflow Report** and live financial dashboard.

### 🎨 Visual Idea for this Slide:
* A 5-step horizontal timeline:  
  `📷 Snap Photo` $\rightarrow$ `🤖 AI Read` $\rightarrow$ `🔔 Boss Alert (Big Spends)` $\rightarrow$ `⏳ Waiting Room` $\rightarrow$ `📊 Official Books`

### 🗣️ Speaker Script (What to Say):
> *"Notice step four: unapproved receipts never touch the company's real numbers. If someone takes a blurry photo or makes a mistake, it sits safely in a pending queue. Nothing counts toward company profit or tax reports until the boss reviews and approves it."*

---

## Slide 3: Technology Selection (Why We Picked These Tools)

### 💡 The Big Idea (Simple Explanation)
> **"Built for real Cambodian businesses, not Silicon Valley theories."**  
> We picked tools that work seamlessly with how people already live and do business in Cambodia.

### 📋 What Goes on the Slide:
* **Telegram:** 99% of Cambodian teams already use Telegram every day. No new app to download or teach staff.
* **Google Gemini AI:** The only vision AI that accurately reads Khmer script (`អាករ`, `សរុប`, `កាលបរិច្ឆេទ`) and faded thermal paper receipts.
* **PostgreSQL Database:** A bulletproof digital vault. Financial records will never be lost, corrupted, or overwritten.
* **Next.js & React:** Loads instantly on mobile phones and laptops with a modern, responsive design.
* **Cloudflare Tunnel:** Delivers bank-grade security to the web app without exposing the server's home address to internet hackers.

### 🎨 Visual Idea for this Slide:
* 4-grid icon layout with modern logos:
  * **Telegram Logo:** "Zero training needed"
  * **Gemini AI Logo:** "Khmer + English receipt vision"
  * **PostgreSQL Logo:** "Unbreakable financial records"
  * **Cloudflare Shield:** "Zero open ports"

### 🗣️ Speaker Script (What to Say):
> *"Why did we choose these technologies? Because standard OCR tools fail on Khmer text and faded receipts, but Google Gemini handles them effortlessly. And instead of forcing Cambodian staff to download yet another app, we brought the entire tool inside Telegram where they already communicate every day."*

---

## Slide 4: System Architecture (How the Pieces Fit Together)

### 💡 The Big Idea (Simple Explanation)
> **"A clean, containerized engine where every part has one clear job."**  
> Think of it like a modern kitchen: the front desk greets guests, the kitchen cooks the food, the safe holds the money, and a walkie-talkie keeps the manager connected.

### 📋 What Goes on the Slide:
* **The Front Gate (Cloudflare Tunnel):** Encrypts every visit and blocks cyber-attacks before they reach our server.
* **The Brain (`komnottra-web`):** The Next.js app that serves the dashboard, runs approval checks, and calculates cashflow.
* **The Eye (`Gemini AI`):** Scans receipt images, finds totals, tax IDs, and dates in seconds.
* **The Steel Vault (`komnottra-db`):** An isolated PostgreSQL database running safely in its own Docker container.
* **The Hotline (`Telegram Bot`):** Connects staff receipt photos directly to the server, and lets the owner ask AI financial questions.

### 🎨 Visual Idea for this Slide:
* Clean block diagram:
  * `User / Telegram` $\rightarrow$ `Cloudflare Edge` $\rightarrow$ `Next.js Web App` $\leftrightarrow$ `PostgreSQL DB` & `Gemini AI`

### 🗣️ Speaker Script (What to Say):
> *"Behind the scenes, everything runs in clean Docker containers on Linux. If one part needs an update, the rest of the system keeps running smoothly without downtime. The entire system is modular, fast, and completely self-contained."*

---

## Slide 5: Core Algorithms (The Smart Logic Made Simple)

### 💡 The Big Idea (Simple Explanation)
> **"Automating the mathematical headaches of Cambodian accounting."**  
> We took the most annoying parts of daily business math and automated them completely.

### 📋 What Goes on the Slide:
1. **The Dual-Currency Engine (USD $\leftrightarrow$ KHR):**
   * Cambodia uses both Dollars and Riel daily.
   * If you pay 8,200 ៛ for coffee and $500 for office rent, Komnottra automatically converts them at the official NBC exchange rate into one unified total.
2. **The Cash Runway Clock:**
   * Answers the #1 question every business owner worries about:  
     *"If we keep spending at this rate, how many months until we run out of cash?"*
3. **The Tax ID Sentinel:**
   * Checks receipts for valid Cambodian Tax IDs (TIN starting with K or L) to ensure expenses can be legally claimed for tax deductions.
4. **Smart Category Learning:**
   * Guides the AI using your company's exact departments (Sales, Operations, Admin) so expenses are never dumped into random buckets.

### 🎨 Visual Idea for this Slide:
* Three visual widgets:
  * **Currency converter badge:** `$1.00 = 4,100 ៛`
  * **Runway dial gauge:** `8.4 Months of Cash Left`
  * **Tax checkmark:** `Valid Cambodian TIN Verified`

### 🗣️ Speaker Script (What to Say):
> *"Cambodia is unique because every business deals with two currencies simultaneously: USD and Khmer Riel. Our dual-currency engine converts mixed currency transactions automatically in real-time. Plus, our runway clock tells the owner exactly how many months of cash they have left before they run out."*

---

## Slide 6: Security & Docker Protection (How We Protect Your Data)

### 💡 The Big Idea (Simple Explanation)
> **"Bank-grade privacy: No company can see another's data, and zero server ports are exposed to hackers."**  
> We protect both your business secrets and your server infrastructure.

### 📋 What Goes on the Slide:
* **1. Company Isolation (Workspace Walls):**
  * Every single database query requires your verified company ID. It is impossible for Company A to peek at Company B's books.
* **2. Staff vs. Boss Shield:**
  * Staff members can **only** submit photos. They cannot see company profits, cash runway, or the owner's dashboard.
* **3. How We Protect Docker (The `docker0` & Port Safeguard):**
  * **The Hidden Risk:** Normal Docker setups often expose ports (like database port `5432`) to the public internet through the default `docker0` bridge.
  * **Our Lockdown:** We locked every container port strictly to `127.0.0.1` (localhost only). To the outside internet, all doors are locked.
  * **Zero Inbound Ports:** Traffic travels through an encrypted Cloudflare Tunnel. Hackers running port scans will find **zero open doors**.

### 🎨 Visual Idea for this Slide:
* **Left:** Safe Vault showing two isolated company boxes (Company A & Company B).
* **Right:** A firewall shield labeled "All ports locked to 127.0.0.1 (Zero Open WAN Ports)".

### 🗣️ Speaker Script (What to Say):
> *"Security is built in at two levels. Inside the app, strict workspace isolation ensures no company can ever see another's data. On the server side, standard Docker containers often accidentally leave database ports open to the public internet. We locked every single container port strictly to localhost, and we use a Cloudflare Tunnel with zero open inbound ports. Hackers scanning our IP see literally nothing."*

---

## Slide 7: Test Results (Proven, Reliable, Production-Ready)

### 💡 The Big Idea (Simple Explanation)
> **"Fully tested on real crumpled receipts and live on the internet today."**  
> Not a prototype or a mockup—Komnottra has been tested and verified end-to-end.

### 📋 What Goes on the Slide:
* **100% Clean Build:** Compiled with Next.js 16 and TypeScript with zero errors or warnings (`exit code 0`).
* **Real-World AI Accuracy:** Successfully tested on Khmer thermal receipts, PassApp taxi screenshots, and ABA KHQR payment slips.
* **No False Alarms:** Verified that client incomes enter silently without annoying alerts, while high-value expenses alert the owner instantly.
* **Strict Approval Gating:** Verified that unapproved receipts never leak into financial reports or runway numbers.
* **1-Click Excel Export:** Generates and downloads a clean 3-sheet financial workbook with working formulas in under 1 second.

### 🎨 Visual Idea for this Slide:
* A scorecard checklist with green checkmarks:
  * `[✓] Next.js 16 Production Build: PASSED`
  * `[✓] Khmer + USD AI Extraction: PASSED`
  * `[✓] Telegram Two-Tier Bot: PASSED`
  * `[✓] Zero-Leak Approval Gate: PASSED`
  * `[✓] 1-Second Excel Export: PASSED`

### 🗣️ Speaker Script (What to Say):
> *"Komnottra isn't just a prototype. Every single feature—from AI OCR scanning of Khmer receipts to real-time Telegram alerts and instant Excel export—has been rigorously tested and is running live in production right now."*
