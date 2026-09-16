# 🛠️ Factory AI Manager — Setup & Quickstart Guide

> **Enterprise Garment Manufacturing ERP & AI Manager**  
> Running on **React 18 + Vite 6 + TypeScript + Tailwind CSS** connected to **Supabase PostgreSQL & Google Gemini AI**.

---

## 1. System Prerequisites

- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **NPM**: `v9.x` or `v10.x`
- **Web Browser**: Chrome, Edge, Safari, Firefox, or Brave (Mobile, Tablet, Desktop & PWA supported)

---

## 2. Environment Variables Configuration (`.env`)

Create or update your [`.env`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/.env) file in the root directory:

```env
# Supabase PostgreSQL Cloud Configuration
VITE_SUPABASE_URL="https://mnnfdedjfffsogdiaoct.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Google Gemini API Key for AI Intelligence Engine
# Can also be dynamically configured via Settings or AI Manager UI modal
VITE_GEMINI_API_KEY="your-google-gemini-api-key"

# AI Microservice (Optional)
VITE_AI_SERVICE_URL="http://localhost:8000"
```

---

## 3. Database Migration Setup (Supabase)

If deploying to a fresh Supabase instance, execute the SQL migrations in order via the **SQL Editor**:
1. [`supabase/migrations/20260309_init_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260309_init_schema.sql)
2. [`supabase/migrations/20260310_production_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260310_production_schema.sql)
3. [`supabase/migrations/20260312_full_factory_modules_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260312_full_factory_modules_schema.sql)
4. [`supabase/enable_anon_access.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/enable_anon_access.sql)

---

## 4. Running the Application

```bash
# 1. Install all dependencies
npm install

# 2. Type-check entire project (verifies 0 TypeScript errors)
npm run check

# 3. Launch local Vite development server
npm run dev
```

Open **`http://localhost:5173`** in your browser.

> [!NOTE]
> **Localhost Isolation Mode**: When running on `localhost` or `127.0.0.1`, data mutations are isolated to browser storage (LocalStorage + IndexedDB) with a **7-day auto-purge TTL**, allowing safe offline and local testing without modifying production database records.

---

## 5. Master Factory Owner Login Credentials

| Credential | Value |
| :--- | :--- |
| **Email** | `kavyakhandelwal57@gmail.com` |
| **Password** | `Kavya@2005` |
| **User Role** | `OWNER` (Full Master Administrative, Financial & Operational Access) |

> [!TIP]
> **Google Sign-In**: Users can also log in seamlessly using the "Sign in with Google" button on the login screen.

---

## 6. Complete Application Route Sitemap (18 Modules)

| Route | Module Name | Primary Purpose |
| :--- | :--- | :--- |
| `/login` | Authentication | Secure salted SHA-256 password & Google Sign-In |
| `/dashboard` | Executive Command Center | Real-time KPIs, shop-floor pulse & AI briefing |
| `/orders` | Sales Order Management | 2D Size-Matrix piece booking & auto pricing |
| `/production` | Shop-Floor Manufacturing | 7-Stage WIP split, Fast-Track, Stage entries & Delete |
| `/inventory` | Multi-Tier Inventory | Physical, Reserved, Ready Goods, and Raw Materials |
| `/purchases` | Material Procurement | Supplier POs, line-items & dock receiving |
| `/dispatch` | Shipping & Logistics | Invoices, packing manifests, cartons & LR tracking |
| `/products` | Style & Catalog Master | Tech-pack specs, fabric details & BOM formulas |
| `/sets-sizes` | Sizing & Set Multi-Matrix | Presets, size dimensional specs & ratio mappings |
| `/customers` | Customer Directory | Wholesale buyers, GSTIN, credit limits & payment terms |
| `/suppliers` | Mill & Vendor Directory | Raw material suppliers, catalogs & payment terms |
| `/payments` | Financial Cashflow Ledger | Customer receivables & supplier disbursements |
| `/expenses` | Factory Overhead Vouchers | Operating expense vouchers & cost-center analytics |
| `/reports` | Executive Analytics Engine | Production efficiency, stock aging & financial exports |
| `/ai-manager` | AI Intelligence Engine | Gemini RAG assistant, lay plan calculator & QC root-cause |
| `/notifications` | Live Alert Hub | Stockouts, delayed batches & overdue receivables |
| `/guide` | Interactive SOP Guide | Bilingual English/Hindi step-by-step garment manual |
| `/settings` | Enterprise System Config | Factory profile, taxes, staff RBAC, security audit & API keys |

---

## 7. Build & Production Deployment

```bash
# Build optimized production bundle with PWA service worker
npm run build

# Preview production build locally
npm run preview

# Deploy to Firebase Hosting (Production Cloud)
firebase deploy
```

The output bundle is generated inside `dist/` with PWA service worker and manifest ready for zero-config deployment on Firebase Hosting, Vercel, Netlify, Cloudflare Pages, or AWS S3/CloudFront.

