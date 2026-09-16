# 🏭 Shree Raas Krishnam Creation — Factory AI Manager

> **Enterprise-Grade Garment Manufacturing & Operations Intelligence ERP**  
> Built with **React 18, TypeScript, Vite 6, Tailwind CSS, Supabase (PostgreSQL with RLS), and Google Gemini AI Engine**.

---

## 📖 Documentation Index

| Document | Description |
| :--- | :--- |
| 📘 **[PROJECT_OVERVIEW.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/PROJECT_OVERVIEW.md)** | Complete master guide covering business problem, all 18 operational modules, and core features. |
| 🏛️ **[ARCHITECTURE.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/ARCHITECTURE.md)** | System design, garment domain hierarchy, Gemini RAG intelligence, security architecture, and offline sync. |
| 🗄️ **[DATABASE.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/DATABASE.md)** | Complete PostgreSQL database schema, ER diagrams, 20+ tables, columns, relations, and constraints. |
| 🛠️ **[SETUP.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/SETUP.md)** | Quickstart installation, live Supabase credentials, Gemini API key configuration, and build/deploy steps. |
| 🎨 **[UI_PLAN.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/UI_PLAN.md)** | UI design system, mobile drawer navigation, responsive breakpoint strategy (320px–1920px+), and all 18 screens. |

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
# Supabase Cloud Configuration
VITE_SUPABASE_URL="https://mnnfdedjfffsogdiaoct.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Google Gemini API Key for AI Intelligence Engine
VITE_GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Master Factory Owner Login
- **Email:** `kavyakhandelwal57@gmail.com`
- **Password:** `Kavya@2005`
- **Role:** `OWNER` (Full Master, Financial, Operational & System Privileges)

### 5. Verify & Production Build
```bash
# Static TypeScript verification (0 errors)
npm run check

# Build optimized production bundle
npm run build

# Deploy to Firebase Hosting (optional)
firebase deploy
```

---

## 🌟 Key Features & Capabilities

- **100% Real Database Ground Truth**: Direct PostgreSQL CRUD operations with zero hardcoded mock/fallback data. Complete clean-slate starting state.
- **AI Factory Intelligence Engine**: Powered by Google Gemini (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-flash-latest`) with live PostgreSQL RAG context, Executive Daily Briefing synthesis, Fabric & Sizing Lay Plan Calculator, and QC Defect Root-Cause Analyzer.
- **Bilingual SOP & Factory Guide (`/guide`)**: Complete Standard Operating Procedure walkthrough available in **English** and **Hindi (हिंदी)** with persistent language selection across browser reloads.
- **Real-World Stage WIP Piece Flow Split**: Dynamic shop-floor piece routing where only produced pieces advance to downstream stages, while unproduced pieces remain safely tracked at their current stage.
- **1-Click Fast Track & Finished Goods Credit**: Instant single-click batch completion bypasses manual stages, updating stock balances and crediting finished goods inventory.
- **Full Work Order Lifecycle Management**: Safe deletion of production orders with cascade cleanup across requirements, stage entries, and stock balances.
- **Localhost Isolation & 7-Day Retention**: Local development and testing on `localhost` is isolated to browser storage with a 7-day TTL auto-purge mechanism, preventing test data pollution of the remote database.
- **Enterprise Application Security**:
  - Web Crypto SHA-256 salted password verification.
  - Anti-tamper HMAC security signature (`factory_user_sig`) preventing privilege escalation via DevTools or localStorage manipulation.
  - Brute-force login rate limiter (5 failed attempts maximum with 15-minute cooldown lockout).
  - Strict Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and XSS sanitization.
  - Real-time security audit event logging.
- **Native Installable PWA**: Progressive Web App with Web App Manifest, offline service worker caching via `vite-plugin-pwa`, and native browser address bar install prompt.
- **Ready-Stock & Replenishment Architecture**: Multi-tier inventory hierarchy separating Physical Stock, Reserved Stock, Dispatchable Saleable Stock, and Shop-Floor WIP.
- **Set & Size Multi-Matrix**: First-class apparel hierarchy (**Product ➔ Sets ➔ Sizes**) with 2D size-wise piece booking and 1-click presets (`Standard 38-46`, `Plus 48-52`, `Kids 24-32`, `Alpha S-XXL`).
- **7-Stage Shop-Floor Tracking**: Sequential production management (**Cutting ➔ Stitching ➔ Washing ➔ Finishing ➔ QC & Rejections ➔ Packing ➔ Dispatch Ready**).
- **Universal Edit & Safe Delete CRUD**: Full data management across Customers, Suppliers, Products, Orders, Purchases, Inventory SKUs, Sets, Sizes, and Users.
- **Immutable Auditing & Double-Entry Ledger**: Append-only auditing for inventory transactions and system security logs.

---

## 📱 Supported Viewports

| Category | Viewports Tested | Status |
| :--- | :--- | :--- |
| **Mobile** | `320px`, `360px`, `375px`, `390px`, `414px`, `430px` | ✅ **PASS (Zero Overflow)** |
| **Tablet** | `768px`, `820px`, `1024px` | ✅ **PASS** |
| **Desktop** | `1280px`, `1366px`, `1440px`, `1600px`, `1920px+` | ✅ **PASS** |
