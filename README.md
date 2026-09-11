# 🏭 Factory AI Manager

> **Cloud-Native Garment Manufacturing & Operations ERP System**  
> Built with **React 18, TypeScript, Vite, Tailwind CSS, and Supabase (PostgreSQL with Row Level Security)**.

---

## 📖 Documentation Index

For complete in-depth documentation, refer to the respective guides:

| Document | Description |
| :--- | :--- |
| 📘 **[PROJECT_OVERVIEW.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/PROJECT_OVERVIEW.md)** | Complete master guide covering business problem, all 15 operational modules, and features. |
| 🏛️ **[ARCHITECTURE.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/ARCHITECTURE.md)** | System design, garment domain hierarchy, offline outbox sync, and RBAC matrix. |
| 🗄️ **[DATABASE.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/DATABASE.md)** | Complete PostgreSQL database schema, ER diagrams, tables, columns, and constraints. |
| 🛠️ **[SETUP.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/SETUP.md)** | Quickstart installation, live Supabase credentials, and environment configuration. |
| 🎨 **[UI_PLAN.md](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/UI_PLAN.md)** | UI design system, color palette, navigation, and screen specifications. |

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
VITE_SUPABASE_URL="https://mnnfdedjfffsogdiaoct.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Master Factory Owner Login
- **Email:** `kavyakhandelwal57@gmail.com`
- **Password:** `Kavya@2005`
- **Role:** `OWNER` (Full Master & Admin Privileges)

### 5. Verify & Build
```bash
# Static TypeScript verification (0 errors)
npm run check

# Build production bundle
npm run build
```

---

## 🌟 Key Features

- **100% Real Supabase Data**: Direct PostgreSQL synchronization with zero hardcoded demo accounts.
- **Full Edit & Delete CRUD**: Complete ability to edit and safely delete records across Customers, Suppliers, Products, Orders, Purchases, Inventory, Sets, Sizes, and Users.
- **Set & Size Multi-Matrix**: First-class apparel hierarchy (**Product ➔ Sets ➔ Sizes**) with 2D matrix order booking and 1-click presets (`Standard 38-46`, `Plus 48-52`, `Kids 24-32`, `Alpha S-XXL`).
- **5-Stage Floor Tracking**: Sequential production management (**Cutting ➔ Stitching ➔ Finishing ➔ QC & Rejections ➔ Packing**).
- **Append-Only Auditing**: Immutable ledgers for inventory transactions and security audit trails.
- **Offline Resilience**: IndexedDB local cache with automatic mutation flush queue upon network reconnection.
- **Enterprise Settings**: Real-time persistent Legal Factory Name, Address, GST registration, tax percentages, and staff RBAC directory.
