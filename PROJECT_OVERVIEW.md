# 🏭 Shree Raas Krishnam Creation — Factory AI Manager
## Complete Project Overview & Master Guide

> **Enterprise-Grade Garment Manufacturing & Factory Intelligence ERP**  
> Built with **React 18, TypeScript, Vite 6, Tailwind CSS, Supabase PostgreSQL, and Google Gemini AI Engine**.

---

## 📌 1. Business Problem & Mission

### 1.1. Garment Industry Operational Challenges
Garment manufacturing facilities operate under distinct operational and financial dynamics:
- **Complex Size-Set Hierarchy**: Apparel is manufactured and sold in **Sets** containing multiple **Sizes** (e.g., *Standard Set: 38–46*, *Extra Set: 48–52*, *Kids Set: 24–32*), requiring multi-dimensional size matrices.
- **Sequential Production Pipelines**: Work-in-progress moves across multiple stages (**Cutting ➔ Stitching ➔ Washing ➔ Finishing ➔ QC & Rejection ➔ Packing ➔ Dispatch**). Shop-floor losses or bottlenecks directly jeopardize delivery commitments.
- **Dynamic Raw Material Consumption**: Fabric, threads, buttons, and trims must be tracked in real-time to avoid line stoppages.
- **Financial Balances & GST**: Wholesale receivables, supplier payables, overhead vouchers, and 5% garment GST reconciliation.
- **Shop-Floor Decision Making**: Factory owners and floor managers require instant factual answers on delayed orders, bottleneck stages, and fabric lay plan estimations.

### 1.2. The Solution: Factory AI Manager
**Factory AI Manager** delivers a cloud-native, responsive ERP system tailored specifically for **Shree Raas Krishnam Creation**, unifying 17 core modules into a single real-time dashboard backed by **100% live database synchronization** and **Google Gemini RAG AI intelligence**.

---

## 🏗️ 2. High-Level Architecture & Tech Stack

```
                              ┌────────────────────────────────────────────────────────┐
                              │            Browser Client (React 18 + Vite + TS)       │
                              │   Responsive UI (320px–4K) + Mobile Drawer + Tailwind  │
                              └───────────┬────────────────────────────────┬───────────┘
                                          │                                │
                              (Live REST / RPC / Queries)      (IndexedDB & Local Storage)
                                          │                                │
                                          ▼                                ▼
                              ┌────────────────────────┐      ┌────────────────────────┐
                              │ Supabase PostgreSQL 15 │      │ Local 7-Day TTL Cache  │
                              │  - 20+ Master Tables   │      │  - Localhost Isolation │
                              │  - Row Level Security  │      │  - Auto-Purge Engine   │
                              │  - Relational FKs      │      └────────────────────────┘
                              └───────────┬────────────┘
                                          │
                              ┌───────────▼────────────┐
                              │ Google Gemini AI Engine│
                              │  - Live Database RAG   │
                              │  - Executive Briefing  │
                              │  - Fabric Lay Plan Calc│
                              │  - QC Defect Diagnosis │
                              └────────────────────────┘
```

### 2.1. Frontend Stack
- **Framework**: React 18 with TypeScript for end-to-end type safety.
- **Bundler & PWA**: Vite 6 with `vite-plugin-pwa` for progressive web app installation and service worker offline caching.
- **Styling**: Tailwind CSS with industrial dark-mode design system.
- **State Management & Caching**:
  - `@tanstack/react-query`: Declarative server-state caching, automatic cache invalidation, and optimistic mutations.
  - `zustand`: Session, authentication state, and anti-tamper signature checking.
- **Icons**: `lucide-react` icons.

### 2.2. Backend & Intelligence Stack
- **Database**: Supabase PostgreSQL 15 with relational constraints, foreign keys, and RLS policies.
- **AI Reasoning Engine**: Google Gemini (`gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-flash-latest`) via live database RAG (Retrieval-Augmented Generation), securely compiling live orders, production batches, raw material inventory, and ledger state.
- **Security Subsystem**: Web Crypto SHA-256 password hashing, HMAC session signatures (`factory_user_sig`), brute-force login rate limiting, and strict CSP protection.

---

## 🗂️ 3. Apparel Domain Hierarchy (Set & Size Model)

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                         PRODUCT MASTER                          │
  │     e.g., "Premium Cotton Kurti Pant Coordination Set"         │
  └────────────────────────────────┬────────────────────────────────┘
                                  │ (Linked via product_sets)
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                          PRODUCT SETS                           │
  │   - Standard Set (Code: SET-STD)  ➔ Sizes: 38, 40, 42, 44, 46   │
  │   - Extra / Plus Set (SET-EXT)    ➔ Sizes: 48, 50, 52           │
  │   - Kids / Junior Set (SET-KIDS)  ➔ Sizes: 24, 26, 28, 30, 32   │
  │   - Alpha Sizing Set (SET-ALPHA)  ➔ Sizes: S, M, L, XL, XXL     │
  └────────────────────────────────┬────────────────────────────────┘
                                  │ (Mapped via set_sizes)
                                  ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                       SIZES & MEASUREMENTS                      │
  │   - Size 38: Chest 38", Waist 34", Length 29", Sequence #1      │
  │   - Size 40: Chest 40", Waist 36", Length 30", Sequence #2      │
  │   - Size 42: Chest 42", Waist 38", Length 30.5", Sequence #3    │
  │   - Size 44: Chest 44", Waist 40", Length 31", Sequence #4      │
  │   - Size 46: Chest 46", Waist 42", Length 31.5", Sequence #5    │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 💻 4. Comprehensive Breakdown of All 17 Modules

### 4.1. 📊 Executive Dashboard (`/dashboard`)
- **Real-Time KPIs**: Active Orders, Today's Finished Output (pcs), Market Receivables, Low Stock SKU alerts.
- **AI Executive Briefing**: Real-time natural language briefing synthesized from live database state.
- **Live Streams**: Recent customer wholesale orders and active production floor runs.

### 4.2. 🛒 Garment Orders & Size Matrix (`/orders`)
- **Wholesale Order Booking**: Multi-product, multi-set, and 2D size-matrix piece breakdown with live line rate and GST calculation.
- **Status Progression**: `DRAFT` ➔ `CONFIRMED` ➔ `IN_PRODUCTION` ➔ `READY_FOR_DISPATCH` ➔ `COMPLETED`.
- **CRUD**: Full Create, View Size Breakdown, Status Confirmation, and Safe Deletion.

### 4.3. ⚙️ Production Shop-Floor Management (`/production`)
- **Stage Pipeline Kanban & Table**: 7-stage sequential pipeline (**Cutting, Stitching, Washing, Finishing, Quality Check, Packing, Dispatch Ready**).
- **Floor Output & QC Logging**: Size-wise passed pieces, rejected pieces, defect categorization, and operator attribution.
- **Delay Alerts**: Automated detection of production orders behind schedule.

### 4.4. 📦 Raw Material & Stock Ledger (`/inventory`)
- **Live Stock Balances**: Fabrics, Threads, Buttons, Zippers, Packaging materials, and Finished Goods.
- **Stock Movement Modal**: Stock In (procurement/returns) and Stock Out (floor issue/sales).
- **Immutable Ledger**: Append-only transaction log for every stock event.

### 4.5. 🛍️ Procurement & Inward Dock (`/purchases`)
- **Purchase Orders (POs)**: Supplier selection, line-item materials, unit costs, and expected dock arrival dates.
- **Dock Receiving**: Inward workflow that auto-updates raw material stock levels.

### 4.6. 🚚 Dispatch & Logistics (`/dispatch`)
- **Shipping Manifests**: Consignment note generation, transporter name, LR/tracking number, carton counts, and delivery tracking.

### 4.7. 👗 Products & Tech Packs (`/products`)
- **Style Catalog**: Tech pack specifications, fabric composition, cost price, wholesale selling price, calculated gross profit margin %, and assigned sets.
- **View Modes**: Interactive Table View and Visual Style Card Grid View.

### 4.8. 📐 Sets & Sizes Master (`/sets-sizes`)
- **Sets Configuration**: Define custom ratio groupings (Standard, Plus, Kids, Alpha).
- **Sizes Master**: Chest, waist, length dimensions, sequence numbers, and status toggle.

### 4.9. 👥 Customer Directory (`/customers`)
- **Wholesale Client Profiles**: Business name, contact person, phone, email, GSTIN, credit limits, and payment terms.

### 4.10. 🏭 Supplier Directory (`/suppliers`)
- **Vendor Master**: Fabric textile mills, yarn spinners, trims, and packaging suppliers with contact and bank details.

### 4.11. 💳 Payments & Cashflow (`/payments`)
- **Financial Ledger**: Inward customer receipts and outward vendor payouts with payment mode (NEFT, UPI, Cheque, Cash) and UTR tracking.

### 4.12. 📑 Operating Expenses (`/expenses`)
- **Factory Overheads**: Electricity, machine maintenance, rent, needles/spares, staff welfare, and freight logging.

### 4.13. 📈 Reports & Business Analytics (`/reports`)
- **Management Reporting**: Sales by customer, production stage efficiency, QC pass rates, inventory valuation, and cashflow with CSV export.

### 4.14. 🤖 AI Factory Intelligence Engine (`/ai-manager`)
- **Live Query Shell**: Grounded bilingual (Hindi/English) conversational assistant querying live PostgreSQL database via Google Gemini models.
- **AI Executive Daily Briefing**: Comprehensive daily factory summary with operational health score, active bottlenecks, and actionable priorities generated by Gemini LLM.
- **Fabric & Sizing Lay Plan Estimator**: Exact meter consumption calculation based on size matrix breakdown with 5% cutting wastage buffer.
- **QC Defect Root-Cause Analyzer**: Pure real-data analysis pulling shop-floor defect logs, with Gemini root-cause diagnosis and actionable corrective plans.
- **RAG Database Context Inspector**: Live transparency viewer showing active context compiled from PostgreSQL.

### 4.15. 🔔 Notifications & Alert Center (`/notifications`)
- **Automated Alerts**: Low stock warnings, production delay alerts, uncollected receivables, and overdue delivery notices.

### 4.16. ⚙️ System Settings & RBAC (`/settings`)
- **Enterprise Profile**: Persistent legal entity name, premises address, GST number, currency, and tax rates.
- **Staff Directory**: Role-Based Access Control (RBAC) user management and immutable audit trails.

### 4.17. 🔐 Authentication & Security (`/login`)
- **Multi-Factor Protection**: Salted SHA-256 password hashing, Google Sign-In OAuth support, anti-tamper signature enforcement, and brute-force rate limiting.

---

## 📱 5. Responsive UI Implementation

- **Zero Page-Level Horizontal Overflow**: Guaranteed across all mobile, tablet, and desktop viewports (320px up to 1920px+).
- **Mobile Drawer Navigation**: Slide-out drawer on `< lg` screens with touch-friendly navigation items and auto-close.
- **Internal Table Scrolling**: All tabular data is wrapped in dedicated `overflow-x-auto` containers with sticky headers.
- **Adaptive Modals**: All modals auto-scale down to 320px with internal vertical scrolling and safe gutters.
- **Touch-Friendly Controls**: Interactive elements configured with $\ge 44\text{px}$ touch targets.
- **Native PWA**: Installable to home screen and desktop application menu.
