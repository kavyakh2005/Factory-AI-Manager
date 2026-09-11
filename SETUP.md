# 🛠️ Factory AI Manager — Setup & Quickstart Guide

> **Cloud-Native Garment Manufacturing & Operations ERP**  
> Running on **React 18 + Vite + TypeScript + Tailwind CSS** connected to **Supabase PostgreSQL**.

---

## 1. System Prerequisites

- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **NPM**: `v9.x` or `v10.x`
- **Web Browser**: Google Chrome, Microsoft Edge, Brave, Mozilla Firefox, or Apple Safari

---

## 2. Supabase Cloud Configuration

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** tab in your project.
3. Run the schema migrations in order:
   - Initial Schema: [`supabase/migrations/20260309_init_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260309_init_schema.sql)
   - Production Schema: [`supabase/migrations/20260310_production_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260310_production_schema.sql)
4. Run the permissions script to enable direct application access:
   - Script: [`supabase/enable_anon_access.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/enable_anon_access.sql)

---

## 3. Environment Variables Configuration

Ensure your [`.env`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/.env) file is populated with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://mnnfdedjfffsogdiaoct.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. Running the Application Locally

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript static type check (0 errors)
npm run check

# 3. Start local development server
npm run dev
```

The application will be accessible at: **`http://localhost:5173`**

---

## 5. Factory Owner Login & Authorization Credentials

The application is configured with real authentication and role-based authorization:

| Parameter | Value |
| :--- | :--- |
| **Master Factory Owner** | `kavyakhandelwal57@gmail.com` |
| **Password** | `Kavya@2005` |
| **Primary Role** | `OWNER` (Full Master, Financial, Operational, and System Administration Access) |

### Role Hierarchy & Access:
- **`OWNER` & `ADMIN`**: Complete access across Dashboard, Production, Orders, Inventory, Purchases, Dispatch, Payments, Expenses, Reports, AI Manager, and Settings.
- **`PRODUCTION_MANAGER`**: Floor execution, cutting/stitching/finishing/QC logs, order tracking, and stock visibility.
- **`INVENTORY_MANAGER`**: Raw material intake, SKU ledger, dock inward from purchase orders, and dispatches.
- **`ACCOUNTANT`**: Wholesale order payments, supplier payouts, operational expense tracking, and GST reporting.
- **`STAFF`**: Floor production entries, product viewing, and inventory balance lookups.

---

## 6. Key Operations & Features

- **Full Edit & Delete CRUD**: Direct Edit and Delete options available across Customers, Suppliers, Products, Orders, Purchases, Inventory SKUs, Sets, Sizes, and Users.
- **Sets & Sizes Hierarchy**: 22+ standard garment sizes pre-seeded with 1-click presets (`Standard 38-46`, `Plus 48-52`, `Kids 24-32`, `Alpha S-XXL`) and inline custom size adder.
- **Persistent Factory Profile**: Edit factory legal entity name, premises address, GST number, currency symbol, and tax % with real-time database persistence.
- **Production Stage Tracking**: 5-stage live floor tracker (**Cutting ➔ Stitching ➔ Finishing ➔ QC & Rejection Analysis ➔ Packing**).
