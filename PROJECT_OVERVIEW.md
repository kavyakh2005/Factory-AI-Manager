# 🏭 Factory AI Manager — Complete Project Documentation & Architecture Guide

> **Enterprise-Grade Garment Manufacturing & Factory Operations Management System (ERP)**  
> Built with **React 18, TypeScript, Vite, Tailwind CSS, and Supabase (PostgreSQL with Row Level Security)**.

---

## 📌 1. Project Overview & Business Purpose

### 1.1. Problem Statement in Garment Manufacturing
Traditional garment manufacturing units and apparel factories face unique operational challenges:
- **Complex Size-Set Hierarchy**: Unlike standard retail where an item is sold as a single SKU, garment factories manufacture and sell in **Sets** containing multiple **Sizes** (e.g., *Standard Set: 38, 40, 42, 44, 46* or *Extra Set: 48, 50, 52*).
- **Floor-Level Production Bottlenecks**: Garments move through sequential production stages (**Cutting ➔ Stitching ➔ Finishing ➔ Quality Check (QC) ➔ Packing**). Losses or delays at any stage derail delivery schedules.
- **Dynamic Raw Material Consumption**: Fabric, threads, zippers, and buttons must be tracked in real-time to prevent production stoppages.
- **Financial Tracking & GST**: Tracking receivables from wholesale buyers, payables to raw material suppliers, and daily operational overheads.

### 1.2. The Solution: Factory AI Manager
**Factory AI Manager** is a full-stack, production-ready enterprise operating system tailored specifically for garment manufacturing facilities. It brings every aspect of factory operations into a single real-time dashboard powered by **100% live database synchronization**.

---

## 🏗️ 2. Core Architecture & Technology Stack

```
                                    ┌──────────────────────────────────────────────────┐
                                    │               Browser Client (React 18)          │
                                    │    Vite + TypeScript + TailwindCSS + Zustand     │
                                    └────────┬─────────────────────────────────┬───────┘
                                             │                                 │
                                   (Direct Query / REST)             (IndexedDB Cache & Outbox)
                                             │                                 │
                                             ▼                                 ▼
                                    ┌──────────────────┐              ┌────────────────┐
                                    │ Supabase Cloud   │              │ Offline Local  │
                                    │ (PostgreSQL 15)  │              │ Storage Engine │
                                    │  - Row Security  │              └────────────────┘
                                    │  - Relational FK │
                                    │  - Live DB Sync  │
                                    └──────────────────┘
```

### 2.1. Frontend Stack
- **Framework**: [React 18](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/package.json) with TypeScript for type-safe business logic.
- **Bundler & Build Tool**: [Vite](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/vite.config.ts) for instant HMR and optimized production bundles.
- **Styling**: [Tailwind CSS](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/tailwind.config.js) with customized industrial dark-mode color palettes (slate, factory-charcoal, emerald, amber, rose).
- **State Management & Data Fetching**:
  - `@tanstack/react-query`: Declarative server-state caching, automatic refetching, and mutation handling.
  - `zustand`: Lightweight global state for authentication and active session management.
- **Icons & UI Assets**: `lucide-react` for clean, professional iconography.

### 2.2. Backend & Database Stack
- **Database**: **Supabase PostgreSQL** with structured schemas, foreign key constraints, and cascade protections.
- **Security & Authorization**: **Row Level Security (RLS)** applied across all tables (`anon` and `authenticated` roles).
- **Data Integrity**: Append-only auditing for `audit_logs` and `inventory_transactions` to guarantee financial and inventory traceability.

---

## 🗂️ 3. Garment Business Hierarchy (Set & Size Model)

The core data model mirrors actual apparel industry manufacturing workflows:

```
  ┌────────────────────────────────────────────────────────┐
  │                    PRODUCT MASTER                      │
  │     e.g., "Men's Premium Oxford Cotton Shirt"          │
  └──────────────────────────┬─────────────────────────────┘
                             │ (1-to-many / many-to-many)
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                   PRODUCT SETS                         │
  │   - Standard Set (Code: SET-STD)                       │
  │   - Extra / Plus Set (Code: SET-EXT)                   │
  │   - Kids / Junior Set (Code: SET-KIDS)                 │
  └──────────────────────────┬─────────────────────────────┘
                             │ (Links through set_sizes)
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                  SIZES (Dimensioned)                   │
  │   - Size 38 (Chest: 38", Waist: 34", Length: 29")      │
  │   - Size 40 (Chest: 40", Waist: 36", Length: 30")      │
  │   - Size 42 (Chest: 42", Waist: 38", Length: 30.5")    │
  │   - Size 44 (Chest: 44", Waist: 40", Length: 31")      │
  │   - Size 46 (Chest: 46", Waist: 42", Length: 31.5")    │
  └────────────────────────────────────────────────────────┘
```

### 3.1. Smart Presets & Inline Size Addition
When creating or editing garment sets:
- **Pre-Seeded Master Sizes Palette**: 22+ standard garment sizes (24 to 52, S, M, L, XL, XXL, 3XL, Free Size) are available instantly.
- **1-Click Presets**:
  - `Standard (38-46)`
  - `Plus Size (48-52)`
  - `Kids Run (24-32)`
  - `Alpha (S-XXL)`
- **Inline Custom Size Adder**: Add custom non-standard sizes (`+ Add Size`) right inside the modal without leaving your workflow.

---

## 💻 4. Comprehensive Breakdown of All 15 Modules

### 4.1. Dashboard (`/dashboard`)
- **Key Performance Indicators (KPIs)**: Total production pieces passed today, rejected pieces, pending orders, delayed delivery count, dispatches today, and critical low-stock alerts.
- **AI Plant Summary**: Real-time rule-based operations analysis highlighting floor bottlenecks and urgent actions.

### 4.2. Customer Master (`/customers`)
- **Firm Management**: Wholesale clients, retail chains, and garment distributors.
- **Attributes**: Customer code, firm name, contact person, phone, email, billing/shipping address, GST number, credit limits, and payment term days.
- **CRUD**: Full Create, View Specifications, Edit Firm Details, and Delete Customer with confirmation.

### 4.3. Supplier Master (`/suppliers`)
- **Vendor Directory**: Fabric textile mills, yarn spinners, trims & button vendors, packaging suppliers.
- **CRUD**: Full Create, Edit Vendor, and Delete Supplier capabilities.

### 4.4. Products Catalog (`/products`)
- **Garment Styles**: Tech-pack specs, fabric composition, cost price, wholesale selling price, calculated gross margin %, and assigned size sets.
- **Views**: Table and Visual Grid views with style thumbnail rendering.
- **CRUD**: Create Product, Edit Tech-Pack, Toggle Active Status, and Delete Product.

### 4.5. Sets & Sizes Master (`/sets-sizes`)
- **Garment Sets Master**: Set codes, categories (Adult, Plus, Kids, Custom), assigned sizes runs, and total size counts.
- **Sizes Master**: Standard garment sizing with chest, waist, and length measurements.
- **CRUD**: Edit and Delete support across both Sets and Sizes tabs.

### 4.6. Garment Orders (`/orders`)
- **Wholesale Order Booking**: Multi-product, multi-set, and 2D size-matrix piece breakdown.
- **Pricing & Taxes**: Automatic line total calculation, subtotal, 5% garment GST, and grand total.
- **CRUD**: Create Order, View Size Matrix Breakdown, Confirm Drafts, and Delete Orders with cascading item removal.

### 4.7. Production Floor Management (`/production`)
- **5-Stage Sequential Pipeline**:
  1. `CUTTING`: Fabric spreading, marker layout, cut piece tally.
  2. `STITCHING`: Assembly line sewing progress.
  3. `FINISHING`: Washing, ironing, thread trimming.
  4. `QUALITY_CHECK`: Strict defect classification and rejection logging.
  5. `PACKING`: Polybag packing, tagging, and carton boxing.
- **Floor Logging**: Log production entries with operator name, machine ID, passed pieces, and rejected pieces with defect reasons.

### 4.8. Raw Material Inventory (`/inventory`)
- **SKU Ledger**: Raw materials (Fabric, Thread, Buttons, Zippers, Packaging) and Finished Goods.
- **Stock Movements**: Real-time In/Out adjustment modal and immutable stock transaction ledger.
- **CRUD**: Add Item, Edit SKU Details, Adjust Stock, and Delete Item.

### 4.9. Procurement & Purchase Orders (`/purchases`)
- **Vendor POs**: PO number, supplier selection, item line-items, tax rates, and expected dock delivery dates.
- **Dock Receiving**: Inward receiving workflow that automatically posts into the immutable inventory stock ledger.
- **CRUD**: Create PO, Receive Dock Inward, and Delete PO.

### 4.10. Dispatches & Logistics (`/dispatch`)
- **Consignment Tracking**: Dispatch note generation, transporter name, vehicle/tracking number, carton counts, and shipment status (**DRAFT ➔ DISPATCHED ➔ DELIVERED**).

### 4.11. Payments & Receivables (`/payments`)
- **Financial Ledger**: Inward customer receipts and outward supplier payouts, payment mode (NEFT/RTGS, UPI, Cheque, Cash), and reference tracking.

### 4.12. Operating Expenses (`/expenses`)
- **Factory Overheads**: Factory electricity, generator diesel, machine maintenance, needles & spares, staff tea & snacks, and rent tracking with category breakdowns.

### 4.13. Factory Analytics & Reports (`/reports`)
- **Executive BI**: Monthly production volume charts, rejection rate analytics, top garment style sales, and revenue vs expenses financial reconciliation.

### 4.14. Notifications Hub (`/notifications`)
- **Real-Time Operational Alerts**: Delayed order warnings, critical raw material stock alerts, QC rejection spikes, and system event feeds.

### 4.15. System & Factory Settings (`/settings`)
- **Factory Profile**: Persistent legal entity name, manufacturing premises address, and GST number with database synchronization.
- **Currency & Tax**: Currency symbol (₹) and default garment GST tax rate (5%).
- **Users & RBAC Directory**: Active staff directory with role assignments, user creation, and user deletion.
- **AI Config**: LLM model provider (Gemini, OpenAI, Anthropic) and API key configuration.
- **Audit Logs**: Immutable log trail of all user actions, logins, and setting modifications.

---

## 🔐 5. Security & Authentication

- **Master Factory Owner**:
  - Email: `kavyakhandelwal57@gmail.com`
  - Password: `asa`
  - Role: `OWNER` (Full Administrative & Operational Permissions)
- **Role-Based Authorization**: System permissions strictly checked on navigation routes and actionable UI buttons based on active user role.
- **Protected Master Account**: Deletion protection safeguards the primary Factory Owner account.
