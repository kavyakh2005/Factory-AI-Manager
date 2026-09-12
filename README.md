# 🏭 Shree Raas Krishnam Creation — Factory AI Manager

> **Enterprise-Grade Garment Manufacturing & Operations Intelligence ERP**  
> Built with **React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL with RLS), and Google Gemini 1.5 Flash AI Engine**.

---

## 📖 Documentation Index

| Document | Description |
| :--- | :--- |
| 📘 **[PROJECT_OVERVIEW.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/PROJECT_OVERVIEW.md)** | Complete master guide covering business problem, all 17 operational modules, and core features. |
| 🏛️ **[ARCHITECTURE.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/ARCHITECTURE.md)** | System design, garment domain hierarchy, Gemini RAG intelligence architecture, responsive layout, and offline sync. |
| 🗄️ **[DATABASE.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/DATABASE.md)** | Complete PostgreSQL database schema, ER diagrams, 20+ tables, columns, relations, and constraints. |
| 🛠️ **[SETUP.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/SETUP.md)** | Quickstart installation, live Supabase credentials, Gemini API key configuration, and build steps. |
| 🎨 **[UI_PLAN.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/UI_PLAN.md)** | UI design system, mobile drawer navigation, responsive breakpoint strategy (320px–1920px+), and all 17 screens. |

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

# (Optional) Google Gemini API Key for AI Manager (can also be configured in UI Settings)
VITE_GEMINI_API_KEY="your-gemini-api-key"
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
```

---

## 🌟 Key Features & Capabilities

- **100% Real Supabase Data Synchronization**: Direct PostgreSQL CRUD operations with zero hardcoded mock/fallback data.
- **AI Factory Intelligence Engine**: Powered by Google Gemini 1.5 Flash with live PostgreSQL RAG context, Executive Daily Briefing synthesis, Fabric & Sizing Lay Plan Calculator, and QC Defect Root-Cause Analyzer.
- **Fully Responsive Mobile-First UI**: Seamless layout down to 320px viewport with mobile drawer navigation, zero page-level horizontal overflow, touch-friendly size matrices, and internal table scrolling.
- **Set & Size Multi-Matrix**: First-class apparel hierarchy (**Product ➔ Sets ➔ Sizes**) with 2D size-wise piece booking and 1-click presets (`Standard 38-46`, `Plus 48-52`, `Kids 24-32`, `Alpha S-XXL`).
- **7-Stage Shop-Floor Tracking**: Sequential production management (**Cutting ➔ Stitching ➔ Washing ➔ Finishing ➔ QC & Rejections ➔ Packing ➔ Dispatch Ready**).
- **Universal Edit & Safe Delete CRUD**: Full data management across Customers, Suppliers, Products, Orders, Purchases, Inventory SKUs, Sets, Sizes, and Users.
- **Immutable Auditing & Double-Entry Ledger**: Append-only auditing for inventory transactions and system security logs.
- **Offline Resilience (Outbox Pattern)**: IndexedDB local cache with automatic mutation queue flushing upon network reconnection.
- **Factory Enterprise Settings**: Real-time persistent legal entity details, GST number, currency conventions, and staff RBAC directory.

---

## 📱 Supported Viewports

| Category | Viewports Tested | Status |
| :--- | :--- | :--- |
| **Mobile** | `320px`, `360px`, `375px`, `390px`, `414px`, `430px` | ✅ **PASS (Zero Overflow)** |
| **Tablet** | `768px`, `820px`, `1024px` | ✅ **PASS** |
| **Desktop** | `1280px`, `1366px`, `1440px`, `1600px`, `1920px+` | ✅ **PASS** |
